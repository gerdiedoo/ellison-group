/* Lead capture modal, simulated Google chooser, property inquiry dialog, toast.
   Prototype only: no real authentication, email or booking happens anywhere. */
(function () {
  'use strict';
  const EG = window.EG, esc = EG.esc, ui = EG.ui;

  /* ---------- toast ---------- */
  let tT;
  ui.toast = function (msg) {
    let t = document.getElementById('egToast');
    if (!t) { t = document.createElement('div'); t.id = 'egToast'; t.className = 'eg-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(tT); tT = setTimeout(() => t.classList.remove('show'), 3200);
  };

  function dlg(id, cls) {
    let d = document.getElementById(id);
    if (!d) {
      d = document.createElement('dialog'); d.id = id; d.className = 'eg-dlg ' + (cls || '');
      d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
      document.body.appendChild(d);
    }
    return d;
  }
  const field = (id, label, o = {}) => `<div class="eg-field" data-f="${id}"><label for="${id}">${label}${o.req ? ' <em aria-hidden="true">*</em>' : ''}</label><input id="${id}" type="${o.type || 'text'}" value="${esc(o.val || '')}" placeholder="${esc(o.ph || '')}" autocomplete="${o.ac || 'off'}" ${o.ro ? 'readonly' : ''} ${o.req ? 'aria-required="true"' : ''}><div class="msg" aria-live="polite"></div></div>`;
  function setErr(d, id, m) { const f = d.querySelector(`[data-f="${id}"]`); if (!f) return; f.classList.toggle('bad', !!m); f.querySelector('.msg').textContent = m || ''; }
  const V = {
    name: (v) => (v.trim().length < 2 ? 'Please enter your full name.' : ''),
    email: (v) => (!v.trim() ? 'Please enter your email address.' : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'That email address looks incomplete.'),
    phone: (v) => (!v.trim() ? 'Please enter a phone number.' : v.replace(/\D/g, '').length < 10 ? 'Please include the full 10-digit number.' : '')
  };
  const INTENT = { showing: 'Showing request', ask: 'Property question', save: 'Saved property', contact: 'Contact agent', assistant: 'Property question', agent: 'Contact agent', valuation: 'Valuation request' };
  ui.INTENT = INTENT;
  const propCtx = (p) => p ? `<div class="eg-ctx"><span aria-hidden="true">⌂</span><div><b>${esc(p.addr)}</b><br><span style="color:var(--e-muted)">${esc(p.loc)} · ${EG.money(p.p)}</span></div></div>` : '';
  const GOOGLE = [
    { name: 'Avery Collins', email: 'avery.collins@example.com', phone: '(501) 555-0110', color: '#3d5a47' },
    { name: 'Jordan Whitfield', email: 'jordan.whitfield@example.com', phone: '', color: '#a04a2f' },
    { name: 'Sam Okafor', email: 'sam.okafor@example.com', phone: '', color: '#2c3d34' }
  ];
  const CM = ['No preference', 'Email', 'Phone call', 'Text message'];
  const cmSelect = (val) => `<div class="eg-field"><label for="egcCM">Preferred contact method <span style="text-transform:none;letter-spacing:0">(optional)</span></label><select id="egcCM">${CM.map((c) => `<option ${c === val ? 'selected' : ''}>${c}</option>`).join('')}</select></div>`;
  const CONSENT = 'I agree that The Ellison Group may contact me about this request. In this prototype, my details are stored only in this browser.';

  /* ---------- lead capture ---------- */
  /* o: { action, propertyId, channel, conversationId, preview, start:'google'|'form', intent, onSuccess(lead), onCancel() } */
  ui.openCapture = function (o) {
    o = o || {};
    const set = EG.settings().capture, req = set.required, p = EG.prop(o.propertyId);
    const d = dlg('egCap');
    let view = o.start === 'google' && set.google ? 'pick' : 'form';
    let profile = null, lead = null, finished = false, method = 'form';
    const prefill = EG.sessionLead() || {};
    d.onclose = () => { if (lead && !finished) { finished = true; o.onSuccess && o.onSuccess(lead); } else if (!lead && o.onCancel) o.onCancel(); };

    const head = (extra) => `<button class="eg-x" data-x aria-label="Close">×</button><span class="eg-eyebrow">${o.preview ? 'Preview · nothing is saved' : 'The Ellison Group'}</span>${extra || ''}`;
    const protoChip = '<div class="eg-proto"><b>PROTOTYPE</b> Sign-in and contact capture are simulated; data stays in this browser.</div>';

    function render() {
      let h = '';
      if (view === 'form') {
        h = `${head(`<h3 id="egcT">${esc(set.headline)}</h3><p class="sub">${esc(set.description)}</p>`)}${protoChip}${propCtx(p)}
          ${set.google ? `<button class="eg-btn eg-g block" data-google type="button"><i aria-hidden="true">G</i> Continue with Google (simulated)</button><div class="eg-or">or continue with contact details</div>` : ''}
          <form id="egcF" novalidate>
            ${field('egcN', 'Full name', { req: req.name, val: prefill.name, ac: 'name' })}
            ${field('egcE', 'Email address', { req: true, type: 'email', val: prefill.email, ac: 'email' })}
            ${field('egcP', 'Phone number', { req: req.phone, type: 'tel', val: prefill.phone, ac: 'tel', ph: '(501) 555-0100' })}
            ${cmSelect(prefill.contactMethod)}
            <label class="eg-check" data-f="egcC"><input type="checkbox" id="egcC"><span>${CONSENT}</span></label>
            <div class="eg-actions"><button type="button" class="eg-link" data-x>Cancel</button><button class="eg-btn solid" type="submit">Continue</button></div>
          </form>
          <p class="eg-why">Why we ask: so a member of our team can reply about this request. You can close this window and keep browsing without sharing anything.</p>`;
      } else if (view === 'pick') {
        h = `${head('<h3>Choose an account</h3><p class="sub">to continue to The Ellison Group</p>')}
          <div class="eg-proto"><b>SIMULATED</b> This is not a real Google sign-in. No Google account or password is used.</div>
          ${GOOGLE.map((a, i) => `<button class="eg-acc" data-acc="${i}" type="button"><span class="eg-av" style="background:${a.color}">${a.name[0]}</span><span><b>${a.name}</b><span>${a.email}</span></span></button>`).join('')}
          <div class="eg-actions" style="margin-top:8px"><button class="eg-link" data-back type="button">← Back</button></div>`;
      } else if (view === 'confirm') {
        const known = EG.findLeadByEmail(profile.email);
        const phone = profile.phone || (known && known.phone) || '';
        h = `${head('<h3>Confirm your details</h3><p class="sub">Signed in as a sample profile (simulated). Add anything missing.</p>')}
          <div class="eg-ctx"><span class="eg-av" style="background:${profile.color};width:34px;height:34px">${profile.name[0]}</span><div><b>${profile.name}</b><br><span style="color:var(--e-muted)">${profile.email}</span></div></div>
          ${known ? '<p class="eg-why" style="margin:-6px 0 14px">We found an existing record for this email in the demo data and will update it instead of creating a duplicate.</p>' : ''}
          <form id="egcF" novalidate>
            ${field('egcP', 'Phone number', { req: req.phone, type: 'tel', val: phone, ac: 'tel', ph: '(501) 555-0100' })}
            ${cmSelect(prefill.contactMethod)}
            <label class="eg-check" data-f="egcC"><input type="checkbox" id="egcC"><span>${CONSENT}</span></label>
            <div class="eg-actions"><button class="eg-link" data-back type="button">← Choose another account</button><button class="eg-btn solid" type="submit">Confirm and continue</button></div>
          </form>`;
      } else {
        const first = lead.name.split(' ')[0];
        const lbl = { showing: 'Continue to showing request', ask: 'Continue to your question', contact: 'Continue to contact the agent', save: 'Save this property' }[o.action] || 'Continue';
        h = `${head()}<div class="eg-done"><div class="eg-tick" aria-hidden="true">✓</div><h3>Thank you, ${esc(first)}.</h3>
          <p class="sub">${o.preview ? 'Preview only: no lead was created.' : `You’re signed in for this demo session${method === 'google' ? ' (simulated Google profile)' : ''}. Your details are saved in this browser only.`}</p>
          ${o.preview ? '' : `<p class="eg-signed">${esc(lead.email)}</p>`}
          <button class="eg-btn solid" data-finish type="button">${o.channel === 'chatbot' ? 'Back to the conversation' : lbl}</button></div>`;
      }
      d.innerHTML = `<div class="eg-in" role="document">${h}</div>`;
      d.setAttribute('aria-label', set.headline);
      const first = d.querySelector('input:not([readonly]), button.eg-acc, [data-finish]');
      if (first && view !== 'form') first.focus({ preventScroll: true });
      wire();
    }

    function create(m, vals) {
      method = m;
      if (o.preview) { lead = { name: vals.name, email: vals.email }; view = 'done'; render(); return; }
      const intent = o.intent || INTENT[o.action] || '';
      const r = EG.captureLead({ name: vals.name, email: vals.email, phone: vals.phone, method: m, channel: o.channel, propertyId: o.propertyId, intent, contactMethod: vals.cm === 'No preference' ? '' : vals.cm, conversationId: o.conversationId });
      lead = r.lead; EG.setSession(lead.id, m); view = 'done'; render();
    }

    function wire() {
      d.querySelectorAll('[data-x]').forEach((b) => (b.onclick = () => d.close()));
      const g = d.querySelector('[data-google]'); if (g) g.onclick = () => { view = 'pick'; render(); };
      d.querySelectorAll('[data-back]').forEach((b) => (b.onclick = () => { view = view === 'confirm' ? 'pick' : 'form'; render(); }));
      d.querySelectorAll('[data-acc]').forEach((b) => (b.onclick = () => { profile = GOOGLE[+b.dataset.acc]; view = 'confirm'; render(); }));
      const fin = d.querySelector('[data-finish]'); if (fin) fin.onclick = () => d.close();
      const f = d.querySelector('#egcF');
      if (f) f.onsubmit = (e) => {
        e.preventDefault();
        const val = (id) => (d.querySelector('#' + id) ? d.querySelector('#' + id).value : '');
        let bad = false;
        const chk = (id, fn, needed) => { const m = needed ? fn(val(id)) : (val(id).trim() ? fn(val(id)) : ''); setErr(d, id, m); if (m) bad = true; };
        if (view === 'form') { chk('egcN', V.name, req.name); chk('egcE', V.email, true); }
        chk('egcP', V.phone, req.phone);
        const c = d.querySelector('#egcC'); const cf = d.querySelector('[data-f="egcC"]');
        cf.classList.toggle('bad', !c.checked); if (!c.checked) bad = true;
        if (bad) { const first = d.querySelector('.eg-field.bad input'); if (first) first.focus(); else c.focus(); return; }
        if (view === 'form') create('form', { name: val('egcN').trim(), email: val('egcE').trim(), phone: val('egcP').trim(), cm: val('egcCM') });
        else create('google', { name: profile.name, email: profile.email, phone: val('egcP').trim(), cm: val('egcCM') });
      };
    }
    render();
    if (!d.open) d.showModal();
  };

  /* Gate a property action. Calls cb(lead|null) once the visitor is identified, or immediately if capture is off for this action. */
  ui.ensureLead = function (action, propertyId, cb, extra) {
    const sl = EG.sessionLead(); if (sl) return cb(sl);
    const c = EG.settings().capture;
    if (!c.enabled || !c.triggers[action]) return cb(null);
    ui.openCapture(Object.assign({ action, propertyId, onSuccess: cb }, extra || {}));
  };

  /* ---------- property inquiry ---------- */
  /* o: { type:'Showing request'|'Property question'|'Contact agent', propertyId, lead } */
  ui.openInquiry = function (o) {
    const p = EG.prop(o.propertyId), lead = o.lead || EG.sessionLead(), type = o.type;
    const d = dlg('egInq', 'wide');
    const isShow = type === 'Showing request';
    const title = { 'Showing request': 'Request a showing', 'Property question': 'Ask about this property', 'Contact agent': 'Contact the agent' }[type] || 'Send an inquiry';
    const today = new Date().toISOString().slice(0, 10);
    const slots = ['Morning (9–12)', 'Afternoon (12–5)', 'Evening (5–8)', 'Flexible'];
    d.innerHTML = `<div class="eg-in"><button class="eg-x" data-x aria-label="Close">×</button>
      <span class="eg-eyebrow">Property inquiry</span><h3>${title}</h3>
      <div class="eg-proto"><b>PROTOTYPE</b> Nothing is emailed or booked. The request is stored in this browser and appears in /admin.</div>
      <div id="egiBody"><form id="egiF" novalidate>
        ${propCtx(p)}
        ${field('egiN', 'Full name', { req: true, val: lead ? lead.name : '', ac: 'name' })}
        <div class="eg-two">${field('egiE', 'Email', { req: true, type: 'email', val: lead ? lead.email : '', ac: 'email', ro: !!lead })}${field('egiP', 'Phone', { req: EG.settings().capture.required.phone, type: 'tel', val: lead ? lead.phone : '', ac: 'tel' })}</div>
        ${isShow ? `<div class="eg-two"><div class="eg-field" data-f="egiD"><label for="egiD">Preferred date</label><input id="egiD" type="date" min="${today}"><div class="msg" aria-live="polite"></div></div>
          <div class="eg-field"><label for="egiT">Preferred time</label><select id="egiT">${slots.map((s) => `<option>${s}</option>`).join('')}</select></div></div>` : ''}
        <div class="eg-field" data-f="egiM"><label for="egiM">Message to the agent${isShow ? ' <span style="text-transform:none;letter-spacing:0">(optional)</span>' : ' <em>*</em>'}</label><textarea id="egiM" rows="3" placeholder="${isShow ? 'Anything we should know before the showing?' : 'What would you like to know?'}"></textarea><div class="msg" aria-live="polite"></div></div>
        <div class="eg-actions"><button type="button" class="eg-link" data-x>Cancel</button><button class="eg-btn solid" type="submit">${isShow ? 'Send showing request' : 'Send message'}</button></div>
      </form></div></div>`;
    d.querySelectorAll('[data-x]').forEach((b) => (b.onclick = () => d.close()));
    d.querySelector('#egiF').onsubmit = (e) => {
      e.preventDefault();
      const v = (id) => d.querySelector('#' + id).value.trim();
      let bad = false;
      const chk = (id, m) => { setErr(d, id, m); if (m) bad = true; };
      chk('egiN', V.name(v('egiN'))); chk('egiE', V.email(v('egiE')));
      chk('egiP', EG.settings().capture.required.phone || v('egiP') ? V.phone(v('egiP')) : '');
      if (!isShow) chk('egiM', v('egiM').length < 5 ? 'Please add a short message.' : '');
      if (bad) { const f = d.querySelector('.eg-field.bad input, .eg-field.bad textarea'); if (f) f.focus(); return; }
      let L = lead;
      if (L) EG.updateLead(L.id, { name: v('egiN'), phone: v('egiP') });
      else { const r = EG.captureLead({ name: v('egiN'), email: v('egiE'), phone: v('egiP'), method: 'form', propertyId: o.propertyId, intent: type }); L = r.lead; EG.setSession(L.id, 'form'); }
      const when = isShow && v('egiD') ? `${v('egiD')} · ${d.querySelector('#egiT').value}` : '';
      const inq = EG.addInquiry({ leadId: L.id, propertyId: o.propertyId, type, message: v('egiM') || (isShow ? 'Showing request (no message).' : ''), preferredShowingDate: when });
      d.querySelector('#egiBody').innerHTML = `<div class="eg-done"><div class="eg-tick" aria-hidden="true">✓</div><h3>Request logged.</h3>
        <p class="sub">${esc(L.name.split(' ')[0])}, your ${type.toLowerCase()}${p ? ' for <b>' + esc(p.addr) + '</b>' : ''} has been recorded in this prototype${when ? ' with a preferred time of ' + esc(when) : ''}.</p>
        <p class="eg-why" style="margin:0 0 18px">Prototype notice: no email was sent, no calendar booking was created, and no agent has been notified.</p>
        <button class="eg-btn solid" data-x type="button">Done</button></div>`;
      d.querySelector('#egiBody [data-x]').onclick = () => d.close();
      ui.toast('Inquiry recorded (prototype). Check it in /admin.');
      if (o.onDone) o.onDone(inq, L);
    };
    if (!d.open) d.showModal();
  };
})();
