/* نواة التطبيق: تخزين محلي + أدوات + تنقل */
const DB_KEY = 'lawfirm_data_v1';
const CUSTOM_KEY = 'lawfirm_custom_opts_v1';
const OTHER = 'أخرى (اكتب بنفسك)';
let DB = load();

function load(){
  try{ const d = JSON.parse(localStorage.getItem(DB_KEY)); if(d) return d; }catch(e){}
  return { companies:[], clients:[], cases:[], expenses:[] };
}
function save(){ localStorage.setItem(DB_KEY, JSON.stringify(DB)); if(window.Sync) Sync.onSave(); }
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function showToast(msg, kind){
  let t = document.getElementById('toast');
  if(!t){ t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = 'show ' + (kind || 'info');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>{ t.className = ''; }, 7000);
}
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function fmtMoney(n){ n = Number(n)||0; return n.toLocaleString('ar-EG') + ' ج.م'; }
function fmtDate(iso){
  if(!iso) return '—';
  try{ return new Date(iso+'T00:00:00').toLocaleDateString('ar-EG',{day:'numeric',month:'long',year:'numeric'}); }catch(e){ return iso; }
}
function todayISO(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function plusDays(n){ const d=new Date(); d.setDate(d.getDate()+n); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function relDate(iso){
  if(!iso) return '';
  const t = todayISO();
  if(iso===t) return 'اليوم';
  if(iso===plusDays(1)) return 'غداً';
  const days = Math.round((new Date(iso+'T00:00:00') - new Date(t+'T00:00:00'))/86400000);
  if(days>1) return 'بعد ' + days.toLocaleString('ar-EG') + ' أيام';
  if(days===-1) return 'أمس';
  if(days<-1) return 'متأخر ' + (-days).toLocaleString('ar-EG') + ' أيام';
  return '';
}
function monthKey(iso){ return (iso||'').slice(0,7); }
function findCompany(id){ return DB.companies.find(c=>c.id===id); }
function findCase(id){ return DB.cases.find(c=>c.id===id); }
function findClient(id){ return DB.clients.find(c=>c.id===id); }
function clientName(id){ const c=findClient(id); return c?c.name:'—'; }
function delConfirm(msg, fn){ if(confirm(msg)) fn(); }

/* الوضع الليلي */
function applyTheme(t){
  if(t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
  try{ localStorage.setItem('lawfirm_theme', t||''); }catch(e){}
}
function toggleTheme(){ applyTheme(document.documentElement.dataset.theme==='dark' ? '' : 'dark'); }

/* روابط الاتصال والواتساب */
function normPhone(p){
  p = String(p||'').replace(/\D/g,'');
  if(p.startsWith('002')) p = p.slice(2);
  else if(p.startsWith('01')) p = '2' + p;
  return p;
}
function waLink(p){ p = normPhone(p); return p ? 'https://wa.me/' + p : ''; }
function telLink(p){ p = String(p||'').replace(/[^\d+]/g,''); return p ? 'tel:' + p : ''; }

/* خيارات مخصصة يتذكرها التطبيق لكل خانة */
function customOpts(key){ try{ const a=JSON.parse(localStorage.getItem(CUSTOM_KEY)||'{}'); return a[key]||[]; }catch(e){ return []; } }
function rememberOpt(key,val){
  val=(val||'').trim(); if(!val) return;
  let a={}; try{ a=JSON.parse(localStorage.getItem(CUSTOM_KEY)||'{}'); }catch(e){}
  a[key]=a[key]||[];
  if(!a[key].includes(val)) a[key].push(val);
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(a));
}

/* نموذج منبثق عام */
function openForm(title, fields, onSubmit, initial){
  initial = initial || {};
  const root = document.getElementById('modalRoot');
  const optHtml = (o,v)=>{
    const ov = typeof o==='object' ? o.v : o, ot = typeof o==='object' ? o.t : o;
    return `<option value="${esc(ov)}" ${ov===v?'selected':''}>${esc(ot)}</option>`;
  };
  const inputs = fields.map(f=>{
    const v = initial[f.key]!=null ? initial[f.key] : (f.value||'');
    let ctrl;
    if(f.type==='combo'){
      const opts = [...f.options];
      customOpts(f.key).forEach(o=>{ if(!opts.includes(o)) opts.push(o); });
      if(v && !opts.includes(v)) opts.push(v);
      ctrl = `<select name="${f.key}" onchange="comboToggle(this)">${opts.map(o=>optHtml(o,v)).join('')}<option value="${esc(OTHER)}">${OTHER}</option></select>` +
        `<input name="${f.key}__other" type="text" placeholder="اكتب القيمة هنا…" style="display:none;margin-top:6px">`;
    }
    else if(f.type==='select') ctrl = `<select name="${f.key}">${f.options.map(o=>optHtml(o,v)).join('')}</select>`;
    else if(f.type==='textarea') ctrl = `<textarea name="${f.key}" rows="3">${esc(v)}</textarea>`;
    else if(f.type==='date') ctrl = `<input name="${f.key}" type="date" value="${v || (f.optional?'':todayISO())}">`;
    else if(f.type==='number') ctrl = `<input name="${f.key}" type="number" inputmode="decimal" min="0" step="any" value="${esc(v)}" ${f.required?'required':''}>`;
    else if(f.type==='tel') ctrl = `<input name="${f.key}" type="tel" inputmode="tel" value="${esc(v)}" placeholder="01xxxxxxxxx" ${f.required?'required':''}>`;
    else ctrl = `<input name="${f.key}" type="${f.type||'text'}" value="${esc(v)}" ${f.required?'required':''}>`;
    return `<label>${f.label}</label>${ctrl}`;
  }).join('');
  root.innerHTML = `<div class="overlay" onclick="if(event.target===this)closeForm()">
    <div class="sheet"><div class="handle"></div><h3>${title}</h3>
    <form id="mform">${inputs}
      <div class="btnrow"><button type="submit" class="btn gold" style="flex:1">حفظ</button>
      <button type="button" class="btn ghost" onclick="closeForm()">إلغاء</button></div>
    </form></div></div>`;
  document.getElementById('mform').onsubmit = e=>{
    e.preventDefault();
    const data = {};
    fields.forEach(f=>{
      if(f.type==='combo'){
        const sel = e.target.elements[f.key];
        if(sel.value===OTHER){
          data[f.key] = e.target.elements[f.key+'__other'].value.trim();
          if(data[f.key]) rememberOpt(f.key, data[f.key]);
        } else data[f.key] = sel.value;
      } else data[f.key] = e.target.elements[f.key].value.trim();
    });
    closeForm(); onSubmit(data);
  };
}
function comboToggle(sel){
  const other = sel.form.querySelector('[name="'+sel.name+'__other"]');
  if(other){ other.style.display = sel.value===OTHER ? 'block':'none'; if(sel.value===OTHER) other.focus(); }
}
function closeForm(){ document.getElementById('modalRoot').innerHTML=''; }

/* تصدير واستيراد نسخة احتياطية */
function exportData(){
  const blob = new Blob([JSON.stringify(DB,null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'نسخة-احتياطية-' + todayISO() + '.json';
  a.click();
  try{ localStorage.setItem('lawfirm_last_export', todayISO()); }catch(e){}
  setTimeout(route, 300);
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
const TITLES = { home:'الرئيسية', companies:'الشركات', cases:'القضايا', clients:'الموكلين', agenda:'الأجندة', accounts:'الحسابات الشهرية' };
function route(){
  const h = location.hash || '#/home';
  const parts = h.slice(2).split('/');
  const page = parts[0] || 'home';
  document.querySelectorAll('#bottomnav a').forEach(a=>a.classList.toggle('active', a.dataset.nav===(page==='clients'?'cases':page)));
  document.getElementById('pageHeading').textContent = page==='home' ? '' : (TITLES[page] || '');
  const v = document.getElementById('view');
  window.scrollTo(0,0);
  if(page==='companies' && parts[1]) renderCompanyDetail(v, parts[1]);
  else if(page==='companies') renderCompanies(v);
  else if(page==='cases' && parts[1]) renderCaseDetail(v, parts[1]);
  else if(page==='cases') renderCases(v);
  else if(page==='clients' && parts[1]) renderClientDetail(v, parts[1]);
  else if(page==='clients'){ sessionStorage.setItem('caselistab','الموكلين'); location.hash='#/cases'; return; }
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
