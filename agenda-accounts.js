/* الأجندة + الحسابات الشهرية */
const EXPENSE_CATS = ['مصاريف المكتب','الرواتب','الإيجارات','مصروف ملف'];
function renderAgenda(v){
  const items = upcomingItems(0);
  const today = todayISO();
  let html = '<div class="card">';
  if(!items.length) html += '<div class="empty">لا مواعيد. أضف جلسات من القضايا وتجديدات من الشركات.</div>';
  let lastDay='';
  items.forEach(i=>{
    if(i.date!==lastDay){ lastDay=i.date; html += `<div><span class="agenda-day">${fmtDate(i.date)}${i.date<today?' (فائت)':i.date===today?' (اليوم)':''}</span></div>`; }
    html += `<div class="list-item" onclick="location.hash='${i.ref}'"><div class="t">${esc(i.label)}</div><span class="pill ${i.date<today?'bad':''}">${i.kind}</span></div>`;
  });
  v.innerHTML = html + '</div>';
}
function renderAccounts(v, mk){
  mk = mk || monthKey(todayISO());
  const s = monthStats(mk);
  const exps = DB.expenses.filter(e=>monthKey(e.date)===mk).sort((a,b)=>a.date<b.date?-1:1);
  const byCat = {}; EXPENSE_CATS.forEach(c=>byCat[c]=0);
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
  <div class="grid3">
    <div class="stat ok"><div class="v">${fmtMoney(s.income)}</div><div class="l">الدخل (المحصّل)</div></div>
    <div class="stat bad"><div class="v">${fmtMoney(s.spent)}</div><div class="l">المصروفات</div></div>
    <div class="stat gold"><div class="v">${fmtMoney(s.net)}</div><div class="l">الباقي / الصافي</div></div>
  </div>
  <div class="card row"><span class="muted">أتعاب مستحقة غير محصلة (إجمالي)</span><b style="color:var(--warn)">${fmtMoney(s.outstanding)}</b></div>
  <h3>المصروفات حسب الفئة</h3>
  <div class="card">${EXPENSE_CATS.map(c=>`<div class="list-item"><span>${c}</span><b>${fmtMoney(byCat[c])}</b></div>`).join('')}</div>
  <h3>سجل المصروفات</h3>
  <div class="card">${exps.length?exps.map(e=>`<div class="list-item"><div><div class="t">${esc(e.category)}</div><div class="muted">${fmtDate(e.date)} ${e.note?'· '+esc(e.note):''}</div></div><b>${fmtMoney(e.amount)}</b></div>`).join(''):'<div class="empty">لا مصروفات هذا الشهر</div>'}</div>
  <div class="btnrow"><button class="btn gold" onclick="addExpense('${mk}')">+ مصروف</button></div>`;
}
function addExpense(mk){
  openForm('مصروف جديد',[
    {key:'category',label:'الفئة',type:'select',options:EXPENSE_CATS},
    {key:'amount',label:'المبلغ',type:'number',required:1},
    {key:'date',label:'التاريخ',type:'date'},
    {key:'note',label:'بيان'}
  ], d=>{ DB.expenses.push({id:uid(),...d,refType:'',refId:''}); save(); location.hash='#/accounts/'+mk; route(); });
}
