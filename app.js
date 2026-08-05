const ACK_WINDOW = 10 * 60;

const lineOptions = {
  'Tata Ace': ['Belt 01', 'Belt 02', 'Belt 03'],
  'Tata Magic': ['Belt 01', 'Belt 02'],
  'Demo Line': ['Belt 01']
};
const employees = ['Amit Kumar', 'Rahul Sharma', 'Sachin Singh', 'Neeraj Verma', 'Pooja Mehta'];
const departments = ['IT', 'Electrical', 'Store', 'Maintenance'];
const problemCatalogue = [
  { label:'Printer not working', department:'IT', keywords:['printer','print'] },
  { label:'Network not available', department:'IT', keywords:['network','internet','wifi'] },
  { label:'Computer not starting', department:'IT', keywords:['computer','pc','system'] },
  { label:'Power supply issue', department:'Electrical', keywords:['power','electricity','supply'] },
  { label:'Lighting issue', department:'Electrical', keywords:['light','lighting'] },
  { label:'Material unavailable', department:'Store', keywords:['material','stock','item'] },
  { label:'Consumable exhausted', department:'Store', keywords:['consumable','paper','stock'] },
  { label:'Machine abnormal noise', department:'Maintenance', keywords:['machine','noise'] }
];

const now = Date.now();
let issueCounter = 1043;
let state = {
  session: null,
  issues: [
    { id:'BD-1042', department:'IT', problem:'Printer not working', remarks:'', type:'NORMAL', status:'WAITING_ACK', reportedAt:now - 3*60*1000, acknowledgedAt:null, acknowledgedBy:null },
    { id:'BD-1041', department:'Store', problem:'Material unavailable', remarks:'Connector tray stock is empty.', type:'NORMAL', status:'ACKNOWLEDGED', reportedAt:now - 18*60*1000, acknowledgedAt:now - 12*60*1000, acknowledgedBy:'Amit Kumar' }
  ],
  modal: null,
  selectedIssueId: null,
  toastTimer: null
};

const app = document.getElementById('app');
const modalRoot = document.getElementById('modal-root');
const toastRoot = document.getElementById('toast-root');

const pad = n => String(n).padStart(2,'0');
const formatElapsed = sec => { const s=Math.max(0,Math.floor(sec)); return `${pad(Math.floor(s/60))}:${pad(s%60)}`; };
const formatTime = ts => new Date(ts).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
const getIssue = () => state.issues.find(i => i.id === state.selectedIssueId);
const npdActive = () => state.issues.some(i => i.type === 'NPD');
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[ch]));

function render(){ state.session ? renderDashboard() : renderLogin(); }

function renderLogin(){
  app.innerHTML = `
    <main class="login-page"><section class="login-card">
      <div class="brand-mark">BN</div><p class="eyebrow">PHASE 1 PROTOTYPE</p><h1>Breakdown Notification</h1>
      <p class="login-copy">Select the production line and sign in to report or attend breakdowns.</p>
      <form class="login-form" id="login-form">
        <label><span>Line Name</span><div class="select-wrap"><select id="login-line">${Object.keys(lineOptions).map(x=>`<option ${x==='Tata Ace'?'selected':''}>${x}</option>`).join('')}</select></div></label>
        <label><span>Conveyor Belt</span><div class="select-wrap"><select id="login-belt"></select></div></label>
        <label><span>Username</span><input id="login-user" placeholder="Enter username"></label>
        <label><span>Password</span><input id="login-pass" type="password" placeholder="Enter password"></label>
        <div id="login-error"></div>
        <button class="primary-button login-button" type="submit">LOGIN</button>
        <p class="demo-note">Prototype: any non-empty username and password will work.</p>
      </form>
    </section></main>`;
  const line = document.getElementById('login-line'); const belt = document.getElementById('login-belt');
  const fillBelts = () => { belt.innerHTML=lineOptions[line.value].map(x=>`<option ${x==='Belt 03'?'selected':''}>${x}</option>`).join(''); };
  fillBelts(); line.onchange=fillBelts;
  document.getElementById('login-form').onsubmit = e => {
    e.preventDefault(); const username=document.getElementById('login-user').value.trim(); const password=document.getElementById('login-pass').value.trim();
    if(!username || !password){ document.getElementById('login-error').innerHTML='<div class="form-error">Enter username and password to continue.</div>'; return; }
    state.session={line:line.value,belt:belt.value,username}; render();
  };
}

function renderDashboard(){
  const activeNpd=npdActive();
  const sorted=[...state.issues].sort((a,b)=>a.type==='NPD'&&b.type!=='NPD'?-1:a.type!=='NPD'&&b.type==='NPD'?1:b.reportedAt-a.reportedAt);
  app.innerHTML=`<main class="app-shell">
    <header class="topbar"><div><p class="eyebrow">BREAKDOWN NOTIFICATION</p><div class="station-line"><h1>${escapeHtml(state.session.line)}</h1><span>${escapeHtml(state.session.belt)}</span></div></div>
    <div class="topbar-actions"><div class="user-chip">● ${escapeHtml(state.session.username)}</div><button class="icon-label-button" id="logout">↪ Logout</button></div></header>
    <section class="content-wrap">
      ${activeNpd?`<div class="global-npd-banner"><div class="alert-icon">!</div><div><strong>NPD ACTIVE — PRODUCTION STOPPED</strong><span>Normal breakdown reporting remains blocked until all NPD issues are resolved.</span></div></div>`:''}
      <button class="report-hero-button ${activeNpd?'npd-mode':''}" id="open-report"><span class="plus">+</span><div><strong>REPORT BREAKDOWN</strong><span>${activeNpd?'Only NPD breakdowns can be added right now':'Create a new issue'}</span></div></button>
      <div class="section-heading"><div><p class="eyebrow">LIVE</p><h2>Open Issues</h2></div><span class="issue-count">${state.issues.length} open</span></div>
      <div class="issue-list">${sorted.length?sorted.map(i=>issueCard(i,activeNpd)).join(''):`<div class="empty-state"><div class="big-check">✓</div><h3>No open breakdowns</h3><p>All reported issues have been resolved.</p></div>`}</div>
    </section></main>`;
  document.getElementById('logout').onclick=()=>{state.session=null;closeModal();render();};
  document.getElementById('open-report').onclick=()=>openReportModal();
  document.querySelectorAll('[data-ack]').forEach(btn=>btn.onclick=()=>openAckModal(btn.dataset.ack));
  document.querySelectorAll('[data-resolve]').forEach(btn=>btn.onclick=()=>openResolveModal(btn.dataset.resolve));
}

function issueCard(issue,activeNpd){
  const now=Date.now(); const isNpd=issue.type==='NPD'; const faded=activeNpd&&!isNpd;
  let timer='';
  if(issue.status==='WAITING_ACK'){
    const remaining=ACK_WINDOW-(now-issue.reportedAt)/1000;
    timer=`<span>${remaining>=0?'ACK DUE IN':'ACK OVERDUE'}</span><strong>${formatElapsed(Math.abs(remaining))}</strong>`;
  } else timer=`<span>RESOLUTION TIME</span><strong>${formatElapsed((now-issue.acknowledgedAt)/1000)}</strong>`;
  return `<article class="issue-card ${isNpd?'npd-card':''} ${faded?'faded-card':''}">
    <div class="issue-topline"><div class="issue-id-wrap"><span class="issue-id">${issue.id}</span>${isNpd?'<span class="npd-pill">NPD</span>':''}</div><span class="status-pill ${issue.status==='WAITING_ACK'?'waiting':'acknowledged'}">${issue.status==='WAITING_ACK'?'WAITING FOR ACK':'ACKNOWLEDGED'}</span></div>
    <div class="issue-main"><div><p class="department">${escapeHtml(issue.department)}</p><h3>${escapeHtml(issue.problem)}</h3>${issue.remarks?`<p class="remarks-preview">${escapeHtml(issue.remarks)}</p>`:''}</div><div class="issue-timebox">${timer}</div></div>
    <div class="issue-footer"><div class="timeline-copy"><span>◷ Reported ${formatTime(issue.reportedAt)}</span>${issue.acknowledgedAt?`<span class="attendee-copy">• ${escapeHtml(issue.acknowledgedBy)} at ${formatTime(issue.acknowledgedAt)}</span>`:''}</div>
    ${issue.status==='WAITING_ACK'?`<button class="secondary-action" data-ack="${issue.id}">ACKNOWLEDGE</button>`:`<button class="resolve-action" data-resolve="${issue.id}">RESOLVE</button>`}</div></article>`;
}

function modalShell(title,body,{narrow=false,closeOnBackdrop=true,onClose}={}){
  state.modal={onClose,closeOnBackdrop};
  modalRoot.innerHTML=`<div class="modal-backdrop" id="backdrop"><section class="modal ${narrow?'narrow':''}"><div class="modal-header"><h2>${title}</h2><button class="icon-button" id="modal-close" aria-label="Close">×</button></div><div class="modal-body">${body}</div></section></div>`;
  document.getElementById('modal-close').onclick=()=>onClose?.();
  document.getElementById('backdrop').onmousedown=e=>{ if(closeOnBackdrop&&e.target.id==='backdrop') onClose?.(); };
}
function closeModal(){ modalRoot.innerHTML=''; state.modal=null; state.selectedIssueId=null; }

function openConfirm({title,message,confirmText='CONFIRM',danger=false,onConfirm,onCancel}){
  const previous=modalRoot.innerHTML;
  modalShell(title,`<p class="confirm-copy">${message}</p><div class="confirm-actions"><button class="ghost-button" id="cancel-confirm">CANCEL</button><button class="${danger?'danger-button':'primary-button'}" id="do-confirm">${confirmText}</button></div>`,{narrow:true,closeOnBackdrop:false,onClose:onCancel});
  document.getElementById('cancel-confirm').onclick=()=>{ modalRoot.innerHTML=previous; wireCurrentModalAfterRestore(); };
  document.getElementById('do-confirm').onclick=onConfirm;
}

function wireCurrentModalAfterRestore(){
  // Restores only the visual form after discard/resolve confirmation cancellation.
  const close=document.getElementById('modal-close'); if(close) close.onclick=()=>{};
}

function confirmDiscard(reopen){
  modalShell('Discard entered information?',`<p class="confirm-copy">The information you entered in this form will be lost.</p><div class="confirm-actions"><button class="ghost-button" id="keep-editing">KEEP EDITING</button><button class="danger-button" id="discard">DISCARD</button></div>`,{narrow:true,closeOnBackdrop:false,onClose:reopen});
  document.getElementById('keep-editing').onclick=reopen;
  document.getElementById('discard').onclick=closeModal;
}

function openReportModal(saved={}){
  const activeNpd=npdActive();
  const model={query:saved.query||'',selected:saved.selected||null,isOther:saved.isOther||false,department:saved.department||'',remarks:saved.remarks||'',type:activeNpd?'NPD':(saved.type||'NORMAL')};
  const body=`${activeNpd?`<div class="npd-warning"><div class="alert-icon">!</div><div><strong>NPD is already active</strong><span>Only another NPD breakdown can be reported until all NPD issues are resolved.</span></div></div>`:''}
  <form class="stack-form" id="report-form">
    <label><span>What is the problem? *</span><div class="search-field"><input id="problem-search" value="${escapeHtml(model.query)}" placeholder="Type printer, network, material..."></div></label>
    <div id="suggestions"></div><div id="selected-problem"></div>
    <div class="or-row"><span>OR</span></div><button type="button" class="other-button ${model.isOther?'active':''}" id="other-problem">OTHER / CAN'T FIND PROBLEM</button>
    <div id="department-area"></div>
    <label><span id="remarks-label">${model.isOther?'Remarks *':'Remarks (Optional)'}</span><textarea id="report-remarks" rows="3" placeholder="${model.isOther?'Describe the problem briefly':'Add any useful detail'}">${escapeHtml(model.remarks)}</textarea></label>
    <fieldset class="breakdown-type"><legend>Breakdown Type *</legend><div class="type-buttons"><button type="button" id="normal-type" ${activeNpd?'disabled':''} class="${model.type==='NORMAL'?'selected':''}">NORMAL</button><button type="button" id="npd-type" class="${model.type==='NPD'?'selected npd-selected':''}">NPD</button></div></fieldset>
    <div id="report-error"></div><button class="primary-button report-submit ${model.type==='NPD'?'npd-submit':''}" id="report-submit" type="submit">REPORT BREAKDOWN</button>
  </form>`;
  modalShell('Report Breakdown',body,{onClose:()=>attemptCloseReport(model)});
  const search=document.getElementById('problem-search'), suggestions=document.getElementById('suggestions'), selectedArea=document.getElementById('selected-problem'), departmentArea=document.getElementById('department-area'), remarks=document.getElementById('report-remarks');
  const renderSubparts=()=>{
    if(model.selected) selectedArea.innerHTML=`<div class="selected-problem"><div class="check">✓</div><div><strong>${escapeHtml(model.selected.label)}</strong><span>${escapeHtml(model.selected.department)} Department</span></div></div>`; else selectedArea.innerHTML='';
    if(model.isOther) departmentArea.innerHTML=`<label><span>Department *</span><div class="select-wrap"><select id="other-dept"><option value="">Select department</option>${departments.map(d=>`<option ${model.department===d?'selected':''}>${d}</option>`).join('')}</select></div></label>`; else departmentArea.innerHTML='';
    const dept=document.getElementById('other-dept'); if(dept) dept.onchange=e=>model.department=e.target.value;
  };
  renderSubparts();
  const renderSuggestions=()=>{
    const q=model.query.trim().toLowerCase(); if(!q||model.selected||model.isOther){suggestions.innerHTML='';return;}
    const matches=problemCatalogue.filter(p=>p.label.toLowerCase().includes(q)||p.keywords.some(k=>k.includes(q))).slice(0,5);
    suggestions.innerHTML=matches.length?`<div class="suggestions">${matches.map((p,idx)=>`<button type="button" data-sug="${idx}"><span>${escapeHtml(p.label)}</span><small>${p.department}</small></button>`).join('')}</div>`:'';
    suggestions.querySelectorAll('[data-sug]').forEach((btn,idx)=>btn.onclick=()=>{model.selected=matches[idx];model.query=matches[idx].label;model.isOther=false;model.department=matches[idx].department;search.value=model.query;suggestions.innerHTML='';renderSubparts();});
  };
  renderSuggestions();
  search.oninput=e=>{model.query=e.target.value;model.selected=null;model.isOther=false;model.department='';renderSubparts();renderSuggestions();};
  remarks.oninput=e=>model.remarks=e.target.value;
  document.getElementById('other-problem').onclick=()=>{model.selected=null;model.query='Other';model.isOther=true;model.department='';search.value='Other';suggestions.innerHTML='';document.getElementById('other-problem').classList.add('active');document.getElementById('remarks-label').textContent='Remarks *';remarks.placeholder='Describe the problem briefly';renderSubparts();};
  document.getElementById('normal-type').onclick=()=>{model.type='NORMAL';document.getElementById('normal-type').className='selected';document.getElementById('npd-type').className='';document.getElementById('report-submit').className='primary-button report-submit';};
  document.getElementById('npd-type').onclick=()=>{model.type='NPD';document.getElementById('normal-type').className='';document.getElementById('npd-type').className='selected npd-selected';document.getElementById('report-submit').className='primary-button report-submit npd-submit';};
  document.getElementById('report-form').onsubmit=e=>{
    e.preventDefault(); const err=document.getElementById('report-error'); model.remarks=remarks.value;
    if(!model.selected&&!model.isOther){err.innerHTML='<div class="form-error">Select a problem or choose Other.</div>';return;}
    if(model.isOther&&!model.department){err.innerHTML='<div class="form-error">Select the department for Other.</div>';return;}
    if(model.isOther&&!model.remarks.trim()){err.innerHTML='<div class="form-error">Remarks are required when the problem is Other.</div>';return;}
    const dept=model.selected?model.selected.department:model.department;
    const issue={id:`BD-${issueCounter++}`,department:dept,problem:model.selected?model.selected.label:'Other',remarks:model.remarks.trim(),type:model.type,status:'WAITING_ACK',reportedAt:Date.now(),acknowledgedAt:null,acknowledgedBy:null};
    state.issues.unshift(issue); closeModal(); renderDashboard(); showToast(model.type==='NPD'?'NPD Breakdown Reported':'Breakdown Reported',`Message sent to ${dept} Department.`);
  };
}
function attemptCloseReport(model){
  model.remarks=document.getElementById('report-remarks')?.value||model.remarks;
  const dirty=Boolean(model.query||model.selected||model.isOther||model.department||model.remarks||(!npdActive()&&model.type!=='NORMAL'));
  if(!dirty){closeModal();return;} confirmDiscard(()=>openReportModal(model));
}

function openAckModal(id){
  state.selectedIssueId=id; const issue=getIssue();
  modalShell('Acknowledge Issue',`<div class="compact-summary"><span>${issue.id}</span><strong>${escapeHtml(issue.department)} • ${escapeHtml(issue.problem)}</strong></div>
  <form class="stack-form" id="ack-form"><label><span>Who is attending this issue? *</span><div class="select-wrap"><select id="ack-employee"><option value="">Select employee</option>${employees.map(e=>`<option>${e}</option>`).join('')}</select></div></label><div id="ack-error"></div><button class="primary-button" type="submit">CONFIRM ACKNOWLEDGEMENT</button></form>`,{narrow:true,onClose:closeModal});
  document.getElementById('ack-form').onsubmit=e=>{e.preventDefault();const emp=document.getElementById('ack-employee').value;if(!emp){document.getElementById('ack-error').innerHTML='<div class="form-error">Select the employee attending this issue.</div>';return;} issue.status='ACKNOWLEDGED';issue.acknowledgedAt=Date.now();issue.acknowledgedBy=emp;closeModal();renderDashboard();showToast('Issue Acknowledged',`Resolution timer started for ${issue.id}.`);};
}

function openResolveModal(id,saved={employee:'',remarks:''}){
  state.selectedIssueId=id; const issue=getIssue(); if(!issue) return;
  modalShell('Resolve Issue',`<div class="resolve-summary"><div class="summary-title"><span>${issue.id}</span><strong>${escapeHtml(issue.department)} • ${escapeHtml(issue.problem)}</strong></div><dl><div><dt>Reported</dt><dd>${formatTime(issue.reportedAt)}</dd></div><div><dt>Acknowledged</dt><dd>${formatTime(issue.acknowledgedAt)}</dd></div><div><dt>Attended by</dt><dd>${escapeHtml(issue.acknowledgedBy)}</dd></div></dl></div>
  <form class="stack-form" id="resolve-form"><label><span>Resolved By *</span><div class="select-wrap"><select id="resolver"><option value="">Select employee</option>${employees.map(e=>`<option ${saved.employee===e?'selected':''}>${e}</option>`).join('')}</select></div></label><label><span>Resolution Remarks *</span><textarea id="resolution-remarks" rows="4" placeholder="Example: Reconnected printer cable and restarted printer">${escapeHtml(saved.remarks)}</textarea></label><div id="resolve-error"></div><button class="resolve-action wide" type="submit">RESOLVE ISSUE</button></form>`,{onClose:()=>attemptCloseResolve(id)});
  document.getElementById('resolve-form').onsubmit=e=>{e.preventDefault();const employee=document.getElementById('resolver').value;const remarks=document.getElementById('resolution-remarks').value.trim();if(!employee||!remarks){document.getElementById('resolve-error').innerHTML=`<div class="form-error">${!employee?'Select the employee resolving this issue.':'Resolution remarks are required.'}</div>`;return;} confirmResolve(id,{employee,remarks});};
}
function attemptCloseResolve(id){
  const employee=document.getElementById('resolver')?.value||'';const remarks=document.getElementById('resolution-remarks')?.value||'';
  if(!employee&&!remarks){closeModal();return;} confirmDiscard(()=>openResolveModal(id,{employee,remarks}));
}
function confirmResolve(id,data){
  state.selectedIssueId=id;
  modalShell('Resolve this issue?',`<p class="confirm-copy">This will stop the resolution timer and remove the issue from the open issues screen.</p><div class="confirm-actions"><button class="ghost-button" id="cancel-resolve">CANCEL</button><button class="primary-button" id="yes-resolve">YES, RESOLVE</button></div>`,{narrow:true,closeOnBackdrop:false,onClose:()=>openResolveModal(id,data)});
  document.getElementById('cancel-resolve').onclick=()=>openResolveModal(id,data);
  document.getElementById('yes-resolve').onclick=()=>{state.issues=state.issues.filter(i=>i.id!==id);closeModal();renderDashboard();showToast('Issue Resolved',`${id} has been removed from open issues.`);};
}

function showToast(title,message){
  clearTimeout(state.toastTimer); toastRoot.innerHTML=`<div class="toast"><div class="check">✓</div><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span></div></div>`;
  state.toastTimer=setTimeout(()=>toastRoot.innerHTML='',4200);
}

setInterval(()=>{ if(state.session && !state.modal) renderDashboard(); },1000);
render();
