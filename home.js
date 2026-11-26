/* الرئيسية: لوحة اليوم */
const IC = {
  building:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3"/></svg>',
  scale:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M8 21h8M12 6l-6 2 6-2 6 2"/><path d="M6 8l-2.5 5a2.8 2.8 0 0 0 5 0L6 8zM18 8l-2.5 5a2.8 2.8 0 0 0 5 0L18 8z"/></svg>',
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18M8 13h3M8 17h5"/></svg>',
  card:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/></svg>',
  bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  money:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M15 9.5c-.8-1-1.9-1.5-3-1.5-1.7 0-3 1-3 2.4 0 3.4 6 1.8 6 5.2 0 1.4-1.3 2.4-3 2.4-1.1 0-2.2-.5-3-1.5"/></svg>',
  save:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 19h16"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  session:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg>'
};
const EMPTY_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/></svg>';

function monthStats(mk){
  let income=0, spent=0, outstanding=0;
  DB.companies.forEach(c=>{ (c.payments||[]).forEach(p=>{ if(monthKey(p.date)===mk) income+=Number(p.amount)||0; }); outstanding += (Number(c.feesAgreed)||0) - (c.payments||[]).reduce((s,p)=>s+(Number(p.amount)||0),0); });
  DB.cases.forEach(c=>{ (c.payments||[]).forEach(p=>{ if(monthKey(p.date)===mk) income+=Number(p.amount)||0; }); outstanding += (Number(c.feesAgreed)||0) - (c.payments||[]).reduce((s,p)=>s+(Number(p.amount)||0),0); });
  DB.expenses.forEach(e=>{ if(monthKey(e.date)===mk) spent+=Number(e.amount)||0; });
  return {income, spent, net:income-spent, outstanding};
}
function upcomingItems(limit){
  const items = [];
  const today = todayISO();
  DB.cases.forEach(c=>{
    (c.sessions||[]).forEach(s=>{
      if(s.nextDate) items.push({date:s.nextDate, kind:'جلسة', label:`${c.number||''} لسنة ${c.year||''} - ${c.court||''}`, ref:'#/cases/'+c.id});
    });
    (c.poas||[]).forEach(p=>{
      if(p.expiry) items.push({date:p.expiry, kind:'توكيل', label:`انتهاء توكيل ${p.number||''} - قضية ${c.number||''} لسنة ${c.year||''}`, ref:'#/cases/'+c.id});
    });
    (c.errands||[]).forEach(x=>{ if(x.date&&!x.done) items.push({date:x.date,kind:'مأمورية',label:`${x.title} - قضية ${c.number||''} لسنة ${c.year||''}`,ref:'#/cases/'+c.id}); });
  });
  DB.companies.forEach(c=>{
    (c.renewals||[]).forEach(r=>{
      let d = r.date; if(!d) return;
      if(r.freq==='شهري'){ const day=d.slice(8); const t=new Date(); d = t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+day; if(d<today){ const n=new Date(t.getFullYear(),t.getMonth()+1,1); d=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+day; } }
      items.push({date:d, kind:'تجديد', label:`${r.label} - ${c.name}`, ref:'#/companies/'+c.id});
    });
    (c.errands||[]).forEach(x=>{ if(x.date&&!x.done) items.push({date:x.date,kind:'مأمورية',label:`${x.title} - ${c.name}`,ref:'#/companies/'+c.id}); });
  });
  items.sort((a,b)=>a.date<b.date?-1:1);
  return limit ? items.slice(0,limit) : items;
}

function renderHome(v){
  const mk = monthKey(todayISO());
  const s = monthStats(mk);
  const today = todayISO();
  const agenda = upcomingItems(0);
  const todaySessions = agenda.filter(i=>i.kind==='جلسة' && i.date===today);
  const overdue = agenda.filter(i=>i.date<today);
  const next7 = agenda.filter(i=>i.date>=today && i.date<=plusDays(7));
  const hour = new Date().getHours();
  const greet = hour>=5 && hour<12 ? 'صباح الخير' : hour<17 ? 'يومك سعيد' : 'مساء الخير';
  const dateStr = new Date().toLocaleDateString('ar-EG',{weekday:'long', day:'numeric', month:'long', year:'numeric'});

  /* تنبيهات ذكية */
  let alerts = '';
  const alertRows = [];
  if(todaySessions.length) alertRows.push({cls:'gold',ic:IC.session,t:`لديك ${todaySessions.length.toLocaleString('ar-EG')} جلسة اليوم`,s:todaySessions[0].label,h:'#/agenda'});
  if(overdue.length) alertRows.push({cls:'bad',ic:IC.bell,t:`${overdue.length.toLocaleString('ar-EG')} موعد فائت`,s:'راجع الأجندة وحدّث المواعيد',h:'#/agenda'});
  else if(next7.length) alertRows.push({cls:'warn',ic:IC.bell,t:`${next7.length.toLocaleString('ar-EG')} موعد خلال ٧ أيام`,s:next7[0].label+' · '+relDate(next7[0].date),h:'#/agenda'});
  if(s.outstanding>0) alertRows.push({cls:'warn',ic:IC.money,t:'أتعاب مستحقة غير محصلة',s:fmtMoney(s.outstanding),h:'#/accounts'});
  const hasData = DB.companies.length || DB.cases.length || DB.expenses.length;
  let lastExp = ''; try{ lastExp = localStorage.getItem('lawfirm_last_export')||''; }catch(e){}
  if(hasData && (!lastExp || lastExp < plusDays(-7))) alertRows.push({cls:'gold',ic:IC.save,t:'تذكير بالنسخ الاحتياطي',s:lastExp?'آخر نسخة: '+fmtDate(lastExp):'لم تصدّر نسخة احتياطية بعد',act:'exportData()'});
  if(alertRows.length) alerts = `<div class="alerts" style="margin-bottom:14px">${alertRows.map(a=>
    `<div class="alert ${a.cls}" onclick="${a.act||`location.hash='${a.h}'`}"><div class="aic">${a.ic}</div><div style="flex:1"><div class="at">${a.t}</div><div class="as">${esc(a.s)}</div></div></div>`).join('')}</div>`;

  const tiles = [
    {h:'#/companies',t:'الشركات',s:'التأسيس والتجديدات والأتعاب',n:DB.companies.length,ic:IC.building},
    {h:'#/cases',t:'القضايا',s:'المتابعة والجلسات والتوكيلات',n:DB.cases.length,ic:IC.scale},
    {h:'#/agenda',t:'الأجندة',s:'مواعيدك اليومية والأسبوعية',n:'',ic:IC.cal},
    {h:'#/accounts',t:'الحسابات',s:'الدخل والمصروف الشهري',n:'',ic:IC.card}
  ];
  const up = upcomingItems(6);

  v.innerHTML = `
  <div class="greet">${greet}${currentUser()?"، "+esc(currentUser()):""}</div>
  <div class="greet-date">${dateStr}</div>
  <div class="banner">
    <div class="bstat"><div class="bv">${todaySessions.length.toLocaleString('ar-EG')}</div><div class="bl">جلسات اليوم</div></div>
    <div class="bdiv"></div>
    <div class="bstat"><div class="bv">${next7.length.toLocaleString('ar-EG')}</div><div class="bl">مواعيد خلال أسبوع</div></div>
    <div class="bdiv"></div>
    <div class="bstat"><div class="bv">${fmtMoney(s.net)}</div><div class="bl">صافي الشهر</div></div>
  </div>
  ${alerts}
  <div class="searchbar">${IC.search}<input id="homeSearch" placeholder="ابحث: شركة، قضية، موكل…" oninput="renderSearch(this.value)"></div>
  <div id="searchResults"></div>
  <div class="tiles">${tiles.map(t=>`<div class="tile" onclick="location.hash='${t.h}'">
    ${t.n!==''?`<span class="tcount">${Number(t.n).toLocaleString('ar-EG')}</span>`:''}
    <div class="badge">${t.ic}</div><div class="tt">${t.t}</div><div class="ts">${t.s}</div></div>`).join('')}</div>
  <h2>الأقرب في الأجندة</h2>
  <div class="card">
    ${up.length ? up.map(i=>`<div class="list-item" onclick="location.hash='${i.ref}'"><div><div class="t">${esc(i.label)}</div><div class="muted">${fmtDate(i.date)} · ${relDate(i.date)}</div></div><span class="pill ${i.date<today?'bad':i.date===today?'warn':''}">${i.kind}</span></div>`).join('') : `<div class="empty"><div class="eic">${EMPTY_IC}</div>لا مواعيد قادمة.<br>أضف جلسات من صفحة القضية وتجديدات من صفحة الشركة لتظهر هنا.</div>`}
  </div>
  <h2>أدوات</h2>
  <div class="btnrow">
    <button class="btn ghost small" onclick="exportData()">تصدير نسخة احتياطية</button>
    <button class="btn ghost small" onclick="importData()">استيراد نسخة</button>
    <button class="btn ghost small" onclick="seedDemo()">بيانات تجريبية</button>
    <button class="btn ghost small" onclick="manageUsers()">المستخدمون والأمان</button>
    <button class="btn ghost small" onclick="lockNow()">قفل التطبيق</button>
  </div>
  <button class="fab" onclick="quickAdd()" aria-label="إضافة سريعة">${IC.plus}</button>`;
}

/* البحث الشامل */
function renderSearch(q){
  const box = document.getElementById('searchResults');
  q = (q||'').trim();
  if(!q){ box.innerHTML=''; return; }
  const res = [];
  DB.companies.forEach(c=>{ if((c.name||'').includes(q)||(c.activity||'').includes(q)) res.push({t:c.name,s:'شركة'+(c.activity?' · '+c.activity:''),ref:'#/companies/'+c.id}); });
  DB.cases.forEach(c=>{ if((c.number||'').includes(q)||(c.year||'').includes(q)||(c.court||'').includes(q)||(c.opponents||'').includes(q)) res.push({t:`قضية ${c.number} لسنة ${c.year}`,s:(c.court||'')+' · '+clientName(c.clientId),ref:'#/cases/'+c.id}); });
  DB.clients.forEach(c=>{
    if((c.name||'').includes(q)||(c.phone||'').includes(q)){
      const kase = DB.cases.find(x=>x.clientId===c.id);
      res.push({t:c.name,s:'موكل'+(c.phone?' · '+c.phone:''),ref:kase?('#/cases/'+kase.id):'#/cases'});
    }
  });
  box.innerHTML = `<div class="card">${res.length ? res.slice(0,8).map(r=>
    `<div class="list-item" onclick="location.hash='${r.ref}'"><div><div class="t">${esc(r.t)}</div><div class="muted">${esc(r.s)}</div></div></div>`).join('')
    : `<div class="empty">لا نتائج مطابقة لـ «${esc(q)}»</div>`}</div>`;
}

/* الإضافة السريعة */
function quickAdd(){
  const root = document.getElementById('modalRoot');
  root.innerHTML = `<div class="overlay" onclick="if(event.target===this)closeForm()">
    <div class="sheet"><div class="handle"></div><h3>إضافة سريعة</h3>
    <div class="qmenu">
      <button onclick="closeForm();addCompany()"><span class="badge">${IC.building}</span>شركة جديدة</button>
      <button onclick="closeForm();addCase()"><span class="badge">${IC.scale}</span>قضية جديدة</button>
      <button onclick="closeForm();quickSession()"><span class="badge">${IC.session}</span>جلسة</button>
      <button onclick="closeForm();quickPayment()"><span class="badge">${IC.money}</span>دفعة أتعاب</button>
      <button onclick="closeForm();addExpense(monthKey(todayISO()))"><span class="badge">${IC.card}</span>مصروف</button>
      <button onclick="closeForm();quickErrand()"><span class="badge">${IC.doc}</span>مأمورية</button>
    </div></div></div>`;
}
function entityOpts(){
  const o = [];
  DB.companies.forEach(c=>o.push({v:'company:'+c.id,t:'شركة: '+c.name}));
  DB.cases.forEach(c=>o.push({v:'case:'+c.id,t:`قضية ${c.number} لسنة ${c.year}`}));
  return o;
}
function quickPayment(){
  const ents = entityOpts();
  if(!ents.length){ alert('أضف شركة أو قضية أولاً'); return; }
  openForm('دفعة أتعاب سريعة',[
    {key:'ent',label:'الجهة',type:'select',options:ents},
    {key:'amount',label:'المبلغ',type:'number',required:1},
    {key:'date',label:'التاريخ',type:'date'},
    {key:'method',label:'طريقة الدفع',type:'combo',options:PAY_METHODS},
    {key:'note',label:'البيان',type:'combo',options:PAY_NOTES}
  ], d=>{
    const [kind,id] = d.ent.split(':');
    const o = kind==='company'?findCompany(id):findCase(id);
    if(o){ o.payments.push({id:uid(),amount:d.amount,date:d.date,method:d.method,note:d.note}); save(); route(); }
  });
}
function quickSession(){
  if(!DB.cases.length){ alert('أضف قضية أولاً'); return; }
  openForm('جلسة سريعة',[
    {key:'cid',label:'القضية',type:'select',options:DB.cases.map(c=>({v:c.id,t:`قضية ${c.number} لسنة ${c.year} - ${c.court||''}`}))},
    {key:'date',label:'تاريخ الجلسة',type:'date',required:1},
    {key:'decision',label:'قرار الجلسة',type:'combo',options:SESSION_DECISIONS},
    {key:'nextDate',label:'التأجيل القادم',type:'date',optional:1}
  ], d=>{
    const c = findCase(d.cid);
    if(c){ c.sessions.push({id:uid(),date:d.date,decision:d.decision,nextDate:d.nextDate}); save(); route(); }
  });
}
function quickErrand(){
  if(!DB.companies.length){ alert('أضف شركة أولاً'); return; }
  openForm('مأمورية سريعة',[
    {key:'cid',label:'الشركة',type:'select',options:DB.companies.map(c=>({v:c.id,t:c.name}))},
    {key:'title',label:'المأمورية',type:'combo',options:ERRAND_TYPES},
    {key:'date',label:'التاريخ',type:'date'}
  ], d=>{
    const c = findCompany(d.cid);
    if(c){ c.errands.push({id:uid(),done:false,title:d.title,date:d.date}); save(); route(); }
  });
}

function seedDemo(){
  if(DB.companies.length||DB.cases.length){ if(!confirm('يوجد بيانات حالية. إضافة بيانات تجريبية فوقها؟')) return; }
  const co = { id:uid(), name:'شركة النور للتجارة', activity:'تجارة عامة', legalForm:'شركة ذات مسئولية محدودة (ذ.م.م)', capital:'100000', address:'الجيزة - المهندسين', partners:'أحمد سمير، منى علي', notes:'', feesAgreed:15000,
    formationDocs:['عقد التأسيس وتوثيقه','السجل التجاري','البطاقة الضريبية','ملف القيمة المضافة','التأمينات الاجتماعية','صحيفة الاستثمار','الرخصة','السجل الصناعي','التوقيع الإلكتروني'].map((n,i)=>({name:n,status:i<3?'تم':(i<5?'جاري':'لم يبدأ')})),
    amendments:[{id:uid(),type:'تعديل رأس المال',date:todayISO(),status:'مطلوب',notes:'زيادة إلى 250 ألف'}],
    renewals:[{id:uid(),label:'إقرار القيمة المضافة',date:todayISO(),freq:'شهري'},{id:uid(),label:'تجديد السجل التجاري',date:plusDays(3),freq:'سنوي'}],
    payments:[{id:uid(),date:todayISO(),amount:5000,method:'تحويل بنكي',note:'دفعة أولى'}], errands:[{id:uid(),title:'تقديم صحيفة الاستثمار',date:plusDays(1),done:false}] };
  const cl = { id:uid(), name:'محمد عبد الله', phone:'01000000000', nationalId:'', companyId:'' };
  const cs = { id:uid(), number:'4521', year:'2025', court:'محكمة جنوب الجيزة الابتدائية', circuit:'الدائرة 3 مدني', type:'مدني', opponents:'شركة المقاولات المتحدة', status:'متداولة', clientId:cl.id, companyId:'', notes:'', feesAgreed:20000,
    sessions:[{id:uid(),date:plusDays(-14),decision:'أُجلت لورود تقرير الخبير',nextDate:todayISO()}],
    poas:[{id:uid(),number:'321',year:'2025',office:'مكتب توثيق الدقي',expiry:''}],
    adminWorks:[{id:uid(),announcementNo:'887',announcementType:'صحيفة دعوى',deliveryDate:plusDays(-5),receiptDate:'',bailiffOffice:'قلم محضرين جنوب الجيزة'}],
    payments:[{id:uid(),date:todayISO(),amount:8000,method:'نقدي',note:'مقدم أتعاب'}] };
  DB.companies.push(co); DB.clients.push(cl); DB.cases.push(cs);
  DB.expenses.push({id:uid(),date:todayISO(),amount:3000,category:'الإيجارات',note:'إيجار المكتب',refType:'',refId:''});
  save(); route();
}
