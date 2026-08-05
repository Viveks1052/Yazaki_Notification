import React, { useEffect, useMemo, useState } from 'react';
import { allEmployees, departments, employeeMaster, problemMaster } from './data';
import { Escalation, IncidentCard, IncidentDrawer, Modal, SlaBlock, StatusPill, SummaryCards, Timeline, Topbar } from './components';
import { formatDuration, formatTime, getNpdLocations, getSummary, hasNpdAtLocation, incidentMetrics, isIncidentNpdLocked, sortForOperations } from './utils';

function NpdBanner({ incidents }) {
  const locations = getNpdLocations(incidents);
  return locations.length ? <div className="global-npd-banner"><div className="alert-icon">!</div><div><strong>NPD ACTIVE — PRODUCTION STOPPED</strong><span>Restrictions apply only to the affected conveyor belt{locations.length > 1 ? 's' : ''}.</span><div className="npd-location-list">{locations.map((location) => <span className="npd-location-pill" key={`${location.line}-${location.belt}`}>NPD ACTIVE · {location.line} · {location.belt}</span>)}</div></div></div> : null;
}

function ReportModal({ incidents, onClose, onSubmit }) {
  const npdActive = incidents.some((item) => item.type === 'NPD');
  const [query, setQuery] = useState('');
  const [problem, setProblem] = useState(null);
  const [other, setOther] = useState(false);
  const [department, setDepartment] = useState('');
  const [remarks, setRemarks] = useState('');
  const [type, setType] = useState(npdActive ? 'NPD' : 'NORMAL');
  const [error, setError] = useState('');
  const matches = query && !problem && !other ? problemMaster.filter((item) => `${item.name} ${item.keywords.join(' ')}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5) : [];
  const submit = (event) => {
    event.preventDefault();
    if (!problem && !other) return setError('Select a problem or choose Other.');
    if (other && !department) return setError('Select the department for Other.');
    if (other && !remarks.trim()) return setError('Remarks are required when the problem is Other.');
    onSubmit({ problem, other, department, remarks, type });
  };
  return <Modal title="Report Breakdown" onClose={onClose}>{npdActive && <div className="npd-warning"><div className="alert-icon">!</div><div><strong>NPD Exclusive Mode</strong><span>Normal breakdown reporting is temporarily disabled because an NPD incident is active on this conveyor belt.</span></div></div>}<form className="stack-form" onSubmit={submit}>
    <label><span>What is the problem? *</span><div className="search-field"><input value={query} placeholder="Type printer, network, material..." onChange={(event) => { setQuery(event.target.value); setProblem(null); setOther(false); }}/></div></label>
    {matches.length > 0 && <div className="suggestions">{matches.map((item) => <button type="button" key={item.name} onClick={() => { setProblem(item); setQuery(item.name); setDepartment(item.department); }}>{item.name}<small>{item.department} · {item.priority}</small></button>)}</div>}
    {problem && <div className="selected-problem"><div className="check">✓</div><div><strong>{problem.name}</strong><span>{problem.department} Department · {problem.priority} priority</span></div></div>}
    <div className="or-row"><span>OR</span></div><button type="button" className={`other-button ${other ? 'active' : ''}`} onClick={() => { setOther(true); setProblem(null); setQuery('Other'); setDepartment(''); }}>OTHER / CAN'T FIND PROBLEM</button>
    {other && <label><span>Department *</span><div className="select-wrap"><select value={department} onChange={(event) => setDepartment(event.target.value)}><option value="">Select department</option>{departments.map((item) => <option key={item}>{item}</option>)}</select></div></label>}
    <label><span>Remarks {other ? '*' : '(Optional)'}</span><textarea rows="3" value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder={other ? 'Describe the problem briefly' : 'Add any useful detail'}/></label>
    <fieldset className="breakdown-type"><legend>Breakdown Type *</legend><div className="type-buttons"><button type="button" disabled={npdActive} className={type === 'NORMAL' ? 'selected' : ''} onClick={() => setType('NORMAL')}>NORMAL</button><button type="button" className={type === 'NPD' ? 'selected npd-selected' : ''} onClick={() => setType('NPD')}>NPD</button></div></fieldset>
    {error && <div className="form-error">{error}</div>}<button className={`primary-button report-submit ${type === 'NPD' ? 'npd-submit' : ''}`}>REPORT BREAKDOWN</button>
  </form></Modal>;
}

function EmployeeModal({ incident, mode, onClose, onSubmit }) {
  const [employee, setEmployee] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const resolve = mode === 'resolve';
  return <Modal title={resolve ? 'Resolve Issue' : 'Acknowledge Issue'} onClose={onClose} narrow={!resolve}><div className="compact-summary"><span>{incident.id}</span><strong>{incident.department} · {incident.problem}</strong></div><form className="stack-form" onSubmit={(event) => { event.preventDefault(); if (!employee) return setError('Select an employee.'); if (resolve && !remarks.trim()) return setError('Resolution remarks are required.'); onSubmit(employee, remarks); }}>
    <label><span>{resolve ? 'Resolved By' : 'Who is attending this issue?'} *</span><div className="select-wrap"><select value={employee} onChange={(event) => setEmployee(event.target.value)}><option value="">Select employee</option>{employeeMaster[incident.department].map((item) => <option key={item}>{item}</option>)}</select></div></label>
    {resolve && <label><span>Resolution Remarks *</span><textarea rows="4" value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder="Example: Reconnected printer cable and restarted printer"/></label>}
    {error && <div className="form-error">{error}</div>}<button className={resolve ? 'resolve-action wide' : 'primary-button'}>{resolve ? 'RESOLVE ISSUE' : 'CONFIRM ACKNOWLEDGEMENT'}</button>
  </form></Modal>;
}

export function ReassignModal({ incident, onClose, onSubmit }) {
  const [target, setTarget] = useState('');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  return <Modal title="Reassign Department" onClose={onClose}><div className="compact-summary"><span>{incident.id} · Current owner: {incident.department}</span><strong>{incident.problem}</strong></div><form className="stack-form" onSubmit={(event) => { event.preventDefault(); if (!target || !reason.trim()) return setError('Target department and reason are required.'); onSubmit(target, reason, remarks); }}>
    <label><span>Target Department *</span><div className="select-wrap"><select value={target} onChange={(event) => setTarget(event.target.value)}><option value="">Select department</option>{departments.filter((item) => item !== incident.department).map((item) => <option key={item}>{item}</option>)}</select></div></label>
    <label><span>Reason *</span><input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why does this belong to another department?"/></label>
    <label><span>Remarks</span><textarea rows="3" value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder="Share investigation details with the new owner"/></label>
    {error && <div className="form-error">{error}</div>}<button className="primary-button">REASSIGN TICKET</button>
  </form></Modal>;
}

export function OperatorDashboard({ session, incidents, clock, actions, onLogout }) {
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const visible = incidents.filter((item) => item.line === session.line && item.belt === session.belt);
  const npdActive = hasNpdAtLocation(incidents, session.line, session.belt);
  const open = (name, incident = null) => { setSelected(incident); setModal(name); };
  return <main className="app-shell"><Topbar title={session.line} subtitle={session.belt} session={session} onLogout={onLogout} actions={<button className="icon-label-button" onClick={() => location.assign('/tv')}>TV Display</button>}/><section className="content-wrap"><NpdBanner incidents={visible}/><button className={`report-hero-button ${npdActive ? 'npd-mode' : ''}`} onClick={() => open('report')}><span className="plus">+</span><div><strong>REPORT BREAKDOWN</strong><span>{npdActive ? 'Only NPD breakdowns can be added right now' : 'Create a new issue'}</span></div></button><div className="section-heading"><div><p className="eyebrow">LIVE</p><h2>Open Issues</h2></div><span className="issue-count">{visible.length} open</span></div><div className="issue-list">{sortForOperations(visible, clock).map((incident) => <IncidentCard key={incident.id} incident={incident} clock={clock} locked={isIncidentNpdLocked(incident, incidents)} onAcknowledge={(item) => open('ack', item)} onResolve={(item) => open('resolve', item)} onReassign={(item) => open('reassign', item)} onDetails={(item) => setSelected(item)}/>)}</div></section>
  {modal === 'report' && (
    <ReportModal incidents={visible} onClose={() => setModal(null)} onSubmit={(data) => { actions.report(data, session); setModal(null); }}/>
  )}
  {modal === 'ack' && (
    <EmployeeModal incident={selected} mode="ack" onClose={() => setModal(null)} onSubmit={(employee) => { actions.ack(selected.id, employee); setModal(null); }}/>
  )}
  {modal === 'resolve' && (
    <EmployeeModal incident={selected} mode="resolve" onClose={() => setModal(null)} onSubmit={(employee, remarks) => { actions.resolve(selected.id, employee, remarks); setModal(null); }}/>
  )}
  {modal === 'reassign' && (
    <ReassignModal incident={selected} onClose={() => setModal(null)} onSubmit={(...values) => { actions.reassign(selected.id, ...values); setModal(null); }}/>
  )}
  {!modal && selected && <IncidentDrawer incident={incidents.find((item) => item.id === selected.id)} clock={clock} onClose={() => setSelected(null)} onReassign={(item) => open('reassign', item)}/>}</main>;
}

function FilterBar({ filters, setFilters, hodDepartment }) {
  return <div className="filter-bar">{!hodDepartment && <select value={filters.department} onChange={(event) => setFilters({ ...filters, department: event.target.value })}><option value="">All departments</option>{departments.map((item) => <option key={item}>{item}</option>)}</select>}<select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option><option value="WAITING_ACK">Waiting ACK</option><option value="ACTIVE">Active</option></select><select value={filters.employee} onChange={(event) => setFilters({ ...filters, employee: event.target.value })}><option value="">All employees</option>{allEmployees.map((item) => <option key={item}>{item}</option>)}</select><select value={filters.line} onChange={(event) => setFilters({ ...filters, line: event.target.value })}><option value="">All lines</option>{['Tata Ace','Tata Magic','Demo Line'].map((item) => <option key={item}>{item}</option>)}</select><select value={filters.flag} onChange={(event) => setFilters({ ...filters, flag: event.target.value })}><option value="">All incidents</option><option value="npd">NPD only</option><option value="overdue">Overdue only</option></select></div>;
}

function IncidentTable({ incidents, allIncidents, clock, onSelect }) {
  return <div className="table-wrap"><table className="incident-table"><thead><tr><th>Ticket</th><th>Incident</th><th>Owner</th><th>Status</th><th>Priority</th><th>Incident SLA</th><th>Attending</th></tr></thead><tbody>{incidents.map((item) => { const metrics = incidentMetrics(item, clock); const locked = isIncidentNpdLocked(item, allIncidents); return <tr className={locked ? 'npd-secondary locked-table-row' : ''} key={item.id} onClick={locked ? undefined : () => onSelect(item)} aria-disabled={locked || undefined}><td><strong>{item.id}</strong>{item.type === 'NPD' && <span className="table-npd">NPD</span>}</td><td><strong>{item.problem}</strong><small>{item.line} · {item.belt}</small></td><td>{item.department}</td><td><StatusPill status={item.status}/>{locked && <span className="table-lock-label">🔒 Locked while NPD is active on this conveyor belt.</span>}</td><td><span className={`priority-pill priority-${item.priority.toLowerCase()}`}>{item.priority}</span></td><td className={metrics.overdue ? 'overdue-text' : ''}>{formatDuration(metrics.incidentMs)}</td><td>{item.acknowledgedBy || '—'}</td></tr>; })}</tbody></table>{incidents.length === 0 && <div className="empty-table">No incidents match the selected filters.</div>}</div>;
}

function DepartmentStatus({ incidents, clock, department }) {
  const groups = department ? [department] : departments;
  return <div className="department-list">{groups.map((name) => { const items = incidents.filter((item) => item.department === name); return <div className="department-row" key={name}><div><strong>{name}</strong><small>{items.filter((item) => item.status === 'ACTIVE').length} active · {items.filter((item) => incidentMetrics(item, clock).overdue).length} overdue</small></div><span>{items.length}</span></div>; })}</div>;
}

export function ManagementDashboard({ session, incidents, clock, actions, onLogout }) {
  const hodDepartment = session.role.endsWith(' HOD') ? session.role.replace(' HOD', '') : null;
  const scoped = hodDepartment ? incidents.filter((item) => item.department === hodDepartment) : incidents;
  const [selected, setSelected] = useState(null);
  const [reassigning, setReassigning] = useState(null);
  const [filters, setFilters] = useState({ department: '', status: '', employee: '', line: '', flag: '' });
  const filtered = scoped.filter((item) => (!filters.department || item.department === filters.department) && (!filters.status || item.status === filters.status) && (!filters.employee || item.acknowledgedBy === filters.employee) && (!filters.line || item.line === filters.line) && (!filters.flag || (filters.flag === 'npd' ? item.type === 'NPD' : incidentMetrics(item, clock).overdue)));
  const summary = getSummary(scoped, clock);
  const recent = [...scoped].flatMap((item) => item.timeline.map((event) => ({ ...event, id: item.id }))).sort((a,b) => b.at-a.at).slice(0,6);
  const escalations = scoped.filter((item) => incidentMetrics(item, clock).escalationLevel > 0).length;
  return <main className="app-shell"><Topbar title={hodDepartment ? `${hodDepartment} HOD` : 'Plant Admin'} subtitle={hodDepartment ? 'Department Operations' : 'Plant Operations'} session={session} onLogout={onLogout} actions={<button className="icon-label-button" onClick={() => location.assign('/tv')}>TV Display</button>}/><section className="admin-wrap"><NpdBanner incidents={incidents}/><SummaryCards summary={summary} department={hodDepartment}/>
    {hodDepartment && <div className="hod-strip"><div><span>Team workload</span><strong>{scoped.filter((item) => item.acknowledgedBy).length}</strong></div><div><span>Escalations</span><strong>{escalations}</strong></div><div><span>Transferred in</span><strong>{scoped.filter((item) => item.transferHistory.some((event) => event.to === hodDepartment)).length}</strong></div><div><span>Transferred out</span><strong>{incidents.filter((item) => item.transferHistory.some((event) => event.from === hodDepartment)).length}</strong></div></div>}
    <div className="dashboard-grid"><section className="panel critical-panel"><div className="panel-heading"><div><p className="eyebrow">PRIORITY</p><h2>Critical Incidents</h2></div></div>{sortForOperations(scoped, clock).filter((item) => item.priority === 'Critical' || item.type === 'NPD').slice(0,5).map((item) => { const locked = isIncidentNpdLocked(item, incidents); return <button className={`critical-row ${locked ? 'npd-secondary' : ''}`} disabled={locked} key={item.id} onClick={() => setSelected(item)}><div><strong>{item.id} · {item.problem}</strong><small>{locked ? `🔒 NPD Active on ${item.belt}` : `${item.department} · ${item.line}`}</small></div><span>{formatDuration(incidentMetrics(item, clock).incidentMs)}</span></button>; })}</section>
    <section className="panel"><div className="panel-heading"><div><p className="eyebrow">OWNERSHIP</p><h2>{hodDepartment ? 'Team Workload' : 'Department Status'}</h2></div></div><DepartmentStatus incidents={scoped} clock={clock} department={hodDepartment}/></section>
    <section className="panel activity-panel"><div className="panel-heading"><div><p className="eyebrow">LIVE</p><h2>Recent Activity</h2></div></div>{recent.map((event, index) => <div className="activity-row" key={`${event.id}-${index}`}><span>{formatTime(event.at)}</span><div><strong>{event.id} · {event.label}</strong><small>{event.detail}</small></div></div>)}</section>
    {!hodDepartment && <section className="panel tv-preview"><div className="panel-heading"><div><p className="eyebrow">DISPLAY</p><h2>TV Preview</h2></div><button className="text-button" onClick={() => location.assign('/tv')}>Open fullscreen</button></div><div className="mini-tv"><strong>{summary.open}</strong><span>Open incidents</span><div><b>{summary.waiting} waiting</b><b>{summary.overdue} overdue</b><b>{summary.npd} NPD</b></div></div></section>}</div>
    <section className="panel incident-section"><div className="panel-heading"><div><p className="eyebrow">OPERATIONS</p><h2>Incident Table</h2></div><span className="issue-count">{filtered.length} incidents</span></div><FilterBar filters={filters} setFilters={setFilters} hodDepartment={hodDepartment}/><IncidentTable incidents={sortForOperations(filtered, clock)} allIncidents={incidents} clock={clock} onSelect={setSelected}/></section>
  </section>{selected && <IncidentDrawer incident={incidents.find((item) => item.id === selected.id)} clock={clock} onClose={() => setSelected(null)} onReassign={(item) => { setSelected(null); setReassigning(item); }}/>} {reassigning && <ReassignModal incident={reassigning} onClose={() => setReassigning(null)} onSubmit={(...values) => { actions.reassign(reassigning.id, ...values); setReassigning(null); }}/>}</main>;
}

export function TvDisplay({ incidents, clock }) {
  const pageSize = 9;
  const sorted = sortForOperations(incidents, clock);
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const [page, setPage] = useState(0);
  useEffect(() => { const timer = setInterval(() => setPage((current) => (current + 1) % pages), 10_000); return () => clearInterval(timer); }, [pages]);
  const summary = getSummary(incidents, clock);
  return <main className="tv-screen"><header className="tv-header"><div><p>YAZAKI · LIVE PLANT OPERATIONS</p><h1>Breakdown Monitoring</h1></div><div className="tv-clock">{new Date(clock).toLocaleTimeString()}</div></header><NpdBanner incidents={incidents}/><SummaryCards summary={summary}/><div className="tv-table"><div className="tv-row tv-table-head"><span>Ticket / Priority</span><span>Problem</span><span>Location</span><span>Status</span><span>Incident Duration</span><span>ACK</span><span>Attending</span></div>{sorted.slice(page * pageSize, page * pageSize + pageSize).map((item) => { const metrics = incidentMetrics(item, clock); const locked = isIncidentNpdLocked(item, incidents); return <div className={`tv-row ${item.type === 'NPD' ? 'tv-npd' : locked ? 'npd-secondary' : ''}`} key={item.id}><span><strong>{item.id}</strong><small>{item.type === 'NPD' ? 'NPD · ' : ''}{item.priority}</small></span><span><strong>{item.problem}</strong><small>{item.department}</small></span><span>{item.line}<small>{item.belt}</small></span><span><StatusPill status={item.status}/>{locked && <small className="tv-lock-label">🔒 NPD active on this belt</small>}</span><span className={metrics.resolutionOverdue ? 'overdue-text' : ''}>{formatDuration(metrics.incidentMs)}</span><span className={metrics.ackOverdue ? 'overdue-text' : ''}>{item.status === 'WAITING_ACK' ? `${metrics.ackOverdue ? '+' : ''}${formatDuration(Math.abs(metrics.ackMs))}` : 'ACK'}</span><span>{item.acknowledgedBy || '—'}</span></div>; })}</div><footer className="tv-footer"><span>Read only · Simulated frontend data</span><span>Page {page + 1} of {pages} · Auto changes every 10 seconds</span></footer></main>;
}
