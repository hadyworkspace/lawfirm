/* تصدير المواعيد إلى تقويم الهاتف بملفات .ics — يعمل محليًا بالكامل على الجهاز،
   لا يُرسل أي بيانات لأي خدمة خارجية؛ الملف يُستورد في تقويم المستخدم الخاص فقط. */
function icsEscape(s){ return String(s==null?'':s).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n'); }
function icsDay(iso, add){
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + (add||0));
  return d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
}
function buildICS(events){
  const stamp = new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z');
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//ElHakim Law Office//Agenda//AR','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
  events.forEach((ev,ix)=>{
    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + (ev.id || uid()) + '-' + ix + '@elhakim-law');
    lines.push('DTSTAMP:' + stamp);
    lines.push('DTSTART;VALUE=DATE:' + icsDay(ev.date,0));
    lines.push('DTEND;VALUE=DATE:' + icsDay(ev.date,1));
    lines.push('SUMMARY:' + icsEscape(ev.title));
    if(ev.desc) lines.push('DESCRIPTION:' + icsEscape(ev.desc));
    if(ev.loc) lines.push('LOCATION:' + icsEscape(ev.loc));
    /* تنبيهان: مساء اليوم السابق وصباح يوم الموعد */
    ['-PT6H','PT7H'].forEach(tr=>{ lines.push('BEGIN:VALARM','ACTION:DISPLAY','TRIGGER:'+tr,'DESCRIPTION:تذكير بالموعد','END:VALARM'); });
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
function downloadICS(filename, events){
  if(!events || !events.length){ alert('لا توجد مواعيد للتصدير'); return; }
  const blob = new Blob(['\ufeff' + buildICS(events)], {type:'text/calendar;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  showToast('تم تنزيل ملف التقويم — افتحه ليُضاف إلى تقويم هاتفك', 'info');
}
function agendaItemEvent(i){
  return {id:'ag-'+i.kind+'-'+(i.ref||'')+'-'+i.date, date:i.date, title:i.kind + ': ' + i.label, desc:'من تطبيق المكتب الحكيم — ' + i.kind + '\n' + i.label};
}
function exportAgendaItem(ix){
  const items = window._agendaItems || [];
  if(!items[ix]) return;
  downloadICS('موعد-' + items[ix].date + '.ics', [agendaItemEvent(items[ix])]);
}
function exportWeekAgenda(){
  const today = todayISO(), end = plusDays(7);
  const items = upcomingItems(0).filter(i=>i.date>=today && i.date<=end);
  downloadICS('مواعيد-الأسبوع-' + today + '.ics', items.map(agendaItemEvent));
}
function exportSessionICS(caseId, sessionIx){
  const c = findCase(caseId); if(!c) return;
  const s = (c.sessions||[])[sessionIx]; if(!s || !s.nextDate) return;
  downloadICS('جلسة-' + (c.number||'قضية') + '-' + s.nextDate + '.ics', [{
    id:'sess-'+caseId+'-'+sessionIx+'-'+s.nextDate,
    date: s.nextDate,
    title: 'جلسة: ' + (c.number||'') + ' لسنة ' + (c.year||'') + ' - ' + (c.court||''),
    desc: 'التأجيل من جلسة ' + fmtDate(s.date) + (s.decision ? '\nقرار الجلسة السابقة: ' + s.decision : '') + '\nمن تطبيق المكتب الحكيم',
    loc: c.court || ''
  }]);
}
