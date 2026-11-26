/* الدخول والأمان: حسابات محلية على الجهاز */
function getUsers(){ try{ return JSON.parse(localStorage.getItem('lawfirm_users'))||[]; }catch(e){ return []; } }
function setUsers(u){ localStorage.setItem('lawfirm_users', JSON.stringify(u)); }
function currentUser(){ return sessionStorage.getItem('lawfirm_session')||''; }
function currentRole(){ return sessionStorage.getItem('lawfirm_role')||''; }

function newSalt(){ const b=new Uint8Array(16); crypto.getRandomValues(b); return btoa(String.fromCharCode(...b)); }
async function pbkdf(pass, saltB64){
  if(window.crypto && crypto.subtle){
    const salt = Uint8Array.from(atob(saltB64), c=>c.charCodeAt(0));
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({name:'PBKDF2', hash:'SHA-256', salt, iterations:150000}, key, 256);
    return btoa(String.fromCharCode(...new Uint8Array(bits)));
  }
  let h=0x811c9dc5; const str=saltB64+'::'+pass;
  for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=(h*0x01000193)>>>0; }
  return 'fnv'+h.toString(16);
}

/* شاشة القفل / الإعداد */
function renderLock(){
  const root = document.getElementById('lockRoot');
  const users = getUsers();
  if(!users.length){ renderSetup(); return; }
  if(currentUser()){ root.innerHTML=''; return; }
  root.innerHTML = `<div class="lockscreen"><div class="lockcard">
    <img src="logo.png" class="locklogo" alt="شعار المكتب">
    <div class="locktitle">المكتب الحكيم</div>
    <div class="locksub">للاستشارات القانونية والمحاماة</div>
    <label>المستخدم</label>
    <select id="lockUser">${users.map(u=>`<option>${esc(u.name)}</option>`).join('')}</select>
    <label>كلمة المرور</label>
    <input id="lockPass" type="password" placeholder="••••" onkeydown="if(event.key==='Enter')tryLogin()">
    <div id="lockErr" class="lockerr"></div>
    <button class="btn gold" style="width:100%;margin-top:6px" onclick="tryLogin()">دخول</button>
    <button class="btn ghost" style="width:100%;margin-top:8px" onclick="forgotFlow()">نسيت كلمة المرور</button>
    <div class="locknote">بياناتك محفوظة على هذا الجهاز فقط، وتسجيل الدخول يحمي التطبيق على هذا الجهاز.</div>
  </div></div>`;
}
function renderSetup(){
  document.getElementById('lockRoot').innerHTML = `<div class="lockscreen"><div class="lockcard">
    <img src="logo.png" class="locklogo" alt="شعار المكتب">
    <div class="locktitle">أهلاً بك في مكتبك</div>
    <div class="locksub">أول تشغيل: أنشئ حساب صاحب المكتب</div>
    <label>اسم المستخدم</label><input id="suName" placeholder="مثال: هادي">
    <label>كلمة المرور</label><input id="suPass1" type="password" placeholder="٤ أحرف على الأقل">
    <label>تأكيد كلمة المرور</label><input id="suPass2" type="password" placeholder="أعد كتابتها">
    <div id="suErr" class="lockerr"></div>
    <button class="btn gold" style="width:100%;margin-top:6px" onclick="doSetup()">إنشاء الحساب وبدء الاستخدام</button>
    <div class="locknote">يمكنك لاحقاً إضافة حتى ٣ مستخدمين من «المستخدمون والأمان».</div>
  </div></div>`;
}
async function doSetup(){
  const name=document.getElementById('suName').value.trim();
  const p1=document.getElementById('suPass1').value, p2=document.getElementById('suPass2').value;
  const err=document.getElementById('suErr');
  if(name.length<2){ err.textContent='اكتب اسماً من حرفين على الأقل'; return; }
  if(p1.length<4){ err.textContent='كلمة المرور ٤ أحرف على الأقل'; return; }
  if(p1!==p2){ err.textContent='كلمتا المرور غير متطابقتين'; return; }
  const salt=newSalt(); const hash=await pbkdf(p1,salt);
  setUsers([{name,salt,hash,role:'المالك'}]);
  sessionStorage.setItem('lawfirm_session',name); sessionStorage.setItem('lawfirm_role','المالك');
  renderLock(); route(); startIdleWatch();
}
async function tryLogin(){
  const name=document.getElementById('lockUser').value, pass=document.getElementById('lockPass').value;
  const u=getUsers().find(x=>x.name===name);
  const hash=u?await pbkdf(pass,u.salt):'';
  if(u && hash===u.hash){
    sessionStorage.setItem('lawfirm_session',u.name); sessionStorage.setItem('lawfirm_role',u.role||'');
    renderLock(); route(); startIdleWatch();
  } else document.getElementById('lockErr').textContent='اسم المستخدم أو كلمة المرور غير صحيحة';
}
function lockNow(){
  sessionStorage.removeItem('lawfirm_session'); sessionStorage.removeItem('lawfirm_role');
  clearTimeout(idleTimer); renderLock();
}

/* نسيت كلمة المرور: مسح بعد تأكيد التصدير */
let forgotExported=false;
function forgotFlow(){
  forgotExported=false;
  document.getElementById('lockRoot').innerHTML = `<div class="lockscreen"><div class="lockcard">
    <div class="locktitle">استعادة الوصول</div>
    <div class="locksub" style="line-height:1.9">كلمة المرور لا تُسترجع، لأن بياناتك محفوظة على جهازك فقط ولا يوجد خادم يعيد تعيينها.<br>الحل الوحيد: مسح كل بيانات التطبيق والبدء من جديد.<br><b>صدّر نسخة احتياطية أولاً حتى لا تفقد بياناتك.</b></div>
    <button class="btn ghost" style="width:100%" id="fgExp" onclick="exportData();forgotExported=true;document.getElementById('fgWipe').disabled=false;document.getElementById('fgWipe').style.opacity=1">١) تصدير نسخة احتياطية</button>
    <button class="btn danger" style="width:100%;margin-top:8px;opacity:.4" id="fgWipe" disabled onclick="wipeAll()">٢) مسح كل البيانات والبدء من جديد</button>
    <button class="btn ghost" style="width:100%;margin-top:8px" onclick="renderLock()">رجوع</button>
  </div></div>`;
}
function wipeAll(){
  if(!forgotExported){ return; }
  if(!confirm('سيتم مسح كل بيانات التطبيق على هذا الجهاز نهائياً. هل أنت متأكد؟')) return;
  localStorage.clear(); sessionStorage.clear(); location.reload();
}

/* القفل التلقائي بعد الخمول */
let idleTimer=null;
function startIdleWatch(){
  clearTimeout(idleTimer);
  const mins=Number(localStorage.getItem('lawfirm_autolock')||'0');
  if(!mins || !currentUser()) return;
  idleTimer=setTimeout(lockNow, mins*60000);
}
['click','touchstart','keydown'].forEach(ev=>window.addEventListener(ev, ()=>{ if(currentUser()) startIdleWatch(); }, {passive:true}));

/* إدارة المستخدمين (صاحب المكتب) */
function manageUsers(){
  const users=getUsers(); const role=currentRole();
  const al=localStorage.getItem('lawfirm_autolock')||'0';
  document.getElementById('modalRoot').innerHTML = `<div class="overlay" onclick="if(event.target===this)closeForm()"><div class="sheet"><div class="handle"></div><h3>المستخدمون والمزامنة</h3>
  ${window.Sync ? Sync.uiBlock() : ''}
  <h3 style="margin-top:14px">المستخدمون</h3>
  ${users.map(u=>`<div class="list-item"><div><div class="t">${esc(u.name)}</div><div class="muted">${esc(u.role)}</div></div>
    ${role==='المالك'&&u.role!=='المالك'?`<button class="btn danger small" onclick="removeUser('${esc(u.name)}')">حذف</button>`:''}</div>`).join('')}
  ${role==='المالك'&&users.length<3?`
  <h3 style="margin-top:14px">إضافة مستخدم (حتى ٣)</h3>
  <label>اسم المستخدم</label><input id="nuName">
  <label>كلمة المرور</label><input id="nuPass" type="password">
  <label>الصلاحية</label><select id="nuRole"><option>محامٍ</option><option>موظف</option></select>
  <div class="btnrow"><button class="btn gold" onclick="addUserSubmit()">إضافة المستخدم</button></div>`:''}
  <h3 style="margin-top:14px">القفل التلقائي</h3>
  <select onchange="localStorage.setItem('lawfirm_autolock',this.value);startIdleWatch()">
    <option value="0" ${al==='0'?'selected':''}>إيقاف</option>
    <option value="2" ${al==='2'?'selected':''}>بعد دقيقتين خمول</option>
    <option value="5" ${al==='5'?'selected':''}>بعد ٥ دقائق خمول</option>
    <option value="15" ${al==='15'?'selected':''}>بعد ١٥ دقيقة خمول</option>
  </select>
  <div class="section-note" style="margin-top:14px;line-height:2">ملاحظة: تسجيل الدخول يحمي التطبيق على هذا الجهاز، والمزامنة (عند ربطها أعلاه) تشارك البيانات لحظياً بين أجهزة المكتب المربوطة بنفس الحساب.</div>
  <div class="btnrow"><button class="btn ghost" onclick="closeForm()">إغلاق</button></div>
  </div></div>`;
}
async function addUserSubmit(){
  const users=getUsers();
  if(users.length>=3){ alert('الحد الأقصى ٣ مستخدمين'); return; }
  const name=document.getElementById('nuName').value.trim();
  const pass=document.getElementById('nuPass').value;
  const role=document.getElementById('nuRole').value;
  if(name.length<2){ alert('اكتب اسماً من حرفين على الأقل'); return; }
  if(pass.length<4){ alert('كلمة المرور ٤ أحرف على الأقل'); return; }
  if(users.some(u=>u.name===name)){ alert('اسم المستخدم موجود بالفعل'); return; }
  const salt=newSalt(); const hash=await pbkdf(pass,salt);
  users.push({name,salt,hash,role}); setUsers(users); manageUsers();
}
function removeUser(name){
  if(!confirm('حذف المستخدم «'+name+'»؟ لن يستطيع الدخول بعدها.')) return;
  setUsers(getUsers().filter(u=>u.name!==name)); manageUsers();
}

window.addEventListener('load', ()=>{ renderLock(); startIdleWatch(); if(window.Sync){ Sync.init(); route(); } });
