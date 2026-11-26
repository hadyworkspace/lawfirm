/* الرئيسية: لوحة اليوم */
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
  const up = upcomingItems(6);
  v.innerHTML = `
  <div class="grid2">
    <div class="stat"><div class="v">${DB.companies.length}</div><div class="l">شركة</div></div>
    <div class="stat"><div class="v">${DB.cases.length}</div><div class="l">قضية</div></div>
  </div>
  <h2>حسابات الشهر الحالي</h2>
  <div class="grid3">
    <div class="stat ok"><div class="v">${fmtMoney(s.income)}</div><div class="l">المحصّل</div></div>
    <div class="stat bad"><div class="v">${fmtMoney(s.spent)}</div><div class="l">المصروف</div></div>
    <div class="stat gold"><div class="v">${fmtMoney(s.net)}</div><div class="l">الصافي</div></div>
  </div>
  <div class="card row"><span class="muted">أتعاب مستحقة غير محصلة</span><b style="color:var(--warn)">${fmtMoney(s.outstanding)}</b></div>
  <h2>الأقرب في الأجندة</h2>
  <div class="card">
    ${up.length ? up.map(i=>`<div class="list-item" onclick="location.hash='${i.ref}'"><div><div class="t">${esc(i.label)}</div><div class="muted">${fmtDate(i.date)}</div></div><span class="pill">${i.kind}</span></div>`).join('') : '<div class="empty">لا مواعيد قادمة. أضف جلسات وتجديدات لتظهر هنا.</div>'}
  </div>
  <h2>أدوات</h2>
  <div class="btnrow">
    <button class="btn ghost small" onclick="exportData()">تصدير نسخة احتياطية</button>
    <button class="btn ghost small" onclick="importData()">استيراد نسخة</button>
    <button class="btn ghost small" onclick="seedDemo()">بيانات تجريبية</button>
  </div>`;
}
function seedDemo(){
  if(DB.companies.length||DB.cases.length){ if(!confirm('يوجد بيانات حالية. إضافة بيانات تجريبية فوقها؟')) return; }
  const co = { id:uid(), name:'شركة النور للتجارة', activity:'تجارة عامة', legalForm:'ذات مسئولية محدودة', capital:'100000', address:'الجيزة - المهندسين', partners:'أحمد سمير، منى علي', notes:'', feesAgreed:15000,
    formationDocs:['عقد التأسيس وتوثيقه','السجل التجاري','البطاقة الضريبية','ملف القيمة المضافة','التأمينات الاجتماعية','صحيفة الاستثمار','الرخصة','السجل الصناعي','التوقيع الإلكتروني'].map((n,i)=>({name:n,status:i<3?'تم':(i<5?'جاري':'لم يبدأ')})),
    amendments:[{id:uid(),type:'تعديل رأس المال',date:todayISO(),status:'مطلوب',notes:'زيادة إلى 250 ألف'}],
    renewals:[{id:uid(),label:'إقرار القيمة المضافة',date:todayISO(),freq:'شهري'},{id:uid(),label:'تجديد السجل التجاري',date:todayISO(),freq:'سنوي'}],
    payments:[{id:uid(),date:todayISO(),amount:5000,method:'تحويل بنكي',note:'دفعة أولى'}], errands:[{id:uid(),title:'تقديم صحيفة الاستثمار',date:todayISO(),done:false}] };
  const cl = { id:uid(), name:'محمد عبد الله', phone:'01000000000', nationalId:'', companyId:'' };
  const cs = { id:uid(), number:'4521', year:'2025', court:'محكمة جنوب الجيزة الابتدائية', circuit:'الدائرة 3 مدني', type:'مدني', opponents:'شركة المقاولات المتحدة', status:'متداولة', clientId:cl.id, companyId:'', notes:'', feesAgreed:20000,
    sessions:[{id:uid(),date:todayISO(),decision:'أُجلت لورود تقرير الخبير',nextDate:todayISO()}],
    poas:[{id:uid(),number:'321',year:'2025',office:'مكتب توثيق الدقي',expiry:''}],
    adminWorks:[{id:uid(),announcementNo:'887',announcementType:'صحيفة دعوى',deliveryDate:todayISO(),receiptDate:'',bailiffOffice:'قلم محضرين جنوب الجيزة'}],
    payments:[{id:uid(),date:todayISO(),amount:8000,method:'نقدي',note:'مقدم أتعاب'}] };
  DB.companies.push(co); DB.clients.push(cl); DB.cases.push(cs);
  DB.expenses.push({id:uid(),date:todayISO(),amount:3000,category:'الإيجارات',note:'إيجار المكتب',refType:'',refId:''});
  save(); route();
}
