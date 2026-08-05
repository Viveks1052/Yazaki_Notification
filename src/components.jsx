import React from 'react';
import { escalationMaster } from './data';
import { formatDateTime, formatDuration, formatTime, incidentMetrics } from './utils';

export function Topbar({ title, subtitle, session, onLogout, actions }) {
  return <header className="topbar enterprise-topbar">
    <div><p className="eyebrow">BREAKDOWN NOTIFICATION</p><div className="station-line"><h1>{title}</h1>{subtitle && <span>{subtitle}</span>}</div></div>
    <div className="topbar-actions">{actions}<div className="user-chip">● {session.username} · {session.role}</div><button className="icon-label-button" onClick={onLogout}>↪ Logout</button></div>
  </header>;
}

export function SummaryCards({ summary, department }) {
  const cards = [
    ['Open', summary.open, 'All unresolved incidents'],
    ['Waiting ACK', summary.waiting, 'Awaiting ownership'],
    ['Active', summary.active, 'Being investigated'],
    ['Overdue', summary.overdue, 'SLA attention required'],
    ...(department ? [] : [['NPD', summary.npd, 'Production stopping']]),
  ];
  return <div className="summary-grid">{cards.map(([label, value, hint]) => <article className={`summary-card ${label === 'Overdue' && value ? 'warning' : ''} ${label === 'NPD' && value ? 'critical' : ''}`} key={label}><span>{label}</span><strong>{value}</strong><small>{hint}</small></article>)}</div>;
}

export function Modal({ title, children, onClose, narrow = false }) {
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}><section className={`modal ${narrow ? 'narrow' : ''}`}><div className="modal-header"><h2>{title}</h2><button className="icon-button" aria-label="Close" onClick={onClose}>×</button></div><div className="modal-body">{children}</div></section></div>;
}

export function StatusPill({ status }) {
  return <span className={`status-pill ${status === 'WAITING_ACK' ? 'waiting' : 'acknowledged'}`}>{status === 'WAITING_ACK' ? 'WAITING FOR ACK' : 'ACTIVE'}</span>;
}

export function SlaBlock({ incident, clock, compact = false }) {
  const metrics = incidentMetrics(incident, clock);
  return <div className={`sla-pair ${compact ? 'compact' : ''}`}>
    <div><span>INCIDENT SLA</span><strong className={metrics.resolutionOverdue ? 'overdue-text' : ''}>{formatDuration(metrics.incidentMs)}</strong><small>Never resets · {incident.resolutionSla}m target</small></div>
    <div><span>DEPARTMENT SLA</span><strong className={metrics.ackOverdue ? 'overdue-text' : ''}>{formatDuration(metrics.departmentMs)}</strong><small>Since current owner received it</small></div>
  </div>;
}

export function IncidentCard({ incident, clock, onAcknowledge, onResolve, onDetails, onReassign, faded }) {
  const metrics = incidentMetrics(incident, clock);
  return <article className={`issue-card ${incident.type === 'NPD' ? 'npd-card' : ''} ${faded ? 'faded-card' : ''}`}>
    <div className="issue-topline"><div className="issue-id-wrap"><span className="issue-id">{incident.id}</span>{incident.type === 'NPD' && <span className="npd-pill">NPD</span>}<span className={`priority-pill priority-${incident.priority.toLowerCase()}`}>{incident.priority}</span></div><StatusPill status={incident.status} /></div>
    <div className="issue-main"><div><p className="department">{incident.department} · {incident.line} · {incident.belt}</p><h3>{incident.problem}</h3>{incident.remarks && <p className="remarks-preview">{incident.remarks}</p>}</div><div className="issue-timebox"><span>{incident.status === 'WAITING_ACK' ? (metrics.ackOverdue ? 'ACK OVERDUE' : 'ACK DUE IN') : 'INCIDENT DURATION'}</span><strong className={metrics.overdue ? 'overdue-text' : ''}>{incident.status === 'WAITING_ACK' ? formatDuration(Math.abs(metrics.ackMs)) : formatDuration(metrics.incidentMs)}</strong></div></div>
    <div className="issue-footer"><div className="timeline-copy"><span>Reported {formatTime(incident.createdAt)}</span>{incident.acknowledgedBy && <span className="attendee-copy">• {incident.acknowledgedBy}</span>}</div><div className="card-actions"><button className="ghost-small" onClick={() => onDetails(incident)}>DETAILS</button>{incident.status === 'WAITING_ACK' ? <button className="secondary-action" onClick={() => onAcknowledge(incident)}>ACKNOWLEDGE</button> : <><button className="ghost-small" onClick={() => onReassign(incident)}>REASSIGN</button><button className="resolve-action" onClick={() => onResolve(incident)}>RESOLVE</button></>}</div></div>
  </article>;
}

export function Timeline({ items }) {
  return <div className="timeline">{items.map((item, index) => <div className="timeline-item" key={`${item.label}-${item.at}-${index}`}><span className="timeline-dot"/><div><strong>{item.label}</strong><p>{item.detail}</p><small>{formatDateTime(item.at)}</small></div></div>)}</div>;
}

export function Escalation({ incident, clock }) {
  const metrics = incidentMetrics(incident, clock);
  return <div className="escalation-list">{escalationMaster[incident.department].map((step) => <div className={`escalation-step ${step.level <= metrics.escalationLevel ? 'reached' : ''}`} key={step.level}><span>{step.level === 0 ? 'Now' : `${step.afterMinutes}m`}</span><strong>{step.role}</strong>{step.level === metrics.escalationLevel && <small>Current level</small>}</div>)}</div>;
}

export function IncidentDrawer({ incident, clock, onClose, onReassign }) {
  if (!incident) return null;
  return <div className="drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside className="incident-drawer"><div className="drawer-header"><div><p className="eyebrow">INCIDENT DETAILS</p><h2>{incident.id}</h2></div><button className="icon-button" onClick={onClose}>×</button></div><div className="drawer-body">
    <div className="drawer-title"><div><p className="department">{incident.department} · {incident.priority}</p><h3>{incident.problem}</h3></div><StatusPill status={incident.status}/></div>
    <SlaBlock incident={incident} clock={clock}/>
    <section className="detail-section"><div className="detail-heading"><h3>Current owner</h3>{incident.status === 'ACTIVE' && <button className="text-button" onClick={() => onReassign(incident)}>Reassign department</button>}</div><p>{incident.department} Department</p><small>{incident.acknowledgedBy || 'Awaiting attending employee'}</small></section>
    <section className="detail-section"><h3>Suggested resolution</h3><ol>{incident.suggestedResolution.map((step) => <li key={step}>{step}</li>)}</ol></section>
    <section className="detail-section"><h3>Escalation matrix</h3><Escalation incident={incident} clock={clock}/></section>
    <section className="detail-section"><h3>Timeline</h3><Timeline items={incident.timeline}/></section>
    {incident.transferHistory.length > 0 && <section className="detail-section"><h3>Transfer history</h3>{incident.transferHistory.map((transfer, index) => <div className="transfer-record" key={index}><strong>{transfer.from} → {transfer.to}</strong><p>{transfer.reason}</p><small>{transfer.remarks}</small></div>)}</section>}
    <section className="detail-section"><h3>Remarks</h3><p>{incident.remarks || 'No reporting remarks provided.'}</p></section>
  </div></aside></div>;
}

export function Toast({ toast }) {
  return toast ? <div className="toast"><div className="check">✓</div><div><strong>{toast.title}</strong><span>{toast.message}</span></div></div> : null;
}
