/* قسم القضايا */
const CASE_TYPES = ['مدني','جنائي','أحوال شخصية','عمالي','تجاري','إداري / مجلس دولة','تنفيذ','إيجارات','تعويضات'];
const CASE_STATUSES = ['متداولة','محجوزة للحكم','صدر فيها حكم','منظورة بالاستئناف','منتهية'];
const COURTS = ['محكمة جنوب الجيزة الابتدائية','محكمة شمال الجيزة الابتدائية','محكمة الجيزة الجزئية','محكمة 6 أكتوبر الابتدائية','محكمة جنوب القاهرة الابتدائية','محكمة شمال القاهرة الابتدائية','محكمة شرق القاهرة الابتدائية','محكمة القاهرة الجديدة الابتدائية','محكمة حلوان الابتدائية','محكمة الأسرة','المحكمة العمالية','المحكمة التجارية','محكمة جنح مستأنفة','محكمة استئناف القاهرة','محكمة استئناف الجيزة','محكمة القضاء الإداري','محكمة النقض','المحكمة الدستورية العليا'];
const CIRCUITS = ['الدائرة 1 مدني','الدائرة 2 مدني','الدائرة 3 مدني','الدائرة 4 مدني','الدائرة مدني مستأنف','دائرة الجنح','دائرة الجنايات','دائرة الأسرة','الدائرة العمالية','الدائرة التجارية','دائرة الإيجارات'];
const SESSION_DECISIONS = ['أُجلت للاطلاع والمذكرات','أُجلت للمرافعة','أُجلت لورود تقرير الخبير','أُجلت لإعلان الخصوم','أُجلت للتحقيق','أُجلت لندب خبير','إثبات حضور وصلح','حُجزت للحكم','صدر الحكم'];
const NOTARY_OFFICES = ['مكتب توثيق الدقي','مكتب توثيق العجوزة','مكتب توثيق المهندسين','مكتب توثيق الجيزة أول','مكتب توثيق 6 أكتوبر','مكتب الشهر العقاري والتوثيق'];
const ANNOUNCEMENT_TYPES = ['صحيفة دعوى','إعلان حكم','إنذار رسمي على يد محضر','إعلان قرار','تكليف بالوفاء'];
const BAILIFF_OFFICES = ['قلم محضرين جنوب الجيزة','قلم محضرين شمال الجيزة','قلم محضرين الجيزة الجزئية','قلم محضرين 6 أكتوبر','قلم محضرين جنوب القاهرة','قلم محضرين شمال القاهرة'];
const PHONE_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.4 2.1L8 10a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2.1-.4c.9.3 1.9.5 2.8.7a2 2 0 0 1 1.7 2z"/></svg>';
const WA_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.4 8.6 8.6 0 0 1-4.1-1L3 20l1.2-5.2a8.3 8.3 0 0 1-1-4A8.4 8.4 0 0 1 11.8 2.3a8.4 8.4 0 0 1 9.2 9.2z"/></svg>';

function clientFees(cid){
  let agreed=0, paid=0;
  DB.cases.filter(x=>x.clientId===cid).forEach(x=>{ agreed+=Number(x.feesAgreed)||0; paid+=(x.payments||[]).reduce((s,p)=>s+(Number(p.amount)||0),0); });
  return {agreed, paid, left:agreed-paid};
}

function renderCases(v){
  const tab = sessionStorage.getItem('caselistab')||'القضايا';
  let body='';
  if(tab==='القضايا'){
    body = DB.cases.length ? DB.cases.map(c=>{
      const next=(c.sessions||[]).map(s=>s.nextDate).filter(Boolean).sort()[0];
      return `<div class="list-item" onclick="location.hash='#/cases/${c.id}'">
        <div><div class="t">قضية ${esc(c.number||'')} لسنة ${esc(c.year||'')}</div>
        <div class="muted">${esc(c.court||'')} ${c.circuit?'· '+esc(c.circuit):''} · ${esc(clientName(c.clientId))}</div></div>
        ${next?`<span class="pill warn">${relDate(next)}</span>`:`<span class="pill">${esc(c.status||'')}</span>`}</div>`;
    }).join('') : `<div class="empty"><div class="eic">${EMPTY_IC}</div>لا قضايا بعد.<br>اضغط + لإضافة أول قضية.</div>`;
  } else if(tab==='المحضرين'){
    const all=[]; DB.cases.forEach(c=>(c.adminWorks||[]).forEach(a=>all.push({c,a})));
    all.sort((x,y)=>(y.a.deliveryDate||'').localeCompare(x.a.deliveryDate||''));
    body = (all.length? all.map(x=>`<div class="list-item" onclick="location.hash='#/cases/${x.c.id}'">
        <div><div class="t">إعلان رقم ${esc(x.a.announcementNo)}${x.a.announcementType?' · '+esc(x.a.announcementType):''}</div>
        <div class="muted">قضية ${esc(x.c.number)} لسنة ${esc(x.c.year)}${x.a.bailiffOffice?' · '+esc(x.a.bailiffOffice):''}</div>
        <div class="muted">تسليم: ${fmtDate(x.a.deliveryDate)} · استلام: ${x.a.receiptDate?fmtDate(x.a.receiptDate):'لم يستلم'}</div></div>
        <span class="pill ${x.a.receiptDate?'ok':'warn'}">${x.a.receiptDate?'تم الاستلام':'لم يستلم'}</span></div>`).join('')
      : `<div class="empty"><div class="eic">${EMPTY_IC}</div>لا أعمال محضرين بعد.<br>سجّل الإعلانات برقمها وقلم المحضرين ويوم التسليم والاستلام.</div>`) +
      `<div class="btnrow"><button class="btn small gold" onclick="addAdminWorkGlobal()">+ إضافة إعلان</button></div>`;
  } else {
    body = (DB.clients.length? DB.clients.map(cl=>{ const kases=DB.cases.filter(x=>x.clientId===cl.id); const f=clientFees(cl.id);
      return `<div class="list-item" onclick="location.hash='#/clients/${cl.id}'">
        <div><div class="t">${esc(cl.name)}</div><div class="muted">${cl.phone?esc(cl.phone)+' · ':''}${kases.length.toLocaleString('ar-EG')} قضية</div></div>
        ${f.left>0?`<span class="pill bad">${fmtMoney(f.left)}</span>`:`<span class="pill ok">سدد بالكامل</span>`}</div>`;}).join('')
      : `<div class="empty"><div class="eic">${EMPTY_IC}</div>لا موكلين بعد.<br>يُضاف الموكل تلقائياً مع أول قضية، أو اضغط + موكل.</div>`) +
      `<div class="btnrow"><button class="btn small gold" onclick="addClientForm()">+ موكل</button></div>`;
  }
  const totalAdmin = DB.cases.reduce((s,c)=>s+(c.adminWorks||[]).length,0);
  v.innerHTML = `<div class="tabbing">
    <button class="${tab==='القضايا'?'on':''}" onclick="sessionStorage.setItem('caselistab','القضايا');route()">القضايا</button>
    <button class="${tab==='المحضرين'?'on':''}" onclick="sessionStorage.setItem('caselistab','المحضرين');route()">المحضرين (${totalAdmin.toLocaleString('ar-EG')})</button>
    <button class="${tab==='الموكلين'?'on':''}" onclick="sessionStorage.setItem('caselistab','الموكلين');route()">الموكلين (${DB.clients.length.toLocaleString('ar-EG')})</button></div>
  <div class="card" style="padding:10px 12px">${body}</div>
  <button class="fab" onclick="addCase()">+</button>`;
}
function addAdminWorkGlobal(){
  if(!DB.cases.length){ alert('أضف قضية أولاً'); return; }
  openForm('إعلان / عمل محضرين',[
    {key:'caseId',label:'القضية',type:'select',options:DB.cases.map(c=>({v:c.id,t:'قضية '+c.number+' لسنة '+c.year}))},
    {key:'announcementNo',label:'رقم الإعلان',required:1},
    {key:'announcementType',label:'نوع الإعلان',type:'combo',options:ANNOUNCEMENT_TYPES},
    {key:'deliveryDate',label:'يوم التسليم للمحضر',type:'date'},
    {key:'receiptDate',label:'يوم الاستلام',type:'date',optional:1},
    {key:'bailiffOffice',label:'تبع أنهي قلم محضرين',type:'combo',options:BAILIFF_OFFICES}
  ], d=>{ const c=findCase(d.caseId); delete d.caseId; (c.adminWorks=c.adminWorks||[]).push({id:uid(),...d}); save(); route(); });
}
function addClientForm(){ openForm('موكل جديد',[
    {key:'name',label:'اسم الموكل',required:1},
    {key:'phone',label:'الموبايل',type:'tel'},
    {key:'nationalId',label:'الرقم القومي'},
    {key:'companyId',label:'تابع لشركة',type:'select',options:[{v:'',t:'— بدون شركة —'},...DB.companies.map(c=>({v:c.id,t:c.name}))]}
  ], d=>{ DB.clients.push({id:uid(),...d}); save(); route(); }); }
function editClient(id){ const cl=findClient(id); openForm('تعديل بيانات الموكل',[
    {key:'name',label:'اسم الموكل',required:1},
    {key:'phone',label:'الموبايل',type:'tel'},
    {key:'nationalId',label:'الرقم القومي'},
    {key:'companyId',label:'تابع لشركة',type:'select',options:[{v:'',t:'— بدون شركة —'},...DB.companies.map(c=>({v:c.id,t:c.name}))]}
  ], d=>{ Object.assign(cl,d); save(); route(); }, cl); }
function renderClientDetail(v,id){
  const cl=findClient(id); if(!cl){ location.hash='#/cases'; return; }
  const kases=DB.cases.filter(x=>x.clientId===id);
  const f=clientFees(id);
  const co=cl.companyId?findCompany(cl.companyId):null;
  const phoneBlock = cl.phone ? `${esc(cl.phone)} <span class="btnrow" style="display:inline-flex;margin:0 6px;gap:6px">
    <a class="btn small gold" href="${telLink(cl.phone)}" style="padding:5px 10px">${PHONE_IC} اتصال</a>
    <a class="btn small ghost" href="${waLink(cl.phone)}" target="_blank" rel="noopener" style="padding:5px 10px">${WA_IC} واتساب</a></span>` : '—';
  v.innerHTML = `<h2>${esc(cl.name)}</h2>
  <div class="card">
    <div class="kv"><b>الموبايل</b>${phoneBlock}</div>
    <div class="kv"><b>الرقم القومي</b>${esc(cl.nationalId||'—')}</div>
    ${co?`<div class="kv"><b>الشركة</b><a href="#/companies/${co.id}" style="color:var(--burgundy);font-weight:700">${esc(co.name)}</a></div>`:''}
    <div class="section-note" style="margin-top:10px">أتعاب الموكل في كل القضايا</div>
    <div class="grid3"><div class="stat"><div class="v">${fmtMoney(f.agreed)}</div><div class="l">المتفق عليه</div></div>
    <div class="stat ok"><div class="v">${fmtMoney(f.paid)}</div><div class="l">المحصّل</div></div>
    <div class="stat bad"><div class="v">${fmtMoney(f.left)}</div><div class="l">المتبقي</div></div></div>
    <div class="btnrow"><button class="btn small gold" onclick="editClient('${id}')">تعديل البيانات</button>
    ${kases.length?'':`<button class="btn danger small" onclick="delConfirm('حذف الموكل نهائياً؟',()=>{DB.clients=DB.clients.filter(x=>x.id!=='${id}');save();location.hash='#/cases'})">حذف الموكل</button>`}</div>
  </div>
  <h2 style="font-size:20px">قضاياه</h2>
  <div class="card">${kases.length?kases.map(x=>`<div class="list-item" onclick="location.hash='#/cases/${x.id}'"><div><div class="t">قضية ${esc(x.number)} لسنة ${esc(x.year)}</div><div class="muted">${esc(x.court||'')}</div></div><span class="pill">${esc(x.status||'')}</span></div>`).join(''):'<div class="empty">لا قضايا لهذا الموكل بعد</div>'}</div>`;
}
function addCase(){
  const clientOpts = DB.clients.map(c=>c.name);
  openForm('قضية جديدة',[
    {key:'number',label:'رقم القضية',required:1},
    {key:'year',label:'السنة',type:'number'},
    {key:'court',label:'المحكمة',type:'combo',options:COURTS},
    {key:'circuit',label:'الدائرة',type:'combo',options:CIRCUITS},
    {key:'type',label:'نوع القضية',type:'combo',options:CASE_TYPES},
    {key:'status',label:'حالة القضية',type:'select',options:CASE_STATUSES,value:'متداولة'},
    {key:'clientNew',label:'الموكل (اختر أو أخرى لاسم جديد)',type:'combo',options:clientOpts},
    {key:'clientPhone',label:'موبايل الموكل (للموكل الجديد)',type:'tel'},
    {key:'opponents',label:'الخصوم'},
    {key:'feesAgreed',label:'الأتعاب المتفق عليها',type:'number'},
    {key:'notes',label:'ملاحظات',type:'textarea'}
  ], d=>{
    let client = DB.clients.find(c=>c.name===d.clientNew);
    if(!client && d.clientNew){ client={id:uid(),name:d.clientNew,phone:d.clientPhone||'',nationalId:'',companyId:''}; DB.clients.push(client); }
    const company = client && client.companyId ? client.companyId : '';
    DB.cases.push({ id:uid(), number:d.number, year:d.year, court:d.court, circuit:d.circuit, type:d.type,
      opponents:d.opponents, status:d.status||'متداولة', clientId:client?client.id:'', companyId:company, notes:d.notes,
      feesAgreed:d.feesAgreed, sessions:[], poas:[], adminWorks:[], payments:[], errands:[], docs:[] });
    save(); route();
  });
}
function renderCaseDetail(v,id){
  const c = findCase(id); if(!c){ location.hash='#/cases'; return; }
  let tab = sessionStorage.getItem('ktab')||'بيانات';
  if(tab==='المحضرين') tab='المحضرين والأعمال الإدارية';
  const tabs = ['بيانات','الجلسات','التوكيلات','المحضرين والأعمال الإدارية','مأموريات','مستندات','الأتعاب','السجل الزمني'];
  let body='';
  if(tab==='بيانات'){
    const co=c.companyId?findCompany(c.companyId):null;
    const cl=c.clientId?findClient(c.clientId):null;
    let clientBlock = esc(clientName(c.clientId));
    if(cl && cl.phone){
      clientBlock += ` <span class="btnrow" style="display:inline-flex;margin:0 6px;gap:6px">
        <a class="btn small gold" href="${telLink(cl.phone)}" style="padding:5px 10px">${PHONE_IC} اتصال</a>
        <a class="btn small ghost" href="${waLink(cl.phone)}" target="_blank" rel="noopener" style="padding:5px 10px">${WA_IC} واتساب</a></span>`;
    }
    let feesBlock='';
    if(cl){ const f=clientFees(cl.id);
      feesBlock = `<div class="card" style="margin:10px 0;padding:12px"><div class="section-note">أتعاب الموكل ${esc(cl.name)} في كل القضايا</div>
      <div class="grid3"><div class="stat"><div class="v">${fmtMoney(f.agreed)}</div><div class="l">المتفق عليه</div></div>
      <div class="stat ok"><div class="v">${fmtMoney(f.paid)}</div><div class="l">المحصّل</div></div>
      <div class="stat bad"><div class="v">${fmtMoney(f.left)}</div><div class="l">المتبقي</div></div></div></div>`;
    }
    body=`
    <div class="kv"><b>رقم القضية</b>${esc(c.number)} لسنة ${esc(c.year)}</div>
    <div class="kv"><b>المحكمة</b>${esc(c.court||'—')}</div>
    <div class="kv"><b>الدائرة</b>${esc(c.circuit||'—')}</div>
    <div class="kv"><b>النوع</b>${esc(c.type||'—')}</div>
    <div class="kv"><b>الموكل</b>${clientBlock}</div>
    ${co?`<div class="kv"><b>الشركة</b><a href="#/companies/${co.id}" style="color:var(--burgundy);font-weight:700">${esc(co.name)}</a></div>`:''}
    <div class="kv"><b>الخصوم</b>${esc(c.opponents||'—')}</div>
    <div class="kv"><b>الحالة</b><span class="pill">${esc(c.status||'—')}</span></div>
    <div class="kv"><b>ملاحظات</b>${esc(c.notes||'—')}</div>
    ${feesBlock}
    <div class="btnrow"><button class="btn danger small" onclick="delConfirm('حذف القضية نهائياً؟',()=>{DB.cases=DB.cases.filter(x=>x.id!=='${id}');save();location.hash='#/cases'})">حذف القضية</button></div>`;
  }
  else if(tab==='الجلسات') body = (c.sessions.length?c.sessions.map(s=>`<div class="list-item"><div><div class="t">${fmtDate(s.date)}</div><div class="muted">${esc(s.decision||'')}</div>${s.nextDate?`<div class="muted">الجلسة القادمة: ${fmtDate(s.nextDate)} (${relDate(s.nextDate)})</div>`:''}</div><span class="pill ${s.nextDate?'warn':'grey'}">${s.nextDate?relDate(s.nextDate):'—'}</span></div>`).join(''):'<div class="empty">لا جلسات مسجلة</div>') +
    `<div class="btnrow"><button class="btn small gold" onclick="addSession('${id}')">+ جلسة</button></div>`;
  else if(tab==='التوكيلات') body = (c.poas.length?c.poas.map(p=>`<div class="list-item"><div><div class="t">توكيل ${esc(p.number)} لسنة ${esc(p.year)}</div><div class="muted">${esc(p.office||'')}</div></div>${p.expiry?`<span class="pill bad">${fmtDate(p.expiry)}</span>`:''}</div>`).join(''):'<div class="empty">لا توكيلات</div>') +
    `<div class="btnrow"><button class="btn small gold" onclick="addPoa('${id}')">+ توكيل</button></div>`;
  else if(tab==='المحضرين والأعمال الإدارية') body = ((c.adminWorks||[]).length?c.adminWorks.map(a=>`<div class="list-item"><div><div class="t">إعلان رقم ${esc(a.announcementNo)}${a.announcementType?' · '+esc(a.announcementType):''}</div><div class="muted">تسليم: ${fmtDate(a.deliveryDate)} · استلام: ${a.receiptDate?fmtDate(a.receiptDate):'لم يستلم'}</div></div><span class="pill">${esc(a.bailiffOffice||'')}</span></div>`).join(''):'<div class="empty">لا أعمال محضرين</div>') +
    `<div class="btnrow"><button class="btn small gold" onclick="addAdminWork('${id}')">+ إعلان</button></div>`;
  else if(tab==='مأموريات') body = ((c.errands||[]).length?c.errands.map(x=>`<div class="list-item" onclick="toggleCaseErrand('${id}','${x.id}')"><div><div class="t" style="${x.done?'text-decoration:line-through;opacity:.6':''}">${esc(x.title)}</div><div class="muted">${fmtDate(x.date)}</div></div><span class="pill ${x.done?'ok':'grey'}">${x.done?'تم':'معلقة'}</span></div>`).join(''):'<div class="empty">لا مأموريات</div>') +
    `<div class="btnrow"><button class="btn small gold" onclick="addCaseErrand('${id}')">+ مأمورية</button></div>`;
  else if(tab==='مستندات') body = ((c.docs||[]).length?c.docs.map(dd=>`<div class="list-item" onclick="delConfirm('حذف المستند؟',()=>delDoc('case','${id}','${dd.id}'))"><div><div class="t">${esc(dd.name)}</div><div class="muted">${fmtDate(dd.date)}${dd.notes?' · '+esc(dd.notes):''}</div></div></div>`).join(''):'<div class="empty">لا مستندات مسجلة.<br>سجّل أوراق الملف هنا (عقود، صحف، أحكام...) لتبقى في مكان واحد.</div>') +
    `<div class="btnrow"><button class="btn small gold" onclick="addDoc('case','${id}')">+ مستند</button></div>`;
  else if(tab==='الأتعاب'){ const paid=(c.payments||[]).reduce((s,p)=>s+(Number(p.amount)||0),0);
    body = `<div class="grid3"><div class="stat"><div class="v">${fmtMoney(c.feesAgreed||0)}</div><div class="l">المتفق عليه</div></div><div class="stat ok"><div class="v">${fmtMoney(paid)}</div><div class="l">المدفوع</div></div><div class="stat bad"><div class="v">${fmtMoney((c.feesAgreed||0)-paid)}</div><div class="l">الباقي</div></div></div>` +
    (c.payments||[]).map(p=>`<div class="list-item"><span>${fmtDate(p.date)}${p.method?' · '+esc(p.method):''}${p.note?' · '+esc(p.note):''}</span><b>${fmtMoney(p.amount)}</b></div>`).join('') +
    `<div class="btnrow"><button class="btn small gold" onclick="addPayment('case','${id}')">+ دفعة</button></div>`; }
  else {
    const evs = [];
    (c.sessions||[]).forEach(s=>{ if(s.date) evs.push({d:s.date,t:'جلسة',s:s.decision||''}); if(s.nextDate) evs.push({d:s.nextDate,t:'جلسة قادمة',s:'التأجيل من جلسة '+fmtDate(s.date)}); });
    (c.payments||[]).forEach(p=>{ if(p.date) evs.push({d:p.date,t:'دفعة '+fmtMoney(p.amount),s:(p.method||'')+(p.note?' · '+p.note:'')}); });
    (c.adminWorks||[]).forEach(a=>{ if(a.deliveryDate) evs.push({d:a.deliveryDate,t:'تسليم إعلان '+(a.announcementNo||''),s:a.bailiffOffice||''}); if(a.receiptDate) evs.push({d:a.receiptDate,t:'استلام إعلان '+(a.announcementNo||''),s:''}); });
    evs.sort((a,b)=>a.d<b.d?1:-1);
    body = evs.length ? `<div class="timeline">${evs.map(e=>`<div class="tl-item"><div class="tl-date">${fmtDate(e.d)} · ${relDate(e.d)}</div><div class="tl-t">${esc(e.t)}</div>${e.s?`<div class="tl-s">${esc(e.s)}</div>`:''}</div>`).join('')}</div>`
      : '<div class="empty">لا أحداث مسجلة بعد. الجلسات والدفعات والإعلانات تظهر هنا تلقائياً.</div>';
  }
  v.innerHTML = `<h2>قضية ${esc(c.number)} لسنة ${esc(c.year)}</h2>
  <div class="tabbing">${tabs.map(t=>`<button class="${t===tab?'on':''}" onclick="sessionStorage.setItem('ktab','${t}');route()">${t}</button>`).join('')}</div>
  <div class="card">${body}</div>`;
}
function addSession(cid){ openForm('جلسة',[
    {key:'date',label:'تاريخ الجلسة',type:'date',required:1},
    {key:'decision',label:'قرار الجلسة',type:'combo',options:SESSION_DECISIONS},
    {key:'nextDate',label:'التأجيل القادم',type:'date',optional:1}
  ], d=>{ findCase(cid).sessions.push({id:uid(),...d}); save(); route(); }); }
function addPoa(cid){ openForm('توكيل',[
    {key:'number',label:'رقم التوكيل',required:1},
    {key:'year',label:'السنة',type:'number'},
    {key:'office',label:'مكتب التوثيق',type:'combo',options:NOTARY_OFFICES},
    {key:'expiry',label:'تاريخ الانتهاء',type:'date',optional:1}
  ], d=>{ findCase(cid).poas.push({id:uid(),...d}); save(); route(); }); }
function addAdminWork(cid){ openForm('إعلان / عمل محضرين',[
    {key:'announcementNo',label:'رقم الإعلان',required:1},
    {key:'announcementType',label:'نوع الإعلان',type:'combo',options:ANNOUNCEMENT_TYPES},
    {key:'deliveryDate',label:'يوم التسليم للمحضر',type:'date'},
    {key:'receiptDate',label:'يوم الاستلام',type:'date',optional:1},
    {key:'bailiffOffice',label:'تبع أنهي قلم محضرين',type:'combo',options:BAILIFF_OFFICES}
  ], d=>{ findCase(cid).adminWorks.push({id:uid(),...d}); save(); route(); }); }
