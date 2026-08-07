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

export const reportTimeframes = [
  { label: 'Last 24 Hours', hours: 24 },
  { label: 'Last 3 Days', hours: 72 },
  { label: 'Last 7 Days', hours: 168 },
  { label: 'Last 30 Days', hours: 720 },
];

export const isOpenIncident = (incident) => incident.status !== 'RESOLVED';
export const getOpenIncidents = (incidents) => incidents.filter(isOpenIncident);
export const incidentLocationKey = (incident) => `${incident.line}::${incident.belt}`;

export const getNpdLocations = (incidents) => [...new Map(
  incidents
    .filter((incident) => isOpenIncident(incident) && incident.type === 'NPD')
    .map((incident) => [incidentLocationKey(incident), { line: incident.line, belt: incident.belt }]),
).values()];

export const hasNpdAtLocation = (incidents, line, belt) => incidents.some(
  (incident) => isOpenIncident(incident) && incident.type === 'NPD' && incident.line === line && incident.belt === belt,
);

export const isIncidentNpdLocked = (incident, incidents) => incident.type !== 'NPD'
  && isOpenIncident(incident)
  && hasNpdAtLocation(incidents, incident.line, incident.belt);

export const incidentMetrics = (incident, clock = Date.now()) => {
  const metricEnd = incident.status === 'RESOLVED' && incident.resolvedAt ? incident.resolvedAt : clock;
  const incidentMs = metricEnd - incident.createdAt;
  const departmentMs = metricEnd - incident.departmentStartedAt;
  const ackLimit = incident.ackSla * 60_000;
  const resolutionLimit = incident.resolutionSla * 60_000;
  const ackMs = incident.status === 'WAITING_ACK' ? ackLimit - departmentMs : 0;
  const ackOverdue = incident.status === 'WAITING_ACK' && ackMs < 0;
  const resolutionOverdue = incidentMs > resolutionLimit;
  const escalationLevel = Math.min(3, Math.floor(departmentMs / 600_000));
  return { incidentMs, departmentMs, ackMs, ackOverdue, resolutionOverdue, overdue: ackOverdue || resolutionOverdue, escalationLevel };
};

export const incidentPriorityRank = (incident, clock = Date.now()) => {
  if (!isOpenIncident(incident)) return 5;
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

export const getSummary = (incidents, clock) => {
  const openIncidents = getOpenIncidents(incidents);
  return {
    open: openIncidents.length,
    waiting: openIncidents.filter((item) => item.status === 'WAITING_ACK').length,
    active: openIncidents.filter((item) => item.status === 'ACTIVE').length,
    overdue: openIncidents.filter((item) => incidentMetrics(item, clock).overdue).length,
    npd: openIncidents.filter((item) => item.type === 'NPD').length,
  };
};

const csvColumns = [
  ['Ticket ID', (incident) => incident.id],
  ['Date Created', (incident) => new Date(incident.createdAt).toISOString()],
  ['Problem', (incident) => incident.problem],
  ['Department', (incident) => incident.department],
  ['Location', (incident) => `${incident.line} - ${incident.belt}`],
  ['Priority', (incident) => incident.priority],
  ['Status', (incident) => incident.status],
];

const escapeCsvValue = (value) => {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export const filterIncidentReportData = (incidents, { hoursBack, department, clock = Date.now() }) => {
  const cutoff = clock - hoursBack * 60 * 60 * 1000;
  return incidents
    .filter((incident) => incident.createdAt >= cutoff)
    .filter((incident) => !department || incident.department === department)
    .sort((a, b) => b.createdAt - a.createdAt);
};

export const incidentsToCsv = (incidents) => {
  const header = csvColumns.map(([label]) => escapeCsvValue(label)).join(',');
  const rows = incidents.map((incident) => csvColumns
    .map(([, getValue]) => escapeCsvValue(getValue(incident)))
    .join(','));
  return [header, ...rows].join('\n');
};

export const downloadCsvFile = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadIncidentReportCsv = (incidents, { hoursBack, department, clock = Date.now() }) => {
  const rows = filterIncidentReportData(incidents, { hoursBack, department, clock });
  const timeframe = reportTimeframes.find((item) => item.hours === hoursBack)?.label || `${hoursBack}h`;
  const scope = department ? department.toLowerCase() : 'plant';
  const filename = `incident-report-${scope}-${timeframe.toLowerCase().replaceAll(' ', '-')}.csv`;
  downloadCsvFile(incidentsToCsv(rows), filename);
  return rows.length;
};
