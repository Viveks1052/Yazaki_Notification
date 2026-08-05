export const departments = ['IT', 'Electrical', 'Store', 'Maintenance'];

export const lines = {
  'Tata Ace': ['Belt 01', 'Belt 02', 'Belt 03'],
  'Tata Magic': ['Belt 01', 'Belt 02'],
  'Demo Line': ['Belt 01'],
};

export const roles = ['Operator', 'Plant Admin', 'IT HOD', 'Electrical HOD', 'Store HOD', 'Maintenance HOD'];

export const employeeMaster = {
  IT: ['Amit Kumar', 'Neeraj Verma', 'Ritika Jain'],
  Electrical: ['Rahul Sharma', 'Pooja Mehta', 'Vijay Yadav'],
  Store: ['Sachin Singh', 'Nisha Gupta', 'Mohan Lal'],
  Maintenance: ['Deepak Patel', 'Anil Kumar', 'Suresh Rao'],
};

export const allEmployees = Object.values(employeeMaster).flat();

export const escalationMaster = Object.fromEntries(departments.map((department) => [department, [
  { level: 0, role: `${department} Desk`, afterMinutes: 0 },
  { level: 1, role: `${department} Supervisor`, afterMinutes: 10 },
  { level: 2, role: `${department} Manager`, afterMinutes: 20 },
  { level: 3, role: 'Plant Head', afterMinutes: 30 },
]]));

export const problemMaster = [
  { name: 'Printer not working', keywords: ['printer', 'print', 'label'], department: 'IT', priority: 'Medium', suggestedResolution: ['Restart printer', 'Check power and data cable', 'Restart print service'], ackSla: 10, resolutionSla: 45 },
  { name: 'Network not available', keywords: ['network', 'internet', 'wifi'], department: 'IT', priority: 'High', suggestedResolution: ['Check switch link', 'Renew terminal connection', 'Escalate to network support'], ackSla: 8, resolutionSla: 30 },
  { name: 'Computer not starting', keywords: ['computer', 'pc', 'system'], department: 'IT', priority: 'Medium', suggestedResolution: ['Check power supply', 'Remove peripheral devices', 'Run hardware diagnostics'], ackSla: 10, resolutionSla: 45 },
  { name: 'Power supply issue', keywords: ['power', 'electricity', 'supply'], department: 'Electrical', priority: 'Critical', suggestedResolution: ['Isolate affected circuit', 'Inspect breaker and supply', 'Restore after safety clearance'], ackSla: 5, resolutionSla: 25 },
  { name: 'Lighting issue', keywords: ['light', 'lighting'], department: 'Electrical', priority: 'Low', suggestedResolution: ['Check fixture supply', 'Replace failed lamp', 'Verify illumination level'], ackSla: 15, resolutionSla: 60 },
  { name: 'Material unavailable', keywords: ['material', 'stock', 'item'], department: 'Store', priority: 'High', suggestedResolution: ['Verify line-side stock', 'Check reserve inventory', 'Arrange urgent replenishment'], ackSla: 8, resolutionSla: 30 },
  { name: 'Consumable exhausted', keywords: ['consumable', 'paper', 'stock'], department: 'Store', priority: 'Medium', suggestedResolution: ['Confirm required quantity', 'Issue from line-side store', 'Update replenishment signal'], ackSla: 10, resolutionSla: 40 },
  { name: 'Machine abnormal noise', keywords: ['machine', 'noise', 'vibration'], department: 'Maintenance', priority: 'High', suggestedResolution: ['Stop and isolate machine', 'Inspect bearings and guards', 'Test at low speed'], ackSla: 5, resolutionSla: 35 },
  { name: 'Conveyor belt jam', keywords: ['belt', 'jam', 'conveyor'], department: 'Maintenance', priority: 'Critical', suggestedResolution: ['Stop conveyor safely', 'Remove obstruction', 'Inspect alignment before restart'], ackSla: 5, resolutionSla: 20 },
  { name: 'Sensor not detecting', keywords: ['sensor', 'detect', 'signal'], department: 'Maintenance', priority: 'High', suggestedResolution: ['Clean sensor face', 'Check alignment and cable', 'Replace sensor if required'], ackSla: 8, resolutionSla: 30 },
];

const now = Date.now();
const seed = [
  ['IT','Printer not working','WAITING_ACK','Medium',3,'Tata Ace','Belt 03',false],
  ['Store','Material unavailable','ACTIVE','High',18,'Tata Ace','Belt 03',false],
  ['Electrical','Power supply issue','WAITING_ACK','Critical',22,'Tata Magic','Belt 01',true],
  ['Maintenance','Conveyor belt jam','ACTIVE','Critical',47,'Tata Ace','Belt 01',true],
  ['IT','Network not available','ACTIVE','High',38,'Tata Magic','Belt 02',false],
  ['Maintenance','Machine abnormal noise','WAITING_ACK','High',12,'Demo Line','Belt 01',false],
  ['Store','Consumable exhausted','ACTIVE','Medium',63,'Tata Ace','Belt 02',false],
  ['Electrical','Lighting issue','WAITING_ACK','Low',7,'Tata Ace','Belt 01',false],
  ['Maintenance','Sensor not detecting','ACTIVE','High',28,'Tata Magic','Belt 01',false],
  ['IT','Computer not starting','WAITING_ACK','Medium',14,'Tata Ace','Belt 03',false],
  ['Maintenance','Conveyor belt jam','ACTIVE','Critical',81,'Demo Line','Belt 01',false],
  ['Store','Material unavailable','WAITING_ACK','High',19,'Tata Magic','Belt 02',false],
  ['IT','Printer not working','ACTIVE','Medium',34,'Tata Ace','Belt 01',false],
  ['Electrical','Power supply issue','ACTIVE','Critical',52,'Tata Ace','Belt 02',false],
  ['Store','Consumable exhausted','WAITING_ACK','Medium',4,'Tata Ace','Belt 03',false],
  ['Maintenance','Machine abnormal noise','ACTIVE','High',46,'Tata Magic','Belt 01',false],
  ['IT','Network not available','WAITING_ACK','High',9,'Demo Line','Belt 01',false],
  ['Electrical','Lighting issue','ACTIVE','Low',71,'Tata Ace','Belt 01',false],
  ['Store','Material unavailable','ACTIVE','High',25,'Tata Magic','Belt 02',false],
  ['Maintenance','Sensor not detecting','WAITING_ACK','High',16,'Tata Ace','Belt 02',false],
  ['IT','Computer not starting','ACTIVE','Medium',58,'Tata Ace','Belt 03',false],
  ['Electrical','Power supply issue','WAITING_ACK','Critical',11,'Demo Line','Belt 01',false],
  ['Store','Consumable exhausted','ACTIVE','Medium',43,'Tata Ace','Belt 01',false],
  ['Maintenance','Conveyor belt jam','WAITING_ACK','Critical',6,'Tata Magic','Belt 01',false],
  ['IT','Printer not working','ACTIVE','Medium',29,'Tata Ace','Belt 02',false],
  ['Electrical','Lighting issue','WAITING_ACK','Low',17,'Tata Magic','Belt 02',false],
  ['Store','Material unavailable','ACTIVE','High',76,'Tata Ace','Belt 03',false],
  ['Maintenance','Machine abnormal noise','ACTIVE','High',36,'Demo Line','Belt 01',false],
];

export const initialIncidents = seed.map(([department, problem, status, priority, age, line, belt, npd], index) => {
  const master = problemMaster.find((item) => item.name === problem);
  const createdAt = now - age * 60_000;
  const acknowledgedAt = status === 'ACTIVE' ? createdAt + Math.min(master.ackSla - 1, 6 + (index % 3)) * 60_000 : null;
  const assignee = status === 'ACTIVE' ? employeeMaster[department][index % employeeMaster[department].length] : null;
  const reassigned = [8, 18, 26].includes(index);
  const previousDepartment = reassigned ? departments[(departments.indexOf(department) + 3) % departments.length] : null;
  const departmentStartedAt = reassigned ? createdAt + 14 * 60_000 : createdAt;
  return {
    id: `BD-${1042 + index}`,
    problem,
    department,
    previousDepartment,
    priority,
    status,
    type: npd ? 'NPD' : 'NORMAL',
    line,
    belt,
    remarks: index % 3 === 0 ? 'Production team requested priority attention.' : '',
    createdAt,
    departmentStartedAt,
    acknowledgedAt,
    acknowledgedBy: assignee,
    ackSla: master.ackSla,
    resolutionSla: master.resolutionSla,
    suggestedResolution: master.suggestedResolution,
    transferHistory: reassigned ? [{ from: previousDepartment, to: department, reason: 'Technical ownership confirmed during investigation', remarks: 'Transferred with existing observations.', at: departmentStartedAt }] : [],
    timeline: [
      { label: 'Created', detail: `${line} · ${belt}`, at: createdAt },
      ...(reassigned ? [{ label: 'Investigation', detail: `${previousDepartment} assessed the incident`, at: createdAt + 7 * 60_000 }, { label: 'Transferred', detail: `${previousDepartment} → ${department}`, at: departmentStartedAt }] : []),
      ...(acknowledgedAt ? [{ label: 'Acknowledged', detail: assignee, at: acknowledgedAt }] : []),
    ],
  };
});
