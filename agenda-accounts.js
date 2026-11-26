/* الأجندة + الحسابات الشهرية */
const EXPENSE_CATS = ['مصاريف المكتب','الرواتب','الإيجارات','مصروف ملف'];
function allExpenseCats(){
  const cats = [...EXPENSE_CATS];
  customOpts('category').forEach(c=>{ if(!cats.includes(c)) cats.push(c); });
  DB.expenses.forEach(e=>{ if(e.category && !cats.includes(e.category)) cats.push(e.category); });
  return cats;
}
function renderAgenda(v){
  const tab = sessionStorage.getItem('atab')||'الكل';
  const tabs = ['اليوم','الأسبوع','الكل'];
  const today = todayISO();
  let items = upcomingItems(0);
  if(tab==='اليوم') items = items.filter(i=>i.date===today);
  else if(tab==='الأسبوع') items = items.filter(i=>i.date>=today && i.date<=plusDays(7));
  window._agendaItems = items;
  let html = `<div class="tabbing">${tabs.map(t=>`<button class="${t===tab?'on':''}" onclick="sessionStorage.setItem('atab','${t}');route()">${t}</button>`).join('')}<button class="" onclick="exportWeekAgenda()" title="تصدير مواعيد الأسبوع لتقويم الهاتف">تصدير الأسبوع للتقويم</button></div><div class="card">`;
  if(!items.length) html += `<div class="empty"><div class="eic">${EMPTY_IC}</div>${tab==='اليوم'?'لا مواعيد اليوم. يومك فارغ.':tab==='الأسبوع'?'لا مواعيد خلال الأسبوع القادم.':'لا مواعيد. أضف جلسات من القضايا وتجديدات من الشركات.'}</div>`;
  let lastDay='';
  items.forEach(i=>{
    if(i.date!==lastDay){ lastDay=i.date; html += `<div><span class="agenda-day">${fmtDate(i.date)} · ${relDate(i.date)}</span></div>`; }
    html += `<div class="list-item" onclick="location.hash='${i.ref}'"><div class="t">${esc(i.label)}</div><span style="display:flex;align-items:center;gap:6px"><button class="btn small ghost" style="padding:4px 8px" title="أضف للتقويم" onclick="event.stopPropagation();exportAgendaItem(${items.indexOf(i)})">${IC.cal||'تقويم'}</button><span class="pill ${i.date<today?'bad':i.date===today?'warn':''}">${i.kind}</span></span></div>`;
  });
  v.innerHTML = html + '</div>';
}
function renderAccounts(v, mk){
  mk = mk || monthKey(todayISO());
  const s = monthStats(mk);
  const exps = DB.expenses.filter(e=>monthKey(e.date)===mk).sort((a,b)=>a.date<b.date?-1:1);
  const cats = allExpenseCats();
  const byCat = {}; cats.forEach(c=>byCat[c]=0);
  exps.forEach(e=>{ byCat[e.category]=(byCat[e.category]||0)+(Number(e.amount)||0); });
  const mLabel = new Date(mk+'-01T00:00:00').toLocaleDateString('ar-EG',{month:'long',year:'numeric'});
  const [y,m] = mk.split('-').map(Number);
  const prev = m===1?`${y-1}-12`:`${y}-${String(m-1).padStart(2,'0')}`;
  const next = m===12?`${y+1}-01`:`${y}-${String(m+1).padStart(2,'0')}`;
  v.innerHTML = `<div class="row" style="margin-bottom:10px">
    <button class="btn small ghost" onclick="location.hash='#/accounts/${prev}'">‹ السابق</button>
    <b style="color:var(--burgundy);font-size:17px">${mLabel}</b>
    <button class="btn small ghost" onclick="location.hash='#/accounts/${next}'">التالي ›</button>
  </div>
  <div class="row" style="margin-bottom:12px">
    <span class="muted">انتقل لشهر معين:</span>
    <input type="month" value="${mk}" style="max-width:170px" onchange="if(this.value)location.hash='#/accounts/'+this.value">
  </div>
  <div class="grid3">
    <div class="stat ok"><div class="v">${fmtMoney(s.income)}</div><div class="l">الدخل (المحصّل)</div></div>
    <div class="stat bad"><div class="v">${fmtMoney(s.spent)}</div><div class="l">المصروفات</div></div>
    <div class="stat gold"><div class="v">${fmtMoney(s.net)}</div><div class="l">الباقي / الصافي</div></div>
  </div>
  <div class="card row" style="margin-top:12px"><span class="muted">أتعاب مستحقة غير محصلة (إجمالي)</span><b style="color:var(--warn)">${fmtMoney(s.outstanding)}</b></div>
  <h3>المصروفات حسب الفئة</h3>
  <div class="card">${cats.map(c=>`<div class="list-item"><span>${esc(c)}</span><b>${fmtMoney(byCat[c])}</b></div>`).join('')}</div>
  <h3>سجل المصروفات</h3>
  <div class="card">${exps.length?exps.map(e=>`<div class="list-item"><div><div class="t">${esc(e.category)}</div><div class="muted">${fmtDate(e.date)} ${e.note?'· '+esc(e.note):''}</div></div><b>${fmtMoney(e.amount)}</b></div>`).join(''):'<div class="empty">لا مصروفات هذا الشهر</div>'}</div>
  <div class="btnrow"><button class="btn gold" onclick="addExpense('${mk}')">+ مصروف</button></div>`;
}
function addExpense(mk){
  openForm('مصروف جديد',[
    {key:'category',label:'الفئة',type:'combo',options:EXPENSE_CATS},
    {key:'amount',label:'المبلغ',type:'number',required:1},
    {key:'date',label:'التاريخ',type:'date'},
    {key:'note',label:'بيان'}
  ], d=>{
    DB.expenses.push({id:uid(),...d,refType:'',refId:''}); save(); location.hash='#/accounts/'+mk; route();
  });
}
