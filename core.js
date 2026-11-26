/* نواة التطبيق: تخزين محلي + أدوات + تنقل */
const DB_KEY = 'lawfirm_data_v1';
let DB = load();

function load(){
  try{ const d = JSON.parse(localStorage.getItem(DB_KEY)); if(d) return d; }catch(e){}
  return { companies:[], clients:[], cases:[], expenses:[] };
}
function save(){ localStorage.setItem(DB_KEY, JSON.stringify(DB)); }
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function fmtMoney(n){ n = Number(n)||0; return n.toLocaleString('ar-EG') + ' ج.م'; }
function fmtDate(iso){
  if(!iso) return '—';
  try{ return new Date(iso+'T00:00:00').toLocaleDateString('ar-EG',{day:'numeric',month:'long',year:'numeric'}); }catch(e){ return iso; }
}
function todayISO(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function monthKey(iso){ return (iso||'').slice(0,7); }
function findCompany(id){ return DB.companies.find(c=>c.id===id); }
function findCase(id){ return DB.cases.find(c=>c.id===id); }
function findClient(id){ return DB.clients.find(c=>c.id===id); }
function clientName(id){ const c=findClient(id); return c?c.name:'—'; }
function delConfirm(msg, fn){ if(confirm(msg)) fn(); }

/* نموذج منبثق عام */
function openForm(title, fields, onSubmit, initial){
  initial = initial || {};
  const root = document.getElementById('modalRoot');
  const inputs = fields.map(f=>{
    const v = initial[f.key]!=null ? initial[f.key] : (f.value||'');
    let ctrl;
    if(f.type==='select') ctrl = `<select name="${f.key}">${f.options.map(o=>`<option ${o===v?'selected':''}>${o}</option>`).join('')}</select>`;
    else if(f.type==='textarea') ctrl = `<textarea name="${f.key}" rows="3">${esc(v)}</textarea>`;
    else ctrl = `<input name="${f.key}" type="${f.type||'text'}" value="${esc(v)}" ${f.required?'required':''} ${f.type==='date'&&!v?`value="${todayISO()}"`:''}>`;
    return `<label>${f.label}</label>${ctrl}`;
  }).join('');
  root.innerHTML = `<div class="overlay" onclick="if(event.target===this)closeForm()">
    <div class="sheet"><h3>${title}</h3>
    <form id="mform">${inputs}
      <div class="btnrow"><button type="submit" class="btn gold">حفظ</button>
      <button type="button" class="btn ghost" onclick="closeForm()">إلغاء</button></div>
    </form></div></div>`;
  document.getElementById('mform').onsubmit = e=>{
    e.preventDefault();
    const data = {};
    fields.forEach(f=>{ data[f.key] = e.target.elements[f.key].value.trim(); });
    closeForm(); onSubmit(data);
  };
}
function closeForm(){ document.getElementById('modalRoot').innerHTML=''; }

/* تصدير واستيراد نسخة احتياطية */
function exportData(){
  const blob = new Blob([JSON.stringify(DB,null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'نسخة-احتياطية-' + todayISO() + '.json';
  a.click();
}
function importData(){
  const inp = document.createElement('input'); inp.type='file'; inp.accept='.json';
  inp.onchange = ()=>{
    const r = new FileReader();
    r.onload = ()=>{ try{ DB = JSON.parse(r.result); save(); route(); alert('تم استيراد النسخة الاحتياطية'); }catch(e){ alert('ملف غير صالح'); } };
    r.readAsText(inp.files[0]);
  };
  inp.click();
}

/* التنقل */
const TITLES = { home:'الرئيسية', companies:'الشركات', cases:'القضايا', agenda:'الأجندة', accounts:'الحسابات الشهرية' };
function route(){
  const h = location.hash || '#/home';
  const parts = h.slice(2).split('/');
  const page = parts[0] || 'home';
  document.querySelectorAll('#bottomnav a').forEach(a=>a.classList.toggle('active', a.dataset.nav===page));
  document.getElementById('pageHeading').textContent = TITLES[page] || '';
  const v = document.getElementById('view');
  window.scrollTo(0,0);
  if(page==='companies' && parts[1]) renderCompanyDetail(v, parts[1]);
  else if(page==='companies') renderCompanies(v);
  else if(page==='cases' && parts[1]) renderCaseDetail(v, parts[1]);
  else if(page==='cases') renderCases(v);
  else if(page==='agenda') renderAgenda(v);
  else if(page==='accounts') renderAccounts(v, parts[1]);
  else renderHome(v);
}
window.addEventListener('hashchange', route);
window.addEventListener('load', ()=>{
  if(location.search==='?demo' && !DB.companies.length && !DB.cases.length) seedDemo();
  route();
  if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
});
