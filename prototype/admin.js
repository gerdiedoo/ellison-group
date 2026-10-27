/* Admin dashboard core: shell, router, helpers, Overview, Leads and Lead detail.
   Mock data only (see store.js). Remaining pages live in admin-pages.js. */
(function () {
  'use strict';
  const EG = window.EG, esc = EG.esc, money = EG.money, DAY = 864e5;
  const A = (window.A = { pages: {}, state: { range: '30', lf: { q: '', status: '', source: '', agent: '', range: 'all' }, sort: { k: 'created', d: -1 }, cf: { q: '', status: '', agent: '' }, af: { q: '', type: '' }, pf: { q: '', status: '', area: '' } } });
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  A.$ = $; A.$$ = $$; A.esc = esc;

  /* ---------- icons ---------- */
  const P = {
    overview: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    leads: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.9.7 3.2 2.4 3.5 5.2"/>',
    properties: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    conversations: '<path d="M4 5h16v11H9l-5 4z"/>',
    assistant: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M18.5 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
    capture: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };
  const ic = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;
  A.ic = ic;

  /* ---------- helpers ---------- */
  const initials = (n) => String(n || '?').split(/\s+/).map((x) => x[0]).slice(0, 2).join('').toUpperCase();
  const SC = { google: '#3d5a47', form: '#a04a2f', chatbot: '#c7a76a' };
  A.sb = (s) => `<span class="badge s-${s.split(' ')[0]}">${esc(s)}</span>`;
  A.cb = (s) => `<span class="badge c-${s.split(' ')[0]}">${esc(s)}</span>`;
  A.src = (s) => `<span class="src" style="--c:${SC[s]}">${EG.SOURCE_SHORT[s]}</span>`;
  A.score = (n) => `<span class="score"><i><b style="width:${n}%"></b></i>${n}</span>`;
  A.pl = (id) => { const p = EG.prop(id); return p ? `<a class="chip" href="#/properties/${p.id}">${esc(p.addr)}</a>` : ''; };
  A.ll = (id) => { const l = EG.getLead(id); return l ? `<a href="#/leads/${l.id}" style="text-decoration:underline;text-underline-offset:3px">${esc(l.name)}</a>` : '<span style="color:var(--muted)">Anonymous visitor</span>'; };
  A.admin = () => EG.agentName(EG.settings().admin.agent);
  A.opts = (arr, sel, blank) => (blank != null ? `<option value="">${esc(blank)}</option>` : '') + arr.map((o) => { const v = o.v != null ? o.v : o, l = o.l != null ? o.l : o; return `<option value="${esc(v)}" ${String(v) === String(sel) ? 'selected' : ''}>${esc(l)}</option>`; }).join('');
  A.agentOpts = (sel, blank) => A.opts(EG.AGENTS.map((a) => ({ v: a.id, l: a.name })), sel, blank);
  A.toggle = (id, label, sub, on, dis) => `<label class="tog"><input type="checkbox" id="${id}" ${on ? 'checked' : ''} ${dis ? 'disabled' : ''}><span class="sw"></span><span class="t">${label}${sub ? `<small>${sub}</small>` : ''}</span></label>`;
  A.empty = (t, s) => `<div class="empty"><b>${esc(t)}</b>${esc(s || '')}</div>`;
  A.act = (fn) => { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); fn(); };
  const dueLabel = (t) => { const d = new Date(t), n = new Date(); d.setHours(0, 0, 0, 0); n.setHours(0, 0, 0, 0); const k = Math.round((d - n) / DAY); return k < 0 ? `<span class="over">Overdue · ${EG.fmtDate(t)}</span>` : k === 0 ? 'Due today' : k === 1 ? 'Due tomorrow' : 'Due ' + EG.fmtDate(t); };
  A.dueLabel = dueLabel;

  A.confirm = (title, msg, ok) => new Promise((res) => {
    const d = document.createElement('dialog'); d.className = 'cfm';
    d.innerHTML = `<h3>${esc(title)}</h3><p>${esc(msg)}</p><div class="a"><button class="btn ghost" data-n>Cancel</button><button class="btn danger" data-y>${esc(ok || 'Confirm')}</button></div>`;
    document.body.appendChild(d); d.showModal();
    const done = (v) => { d.close(); d.remove(); res(v); };
    d.querySelector('[data-n]').onclick = () => done(false); d.querySelector('[data-y]').onclick = () => done(true);
    d.addEventListener('cancel', (e) => { e.preventDefault(); done(false); });
  });
  A.download = (name, text, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 500); };

  /* drawer */
  let drawerFn = null;
  A.drawer = {
    open(fn) { drawerFn = fn; this.paint(); $('#drawer').classList.add('on'); $('#scrim').classList.add('on'); $('#drawer').setAttribute('aria-hidden', 'false'); },
    paint() { if (!drawerFn) return; const d = $('#drawer'); d.innerHTML = drawerFn(); $$('[data-dclose]', d).forEach((b) => (b.onclick = () => A.drawer.close(true))); if (drawerFn.bind) drawerFn.bind(d); },
    close(nav) { drawerFn = null; $('#drawer').classList.remove('on'); $('#scrim').classList.remove('on'); $('#drawer').setAttribute('aria-hidden', 'true'); if (nav && /^#\/properties\//.test(location.hash)) history.replaceState(null, '', '#/properties'); }
  };

  /* ---------- date / stats ---------- */
  const inR = (t, r, off) => r === 'all' || (t >= Date.now() - (+r) * DAY * (off ? 2 : 1) && (!off || t < Date.now() - (+r) * DAY));
  function metrics(r, off) {
    const s = EG.get(), L = s.leads.filter((l) => inR(l.createdAt, r, off));
    return {
      total: L.length, new: L.filter((l) => l.status === 'New').length, qualified: L.filter((l) => ['Qualified', 'Appointment Scheduled'].includes(l.status)).length,
      contacted: L.filter((l) => l.status !== 'New').length, inquiries: s.inquiries.filter((i) => inR(i.createdAt, r, off)).length,
      google: L.filter((l) => l.source === 'google').length, form: L.filter((l) => l.source === 'form').length, chatbot: L.filter((l) => l.source === 'chatbot').length
    };
  }
  A.metrics = metrics;
  function chartSVG(r) {
    const s = EG.get(), now = Date.now();
    const cfg = r === '7' ? [7, DAY] : r === '30' ? [30, DAY] : r === '90' ? [13, 7 * DAY] : [9, 7 * DAY];
    const [n, step] = cfg, B = [];
    for (let i = 0; i < n; i++) { const a = now - (n - i) * step, b = a + step; B.push({ a, b, google: 0, form: 0, chatbot: 0 }); }
    s.leads.forEach((l) => { const bk = B.find((x) => l.createdAt >= x.a && l.createdAt < x.b); if (bk) bk[l.source]++; });
    const tot = (x) => x.google + x.form + x.chatbot, mx = Math.max(4, ...B.map(tot)), top = Math.ceil(mx / 4) * 4;
    const W = 760, H = 250, pl = 34, pr = 8, pt = 10, pb = 26, cw = (W - pl - pr) / n, bw = Math.max(4, cw * 0.66), ch = H - pt - pb;
    let g = '';
    for (let i = 0; i <= 4; i++) { const y = pt + ch - (ch * i) / 4; g += `<line x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}" stroke="rgba(20,34,27,.1)"/><text x="${pl - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6a746d">${(top * i) / 4}</text>`; }
    const every = Math.ceil(n / 7);
    B.forEach((x, i) => {
      const cx = pl + i * cw + (cw - bw) / 2; let y = pt + ch; const t = tot(x);
      const label = `${EG.fmtDate(x.a).replace(/, \d{4}/, '')}${step > DAY ? ' to ' + EG.fmtDate(x.b - 1).replace(/, \d{4}/, '') : ''}: ${t} lead${t === 1 ? '' : 's'} (${x.google} Google, ${x.form} form, ${x.chatbot} chatbot)`;
      g += `<g><title>${label}</title>`;
      ['google', 'form', 'chatbot'].forEach((k) => { if (!x[k]) return; const h = (x[k] / top) * ch; y -= h; g += `<rect x="${cx}" y="${y}" width="${bw}" height="${h - 1}" rx="2" fill="${SC[k]}"/>`; });
      g += `<rect x="${pl + i * cw}" y="${pt}" width="${cw}" height="${ch}" fill="transparent"/></g>`;
      if (i % every === 0) g += `<text x="${cx + bw / 2}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#6a746d">${EG.fmtDate(x.a).replace(/, \d{4}/, '')}</text>`;
    });
    const total = B.reduce((a, x) => a + tot(x), 0);
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Leads over time, stacked by source. ${total} leads in the chart window.">${g}</svg>`;
  }

  /* ---------- Overview ---------- */
  A.pages.overview = {
    title: 'Overview',
    html() {
      const r = A.state.range, m = metrics(r), pm = r === 'all' ? null : metrics(r, true), s = EG.get();
      const rl = r === 'all' ? 'all time' : 'last ' + r + ' days';
      const kp = (label, key, note) => {
        let d = '<span> </span>';
        if (pm) { const a = m[key], b = pm[key]; d = b === 0 ? (a ? `<b class="up">+${a}</b> vs prior period` : 'No change vs prior') : `<b class="${a >= b ? 'up' : 'dn'}">${a >= b ? '▲' : '▼'} ${Math.abs(Math.round(((a - b) / b) * 100))}%</b> vs prior ${r}d`; }
        return `<div class="card kpi"><div class="l">${label}</div><div class="v">${m[key]}</div><div class="d">${note ? esc(note) + ' · ' : ''}${d}</div></div>`;
      };
      const L = s.leads.filter((l) => inR(l.createdAt, r)).sort((a, b) => b.createdAt - a.createdAt);
      const I = s.inquiries.filter((i) => inR(i.createdAt, r)).sort((a, b) => b.createdAt - a.createdAt);
      const C = s.conversations.filter((c) => inR(c.createdAt, r) || c.lastActivityAt >= Date.now() - (r === 'all' ? 1e12 : +r * DAY)).sort((a, b) => b.lastActivityAt - a.lastActivityAt);
      const act = s.activities.filter((a) => inR(a.timestamp, r)).slice(0, 8);
      const tasks = s.leads.flatMap((l) => l.tasks.filter((t) => !t.done).map((t) => Object.assign({ lead: l }, t))).sort((a, b) => a.due - b.due).slice(0, 6);
      const tot = m.total || 1;
      const srcBars = ['google', 'form', 'chatbot'].map((k) => `<div class="bar"><span class="src" style="--c:${SC[k]}">${EG.SOURCE_SHORT[k]}</span><span class="tr"><b style="width:${(m[k] / tot) * 100}%;background:${SC[k]}"></b></span><span style="text-align:right">${m[k]} · ${Math.round((m[k] / tot) * 100) || 0}%</span></div>`).join('');
      return `<div class="ph"><div><h1>Overview</h1><p>Lead capture and AI assistant activity, ${rl}.</p></div>
        <label class="f" style="margin:0"><span class="sr" style="position:absolute;left:-999px">Date range</span><select id="range" aria-label="Date range">${A.opts([{ v: '7', l: 'Last 7 days' }, { v: '30', l: 'Last 30 days' }, { v: '90', l: 'Last 90 days' }, { v: 'all', l: 'All time' }], r)}</select></label></div>
        <div class="proto-note"><b>Demo data.</b> Every number here is generated from mock records in this browser. It does not represent real business performance.</div>
        <div class="grid g4">${kp('Total leads', 'total')}${kp('New leads', 'new', 'Not yet contacted')}${kp('Qualified leads', 'qualified', 'Qualified or scheduled')}${kp('Leads contacted', 'contacted')}
        ${kp('Property inquiries', 'inquiries')}${kp('Google sign-in conversions', 'google', 'Simulated')}${kp('Form submissions', 'form')}${kp('Chatbot-generated leads', 'chatbot', 'Simulated AI')}</div>
        <div class="grid g2"><div class="card"><div class="card-h"><h2>Leads over time</h2><div class="legend"><span><i style="background:${SC.google}"></i>Google</span><span><i style="background:${SC.form}"></i>Form</span><span><i style="background:${SC.chatbot}"></i>Chatbot</span></div></div>${chartSVG(r)}</div>
          <div class="card"><div class="card-h"><h2>Lead sources</h2></div><p class="sub">${m.total} lead${m.total === 1 ? '' : 's'}, ${rl}</p>${srcBars}</div></div>
        <div class="grid g2"><div class="card"><div class="card-h"><h2>Recent leads</h2><a href="#/leads">View all</a></div>
          ${L.length ? `<div class="mini tw"><table><thead><tr><th>Lead</th><th>Source</th><th>Property</th><th>Status</th><th>Created</th></tr></thead><tbody>${L.slice(0, 6).map((l) => `<tr class="row" data-go="#/leads/${l.id}"><td><div class="nm">${esc(l.name)}</div></td><td>${A.src(l.source)}</td><td>${l.interestedPropertyIds[0] ? esc(EG.prop(l.interestedPropertyIds[0]).addr) : '<span class="em">None yet</span>'}</td><td>${A.sb(l.status)}</td><td>${EG.rel(l.createdAt)}</td></tr>`).join('')}</tbody></table></div>` : A.empty('No leads in this period', 'Try a wider date range.')}</div>
          <div class="card"><div class="card-h"><h2>Follow-up reminders</h2></div>${tasks.length ? tasks.map((t) => `<div class="li"><input type="checkbox" class="chk" data-task="${t.lead.id}|${t.id}" aria-label="Mark done: ${esc(t.text)}"><div class="b"><div class="t">${esc(t.text)}</div><div class="m"><a href="#/leads/${t.lead.id}" style="text-decoration:underline">${esc(t.lead.name)}</a> · ${dueLabel(t.due)}</div></div></div>`).join('') : A.empty('All caught up', 'No open reminders.')}</div></div>
        <div class="grid g3">
          <div class="card"><div class="card-h"><h2>Property inquiries</h2><a href="#/properties">Properties</a></div>${I.length ? I.slice(0, 5).map((i) => `<div class="li"><div class="b"><div class="t">${esc(i.inquiryType)}</div><div class="m">${A.ll(i.leadId)} · ${i.propertyId ? esc(EG.prop(i.propertyId).addr) : 'No property'}</div></div><span class="m">${EG.rel(i.createdAt)}</span></div>`).join('') : A.empty('No inquiries')}</div>
          <div class="card"><div class="card-h"><h2>Chatbot conversations</h2><a href="#/conversations">Open inbox</a></div>${C.length ? C.slice(0, 5).map((c) => { const lm = c.messages.filter((m) => m.messageType !== 'properties').slice(-1)[0]; return `<a class="li" href="#/conversations/${c.id}">${c.unread ? '<span class="dot" title="Unread"></span>' : ''}<div class="b"><div class="t">${c.leadId ? esc(EG.getLead(c.leadId).name) : 'Anonymous visitor'} ${A.cb(c.status)}</div><div class="pv">${esc(lm ? lm.content : '')}</div></div><span class="m">${EG.rel(c.lastActivityAt)}</span></a>`; }).join('') : A.empty('No conversations')}</div>
          <div class="card"><div class="card-h"><h2>Latest activity</h2><a href="#/activity">Full log</a></div>${act.length ? act.map((a) => `<div class="li"><div class="b"><div class="t" style="font-weight:400">${esc(a.description)}</div><div class="m">${a.leadId && EG.getLead(a.leadId) ? esc(EG.getLead(a.leadId).name) + ' · ' : ''}${EG.rel(a.timestamp)}</div></div></div>`).join('') : A.empty('No activity')}</div></div>`;
    },
    bind(root) {
      $('#range', root).onchange = (e) => { A.state.range = e.target.value; A.render(); };
      $$('[data-task]', root).forEach((c) => (c.onchange = () => { const [l, t] = c.dataset.task.split('|'); EG.toggleTask(l, t); EG.ui.toast('Follow-up marked done.'); }));
    }
  };

  /* ---------- Leads ---------- */
  const COLS = [
    { k: 'name', l: 'Lead', get: (l) => l.name.toLowerCase() }, { k: 'email', l: 'Email', get: (l) => l.email }, { k: 'phone', l: 'Phone', get: (l) => l.phone },
    { k: 'source', l: 'Source', get: (l) => l.source }, { k: 'prop', l: 'Interested property', get: (l) => (EG.prop(l.interestedPropertyIds[0]) || { addr: '' }).addr },
    { k: 'type', l: 'Inquiry type', get: (l) => l.intent || '' }, { k: 'status', l: 'Status', get: (l) => EG.STATUSES.indexOf(l.status) },
    { k: 'score', l: 'Score', get: (l) => l.score }, { k: 'agent', l: 'Assigned agent', get: (l) => EG.agentName(l.assignedAgent) },
    { k: 'last', l: 'Last activity', get: (l) => l.lastActivityAt }, { k: 'created', l: 'Created', get: (l) => l.createdAt }
  ];
  function filteredLeads() {
    const f = A.state.lf, q = f.q.trim().toLowerCase(), now = Date.now();
    let L = EG.get().leads.filter((l) => {
      if (f.status && l.status !== f.status) return false;
      if (f.source && l.source !== f.source) return false;
      if (f.agent === '_none' ? l.assignedAgent : f.agent && l.assignedAgent !== f.agent) return false;
      if (f.range !== 'all' && l.createdAt < now - +f.range * DAY) return false;
      if (q) { const hay = (l.name + ' ' + l.email + ' ' + l.interestedPropertyIds.map((i) => EG.prop(i).addr + ' ' + EG.prop(i).loc).join(' ')).toLowerCase(); if (!hay.includes(q)) return false; }
      return true;
    });
    const c = COLS.find((x) => x.k === A.state.sort.k), d = A.state.sort.d;
    L.sort((a, b) => { const x = c.get(a), y = c.get(b); return (x > y ? 1 : x < y ? -1 : 0) * d; });
    return L;
  }
  function leadRows() {
    const L = filteredLeads();
    if (!L.length) return `<tr><td colspan="12">${A.empty('No leads match these filters', 'Clear a filter or search for something else.')}</td></tr>`;
    return L.map((l) => {
      const ps = l.interestedPropertyIds;
      return `<tr class="row" data-go="#/leads/${l.id}" tabindex="0">
        <td class="first" data-l="Lead"><div class="nm">${esc(l.name)}</div></td><td data-l="Email">${esc(l.email)}</td><td data-l="Phone">${esc(l.phone)}</td><td data-l="Source">${A.src(l.source)}</td>
        <td data-l="Property">${ps.length ? esc(EG.prop(ps[0]).addr) + (ps.length > 1 ? ` <span class="em">+${ps.length - 1}</span>` : '') : '<span class="em">None yet</span>'}</td>
        <td data-l="Inquiry">${esc(l.intent || '—')}</td><td data-l="Status">${A.sb(l.status)}</td><td data-l="Score">${A.score(l.score)}</td>
        <td data-l="Agent">${esc(EG.agentName(l.assignedAgent))}</td><td data-l="Last activity">${EG.rel(l.lastActivityAt)}</td><td data-l="Created">${EG.fmtDate(l.createdAt)}</td>
        <td data-l="Actions"><span class="pill-row"><a class="btn sm ghost" href="#/leads/${l.id}">View</a><button class="btn sm danger" data-del="${l.id}" aria-label="Delete ${esc(l.name)}">Delete</button></span></td></tr>`;
    }).join('');
  }
  function leadHead() {
    const s = A.state.sort;
    return COLS.map((c) => `<th scope="col" aria-sort="${s.k === c.k ? (s.d > 0 ? 'ascending' : 'descending') : 'none'}"><button data-sort="${c.k}">${c.l}</button></th>`).join('') + '<th scope="col">Actions</th>';
  }
  function csvOf(L) {
    const q = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const head = ['Name', 'Email', 'Phone', 'Source', 'Interested properties', 'Inquiry type', 'Status', 'Score', 'Assigned agent', 'Last activity', 'Created'];
    return [head.map(q).join(',')].concat(L.map((l) => [l.name, l.email, l.phone, EG.SOURCE_SHORT[l.source], l.interestedPropertyIds.map((i) => EG.prop(i).addr).join('; '), l.intent, l.status, l.score, EG.agentName(l.assignedAgent), new Date(l.lastActivityAt).toISOString(), new Date(l.createdAt).toISOString()].map(q).join(','))).join('\r\n');
  }
  A.pages.leads = {
    title: 'Leads',
    html() {
      const f = A.state.lf;
      return `<div class="ph"><div><h1>Leads</h1><p>Everyone who has shared contact details, from properties, forms and the chatbot.</p></div><button class="btn" id="exp">${ic('download')} Export CSV</button></div>
        <div class="toolbar" role="search"><input type="search" id="lq" placeholder="Search name, email or property" value="${esc(f.q)}" aria-label="Search leads">
          <select id="lst" aria-label="Status">${A.opts(EG.STATUSES, f.status, 'All statuses')}</select>
          <select id="lso" aria-label="Source">${A.opts(Object.keys(EG.SOURCE_SHORT).map((k) => ({ v: k, l: EG.SOURCE_SHORT[k] })), f.source, 'All sources')}</select>
          <select id="lag" aria-label="Agent">${A.opts([{ v: '_none', l: 'Unassigned' }].concat(EG.AGENTS.map((a) => ({ v: a.id, l: a.name }))), f.agent, 'All agents')}</select>
          <select id="lrg" aria-label="Date created">${A.opts([{ v: 'all', l: 'Any date' }, { v: '7', l: 'Last 7 days' }, { v: '30', l: 'Last 30 days' }, { v: '90', l: 'Last 90 days' }], f.range)}</select>
          <button class="btn ghost sm" id="lclr">Clear</button><span class="cnt" id="lcnt" aria-live="polite"></span></div>
        <div class="tw rc"><table><thead><tr id="lhead">${leadHead()}</tr></thead><tbody id="lbody">${leadRows()}</tbody></table></div>`;
    },
    bind(root) {
      const upd = () => { $('#lbody', root).innerHTML = leadRows(); $('#lhead', root).innerHTML = leadHead(); $('#lcnt', root).textContent = `${filteredLeads().length} of ${EG.get().leads.length} leads`; wire(); };
      const wire = () => {
        $$('[data-go]', root).forEach((r) => { r.onclick = (e) => { if (!e.target.closest('a,button')) location.hash = r.dataset.go; }; r.onkeydown = (e) => { if (e.key === 'Enter' && !e.target.closest('a,button')) location.hash = r.dataset.go; }; });
        $$('[data-del]', root).forEach((b) => (b.onclick = async () => { const l = EG.getLead(b.dataset.del); if (await A.confirm('Delete demo lead?', `${l.name} and their demo inquiries will be removed. You can restore everything with Reset demo data.`, 'Delete lead')) { EG.deleteLead(l.id); EG.ui.toast('Demo lead deleted.'); } }));
        $$('[data-sort]', root).forEach((b) => (b.onclick = () => { const s = A.state.sort; if (s.k === b.dataset.sort) s.d *= -1; else { s.k = b.dataset.sort; s.d = 1; } upd(); }));
      };
      const bindF = (id, key, ev) => { $(id, root)[ev || 'onchange'] = (e) => { A.state.lf[key] = e.target.value; upd(); }; };
      bindF('#lq', 'q', 'oninput'); bindF('#lst', 'status'); bindF('#lso', 'source'); bindF('#lag', 'agent'); bindF('#lrg', 'range');
      $('#lclr', root).onclick = () => { A.state.lf = { q: '', status: '', source: '', agent: '', range: 'all' }; A.render(); };
      $('#exp', root).onclick = () => { const L = filteredLeads(); A.download('ellison-demo-leads.csv', csvOf(L), 'text/csv'); EG.ui.toast(`Exported ${L.length} demo lead${L.length === 1 ? '' : 's'} to CSV.`); };
      $('#lcnt', root).textContent = `${filteredLeads().length} of ${EG.get().leads.length} leads`; wire();
    }
  };

  /* ---------- Lead detail ---------- */
  A.pages.lead = {
    title: 'Lead',
    html(id) {
      const l = EG.getLead(id);
      if (!l) return `<div class="crumb"><a href="#/leads">← Leads</a></div>${A.empty('Lead not found', 'It may have been deleted. Reset demo data to restore the samples.')}`;
      const s = EG.get(), I = s.inquiries.filter((i) => i.leadId === l.id).sort((a, b) => b.createdAt - a.createdAt);
      const C = s.conversations.filter((c) => c.leadId === l.id), T = s.activities.filter((a) => a.leadId === l.id).slice(0, 25);
      const tomorrow = new Date(Date.now() + DAY).toISOString().slice(0, 10);
      const tasks = l.tasks.slice().sort((a, b) => a.done - b.done || a.due - b.due);
      return `<div class="crumb"><a href="#/leads">← Leads</a></div>
        <div class="ph"><div style="display:flex;gap:14px;align-items:center"><span class="av" style="width:52px;height:52px;font-size:18px">${initials(l.name)}</span><div><h1>${esc(l.name)}</h1><p>${A.src(l.source)} · captured ${EG.fmtDT(l.createdAt)}</p></div></div>
          <button class="btn danger" id="ldel">${ic('trash')} Delete demo lead</button></div>
        <div class="dg"><div class="stack">
          <form class="card" id="cform" novalidate><h2>Contact information</h2><p class="sub">Edits apply everywhere in the prototype.</p>
            <label class="f">Full name<input id="fn" value="${esc(l.name)}" autocomplete="off"><span class="err" id="e-fn"></span></label>
            <label class="f">Email<input id="fe" type="email" value="${esc(l.email)}"><span class="err" id="e-fe"></span></label>
            <label class="f">Phone<input id="fp" type="tel" value="${esc(l.phone)}"><span class="err" id="e-fp"></span></label>
            <label class="f">Preferred contact<select id="fc">${A.opts(['', 'Email', 'Phone call', 'Text message'], l.contactMethod, '—')}</select></label>
            <label class="f">Lead score (0–100)<input id="fs" type="number" min="0" max="100" value="${l.score}"></label>
            <button class="btn solid" type="submit">Save changes</button></form>
          <div class="card"><h2>Pipeline</h2>
            <label class="f" style="margin-top:12px">Status<select id="st">${A.opts(EG.STATUSES, l.status)}</select></label>
            <label class="f">Assigned agent<select id="ag">${A.agentOpts(l.assignedAgent, 'Unassigned')}</select></label>
            <div class="m" style="color:var(--muted);font-size:13px">Source: ${EG.SOURCE_LABEL[l.source]}<br>Capture method: ${l.captureMethod === 'google' ? 'Google sign-in (simulated)' : 'Contact form'}<br>Consent: ${esc(l.consentStatus)}<br>Last activity ${EG.rel(l.lastActivityAt)}</div></div>
          <div class="card"><h2>Interested properties</h2><div class="chips" style="margin:10px 0">${l.interestedPropertyIds.length ? l.interestedPropertyIds.map((p) => A.pl(p) + ((l.savedPropertyIds || []).includes(p) ? '' : '')).join('') : '<span style="color:var(--muted)">None yet</span>'}</div>
            ${(l.savedPropertyIds || []).length ? `<div class="m" style="color:var(--muted);font-size:13px;margin-bottom:8px">Saved: ${l.savedPropertyIds.map((p) => esc(EG.prop(p).addr)).join(', ')}</div>` : ''}
            <div class="pill-row"><select id="ap" aria-label="Add property">${A.opts(EG.PROPS.filter((p) => !l.interestedPropertyIds.includes(p.id)).map((p) => ({ v: p.id, l: p.addr })), '', 'Add a property…')}</select><button class="btn sm" id="apb">Add</button></div></div>
        </div><div class="stack">
          <div class="card"><h2>Internal notes</h2><p class="sub">Visible to the team only.</p>
            <form id="nf" style="display:grid;gap:8px;margin-bottom:8px"><textarea id="nt" rows="2" placeholder="Add a note about this lead" aria-label="New note"></textarea><div><button class="btn solid sm" type="submit">Add note</button></div></form>
            ${l.notes.length ? l.notes.map((n) => `<div class="note"><div>${esc(n.text)}</div><div class="m">${esc(n.author)} · ${EG.fmtDT(n.ts)}</div></div>`).join('') : '<div class="m" style="color:var(--muted)">No notes yet.</div>'}</div>
          <div class="card"><h2>Follow-up reminders</h2>
            <form id="tf" class="pill-row" style="margin:12px 0"><input id="tt" placeholder="What needs to happen?" style="flex:1;min-width:180px" aria-label="Reminder"><input id="td" type="date" value="${tomorrow}" aria-label="Due date"><button class="btn solid sm" type="submit">Add reminder</button></form>
            ${tasks.length ? tasks.map((t) => `<div class="li"><input type="checkbox" class="chk" data-t="${t.id}" ${t.done ? 'checked' : ''} aria-label="Done: ${esc(t.text)}"><div class="b"><div class="t" style="${t.done ? 'text-decoration:line-through;color:var(--muted)' : ''}">${esc(t.text)}</div><div class="m">${t.done ? 'Completed' : dueLabel(t.due)}</div></div></div>`).join('') : '<div class="m" style="color:var(--muted)">No reminders.</div>'}</div>
          <div class="card"><h2>Property inquiry history</h2>${I.length ? `<div class="tw mini" style="margin-top:10px"><table><thead><tr><th>Type</th><th>Property</th><th>Preferred time</th><th>Status</th><th>Date</th></tr></thead><tbody>${I.map((i) => `<tr><td>${esc(i.inquiryType)}<div class="em">${esc(i.message).slice(0, 90)}</div></td><td>${i.propertyId ? A.pl(i.propertyId) : '—'}</td><td>${esc(i.preferredShowingDate || '—')}</td><td><select data-inq="${i.id}" aria-label="Inquiry status">${A.opts(['New', 'Responded', 'Scheduled', 'Closed'], i.status)}</select></td><td>${EG.fmtDate(i.createdAt)}</td></tr>`).join('')}</tbody></table></div>` : A.empty('No inquiries yet')}</div>
          <div class="card"><h2>Chatbot conversations</h2>${C.length ? C.map((c) => { const lm = c.messages.filter((m) => m.messageType !== 'properties' && m.sender !== 'system').slice(-1)[0]; return `<a class="li" href="#/conversations/${c.id}"><div class="b"><div class="t">${A.cb(c.status)} <span class="m">${c.messages.length} messages · ${EG.rel(c.lastActivityAt)}</span></div><div class="pv">${esc(lm ? lm.content : '')}</div></div></a>`; }).join('') : '<div class="m" style="color:var(--muted);margin-top:8px">No chatbot conversations linked to this lead.</div>'}</div>
          <div class="card"><h2>Activity timeline</h2><div class="tl" style="margin-top:14px">${T.length ? T.map((a) => `<div class="e"><div>${esc(a.description)}</div><div class="m">${EG.fmtDT(a.timestamp)}</div></div>`).join('') : '<div class="m">No activity.</div>'}</div></div>
        </div></div>`;
    },
    bind(root, id) {
      const l = EG.getLead(id); if (!l) return;
      const err = (k, m) => { $('#e-' + k, root).textContent = m || ''; return !!m; };
      $('#cform', root).onsubmit = (e) => {
        e.preventDefault();
        const n = $('#fn', root).value.trim(), em = $('#fe', root).value.trim(), ph = $('#fp', root).value.trim(), sc = Math.max(0, Math.min(100, parseInt($('#fs', root).value, 10) || 0));
        let bad = err('fn', n.length < 2 ? 'Name is required.' : '');
        bad = err('fe', !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em) ? 'Enter a valid email.' : (EG.findLeadByEmail(em) && EG.findLeadByEmail(em).id !== l.id ? 'Another lead already uses this email.' : '')) || bad;
        bad = err('fp', ph && ph.replace(/\D/g, '').length < 10 ? 'Enter a 10-digit phone number.' : '') || bad;
        if (bad) return;
        A.act(() => { EG.updateLead(l.id, { name: n, email: EG.normEmail(em), phone: ph, contactMethod: $('#fc', root).value, score: sc }, 'Contact information updated by ' + A.admin()); EG.ui.toast('Lead updated.'); });
      };
      $('#st', root).onchange = (e) => { EG.updateLead(l.id, { status: e.target.value }, `Status changed to ${e.target.value} by ${A.admin()}`); EG.ui.toast('Status updated.'); };
      $('#ag', root).onchange = (e) => { EG.updateLead(l.id, { assignedAgent: e.target.value }, e.target.value ? `Assigned to ${EG.agentName(e.target.value)}` : 'Unassigned'); EG.ui.toast(e.target.value ? 'Assigned to ' + EG.agentName(e.target.value) + '.' : 'Unassigned.'); };
      $('#apb', root).onclick = () => { const v = +$('#ap', root).value; if (!v) return; const L = EG.getLead(l.id); EG.updateLead(l.id, { interestedPropertyIds: L.interestedPropertyIds.concat(v) }, 'Added interested property ' + EG.prop(v).addr); };
      $('#nf', root).onsubmit = (e) => { e.preventDefault(); const t = $('#nt', root).value.trim(); if (!t) { $('#nt', root).focus(); return; } A.act(() => { EG.addNote(l.id, t, A.admin()); EG.ui.toast('Note added.'); }); };
      $('#tf', root).onsubmit = (e) => { e.preventDefault(); const t = $('#tt', root).value.trim(), d = $('#td', root).value; if (!t || !d) { $('#tt', root).focus(); return; } A.act(() => { EG.addTask(l.id, t, new Date(d + 'T09:00:00').getTime()); EG.ui.toast('Reminder added.'); }); };
      $$('[data-t]', root).forEach((c) => (c.onchange = () => EG.toggleTask(l.id, c.dataset.t)));
      $$('[data-inq]', root).forEach((s) => (s.onchange = () => { const i = EG.get().inquiries.find((x) => x.id === s.dataset.inq); i.status = s.value; EG.addActivity(l.id, 'inquiry', `Inquiry marked ${s.value}`); EG.save(); EG.ui.toast('Inquiry updated.'); }));
      $('#ldel', root).onclick = async () => { if (await A.confirm('Delete demo lead?', `${l.name} and their demo inquiries will be removed. Reset demo data restores the samples.`, 'Delete lead')) { EG.deleteLead(l.id); location.hash = '#/leads'; EG.ui.toast('Demo lead deleted.'); } };
    }
  };

  /* ---------- shell + router ---------- */
  const NAV = [['overview', 'Overview', '/'], ['leads', 'Leads', '/leads'], ['properties', 'Properties', '/properties'], ['conversations', 'Conversations', '/conversations'], ['assistant', 'AI Assistant', '/assistant'], ['capture', 'Lead Capture Settings', '/lead-capture'], ['activity', 'Activity Log', '/activity'], ['settings', 'Settings', '/settings']];
  function route() {
    const h = location.hash.replace(/^#/, '') || '/', seg = h.split('/').filter(Boolean);
    const first = seg[0] || '';
    const map = { '': 'overview', leads: seg[1] ? 'lead' : 'leads', properties: 'properties', conversations: 'conversations', assistant: 'assistant', 'lead-capture': 'capture', activity: 'activity', settings: 'settings' };
    return { page: map[first] || 'overview', id: seg[1] ? decodeURIComponent(seg[1]) : null, nav: first === 'leads' ? 'leads' : (map[first] || 'overview') };
  }
  function shell() {
    const s = EG.get(), nl = s.leads.filter((l) => l.status === 'New').length, nc = s.conversations.filter((c) => c.status === 'Needs Follow-up' || c.unread).length;
    const cur = route().nav, bd = { leads: nl, conversations: nc };
    $('#nav').innerHTML = NAV.map(([k, l, h]) => `<a href="#${h}" ${k === cur || (k === 'overview' && cur === 'overview') ? 'aria-current="page"' : ''} title="${l}">${ic(k === 'capture' ? 'capture' : k)}<span class="lb">${l}</span>${bd[k] ? `<span class="bd" aria-label="${bd[k]} need attention">${bd[k]}</span>` : ''}</a>`).join('');
    const ag = EG.agent(EG.settings().admin.agent);
    $('#prof').innerHTML = `<button id="pb" aria-haspopup="true" aria-expanded="false"><span class="av">${initials(ag.name)}</span><span>${esc(ag.name.split(' ')[0])}</span></button>
      <div class="menu" id="pm" role="menu"><div class="hd"><b>${esc(ag.name)}</b>${esc(ag.role)} · demo profile</div><div class="lab">Act as</div>${EG.AGENTS.map((a) => `<button role="menuitem" data-as="${a.id}">${a.id === ag.id ? '✓ ' : ''}${esc(a.name)}</button>`).join('')}<div class="lab">Prototype</div><a role="menuitem" href="index.html">Open public site</a><button role="menuitem" id="pr">Reset demo data…</button></div>`;
    $('#pb').onclick = (e) => { e.stopPropagation(); const m = $('#pm'); const on = m.classList.toggle('on'); $('#pb').setAttribute('aria-expanded', on); };
    $$('[data-as]').forEach((b) => (b.onclick = () => { EG.setSettings((st) => (st.admin.agent = b.dataset.as)); EG.ui.toast('Now acting as ' + EG.agentName(b.dataset.as) + ' (demo).'); }));
    $('#pr').onclick = () => A.resetDemo();
  }
  A.resetDemo = async () => { if (await A.confirm('Reset demo data?', 'All leads, inquiries, conversations, notes and settings return to the starting sample. The visitor session on the public site is cleared too.', 'Reset demo data')) { EG.reset(); EG.ui.chat && EG.ui.chat.reset && EG.ui.chat.reset(); location.hash = '#/'; EG.ui.toast('Demo data reset to the starting sample.'); } };
  A.render = function () {
    const r = route(), pg = A.pages[r.page] || A.pages.overview, main = $('#page');
    const keep = main.scrollTop;
    document.title = (pg.title || 'Admin') + ' — Ellison Group admin (demo)';
    shell();
    main.innerHTML = pg.html(r.id);
    pg.bind && pg.bind(main, r.id);
    if (A.drawerSync) A.drawerSync(r);
    A.drawer.paint();
  };
  let lastPage = null, raf = null;
  const typing = () => { const a = document.activeElement; return a && $('#page').contains(a) && /^(INPUT|TEXTAREA)$/.test(a.tagName) && !/checkbox|radio|button/.test(a.type || '') && (a.value || '').length > 0; };
  function schedule() { if (raf) return; raf = requestAnimationFrame(() => { raf = null; if (typing()) return; const sy = scrollY; A.render(); scrollTo(0, sy); }); }
  A.start = function () {
    const app = $('#app');
    try { if (localStorage.getItem('eg_admin_collapsed') === '1') app.classList.add('collapsed'); } catch (e) { /* ignore */ }
    $('#collapse').onclick = () => { app.classList.toggle('collapsed'); try { localStorage.setItem('eg_admin_collapsed', app.classList.contains('collapsed') ? '1' : '0'); } catch (e) { /* ignore */ } };
    $('#burger').onclick = () => { const o = app.classList.toggle('mopen'); $('#burger').setAttribute('aria-expanded', o); };
    $('#mscrim').onclick = () => app.classList.remove('mopen');
    $('#scrim').onclick = () => A.drawer.close(true);
    document.addEventListener('click', (e) => { if (!e.target.closest('#prof')) { const m = $('#pm'); if (m) m.classList.remove('on'); } });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { A.drawer.close(true); const m = $('#pm'); if (m) m.classList.remove('on'); } });
    window.addEventListener('hashchange', () => { $('#app').classList.remove('mopen'); const r = route(); if (lastPage && lastPage !== r.page) { const c = document.getElementById('egChat'); if (c) { c.remove(); EG.ui.chat = null; } } lastPage = r.page; A.render(); if (!/^#\/properties\//.test(location.hash)) A.drawer.close(); window.scrollTo(0, 0); $('#page').focus({ preventScroll: true }); });
    document.addEventListener('click', (e) => { const g = e.target.closest('[data-go]'); if (g && !e.target.closest('a,button,select,input')) location.hash = g.dataset.go; });
    EG.on(schedule);
    lastPage = route().page; A.render();
  };
})();
