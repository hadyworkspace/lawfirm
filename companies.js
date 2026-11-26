/* قسم الشركات */
const FORMATION_DOCS = ['عقد التأسيس وتوثيقه','السجل التجاري','البطاقة الضريبية','ملف القيمة المضافة','التأمينات الاجتماعية','صحيفة الاستثمار','الرخصة','السجل الصناعي','التوقيع الإلكتروني'];
const DOC_STATUSES = ['لم يبدأ','جاري','تم','يحتاج تجديد'];
const ACTIVITIES = ['تجارة عامة','مقاولات وتشييد','عقارات','استيراد وتصدير','صناعة','خدمات','تكنولوجيا معلومات','أغذية ومشروبات','مطاعم','زراعة','نقل ولوجستيات'];
const LEGAL_FORMS = ['منشأة فردية','شركة تضامن','شركة توصية بسيطة','شركة ذات مسئولية محدودة (ذ.م.م)','شركة مساهمة مصرية (ش.م.م)','شركة توصية بالأسهم','شركة أوف شور','فرع شركة أجنبية'];
const AMEND_TYPES = ['جمعية عادية','جمعية غير عادية','قرار إداري','مجلس إدارة','تعديل منشأة فردية'];
const RENEWAL_TYPES = ['إقرار القيمة المضافة','التأمينات الاجتماعية','إقرار ضريبة الدخل','كسب العمل','تجديد السجل التجاري','تجديد البطاقة الضريبية','تجديد الرخصة','تجديد السجل الصناعي','تجديد التوقيع الإلكتروني'];
const ERRAND_TYPES = ['تقديم صحيفة','متابعة توثيق عقد','استلام مستندات','سداد رسوم','استخراج مستخرج رسمي','تسليم إقرارات','تصوير ملف'];
const PAY_METHODS = ['نقدي','تحويل بنكي','إنستاباي','فودافون كاش','شيك'];
const PAY_NOTES = ['مقدم أتعاب','دفعة أولى','دفعة تحت الحساب','دفعة أخيرة','تسوية كاملة'];
function docPill(s){ return s==='تم'?'ok':(s==='جاري'?'warn':(s==='يحتاج تجديد'?'bad':'grey')); }

function renderCompanies(v){
  v.innerHTML = `<div class="card">${DB.companies.length ? DB.companies.map(c=>{
    const done=(c.formationDocs||[]).filter(d=>d.status==='تم').length, tot=(c.formationDocs||[]).length;
    const pillTxt = tot>0 ? `${done}/${tot} تأسيس` : `${(c.amendments||[]).length.toLocaleString('ar-EG')} تعديل`;
    return `<div class="list-item" onclick="location.hash='#/companies/${c.id}'">
      <div><div class="t">${esc(c.name)}</div><div class="muted">${esc(c.activity||'')} ${c.legalForm?'· '+esc(c.legalForm):''}</div></div>
      <span class="pill">${pillTxt}</span></div>`;
  }).join('') : `<div class="empty"><div class="eic">${EMPTY_IC}</div>لا شركات بعد.<br>اضغط + لإضافة أول شركة وابدأ ملف التأسيس.</div>`}</div>
  <button class="fab" onclick="addCompany()">+</button>`;
}
function addCompany(){
  openForm('شركة جديدة',[
    {key:'name',label:'اسم الشركة',required:1},
    {key:'established',label:'حالة الملف',type:'select',options:['تأسيس جديد عن طريق المكتب','شركة قائمة بالفعل (تعديلات فقط)']},
    {key:'activity',label:'النشاط',type:'combo',options:ACTIVITIES},
    {key:'legalForm',label:'الشكل القانوني',type:'combo',options:LEGAL_FORMS},
    {key:'capital',label:'رأس المال',type:'number'},
    {key:'address',label:'المقر'},
    {key:'partners',label:'الشركاء / المؤسسين'},
    {key:'feesAgreed',label:'الأتعاب المتفق عليها',type:'number'},
    {key:'notes',label:'ملاحظات',type:'textarea'}
  ], d=>{
    const est = d.established==='شركة قائمة بالفعل (تعديلات فقط)';
    DB.companies.push({ id:uid(), ...d,
      formationDocs: est ? [] : FORMATION_DOCS.map(n=>({name:n,status:'لم يبدأ'})),
      amendments:[], renewals:[
        {id:uid(),label:'إقرار القيمة المضافة',date:todayISO(),freq:'شهري'},
        {id:uid(),label:'التأمينات الاجتماعية',date:todayISO(),freq:'شهري'}
      ], payments:[], errands:[] });
    save(); route();
  });
}
function renderCompanyDetail(v,id){
  const c = findCompany(id); if(!c){ location.hash='#/companies'; return; }
  const tab = sessionStorage.getItem('ctab')||'بيانات';
  const tabs = ['بيانات','التأسيس','التعديلات','التجديدات','الأتعاب','مأموريات','قضاياها'];
  let body='';
  if(tab==='بيانات') body = `
    <div class="kv"><b>النشاط</b>${esc(c.activity||'—')}</div>
    <div class="kv"><b>الشكل القانوني</b>${esc(c.legalForm||'—')}</div>
    <div class="kv"><b>رأس المال</b>${c.capital?fmtMoney(c.capital):'—'}</div>
    <div class="kv"><b>المقر</b>${esc(c.address||'—')}</div>
    <div class="kv"><b>الشركاء</b>${esc(c.partners||'—')}</div>
    <div class="kv"><b>ملاحظات</b>${esc(c.notes||'—')}</div>
    <div class="btnrow"><button class="btn danger small" onclick="delConfirm('حذف الشركة نهائياً؟',()=>{DB.companies=DB.companies.filter(x=>x.id!=='${id}');save();location.hash='#/companies'})">حذف الشركة</button></div>`;
  else if(tab==='التأسيس' && !c.formationDocs.length) body = `<div class="empty"><div class="eic">${EMPTY_IC}</div>هذه الشركة قائمة بالفعل ولم تُؤسَّس عن طريق المكتب،<br>فلا مستندات تأسيس لها. سجّل الشغل عليها من قسم التعديلات.</div>`;
  else if(tab==='التأسيس'){
    const doneN=c.formationDocs.filter(d=>d.status==='تم').length, totN=c.formationDocs.length, pct=totN?Math.round(doneN/totN*100):0;
    body = `<div class="section-note">اضغط على الحالة لتغييرها (لم يبدأ ← جاري ← تم)</div>
    <div class="progress"><div style="width:${pct}%"></div></div>
    <div class="section-note" style="margin-bottom:10px">اكتمل ${doneN.toLocaleString('ar-EG')} من ${totN.toLocaleString('ar-EG')} (${pct.toLocaleString('ar-EG')}%)</div>` +
    c.formationDocs.map((d,i)=>`<div class="list-item" onclick="cycleDoc('${id}',${i})"><span>${esc(d.name)}</span><span class="pill ${docPill(d.status)}">${d.status}</span></div>`).join(''); }
  else if(tab==='التعديلات') body = (c.amendments.length?c.amendments.map(a=>`<div class="list-item" onclick="cycleAmend('${id}','${a.id}')"><div><div class="t">${esc(a.type)}</div><div class="muted">${fmtDate(a.date)}${a.fees?' · أتعاب: '+fmtMoney(a.fees):''}${a.notes?' · '+esc(a.notes):''}</div></div><span class="pill ${a.status==='تم'?'ok':a.status==='جاري'?'warn':'bad'}">${a.status}</span></div>`).join(''):'<div class="empty">لا تعديلات مسجلة</div>') +
    `<div class="btnrow"><button class="btn small gold" onclick="addAmend('${id}')">+ تعديل</button></div>`;
  else if(tab==='التجديدات') body = (c.renewals.length?c.renewals.map(r=>`<div class="list-item"><div><div class="t">${esc(r.label)}</div><div class="muted">${fmtDate(r.date)}</div></div><span class="pill ${r.freq==='شهري'?'warn':''}">${r.freq}</span></div>`).join(''):'<div class="empty">لا مواعيد</div>') +
    `<div class="btnrow"><button class="btn small gold" onclick="addRenewal('${id}')">+ موعد</button></div>`;
  else if(tab==='الأتعاب'){ const paid=(c.payments||[]).reduce((s,p)=>s+(Number(p.amount)||0),0);
    body = `<div class="grid3"><div class="stat"><div class="v">${fmtMoney(c.feesAgreed||0)}</div><div class="l">المتفق عليه</div></div><div class="stat ok"><div class="v">${fmtMoney(paid)}</div><div class="l">المدفوع</div></div><div class="stat bad"><div class="v">${fmtMoney((c.feesAgreed||0)-paid)}</div><div class="l">الباقي</div></div></div>` +
    (c.payments||[]).map(p=>`<div class="list-item"><span>${fmtDate(p.date)}${p.method?' · '+esc(p.method):''}${p.note?' · '+esc(p.note):''}</span><b>${fmtMoney(p.amount)}</b></div>`).join('') +
    `<div class="btnrow"><button class="btn small gold" onclick="addPayment('company','${id}')">+ دفعة</button></div>`; }
  else if(tab==='مأموريات') body = (c.errands.length?c.errands.map(x=>`<div class="list-item" onclick="toggleErrand('${id}','${x.id}')"><div><div class="t" style="${x.done?'text-decoration:line-through;opacity:.6':''}">${esc(x.title)}</div><div class="muted">${fmtDate(x.date)}</div></div><span class="pill ${x.done?'ok':'grey'}">${x.done?'تم':'معلقة'}</span></div>`).join(''):'<div class="empty">لا مأموريات</div>') +
    `<div class="btnrow"><button class="btn small gold" onclick="addErrand('${id}')">+ مأمورية</button></div>`;
  else body = (DB.cases.filter(x=>x.companyId===id).map(x=>`<div class="list-item" onclick="location.hash='#/cases/${x.id}'"><div><div class="t">قضية ${x.number} لسنة ${x.year}</div><div class="muted">${esc(x.court||'')}</div></div><span class="pill">${esc(x.status||'')}</span></div>`).join('')||'<div class="empty">لا قضايا مربوطة بهذه الشركة</div>');
  v.innerHTML = `<h2>${esc(c.name)}</h2>
  <div class="tabbing">${tabs.map(t=>`<button class="${t===tab?'on':''}" onclick="sessionStorage.setItem('ctab','${t}');route()">${t}</button>`).join('')}</div>
  <div class="card">${body}</div>`;
}
function cycleDoc(cid,i){ const c=findCompany(cid); const d=c.formationDocs[i];
  const order=['لم يبدأ','جاري','تم']; d.status = order[(order.indexOf(d.status)+1)%3]; save(); route(); }
function addAmend(cid){ openForm('تعديل جديد',[
    {key:'type',label:'نوع التعديل',type:'combo',options:AMEND_TYPES},
    {key:'date',label:'التاريخ',type:'date'},
    {key:'status',label:'الحالة',type:'select',options:['مطلوب','جاري','تم']},
    {key:'fees',label:'أتعاب التعديل',type:'number'},
    {key:'notes',label:'ملاحظات',type:'textarea'}
  ], d=>{ findCompany(cid).amendments.push({id:uid(),...d}); save(); route(); }); }
function cycleAmend(cid,aid){ const a=findCompany(cid).amendments.find(x=>x.id===aid);
  const order=['مطلوب','جاري','تم']; a.status=order[(order.indexOf(a.status)+1)%3]; save(); route(); }
function addRenewal(cid){ openForm('موعد / تجديد',[
    {key:'label',label:'البند',type:'combo',options:RENEWAL_TYPES},
    {key:'date',label:'التاريخ',type:'date'},
    {key:'freq',label:'التكرار',type:'select',options:['شهري','سنوي','مرة واحدة']}
  ], d=>{ findCompany(cid).renewals.push({id:uid(),...d}); save(); route(); }); }
function addPayment(kind,id){ openForm('دفعة جديدة',[
    {key:'amount',label:'المبلغ',type:'number',required:1},
    {key:'date',label:'التاريخ',type:'date'},
    {key:'method',label:'طريقة الدفع',type:'combo',options:PAY_METHODS},
    {key:'note',label:'البيان',type:'combo',options:PAY_NOTES}
  ], d=>{ const o = kind==='company'?findCompany(id):findCase(id); o.payments.push({id:uid(),...d}); save(); route(); }); }
function addErrand(cid){ openForm('مأمورية',[
    {key:'title',label:'المأمورية',type:'combo',options:ERRAND_TYPES},
    {key:'date',label:'التاريخ',type:'date'}
  ], d=>{ findCompany(cid).errands.push({id:uid(),done:false,...d}); save(); route(); }); }
function toggleErrand(cid,eid){ const x=findCompany(cid).errands.find(e=>e.id===eid); x.done=!x.done; save(); route(); }
