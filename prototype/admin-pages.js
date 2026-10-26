/* Admin pages: Properties, Conversations, AI Assistant, Lead Capture Settings, Activity Log, Settings. */
(function () {
  'use strict';
  const A = window.A, EG = window.EG, esc = EG.esc, money = EG.money, $ = A.$, $$ = A.$$, DAY = 864e5;
  const toast = (m) => EG.ui.toast(m);

  /* ---------- Properties ---------- */
  const counts = (pid) => {
    const s = EG.get();
    return { inq: s.inquiries.filter((i) => i.propertyId === pid).length, leads: s.leads.filter((l) => l.interestedPropertyIds.includes(pid)).length };
  };
  function propRows() {
    const f = A.state.pf, q = f.q.trim().toLowerCase();
    const P = EG.PROPS.filter((p) => (!f.status || p.st === f.status) && (!f.area || p.area === f.area) && (!q || (p.addr + ' ' + p.loc + ' ' + p.pt).toLowerCase().includes(q)));
    if (!P.length) return `<tr><td colspan="8">${A.empty('No properties match', 'Adjust the filters.')}</td></tr>`;
    return P.map((p) => { const c = counts(p.id); return `<tr class="row" data-go="#/properties/${p.id}" tabindex="0"><td class="first" data-l="Property"><div class="nm">${esc(p.addr)}</div><div class="em">${esc(p.loc)}</div></td><td data-l="Type">${esc(p.pt)}</td><td data-l="Beds / baths">${p.bd ? p.bd + ' / ' + p.ba : '—'}</td><td data-l="Sq ft">${p.sf ? p.sf.toLocaleString() : '—'}</td><td data-l="Price">${money(p.p)}</td><td data-l="Status"><span class="badge ${p.st === 'Pending' ? 's-New' : 's-Qualified'}">${p.st}</span></td><td data-l="Inquiries">${c.inq}</td><td data-l="Interested leads">${c.leads}</td></tr>`; }).join('');
  }
  A.pages.properties = {
    title: 'Properties',
    html() {
      const s = EG.get(), f = A.state.pf;
      const top = EG.PROPS.map((p) => [p, counts(p.id).inq]).sort((a, b) => b[1] - a[1])[0];
      return `<div class="ph"><div><h1>Properties</h1><p>The same listings as the public site, with inquiry and lead interest.</p></div></div>
        <div class="grid g4"><div class="card kpi"><div class="l">Listings</div><div class="v">${EG.PROPS.length}</div><div class="d">${EG.PROPS.filter((p) => p.st === 'For Sale').length} for sale · ${EG.PROPS.filter((p) => p.st === 'Pending').length} pending</div></div>
          <div class="card kpi"><div class="l">Property inquiries</div><div class="v">${s.inquiries.filter((i) => i.propertyId).length}</div><div class="d">All time</div></div>
          <div class="card kpi"><div class="l">Showing requests</div><div class="v">${s.inquiries.filter((i) => i.inquiryType === 'Showing request').length}</div><div class="d">All time</div></div>
          <div class="card kpi"><div class="l">Most inquired</div><div class="v" style="font-size:22px;line-height:1.25">${esc(top[0].addr)}</div><div class="d">${top[1]} inquiries</div></div></div>
        <div class="toolbar"><input type="search" id="pq" placeholder="Search address, area or type" value="${esc(f.q)}" aria-label="Search properties">
          <select id="ps" aria-label="Status">${A.opts(['For Sale', 'Pending'], f.status, 'All statuses')}</select>
          <select id="pa" aria-label="Area">${A.opts(Object.keys(EG.AREA_LABEL).map((k) => ({ v: k, l: EG.AREA_LABEL[k] })), f.area, 'All areas')}</select></div>
        <div class="tw rc"><table><thead><tr><th>Property</th><th>Type</th><th>Beds / baths</th><th>Sq ft</th><th>Price</th><th>Status</th><th>Inquiries</th><th>Interested leads</th></tr></thead><tbody id="pbody">${propRows()}</tbody></table></div>`;
    },
    bind(root) {
      const upd = () => { $('#pbody', root).innerHTML = propRows(); $$('[data-go]', root).forEach((r) => (r.onkeydown = (e) => { if (e.key === 'Enter') location.hash = r.dataset.go; })); };
      $('#pq', root).oninput = (e) => { A.state.pf.q = e.target.value; upd(); };
      $('#ps', root).onchange = (e) => { A.state.pf.status = e.target.value; upd(); };
      $('#pa', root).onchange = (e) => { A.state.pf.area = e.target.value; upd(); };
      upd();
    }
  };
  function propDrawer(id) {
    const fn = () => {
      const p = EG.prop(id); if (!p) return '<div class="db">Not found.</div>';
      const s = EG.get(), I = s.inquiries.filter((i) => i.propertyId === p.id).sort((a, b) => b.createdAt - a.createdAt), L = s.leads.filter((l) => l.interestedPropertyIds.includes(p.id));
      return `<div class="dh"><div><div class="m" style="color:var(--muted);font-size:12px;letter-spacing:.1em;text-transform:uppercase">${esc(p.pt)} · ${p.st}</div><h2 style="font-size:26px">${esc(p.addr)}</h2><div style="color:var(--muted)">${esc(p.loc)}</div></div><button class="btn sm ghost" data-dclose aria-label="Close">Close</button></div>
        <div class="db"><div class="grid g3" style="gap:10px"><div class="card kpi"><div class="l">Price</div><div class="v" style="font-size:24px">${money(p.p)}</div></div><div class="card kpi"><div class="l">Beds / baths</div><div class="v" style="font-size:24px">${p.bd ? p.bd + ' / ' + p.ba : '—'}</div></div><div class="card kpi"><div class="l">Sq ft</div><div class="v" style="font-size:24px">${p.sf ? p.sf.toLocaleString() : '—'}</div></div></div>
        <p style="margin:6px 0 18px"><a class="btn sm" href="index.html#property-${p.id}">View on public site</a></p>
        <h3 style="font-size:19px;margin-bottom:6px">Inquiries (${I.length})</h3>${I.length ? I.map((i) => `<div class="li"><div class="b"><div class="t">${esc(i.inquiryType)} <span class="badge s-Contacted">${esc(i.status)}</span></div><div class="m">${A.ll(i.leadId)} · ${EG.fmtDT(i.createdAt)}${i.preferredShowingDate ? ' · wants ' + esc(i.preferredShowingDate) : ''}</div></div></div>`).join('') : '<div class="m" style="color:var(--muted)">No inquiries yet.</div>'}
        <h3 style="font-size:19px;margin:20px 0 6px">Interested leads (${L.length})</h3>${L.length ? L.map((l) => `<a class="li" href="#/leads/${l.id}"><div class="b"><div class="t">${esc(l.name)}</div><div class="m">${esc(l.email)}</div></div>${A.sb(l.status)}</a>`).join('') : '<div class="m" style="color:var(--muted)">No leads yet.</div>'}</div>`;
    };
    return fn;
  }
  A.drawerSync = (r) => { if (r.page === 'properties' && r.id) { const fn = propDrawer(+r.id); A.drawer.open(fn); } else if (!/^#\/properties\//.test(location.hash)) A.drawer.close(); };

  /* ---------- Conversations ---------- */
  const lname = (c) => (c.leadId && EG.getLead(c.leadId) ? EG.getLead(c.leadId).name : 'Anonymous visitor');
  const previewOf = (c) => { const m = c.messages.filter((x) => x.messageType !== 'properties' && x.sender !== 'system').slice(-1)[0]; return m ? (m.sender === 'visitor' ? '' : m.sender === 'agent' ? 'Agent: ' : 'Bot: ') + m.content : ''; };
  function convList() {
    const f = A.state.cf, q = f.q.trim().toLowerCase();
    return EG.get().conversations.filter((c) => (!f.status || c.status === f.status) && (!f.agent || (f.agent === '_none' ? !c.assignedAgent : c.assignedAgent === f.agent)) && (!q || (lname(c) + ' ' + (c.leadId && EG.getLead(c.leadId) ? EG.getLead(c.leadId).email : '') + ' ' + c.messages.map((m) => m.content).join(' ')).toLowerCase().includes(q))).sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  }
  function msgHTML(m) {
    if (m.messageType === 'properties') return `<div class="mg cards">${(m.propIds || []).map((i) => EG.prop(i)).filter(Boolean).map((p) => `<a href="#/properties/${p.id}">${esc(p.addr)} · ${money(p.p)}</a>`).join('')}</div>`;
    const who = m.sender === 'visitor' ? 'Visitor' : m.sender === 'agent' ? 'Agent' : m.sender === 'system' ? '' : 'Assistant (simulated)';
    return `<div class="mg ${m.sender}">${who && m.sender !== 'system' ? `<small>${who} · ${EG.fmtTime(m.timestamp)}</small>` : ''}${esc(m.content)}${m.messageType === 'capture-offer' ? '<small style="margin-top:4px">Offered contact capture</small>' : ''}</div>`;
  }
  A.pages.conversations = {
    title: 'Conversations',
    html(id) {
      const f = A.state.cf, L = convList(), sel = id ? EG.getConv(id) : L[0];
      const item = (c) => `<div class="ci ${c.unread ? 'un' : ''} ${sel && sel.id === c.id ? 'on' : ''}" data-open="${c.id}" tabindex="0" role="button" aria-label="Open conversation with ${esc(lname(c))}"><span class="av" style="background:${c.leadId ? '#3d5a47' : '#8a8f87'}">${lname(c)[0]}</span><div class="b"><div class="t"><b>${esc(lname(c))}</b><span>${EG.rel(c.lastActivityAt)}</span></div><div class="pv">${esc(previewOf(c)) || '—'}</div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${A.cb(c.status)}<span class="em" style="font-size:12px;color:var(--muted)">${esc(EG.agentName(c.assignedAgent))}</span></div></div></div>`;
      return `<div class="ph"><div><h1>Conversations</h1><p>Simulated AI chatbot conversations from the public site.</p></div></div>
        <div class="cv ${id ? 'hasd' : ''}"><div class="cl"><div class="toolbar"><input type="search" id="cq" placeholder="Search visitor or message" value="${esc(f.q)}" aria-label="Search conversations">
          <select id="cs" aria-label="Status">${A.opts(EG.CONV_STATUSES, f.status, 'All statuses')}</select><select id="ca" aria-label="Agent">${A.opts([{ v: '_none', l: 'Unassigned' }].concat(EG.AGENTS.map((a) => ({ v: a.id, l: a.name }))), f.agent, 'All agents')}</select></div>
          <div class="scroll" id="clist">${L.length ? L.map(item).join('') : A.empty('No conversations', 'Try clearing the filters.')}</div></div>
          <div class="cd">${sel ? detail(sel) : A.empty('Select a conversation', 'Its transcript and actions appear here.')}</div></div>`;
    },
    bind(root, id) {
      const L = convList(), sel = id ? EG.getConv(id) : L[0];
      $$('[data-open]', root).forEach((e) => { const go = () => (location.hash = '#/conversations/' + e.dataset.open); e.onclick = go; e.onkeydown = (k) => { if (k.key === 'Enter') go(); }; });
      const setF = (sid, key) => ($(sid, root)[key === 'q' ? 'oninput' : 'onchange'] = (e) => { A.state.cf[key] = e.target.value; const keepFocus = key === 'q'; const v = e.target.value; A.render(); if (keepFocus) { const i = $('#cq'); i.focus(); i.setSelectionRange(v.length, v.length); } });
      setF('#cq', 'q'); setF('#cs', 'status'); setF('#ca', 'agent');
      if (!sel) return;
      const bk = $('[data-bk]', root); if (bk) bk.onclick = () => (location.hash = '#/conversations');
      if (sel.unread) { sel.unread = false; EG.save(); }
      const me = EG.settings().admin.agent, name = EG.agentName(me);
      const upd = (patch, msg, t) => { A.act(() => { EG.updateConv(sel.id, patch, t); if (msg) EG.addMessage(sel.id, { sender: 'system', content: msg }); toast(t || 'Conversation updated.'); }); };
      const on = (k, fn) => { const b = $(`[data-a="${k}"]`, root); if (b) b.onclick = fn; };
      on('take', () => upd({ status: 'Handed to Agent', agentManaged: true, assignedAgent: sel.assignedAgent || me }, `${EG.agentName(sel.assignedAgent || me)} has taken over this conversation (simulated).`, 'Conversation taken over. Visitor replies now go to the agent.'));
      on('follow', () => upd({ status: 'Needs Follow-up' }, null, 'Marked as needing follow-up.'));
      on('hand', () => upd({ status: 'Handed to Agent', assignedAgent: sel.assignedAgent || me }, `Handed to ${EG.agentName(sel.assignedAgent || me)} (simulated).`, 'Marked as handed to an agent.'));
      on('close', () => upd({ status: 'Closed', agentManaged: false }, 'Conversation closed.', 'Conversation closed.'));
      on('reopen', () => upd({ status: 'Active' }, 'Conversation reopened.', 'Conversation reopened.'));
      const as = $('#cas', root); if (as) as.onchange = (e) => { EG.updateConv(sel.id, { assignedAgent: e.target.value }, 'Conversation assigned to ' + EG.agentName(e.target.value)); toast(e.target.value ? 'Assigned to ' + EG.agentName(e.target.value) + '.' : 'Unassigned.'); };
      const nf = $('#cnf', root); if (nf) nf.onsubmit = (e) => { e.preventDefault(); const t = $('#cnt', root).value.trim(); if (!t) return; A.act(() => { sel.notes = sel.notes || []; sel.notes.unshift({ id: EG.uid('n'), text: t, author: name, ts: Date.now() }); EG.save(); toast('Internal note added.'); }); };
      const rf = $('#crf', root); if (rf) rf.onsubmit = (e) => { e.preventDefault(); const t = $('#crt', root).value.trim(); if (!t) return; A.act(() => { EG.addMessage(sel.id, { sender: 'agent', content: t }); toast('Reply sent to the visitor widget (simulated).'); }); };
      const tr = $('.tr-box', root); if (tr) tr.scrollTop = tr.scrollHeight;
    }
  };
  function detail(c) {
    const l = c.leadId ? EG.getLead(c.leadId) : null, p = c.propertyId ? EG.prop(c.propertyId) : null;
    const rel = new Set(c.messages.flatMap((m) => m.propIds || [])); if (p) rel.add(p.id);
    return `<div class="cd-h"><button class="btn sm ghost back" data-bk>← All conversations</button>
        <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start"><div><h2 style="font-size:24px">${esc(lname(c))}</h2>
        <div style="color:var(--muted);font-size:13px">${l ? `${esc(l.email)} · ${esc(l.phone)} · ${A.sb(l.status)}` : 'No contact details shared yet. Capture is only requested for gated actions.'}</div></div>
        <div style="text-align:right">${A.cb(c.status)}${c.agentManaged ? ' <span class="badge c-Handed">Agent-managed</span>' : ''}<div class="m" style="color:var(--muted);font-size:12px;margin-top:4px">Started ${EG.fmtDT(c.createdAt)}</div></div></div>
        <div class="cd-a">${c.agentManaged || c.status === 'Closed' ? '' : '<button class="btn solid sm" data-a="take">Take over conversation</button>'}
          ${c.status !== 'Needs Follow-up' && c.status !== 'Closed' ? '<button class="btn sm" data-a="follow">Needs follow-up</button>' : ''}
          ${c.status !== 'Handed to Agent' && c.status !== 'Closed' ? '<button class="btn sm" data-a="hand">Mark handed to agent</button>' : ''}
          ${c.status === 'Closed' ? '<button class="btn sm" data-a="reopen">Reopen</button>' : '<button class="btn sm ghost" data-a="close">Close</button>'}
          <label class="f" style="margin:0 0 0 auto;display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0">Agent <select id="cas" aria-label="Assign agent">${A.agentOpts(c.assignedAgent, 'Unassigned')}</select></label></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;align-items:center">${l ? `<a class="btn sm ghost" href="#/leads/${l.id}">Open lead profile</a>` : ''}${[...rel].map((i) => A.pl(i)).join('')}</div></div>
      <div class="tr-box" role="log" aria-label="Conversation transcript">${c.messages.map(msgHTML).join('') || '<div class="mg system">No messages.</div>'}</div>
      <div class="cd-f">${c.agentManaged && c.status !== 'Closed' ? `<form id="crf" class="pill-row" style="margin-bottom:16px"><input id="crt" placeholder="Reply to the visitor as ${esc(EG.agentName(c.assignedAgent))} (simulated)" style="flex:1;min-width:200px" aria-label="Reply"><button class="btn solid sm" type="submit">Send reply</button></form>` : ''}
        <h3 style="font-size:17px;margin-bottom:8px">Internal notes</h3><form id="cnf" class="pill-row" style="margin-bottom:6px"><input id="cnt" placeholder="Add a note for the team" style="flex:1;min-width:200px" aria-label="New note"><button class="btn sm" type="submit">Add note</button></form>
        ${(c.notes || []).map((n) => `<div class="note"><div>${esc(n.text)}</div><div class="m">${esc(n.author)} · ${EG.fmtDT(n.ts)}</div></div>`).join('')}</div>`;
  }

  /* ---------- chatbot + capture config cards ---------- */
  A.chatbotCard = () => {
    const c = EG.settings().chatbot;
    return `<div class="card" id="cbc"><h2>AI chatbot</h2><p class="sub">Simulated assistant on the public site. Changes apply immediately.</p>
      ${A.toggle('cb-en', 'Show the chatbot on the public site', 'Hides the launcher when off.', c.enabled)}
      <label class="f" style="margin-top:14px">Welcome message<textarea id="cb-wel" rows="3">${esc(c.welcome)}</textarea></label>
      <div class="prompts"><div class="m" style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Suggested prompts</div>
        ${c.prompts.map((p, i) => `<div class="pr"><input value="${esc(p)}" data-pi="${i}" aria-label="Prompt ${i + 1}"><button class="btn sm ghost" data-prm="${i}" aria-label="Remove prompt ${i + 1}">Remove</button></div>`).join('')}
        <div class="pill-row"><button class="btn sm" id="cb-add">${A.ic('plus')} Add prompt</button><button class="btn sm ghost" id="cb-def">Restore default prompts</button></div></div>
      <div class="pill-row" style="margin-top:16px"><button class="btn solid" id="cb-prev">Preview chatbot</button><span class="m" style="color:var(--muted);font-size:12.5px;align-self:center">Preview runs in a sandbox. Nothing is saved.</span></div></div>`;
  };
  A.bindChatbot = (root) => {
    const set = (fn, msg) => { EG.setSettings(fn); toast(msg || 'Saved.'); };
    $('#cb-en', root).onchange = (e) => set((s) => (s.chatbot.enabled = e.target.checked), e.target.checked ? 'Chatbot enabled on the public site.' : 'Chatbot hidden on the public site.');
    $('#cb-wel', root).onchange = (e) => set((s) => (s.chatbot.welcome = e.target.value.trim() || EG.defaults().chatbot.welcome), 'Welcome message saved.');
    $$('[data-pi]', root).forEach((i) => (i.onchange = () => set((s) => { const v = i.value.trim(); if (v) s.chatbot.prompts[+i.dataset.pi] = v; else s.chatbot.prompts.splice(+i.dataset.pi, 1); }, 'Prompt saved.')));
    $$('[data-prm]', root).forEach((b) => (b.onclick = () => A.act(() => set((s) => s.chatbot.prompts.splice(+b.dataset.prm, 1), 'Prompt removed.'))));
    $('#cb-add', root).onclick = () => A.act(() => set((s) => s.chatbot.prompts.push('New suggested prompt'), 'Prompt added. Edit its text above.'));
    $('#cb-def', root).onclick = () => A.act(() => set((s) => (s.chatbot.prompts = EG.defaults().chatbot.prompts), 'Default prompts restored.'));
    $('#cb-prev', root).onclick = () => { const ch = EG.ui.chat || EG.ui.mountChat({ preview: true }); ch.open(); };
  };
  const TRIG = [['showing', 'Request a showing'], ['ask', 'Ask about this property'], ['save', 'Save property'], ['contact', 'Contact the agent'], ['assistant', 'Start an AI conversation from a property']];
  function captureCard() {
    const c = EG.settings().capture;
    return `<div class="card" id="cpc"><h2>Lead capture</h2><p class="sub">Controls the modal shown on gated property actions.</p>
      ${A.toggle('cp-en', 'Require lead capture for gated actions', 'When off, visitors reach the inquiry form directly.', c.enabled)}
      <div style="margin:14px 0 4px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)">Actions that trigger capture</div>
      ${TRIG.map(([k, l]) => A.toggle('cp-t-' + k, l, '', c.triggers[k], !c.enabled)).join('')}
      <div style="margin:14px 0 4px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)">Sign-in option</div>
      ${A.toggle('cp-g', 'Show “Continue with Google (simulated)”', 'A sample-profile chooser. No real Google sign-in or credentials.', c.google)}
      <div style="margin:14px 0 4px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)">Required contact fields</div>
      ${A.toggle('cp-r-name', 'Full name', '', c.required.name)}${A.toggle('cp-r-email', 'Email address', 'Always required. It is the key used to avoid duplicate leads.', true, true)}${A.toggle('cp-r-phone', 'Phone number', '', c.required.phone)}
      <label class="f" style="margin-top:14px">Headline<input id="cp-h" value="${esc(c.headline)}"></label>
      <label class="f">Description<textarea id="cp-d" rows="3">${esc(c.description)}</textarea></label>
      <div class="pill-row"><button class="btn solid" id="cp-prev">Preview capture modal</button><button class="btn danger" id="cp-reset">Reset settings to defaults</button></div></div>`;
  }
  function bindCapture(root) {
    const set = (fn, msg) => { EG.setSettings(fn); toast(msg || 'Saved. The public site picks this up immediately.'); };
    $('#cp-en', root).onchange = (e) => set((s) => (s.capture.enabled = e.target.checked));
    TRIG.forEach(([k]) => ($('#cp-t-' + k, root).onchange = (e) => set((s) => (s.capture.triggers[k] = e.target.checked))));
    $('#cp-g', root).onchange = (e) => set((s) => (s.capture.google = e.target.checked));
    $('#cp-r-name', root).onchange = (e) => set((s) => (s.capture.required.name = e.target.checked));
    $('#cp-r-phone', root).onchange = (e) => set((s) => (s.capture.required.phone = e.target.checked));
    $('#cp-h', root).onchange = (e) => set((s) => (s.capture.headline = e.target.value.trim() || EG.defaults().capture.headline));
    $('#cp-d', root).onchange = (e) => set((s) => (s.capture.description = e.target.value.trim() || EG.defaults().capture.description));
    $('#cp-prev', root).onclick = () => EG.ui.openCapture({ action: 'showing', propertyId: 1, preview: true });
    $('#cp-reset', root).onclick = async () => { if (await A.confirm('Reset settings to defaults?', 'Lead capture and chatbot settings return to their original values. Leads and conversations are not affected.', 'Reset settings')) { EG.resetSettings(); toast('Settings reset to defaults.'); } };
  }
  A.pages.capture = {
    title: 'Lead Capture Settings',
    html() { return `<div class="ph"><div><h1>Lead Capture Settings</h1><p>Settings are saved in this browser and apply immediately to the public site.</p></div><a class="btn" href="index.html" target="_blank" rel="noopener">Open public site ↗</a></div>
      <div class="proto-note"><b>Prototype.</b> There is no real OAuth or API credential management here. Google sign-in is a simulated profile chooser.</div><div class="grid g22">${captureCard()}${A.chatbotCard()}</div>`; },
    bind(root) { bindCapture(root); A.bindChatbot(root); }
  };

  /* ---------- AI Assistant ---------- */
  A.pages.assistant = {
    title: 'AI Assistant',
    html() {
      const s = EG.get(), C = s.conversations, by = (st) => C.filter((c) => c.status === st).length;
      const k = (l, v, d) => `<div class="card kpi"><div class="l">${l}</div><div class="v">${v}</div><div class="d">${d}</div></div>`;
      return `<div class="ph"><div><h1>AI Assistant</h1><p>A simulated assistant that answers from the listing data and hands off to the team.</p></div></div>
        <div class="proto-note"><b>Simulated.</b> Replies come from local intent and entity matching over the mock listings. No AI service is called, and it never invents prices or availability.</div>
        <div class="grid g4">${k('Conversations', C.length, `${by('Active')} active`)}${k('Needs follow-up', by('Needs Follow-up'), 'Waiting on the team')}${k('Handed to agent', by('Handed to Agent'), 'Agent-managed')}${k('Chatbot leads', s.leads.filter((l) => l.source === 'chatbot').length, 'Source: AI chatbot')}</div>
        <div class="grid g22">${A.chatbotCard()}<div class="card"><h2>What it can do</h2><p class="sub">Try these in the preview or on the public site.</p>
          ${['Filter homes by budget, bedrooms and neighborhood, e.g. “homes under $500,000 with at least three bedrooms”', 'Explain a listing’s price, beds, baths, size and status', 'Describe the neighborhoods already on the site', 'Explain the valuation request process (it never estimates a price)', 'Offer a showing or a human agent and capture contact details through the same modal', 'Keep context within the session and link the conversation to the lead', 'Say “I don’t have that” and offer the team when it cannot answer'].map((t) => `<div class="li"><span class="dot" style="background:var(--moss)"></span><div class="b">${esc(t)}</div></div>`).join('')}
          <div style="margin-top:14px"><a class="btn" href="#/conversations">Open conversation inbox</a></div></div></div>`;
    },
    bind(root) { A.bindChatbot(root); }
  };

  /* ---------- Activity log ---------- */
  const TL = { lead_created: 'Lead captured', lead_matched: 'Returning visitor', inquiry: 'Inquiry', status_change: 'Status', assignment: 'Assignment', note: 'Note', task: 'Follow-up', chat: 'Chatbot', saved: 'Saved property', update: 'Update', delete: 'Deleted' };
  function actRows() {
    const f = A.state.af, q = f.q.trim().toLowerCase();
    const L = EG.get().activities.filter((a) => (!f.type || a.type === f.type) && (!q || (a.description + ' ' + (a.leadId && EG.getLead(a.leadId) ? EG.getLead(a.leadId).name : '')).toLowerCase().includes(q))).slice(0, 200);
    if (!L.length) return `<tr><td colspan="4">${A.empty('No activity matches', 'Clear the filters.')}</td></tr>`;
    return L.map((a) => `<tr><td data-l="When" class="first">${EG.fmtDT(a.timestamp)}<div class="em">${EG.rel(a.timestamp)}</div></td><td data-l="Type"><span class="badge s-Contacted">${TL[a.type] || a.type}</span></td><td data-l="Activity">${esc(a.description)}</td><td data-l="Lead">${a.leadId && EG.getLead(a.leadId) ? A.ll(a.leadId) : '—'}</td></tr>`).join('');
  }
  A.pages.activity = {
    title: 'Activity Log',
    html() { const f = A.state.af; return `<div class="ph"><div><h1>Activity Log</h1><p>Everything that happens to leads, inquiries and conversations in this demo.</p></div></div>
      <div class="toolbar"><input type="search" id="aq" placeholder="Search activity or lead" value="${esc(f.q)}" aria-label="Search activity"><select id="at" aria-label="Type">${A.opts(Object.keys(TL).map((k) => ({ v: k, l: TL[k] })), f.type, 'All types')}</select></div>
      <div class="tw rc"><table><thead><tr><th>When</th><th>Type</th><th>Activity</th><th>Lead</th></tr></thead><tbody id="abody">${actRows()}</tbody></table></div>`; },
    bind(root) { $('#aq', root).oninput = (e) => { A.state.af.q = e.target.value; $('#abody', root).innerHTML = actRows(); }; $('#at', root).onchange = (e) => { A.state.af.type = e.target.value; $('#abody', root).innerHTML = actRows(); }; }
  };

  /* ---------- Settings ---------- */
  A.pages.settings = {
    title: 'Settings',
    html() {
      const kb = (() => { try { return Math.round((localStorage.getItem(EG.KEY) || '').length / 102.4) / 10; } catch (e) { return 0; } })();
      const ses = EG.sessionLead();
      return `<div class="ph"><div><h1>Settings</h1><p>Prototype controls. There is no real authentication, backend or AI service.</p></div></div>
        <div class="grid g22"><div class="card"><h2>Demo profile</h2><p class="sub">Used as the author of notes and as the agent when you take over a conversation.</p>
          <label class="f">Acting as<select id="sa">${A.agentOpts(EG.settings().admin.agent)}</select></label>
          <h2 style="margin-top:20px">Demo tools</h2><p class="sub">Try the live-update flow without a second visitor.</p>
          <div class="pill-row"><button class="btn solid" id="sim">Simulate incoming visitor lead</button><a class="btn" href="index.html" target="_blank" rel="noopener">Open public site ↗</a></div>
          <div style="margin-top:20px;display:grid;gap:10px;color:var(--ink-2)"><div>Public visitor session: <b>${ses ? esc(ses.name) + ' (' + esc(ses.email) + ')' : 'none'}</b></div>${ses ? '<div><button class="btn sm ghost" id="so">Sign visitor out</button></div>' : ''}</div></div>
        <div class="card"><h2>Data</h2><p class="sub">Everything lives in this browser's localStorage (about ${kb} KB). Nothing is sent anywhere.</p>
          <div class="pill-row"><button class="btn" id="ex">${A.ic('download')} Export all data (JSON)</button><button class="btn danger" id="rs">Reset demo data</button></div>
          <h2 style="margin-top:24px">What is simulated</h2>
          ${['Google sign-in: a sample-profile chooser, no real OAuth', 'AI assistant: local rules, no AI API', 'Emails, texts, calendar bookings and agent notifications: none are sent', 'Analytics: generated from mock records', 'Admin authentication: none (prototype)'].map((t) => `<div class="li"><span class="dot" style="background:var(--moss)"></span><div class="b">${esc(t)}</div></div>`).join('')}</div></div>`;
    },
    bind(root) {
      $('#sa', root).onchange = (e) => { EG.setSettings((s) => (s.admin.agent = e.target.value)); toast('Now acting as ' + EG.agentName(e.target.value) + '.'); };
      $('#sim', root).onclick = () => { const l = EG.simulateVisitorLead(); toast(`New lead: ${l.name}. See Leads or Overview.`); };
      const so = $('#so', root); if (so) so.onclick = () => { EG.clearSession(); toast('Visitor session cleared.'); };
      $('#ex', root).onclick = () => { A.download('ellison-demo-data.json', JSON.stringify(EG.get(), null, 2), 'application/json'); toast('Exported demo data.'); };
      $('#rs', root).onclick = () => A.resetDemo();
    }
  };

  A.start();
})();
