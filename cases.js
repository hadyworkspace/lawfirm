/* قسم القضايا */
const CASE_TYPES = ['مدني','جنائي','أحوال شخصية','عمالي','تجاري','إداري / مجلس دولة','تنفيذ','إيجارات','تعويضات'];
const CASE_STATUSES = ['متداولة','محجوزة للحكم','صدر فيها حكم','منظورة بالاستئناف','منتهية'];
const COURTS = ['محكمة جنوب الجيزة الابتدائية','محكمة شمال الجيزة الابتدائية','محكمة الجيزة الجزئية','محكمة 6 أكتوبر الابتدائية','محكمة جنوب القاهرة الابتدائية','محكمة شمال القاهرة الابتدائية','محكمة شرق القاهرة الابتدائية','محكمة القاهرة الجديدة الابتدائية','محكمة حلوان الابتدائية','محكمة الأسرة','المحكمة العمالية','المحكمة التجارية','محكمة جنح مستأنفة','محكمة استئناف القاهرة','محكمة استئناف الجيزة','محكمة القضاء الإداري','محكمة النقض','المحكمة الدستورية العليا'];
const CIRCUITS = ['الدائرة 1 مدني','الدائرة 2 مدني','الدائرة 3 مدني','الدائرة 4 مدني','الدائرة مدني مستأنف','دائرة الجنح','دائرة الجنايات','دائرة الأسرة','الدائرة العمالية','الدائرة التجارية','دائرة الإيجارات'];
const SESSION_DECISIONS = ['أُجلت للاطلاع والمذكرات','أُجلت للمرافعة','أُجلت لورود تقرير الخبير','أُجلت لإعلان الخصوم','أُجلت للتحقيق','أُجلت لندب خبير','إثبات حضور وصلح','حُجزت للحكم','صدر الحكم'];
const NOTARY_OFFICES = ['مكتب توثيق الدقي','مكتب توثيق العجوزة','مكتب توثيق المهندسين','مكتب توثيق الجيزة أول','مكتب توثيق 6 أكتوبر','مكتب الشهر العقاري والتوثيق'];
const ANNOUNCEMENT_TYPES = ['صحيفة دعوى','إعلان حكم','إنذار رسمي على يد محضر','إعلان قرار','تكليف بالوفاء'];
const BAILIFF_OFFICES = ['قلم محضرين جنوب الجيزة','قلم محضرين شمال الجيزة','قلم محضرين الجيزة الجزئية','قلم محضرين 6 أكتوبر','قلم محضرين جنوب القاهرة','قلم محضرين شمال القاهرة'];

function renderCases(v){
  v.innerHTML = `<div class="card">${DB.cases.length ? DB.cases.map(c=>{
    const next=(c.sessions||[]).map(s=>s.nextDate).filter(Boolean).sort()[0];
    return `<div class="list-item" onclick="location.hash='#/cases/${c.id}'">
      <div><div class="t">قضية ${esc(c.number||'')} لسنة ${esc(c.year||'')}</div>
      <div class="muted">${esc(c.court||'')} ${c.circuit?'· '+esc(c.circuit):''} · ${esc(clientName(c.clientId))}</div></div>
      ${next?`<span class="pill warn">${fmtDate(next)}</span>`:`<span class="pill">${esc(c.status||'')}</span>`}</div>`;
  }).join('') : '<div class="empty">لا قضايا بعد. اضغط + لإضافة أول قضية.</div>'}</div>
  <button class="fab" onclick="addCase()">+</button>`;
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
    {key:'opponents',label:'الخصوم'},
    {key:'feesAgreed',label:'الأتعاب المتفق عليها',type:'number'},
    {key:'notes',label:'ملاحظات',type:'textarea'}
  ], d=>{
    let client = DB.clients.find(c=>c.name===d.clientNew);
    if(!client && d.clientNew){ client={id:uid(),name:d.clientNew,phone:'',nationalId:'',companyId:''}; DB.clients.push(client); }
    const company = client && client.companyId ? client.companyId : '';
    DB.cases.push({ id:uid(), number:d.number, year:d.year, court:d.court, circuit:d.circuit, type:d.type,
      opponents:d.opponents, status:d.status||'متداولة', clientId:client?client.id:'', companyId:company, notes:d.notes,
      feesAgreed:d.feesAgreed, sessions:[], poas:[], adminWorks:[], payments:[] });
    save(); route();
  });
}
function renderCaseDetail(v,id){
  const c = findCase(id); if(!c){ location.hash='#/cases'; return; }
  const tab = sessionStorage.getItem('ktab')||'بيانات';
  const tabs = ['بيانات','الجلسات','التوكيلات','المحضرين','الأتعاب'];
  let body='';
  if(tab==='بيانات'){ const co=c.companyId?findCompany(c.companyId):null; body=`
    <div class="kv"><b>رقم القضية</b>${esc(c.number)} لسنة ${esc(c.year)}</div>
    <div class="kv"><b>المحكمة</b>${esc(c.court||'—')}</div>
    <div class="kv"><b>الدائرة</b>${esc(c.circuit||'—')}</div>
    <div class="kv"><b>النوع</b>${esc(c.type||'—')}</div>
    <div class="kv"><b>الموكل</b>${esc(clientName(c.clientId))}</div>
    ${co?`<div class="kv"><b>الشركة</b><a href="#/companies/${co.id}" style="color:var(--burgundy)">${esc(co.name)}</a></div>`:''}
    <div class="kv"><b>الخصوم</b>${esc(c.opponents||'—')}</div>
    <div class="kv"><b>الحالة</b>${esc(c.status||'—')}</div>
    <div class="kv"><b>ملاحظات</b>${esc(c.notes||'—')}</div>
    <div class="btnrow"><button class="btn danger small" onclick="delConfirm('حذف القضية نهائياً؟',()=>{DB.cases=DB.cases.filter(x=>x.id!=='${id}');save();location.hash='#/cases'})">حذف القضية</button></div>`; }
  else if(tab==='الجلسات') body = (c.sessions.length?c.sessions.map(s=>`<div class="list-item"><div><div class="t">${fmtDate(s.date)}</div><div class="muted">${esc(s.decision||'')}</div>${s.nextDate?`<div class="muted">الجلسة القادمة: ${fmtDate(s.nextDate)}</div>`:''}</div><span class="pill ${s.nextDate?'warn':'grey'}">${s.nextDate?'متأجلة':'—'}</span></div>`).join(''):'<div class="empty">لا جلسات مسجلة</div>') +
    `<div class="btnrow"><button class="btn small gold" onclick="addSession('${id}')">+ جلسة</button></div>`;
  else if(tab==='التوكيلات') body = (c.poas.length?c.poas.map(p=>`<div class="list-item"><div><div class="t">توكيل ${esc(p.number)} لسنة ${esc(p.year)}</div><div class="muted">${esc(p.office||'')}</div></div>${p.expiry?`<span class="pill bad">${fmtDate(p.expiry)}</span>`:''}</div>`).join(''):'<div class="empty">لا توكيلات</div>') +
    `<div class="btnrow"><button class="btn small gold" onclick="addPoa('${id}')">+ توكيل</button></div>`;
  else if(tab==='المحضرين') body = (c.adminWorks.length?c.adminWorks.map(a=>`<div class="list-item"><div><div class="t">إعلان رقم ${esc(a.announcementNo)}${a.announcementType?' · '+esc(a.announcementType):''}</div><div class="muted">تسليم: ${fmtDate(a.deliveryDate)} · استلام: ${a.receiptDate?fmtDate(a.receiptDate):'لم يستلم'}</div></div><span class="pill">${esc(a.bailiffOffice||'')}</span></div>`).join(''):'<div class="empty">لا أعمال محضرين</div>') +
    `<div class="btnrow"><button class="btn small gold" onclick="addAdminWork('${id}')">+ إعلان</button></div>`;
  else { const paid=(c.payments||[]).reduce((s,p)=>s+(Number(p.amount)||0),0);
    body = `<div class="grid3"><div class="stat"><div class="v">${fmtMoney(c.feesAgreed||0)}</div><div class="l">المتفق عليه</div></div><div class="stat ok"><div class="v">${fmtMoney(paid)}</div><div class="l">المدفوع</div></div><div class="stat bad"><div class="v">${fmtMoney((c.feesAgreed||0)-paid)}</div><div class="l">الباقي</div></div></div>` +
    (c.payments||[]).map(p=>`<div class="list-item"><span>${fmtDate(p.date)}${p.method?' · '+esc(p.method):''}${p.note?' · '+esc(p.note):''}</span><b>${fmtMoney(p.amount)}</b></div>`).join('') +
    `<div class="btnrow"><button class="btn small gold" onclick="addPayment('case','${id}')">+ دفعة</button></div>`; }
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
