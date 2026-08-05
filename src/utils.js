export const formatDuration = (milliseconds) => {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
export const formatDateTime = (timestamp) => new Date(timestamp).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export const incidentLocationKey = (incident) => `${incident.line}::${incident.belt}`;

export const getNpdLocations = (incidents) => [...new Map(
  incidents
    .filter((incident) => incident.type === 'NPD')
    .map((incident) => [incidentLocationKey(incident), { line: incident.line, belt: incident.belt }]),
).values()];

export const hasNpdAtLocation = (incidents, line, belt) => incidents.some(
  (incident) => incident.type === 'NPD' && incident.line === line && incident.belt === belt,
);

export const isIncidentNpdLocked = (incident, incidents) => incident.type !== 'NPD'
  && hasNpdAtLocation(incidents, incident.line, incident.belt);

export const incidentMetrics = (incident, clock = Date.now()) => {
  const incidentMs = clock - incident.createdAt;
  const departmentMs = clock - incident.departmentStartedAt;
  const ackLimit = incident.ackSla * 60_000;
  const resolutionLimit = incident.resolutionSla * 60_000;
  const ackMs = incident.status === 'WAITING_ACK' ? ackLimit - departmentMs : 0;
  const ackOverdue = incident.status === 'WAITING_ACK' && ackMs < 0;
  const resolutionOverdue = incidentMs > resolutionLimit;
  const escalationLevel = Math.min(3, Math.floor(departmentMs / 600_000));
  return { incidentMs, departmentMs, ackMs, ackOverdue, resolutionOverdue, overdue: ackOverdue || resolutionOverdue, escalationLevel };
};

export const incidentPriorityRank = (incident, clock = Date.now()) => {
  const metrics = incidentMetrics(incident, clock);
  if (incident.type === 'NPD') return 0;
  if (metrics.ackOverdue) return 1;
  if (metrics.resolutionOverdue) return 2;
  if (incident.status === 'WAITING_ACK') return 3;
  return 4;
};

export const sortForOperations = (incidents, clock) => [...incidents].sort((a, b) => {
  const rank = incidentPriorityRank(a, clock) - incidentPriorityRank(b, clock);
  return rank || a.createdAt - b.createdAt;
});

export const getSummary = (incidents, clock) => ({
  open: incidents.length,
  waiting: incidents.filter((item) => item.status === 'WAITING_ACK').length,
  active: incidents.filter((item) => item.status === 'ACTIVE').length,
  overdue: incidents.filter((item) => incidentMetrics(item, clock).overdue).length,
  npd: incidents.filter((item) => item.type === 'NPD').length,
});
