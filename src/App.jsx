import React, { useEffect, useState } from 'react';
import { historicalIncidents, initialIncidents, lines, problemMaster, roles } from './data';
import { ManagementDashboard, OperatorDashboard, TvDisplay } from './dashboards';
import { Toast } from './components';
import { getOpenIncidents, hasNpdAtLocation, isIncidentNpdLocked } from './utils';

function Login({ onLogin }) {
  const [line, setLine] = useState('Tata Ace');
  const [belt, setBelt] = useState('Belt 03');
  const [role, setRole] = useState('Operator');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const isOperator = role === 'Operator';
  const lineOptions = Object.keys(lines);
  const beltOptions = isOperator && line ? lines[line] : [];
  const handleRoleChange = (event) => {
    const nextRole = event.target.value;
    setRole(nextRole);
    if (nextRole === 'Operator') {
      const nextLine = line || lineOptions[0];
      setLine(nextLine);
      setBelt(belt || lines[nextLine][0]);
      return;
    }
    setLine('');
    setBelt('');
  };

  return <main className="login-page"><section className="login-card"><div className="brand-mark">BN</div><p className="eyebrow">PHASE 1 PROTOTYPE</p><h1>Breakdown Notification</h1><p className="login-copy">Select the production line and your demonstration role to continue.</p><form className="login-form" onSubmit={(event) => { event.preventDefault(); if (!username.trim() || !password.trim()) return setError('Enter username and password to continue.'); onLogin({ line: isOperator ? line : '', belt: isOperator ? belt : '', role, username }); }}>
    <label><span>Role</span><div className="select-wrap"><select value={role} onChange={handleRoleChange}>{roles.map((item) => <option key={item}>{item}</option>)}</select></div></label>
    <div className="form-row"><label><span>Line Name</span><div className="select-wrap"><select value={line} disabled={!isOperator} onChange={(event) => { setLine(event.target.value); setBelt(lines[event.target.value][0]); }}>{!isOperator && <option value="">Not required</option>}{lineOptions.map((item) => <option key={item}>{item}</option>)}</select></div></label><label><span>Conveyor Belt</span><div className="select-wrap"><select value={belt} disabled={!isOperator} onChange={(event) => setBelt(event.target.value)}>{!isOperator && <option value="">Not required</option>}{beltOptions.map((item) => <option key={item}>{item}</option>)}</select></div></label></div>
    <label><span>Username</span><input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter username"/></label><label><span>Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password"/></label>{error && <div className="form-error">{error}</div>}<button className="primary-button login-button">LOGIN</button><p className="demo-note">Prototype: any non-empty username and password will work.</p>
  </form></section></main>;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [incidents, setIncidents] = useState(() => [...historicalIncidents, ...initialIncidents]);
  const [clock, setClock] = useState(Date.now());
  const [toast, setToast] = useState(null);
  const openIncidents = getOpenIncidents(incidents);
  useEffect(() => { const timer = setInterval(() => setClock(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const notify = (title, message) => { setToast({ title, message }); setTimeout(() => setToast(null), 4200); };
  const update = (id, callback) => setIncidents((current) => current.map((item) => item.id === id ? callback(item) : item));
  const operationLocked = (id) => {
    const incident = incidents.find((item) => item.id === id);
    return incident ? isIncidentNpdLocked(incident, openIncidents) : false;
  };
  const rejectLockedOperation = (id) => {
    if (!operationLocked(id)) return false;
    notify('Operation Locked', 'This incident is locked while NPD is active on its conveyor belt.');
    return true;
  };
  const actions = {
    report(data, login) {
      const effectiveType = hasNpdAtLocation(openIncidents, login.line, login.belt) ? 'NPD' : data.type;
      const master = data.problem || { name: 'Other', department: data.department, priority: effectiveType === 'NPD' ? 'Critical' : 'Medium', ackSla: 10, resolutionSla: 45, suggestedResolution: ['Assess the reported condition', 'Apply department standard work', 'Verify operation before closure'] };
      const createdAt = Date.now();
      const id = `BD-${Math.max(...incidents.map((item) => Number(item.id.split('-')[1]))) + 1}`;
      setIncidents((current) => [{ id, problem: master.name, department: master.department, previousDepartment: null, priority: master.priority, status: 'WAITING_ACK', type: effectiveType, line: login.line, belt: login.belt, remarks: data.remarks.trim(), createdAt, departmentStartedAt: createdAt, acknowledgedAt: null, acknowledgedBy: null, resolvedAt: null, ackSla: master.ackSla, resolutionSla: master.resolutionSla, suggestedResolution: master.suggestedResolution, transferHistory: [], timeline: [{ label: 'Created', detail: `${login.line} · ${login.belt}`, at: createdAt }, { label: 'Department notified', detail: `${master.department} Department`, at: createdAt }] }, ...current]);
      notify(effectiveType === 'NPD' ? 'NPD Breakdown Reported' : 'Breakdown Reported', `Message simulated to ${master.department} Department.`);
    },
    ack(id, employee) { if (rejectLockedOperation(id)) return; const at = Date.now(); update(id, (item) => ({ ...item, status: 'ACTIVE', acknowledgedAt: at, acknowledgedBy: employee, timeline: [...item.timeline, { label: 'Acknowledged', detail: employee, at }] })); notify('Issue Acknowledged', `Resolution timer continues for ${id}.`); },
    resolve(id, employee, remarks) { if (rejectLockedOperation(id)) return; const at = Date.now(); update(id, (item) => ({ ...item, status: 'RESOLVED', resolvedAt: at, timeline: [...item.timeline, { label: 'Resolved', detail: `${employee}: ${remarks}`, at }] })); notify('Issue Resolved', `${id} resolved by ${employee}. ${remarks}`); },
    reassign(id, target, reason, remarks) { if (rejectLockedOperation(id)) return; const at = Date.now(); update(id, (item) => ({ ...item, previousDepartment: item.department, department: target, departmentStartedAt: at, status: 'WAITING_ACK', acknowledgedAt: null, acknowledgedBy: null, transferHistory: [...item.transferHistory, { from: item.department, to: target, reason, remarks, at }], timeline: [...item.timeline, { label: 'Investigation', detail: reason, at: at - 1000 }, { label: 'Transferred', detail: `${item.department} → ${target}`, at }], suggestedResolution: problemMaster.find((master) => master.department === target)?.suggestedResolution || item.suggestedResolution })); notify('Department Reassigned', `${id} transferred to ${target}. Department SLA restarted; Incident SLA continues.`); },
  };
  if (location.pathname === '/tv') return <TvDisplay incidents={openIncidents} clock={clock}/>;
  if (!session) return <><Login onLogin={setSession}/><Toast toast={toast}/></>;
  const dashboard = session.role === 'Operator' ? <OperatorDashboard session={session} incidents={openIncidents} clock={clock} actions={actions} onLogout={() => setSession(null)}/> : <ManagementDashboard session={session} incidents={openIncidents} exportIncidents={incidents} clock={clock} actions={actions} onLogout={() => setSession(null)}/>;
  return <>{dashboard}<Toast toast={toast}/></>;
}
