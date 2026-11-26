/* طبقة المزامنة — Firebase Firestore (الخطة المجانية Spark)، offline-first.
   كل البيانات تمر عبر DB + save() في core.js، وsave() تنادي Sync.onSave() بعد كل تغيير.
   التخزين المحلي (localStorage) هو الأساس؛ Firestore نسخة مشتركة بين الأجهزة بتحديث لحظي.
   آخر كتابة تكسب (رقم مراجعة متزايد) — مناسب لحجم مكتب واحد بعدد أجهزة قليل. */
const Sync = {
  enabled: true,
  status: 'off', // off | needlink | linking | online | error
  rev: Number(localStorage.getItem('lawfirm_sync_rev') || 0),
  _db: null, _auth: null, _unsub: null, _timer: null, _remoteApplying: false,

  init(){
    if(this._db || typeof firebase === 'undefined' || typeof FIREBASE_CONFIG === 'undefined') return;
    try{
      firebase.initializeApp(FIREBASE_CONFIG);
      this._auth = firebase.auth();
      this._db = firebase.firestore();
      this._db.enablePersistence({synchronizeTabs:true}).catch(()=>{});
      this._auth.onAuthStateChanged(u=>{
        if(u){ this.status = 'online'; this._listen(); }
        else if(this.status === 'online' || this.status === 'linking'){ this.status = 'needlink'; }
      });
      const c = this._creds();
      if(c){ this.status = 'linking'; this._signIn(c.e, c.p); }
      else this.status = 'needlink';
    }catch(e){ this.status = 'error'; }
  },

  _creds(){ try{ return JSON.parse(localStorage.getItem('lawfirm_sync_creds') || 'null'); }catch(e){ return null; } },
  _doc(){ return this._db.collection('firms').doc('main'); },

  async _signIn(email, pass){
    try{ await this._auth.signInWithEmailAndPassword(email, pass); }
    catch(e){ this.status = 'error'; }
  },

  async link(email, pass){
    if(!this._auth) return 'المزامنة غير مهيأة على هذا الجهاز';
    this.status = 'linking';
    try{
      await this._auth.signInWithEmailAndPassword(email, pass);
      localStorage.setItem('lawfirm_sync_creds', JSON.stringify({e: email, p: pass}));
      this.status = 'online';
      this._listen();
      this._push();
      return null;
    }catch(e){ this.status = 'error'; return 'تعذر تسجيل الدخول — تأكد من البريد وكلمة المرور'; }
  },

  unlink(){
    localStorage.removeItem('lawfirm_sync_creds');
    if(this._unsub){ this._unsub(); this._unsub = null; }
    if(this._auth) this._auth.signOut();
    this.status = 'needlink';
  },

  _listen(){
    if(this._unsub || !this._db) return;
    this._unsub = this._doc().onSnapshot(snap=>{
      if(!snap.exists){ this._push(); return; }
      const r = snap.data() || {};
      const remoteRev = r.rev || 0;
      if(this._remoteApplying) return;
      /* قواعد Firestore تمنع أي كتابة برقم مراجعة أقدم أو مساوٍ، فالخادم لا يتراجع أبدًا.
         هنا نعتمد النسخة الأحدث، وفي حالة تساوي الرقم مع اختلاف البيانات (تضارب جهازين)
         يعتمد هذا الجهاز نسخة الخادم حتى تتلاقى الأجهزة بدل أن تتباعد بصمت. */
      const conflict = remoteRev === this.rev && typeof r.data === 'string' && r.data !== JSON.stringify(DB);
      if(remoteRev < this.rev || (remoteRev === this.rev && !conflict)) return;
      this._remoteApplying = true;
      const gap = remoteRev > this.rev + 1;
      this.rev = remoteRev;
      localStorage.setItem('lawfirm_sync_rev', String(this.rev));
      try{
        DB = JSON.parse(r.data);
        localStorage.setItem(DB_KEY, JSON.stringify(DB));
      }catch(e){}
      this._remoteApplying = false;
      route();
      if(conflict) showToast('جهاز آخر عدّل البيانات في نفس الوقت — اعتُمدت النسخة الأحدث. راجع بياناتك.', 'warn');
      else if(gap) showToast('وصلت تحديثات من جهاز آخر — راجع بياناتك', 'info');
    }, ()=>{ this.status = 'error'; });
  },

  onSave(){
    if(this._remoteApplying || !this._db || !this._auth || !this._auth.currentUser) return;
    clearTimeout(this._timer);
    this._timer = setTimeout(()=>this._push(), 800);
  },

  _push(){
    if(!this._db || !this._auth || !this._auth.currentUser) return;
    this.rev++;
    localStorage.setItem('lawfirm_sync_rev', String(this.rev));
    this._doc().set({
      data: JSON.stringify(DB),
      rev: this.rev,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(err=>{
      if(err && err.code === 'permission-denied'){ this.pull(); }
      else this.status = 'error';
    });
  },

  async pull(){
    if(!this._db || !this._auth || !this._auth.currentUser) return false;
    try{
      const snap = await this._doc().get();
      if(!snap.exists) return false;
      const r = snap.data() || {};
      const conflict = (r.rev || 0) === this.rev && typeof r.data === 'string' && r.data !== JSON.stringify(DB);
      if((r.rev || 0) > this.rev || conflict){
        this.rev = r.rev;
        localStorage.setItem('lawfirm_sync_rev', String(this.rev));
        DB = JSON.parse(r.data);
        localStorage.setItem(DB_KEY, JSON.stringify(DB));
        route();
        return true;
      }
    }catch(e){}
    return false;
  },

  uiBlock(){
    const st = this.status;
    let inner;
    if(st === 'online'){
      const c = this._creds() || {};
      inner = `<div class="kv"><b>الحالة</b><span class="pill ok">متصلة — الأجهزة متزامنة</span></div>
      <div class="kv"><b>حساب المزامنة</b>${esc(c.e || '')}</div>
      <div class="btnrow"><button class="btn danger small" onclick="Sync.unlink();manageUsers()">فصل هذا الجهاز</button></div>`;
    } else {
      const msg = st === 'linking' ? 'جارٍ الربط…' : st === 'error' ? 'تعذر الاتصال — تأكد من البيانات والإنترنت' : 'غير مربوطة على هذا الجهاز';
      inner = `<div class="kv"><b>الحالة</b><span class="pill warn">${msg}</span></div>
      <label>البريد الإلكتروني للمكتب</label><input id="syncEmail" type="email" dir="ltr" autocomplete="username">
      <label>كلمة المرور</label><input id="syncPass" type="password" dir="ltr" autocomplete="current-password">
      <div class="btnrow"><button class="btn gold" onclick="linkSyncSubmit()">ربط هذا الجهاز بالمزامنة</button></div>`;
    }
    return `<h3 style="margin-top:14px">المزامنة بين الأجهزة</h3>${inner}
    <div class="section-note" style="margin-top:6px;line-height:2">المزامنة مجانية (خطة Firebase Spark) وتعمل دون إنترنت: تُحفظ التغييرات على الجهاز وتُرفع عند عودة الاتصال. البيانات على خوادم Google في أوروبا ولا يصلها إلا حساب المكتب.</div>`;
  }
};
window.Sync = Sync;

async function linkSyncSubmit(){
  const e = (document.getElementById('syncEmail').value || '').trim();
  const p = document.getElementById('syncPass').value || '';
  if(!e.includes('@')){ alert('اكتب البريد الإلكتروني'); return; }
  if(p.length < 6){ alert('كلمة المرور ٦ أحرف على الأقل'); return; }
  const err = await Sync.link(e, p);
  if(err) alert(err);
  manageUsers();
}
