/* Simulated AI real-estate assistant: local intent + entity matching over the mock listing data.
   No external AI service is called. Replies are generated from EG.PROPS, so facts never drift from the listings. */
(function () {
  'use strict';
  const EG = window.EG, ui = EG.ui, esc = EG.esc, money = EG.money;
  const SESSION = 'eg_proto_chat_v1';
  const NO_LISTING = ['heights', 'hillcrest', 'maumelle'];
  const NUMW = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
  const PROP_KEYS = { 1: ['westridge'], 2: ['la scala', 'scala'], 3: ['277 pleasant', 'pleasant valley drive'], 4: ['valley estates'], 5: ['valley club'], 6: ['1820 main', 'main street'], 7: ['robinwood'], 8: ['el dorado', 'eldorado'], 9: ['rock street', '315 rock'], 10: ['louisiana'], 11: ['john branch'], 12: ['wolfsbridge'], 13: ['shaun'], 14: ['chalet'], 15: ['woodlawn'], 16: ['lynn creek'] };
  const AREA_KEYS = [
    [/chenal|west little rock/, 'chenal'], [/pleasant valley|72212/, 'pleasant'], [/downtown|historic/, 'downtown'],
    [/heights/, 'heights'], [/hillcrest/, 'hillcrest'], [/maumelle/, 'maumelle'], [/cabot|mayflower|scott\b|fairfield|beyond|outside (of )?little rock|robinwood|72227/, 'beyond']
  ];
  const areaName = (k) => (EG.AREAS[k] ? EG.AREAS[k].n : EG.AREA_LABEL[k] || k);
  const cleanDesc = (k) => EG.AREAS[k].d.replace(/\s*Concept copy:.*$/, '');

  /* ---------- entity extraction ---------- */
  function money$(n, u) {
    let v = parseFloat(String(n).replace(/,/g, '')); if (isNaN(v)) return null;
    if (/^(k|thousand)$/i.test(u || '')) v *= 1e3; else if (/^(m|mm|million)$/i.test(u || '')) v *= 1e6; else if (v < 10000 && v >= 50) v *= 1e3;
    return v;
  }
  function parse(text) {
    const t = ' ' + text.toLowerCase().replace(/’/g, "'") + ' ', out = {};
    let r = t;
    const bm = r.match(/\b(\d+|one|two|three|four|five|six)\s*\+?\s*(?:or more\s*|plus\s*)?-?\s*(?:bed(?:room)?s?|br|bd)\b/);
    if (bm) { out.beds = NUMW[bm[1]] || parseInt(bm[1], 10); r = r.replace(bm[0], ' '); }
    const rg = r.match(/between\s*\$?\s*([\d][\d,.]*)\s*(k|m|mm|million|thousand)?\s*(?:and|to|-)\s*\$?\s*([\d][\d,.]*)\s*(k|m|mm|million|thousand)?/);
    if (rg) { out.min = money$(rg[1], rg[2] || rg[4]); out.max = money$(rg[3], rg[4] || rg[2]); }
    else {
      const mx = r.match(/(?:under|below|less than|up to|max(?:imum)?(?: of)?|no more than|within|at most|budget(?: is| of)?(?: about| around)?|around|about|<=?)\s*\$?\s*([\d][\d,.]*)\s*(k|m|mm|million|thousand)?\b/);
      const mn = r.match(/(?:over|above|more than|at least|minimum(?: of)?|starting at)\s*(?:\$\s*([\d][\d,.]*)\s*(k|m|mm|million|thousand)?|([\d][\d,.]*)\s*(k|m|mm|million|thousand)\b)/);
      if (mx) out.max = money$(mx[1], mx[2]);
      if (mn) out.min = money$(mn[1] || mn[3], mn[2] || mn[4]);
      if (!mx && !mn) { const b = r.match(/\$\s*([\d][\d,.]*)\s*(k|m|mm|million|thousand)?/); if (b) out.max = money$(b[1], b[2]); }
    }
    // property reference (before area so "277 Pleasant Valley Drive" is a property, not a neighborhood)
    for (const p of EG.PROPS) {
      const keys = PROP_KEYS[p.id].slice(); const num = p.addr.split(' ')[0]; if (/^\d{3,}$/.test(num)) keys.push(num);
      if (keys.some((k) => t.includes(k))) { out.prop = p.id; break; }
    }
    if (!out.prop) for (const [rx, k] of AREA_KEYS) if (rx.test(t)) { out.area = k; break; }
    out.lot = /\b(lot|land|vacant)\b/.test(t);
    return out;
  }
  const hasCriteria = (c) => c.beds != null || c.max != null || c.min != null || c.area;

  /* ---------- search ---------- */
  function search(ctx) {
    let pool = EG.PROPS.filter((p) => p.st === 'For Sale' && (ctx.lot ? !p.bd : p.bd > 0));
    if (ctx.area) pool = pool.filter((p) => p.area === ctx.area);
    if (ctx.beds) pool = pool.filter((p) => p.bd >= ctx.beds);
    if (ctx.min) pool = pool.filter((p) => p.p >= ctx.min);
    const base = pool.slice();
    if (ctx.max) pool = pool.filter((p) => p.p <= ctx.max);
    return { hits: pool.sort((a, b) => b.p - a.p), near: ctx.max ? base.filter((p) => p.p > ctx.max && p.p <= ctx.max * 1.25).sort((a, b) => a.p - b.p) : [] };
  }
  function critText(c) {
    const b = [];
    if (c.max) b.push('under ' + money(c.max)); if (c.min) b.push('over ' + money(c.min));
    if (c.beds) b.push('with at least ' + c.beds + ' bedroom' + (c.beds > 1 ? 's' : ''));
    if (c.area && !NO_LISTING.includes(c.area)) b.push('in ' + areaName(c.area));
    return b.length ? ' ' + b.join(', ') : '';
  }
  const pick = (a, n) => a.slice(0, n).map((p) => p.id);

  /* ---------- the engine ---------- */
  /* returns { replies:[{t:'text'|'props'|'offer', ...}], ctx } */
  function respond(input, ctx, env) {
    const text = input.trim(), t = text.toLowerCase().replace(/’/g, "'");
    const e = parse(text), R = [], say = (c) => R.push({ t: 'text', c }), cards = (ids) => ids.length && R.push({ t: 'props', ids });
    const offer = (intent, pid, c) => R.push({ t: 'offer', c, intent, propertyId: pid || null });
    ctx.lastResults = ctx.lastResults || [];
    const focusFromText = () => {
      if (e.prop) return e.prop;
      const ord = t.match(/\b(first|1st|second|2nd|third|3rd|fourth|4th)\b|#([1-4])\b/);
      if (ord && ctx.lastResults.length) { const i = { first: 0, '1st': 0, second: 1, '2nd': 1, third: 2, '3rd': 2, fourth: 3, '4th': 3 }[ord[1]] ?? (+ord[2] - 1); if (ctx.lastResults[i]) return ctx.lastResults[i]; }
      if (/cheapest|lowest price|least expensive/.test(t) && ctx.lastResults.length) return ctx.lastResults.map(EG.prop).sort((a, b) => a.p - b.p)[0].id;
      if (/largest|biggest|most (square|space)/.test(t) && ctx.lastResults.length) return ctx.lastResults.map(EG.prop).sort((a, b) => b.sf - a.sf)[0].id;
      if (/\b(this|that|the)\s+(one|property|home|house|listing)\b|\bit\b|\bthis\b/.test(t)) return ctx.focus || ui.focusPropertyId || null;
      return null;
    };
    const fid = focusFromText(), fp = EG.prop(fid);
    if (/start over|new search|reset|clear (my )?search/.test(t)) { Object.assign(ctx, { max: null, min: null, beds: null, area: null, lot: false, focus: null, lastResults: [], goal: null }); say('No problem, we’ll start fresh. Are you looking to buy, sell, or just exploring?'); return { replies: R, ctx }; }

    // fact question about a specific home
    const factual = (p) => {
      const b = [];
      if (/bed/.test(t)) b.push(p.bd ? `${p.addr} has ${p.bd} bedrooms and ${p.ba} bathrooms.` : `${p.addr} is a vacant lot, so there are no bedrooms.`);
      else if (/\bbath/.test(t)) b.push(p.bd ? `${p.addr} has ${p.ba} bathrooms.` : `${p.addr} is a vacant lot, so there are no bathrooms.`);
      if (/price|cost|how much|listed|asking/.test(t)) b.push(`${p.addr} is listed at ${money(p.p)}.`);
      if (/square|sq\.? ?f|size|how big/.test(t)) b.push(p.sf ? `${p.addr} offers ${p.sf.toLocaleString()} square feet.` : `${p.addr} is a lot, so I don’t have square footage for it.`);
      if (/available|still|pending|sold|status/.test(t)) b.push(p.st === 'Pending' ? `${p.addr} currently shows as Pending in our selection, so I can’t promise it’s available.` : `${p.addr} currently shows as For Sale in our selection.`);
      return b.join(' ');
    };

    // ---- intent routing ----
    const isGreet = /^(hi|hello|hey|good (morning|afternoon|evening)|howdy)\b/.test(t) && t.split(/\s+/).length <= 4;
    const isThanks = /^(thanks|thank you|thx|great, thanks|cheers)\b/.test(t);
    const isBye = /^(bye|goodbye|that's all|no thanks|not now|maybe later)\b/.test(t);
    const wantAgent = /(agent|human|real person|realtor|someone (call|from)|call me|talk to|speak (to|with)|connect me|contact (the )?team|reach (the )?team)/.test(t);
    const wantShow = /(showing|tour|viewing|schedule|appointment|see (it|this|the (home|house|property)) in person|visit (it|the))/.test(t);
    const wantSell = /(sell|selling|valuation|home worth|what('s| is) my home|market value|list my (home|house))/.test(t);
    const wantHood = /(neighbo(u)?rhood|which part|where should|what area|community|walkable|quiet|schools?|commute|character|family[- ]friendly)/.test(t);
    const wantContact = /(phone number|your number|office (address|location)|where are you (located)?|opening hours|office hours|email address)/.test(t);
    const wantBuy = /(^|\b)(buy|buying|purchase|move to|relocat)/.test(t);

    if (isGreet) { say('Hello! Are you looking to buy, sell, or just exploring Little Rock? I can show homes from our current selection, talk through neighborhoods, or connect you with the team.'); return { replies: R, ctx }; }
    if (isBye) { say('Of course. I’m here whenever you’d like to continue. You can also reach the team at (501) 725-1227.'); return { replies: R, ctx }; }
    if (isThanks) { say('You’re welcome! Is there anything else I can help you explore?'); return { replies: R, ctx }; }
    if (wantContact) { say('You can reach The Ellison Group at (501) 725-1227. The office is at 12814 Cantrell Rd, Little Rock, AR 72223. I don’t have office hours in the information available to me, so a quick call is the best way to confirm.'); return { replies: R, ctx }; }

    if (wantAgent) {
      const pid = fp ? fp.id : ctx.focus || null; ctx.pending = { intent: 'Contact agent', propertyId: pid };
      const sl = EG.sessionLead();
      if (sl) { R.push({ t: 'action', act: 'finalize', intent: 'Contact agent', propertyId: pid }); return { replies: R, ctx }; }
      offer('Contact agent', pid, 'Happy to. A member of the team can follow up with you directly. Would you like to share your contact details?');
      return { replies: R, ctx };
    }

    if (wantSell && !fp) {
      ctx.goal = 'sell';
      say('Happy to help with that. The valuation request on this site has three short steps: your property address, a few details about the home, and how to reach you. A member of the team then prepares your valuation personally, and you can expect a reply within one business day. I can’t estimate a price myself, and I won’t guess at one.');
      offer('Valuation request', null, 'Would you like to start the request, or share your contact details so the team can follow up?');
      return { replies: R, ctx };
    }

    if (wantShow) {
      const pid = fp ? fp.id : ctx.focus || (ctx.lastResults.length === 1 ? ctx.lastResults[0] : null);
      const p = EG.prop(pid);
      if (!p) {
        const ids = ctx.lastResults.length ? ctx.lastResults.slice(0, 4) : pick(EG.PROPS.filter((x) => x.st === 'For Sale' && x.bd).sort((a, b) => b.p - a.p), 3);
        say('I’d be glad to arrange a showing. Which home would you like to see? Tell me the address, or pick one of these:'); cards(ids); ctx.awaiting = 'showing'; return { replies: R, ctx };
      }
      ctx.focus = p.id;
      if (p.st === 'Pending') { say(`${p.addr} currently shows as Pending in our selection, so I can’t promise a showing. I can note your interest and the team can point you to similar homes.`); offer('Property question', p.id, 'Would you like to share your contact details so the team can follow up about similar homes?'); return { replies: R, ctx }; }
      ctx.pending = { intent: 'Showing request', propertyId: p.id };
      if (EG.sessionLead()) { R.push({ t: 'action', act: 'finalize', intent: 'Showing request', propertyId: p.id }); return { replies: R, ctx }; }
      offer('Showing request', p.id, 'I can help arrange a viewing. Would you like to share your contact details so the team can follow up about this property?');
      return { replies: R, ctx };
    }

    // neighborhood discovery
    if (wantHood || (e.area && /(tell me about|what('s| is) .* like|describe|about)/.test(t) && !/home|house|listing|under|bed/.test(t))) {
      if (e.area) {
        ctx.area = e.area; const n = EG.PROPS.filter((p) => p.area === e.area && p.st === 'For Sale' && p.bd).length;
        say(`${areaName(e.area)}: ${cleanDesc(e.area)}`);
        say(NO_LISTING.includes(e.area) ? `I don’t have any listings in ${areaName(e.area)} in our current selection, but the team can tell you what may be coming up. Want me to look at nearby areas instead?` : `We currently show ${n} home${n === 1 ? '' : 's'} for sale there in this selection. Want to see them?`);
        ctx.awaiting = 'hood-confirm'; return { replies: R, ctx };
      }
      const traits = [[/walkab|urban|downtown|restaurant/, ['heights', 'downtown']], [/quiet|peace|calm/, ['maumelle']], [/histor|character|porch/, ['hillcrest', 'downtown']], [/space|yard|larger|big|room/, ['chenal', 'pleasant']], [/golf/, ['pleasant']], [/family/, ['maumelle', 'pleasant']]];
      const hit = traits.find(([rx]) => rx.test(t));
      if (hit) { say('Based on what you’ve said, a few neighborhoods are worth a look:'); hit[1].forEach((k) => say(`• ${areaName(k)}: ${EG.AREAS[k].c.join(', ')}`)); say('Want details on one of them, or shall I show current listings there?'); return { replies: R, ctx }; }
      say('Little Rock has distinct neighborhoods, and I can speak to six of them: The Heights, Hillcrest, Historic Downtown, Chenal, Maumelle and Pleasant Valley. What matters most to you: space, walkability, a quiet setting, or historic character?');
      return { replies: R, ctx };
    }

    // specific property
    if (fp && !hasCriteria(e)) {
      ctx.focus = fp.id; if (!ctx.lastResults.includes(fp.id)) ctx.lastResults = [fp.id].concat(ctx.lastResults).slice(0, 4);
      const f = factual(fp);
      say(f || EG.propLine(fp)); if (f) say(EG.propLine(fp));
      if (fp.st === 'Pending') say('It’s under contract (Pending) in our selection. I can note your interest in similar homes.');
      cards([fp.id]);
      say(fp.st === 'Pending' ? 'Would you like to see similar homes?' : 'Would you like me to arrange a showing for this one?');
      return { replies: R, ctx };
    }
    if (fp && hasCriteria(e) && e.prop) { ctx.focus = fp.id; say(EG.propLine(fp)); cards([fp.id]); return { replies: R, ctx }; }
    if (/tell me about (this|the) (property|home|house)|about this (property|home)/.test(t) && !fp) {
      const ids = ctx.lastResults.length ? ctx.lastResults.slice(0, 3) : pick(EG.PROPS.filter((x) => x.st === 'For Sale' && x.bd).sort((a, b) => b.p - a.p), 3);
      say('I’m happy to. Which property do you mean? Open one on the site, give me the address, or pick from these:'); cards(ids); ctx.awaiting = 'property'; return { replies: R, ctx };
    }

    // search / buying
    const hunting = hasCriteria(e) || /(home|house|listing|propert|condo|find|looking for|show me|options|available|what do you have)/.test(t) || wantBuy;
    if (hunting) {
      if (e.beds != null) ctx.beds = e.beds; if (e.max != null) ctx.max = e.max; if (e.min != null) ctx.min = e.min;
      if (e.area) ctx.area = e.area; if (e.lot) ctx.lot = true;
      if (e.area && NO_LISTING.includes(e.area)) { say(`I don’t have any listings in ${areaName(e.area)} in our current selection. We do have homes right now in Chenal, Pleasant Valley, Historic Downtown and a few areas beyond Little Rock. Want me to look there?`); ctx.area = null; return { replies: R, ctx }; }
      ctx.goal = ctx.goal || 'buy';
      const { hits, near } = search(ctx), c = critText(ctx);
      if (!hasCriteria(ctx) && !e.lot) {
        const all = EG.PROPS.filter((p) => p.st === 'For Sale' && p.bd).sort((a, b) => b.p - a.p), spread = [0, Math.floor(all.length / 3), Math.floor((2 * all.length) / 3), all.length - 1].map((i) => all[i].id);
        ctx.lastResults = spread;
        say(`Here are a few from our current selection, from higher-end to more approachable. We currently show ${all.length} homes for sale in this prototype.`); cards(spread);
        say('What budget and number of bedrooms are you thinking about? And do you have a neighborhood in mind?'); return { replies: R, ctx };
      }
      if (hits.length) {
        const show = hits.slice(0, 4); ctx.lastResults = show.map((p) => p.id);
        say(`I’d be happy to help. I found ${hits.length} listing${hits.length === 1 ? '' : 's'} in our current selection that may fit${c}.${hits.length > 4 ? ' Here are the first four:' : ''}`); cards(ctx.lastResults);
        if (!ctx.area) {
          const counts = {}; hits.forEach((p) => (counts[p.area] = (counts[p.area] || 0) + 1));
          const ks = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
          const nm = (k) => (k === 'beyond' ? 'other areas around Little Rock' : areaName(k));
          say(ks.length > 1 ? `Would you prefer to stay near ${areaName(ks[0] === 'beyond' ? ks[1] : ks[0])}, explore ${areaName(ks.find((k) => k !== ks[0] && k !== 'beyond') || ks[1])}, or consider ${ks.includes('beyond') ? 'other areas around Little Rock' : 'something different'}?` : `They’re all in ${nm(ks[0])}. Would you like details on any of them, or to widen the search?`);
        } else say('Would you like details on any of these, or shall I arrange a showing?');
      } else {
        say(`I don’t see a match in our current selection${c}.`);
        if (near.length) { ctx.lastResults = pick(near, 3); say('These are the closest options, just above that budget:'); cards(ctx.lastResults); }
        else say('You could widen the budget, lower the bedroom count, or try another neighborhood. The team may also know of homes that aren’t in this selection.');
        if (!near.length) offer('Contact agent', null, 'Would you like to share your contact details so the team can follow up with options?');
      }
      return { replies: R, ctx };
    }

    // simple answers to the last question
    if (ctx.awaiting === 'hood-confirm' && /^(yes|yeah|sure|ok|okay|please|yep)\b/.test(t)) { ctx.awaiting = null; return respond('show me homes' + (ctx.area ? ' in ' + areaName(ctx.area) : ''), ctx, env); }
    if (/^(yes|yeah|sure|ok|okay|please|yep)\b/.test(t) && ctx.focus) return respond('schedule a showing', ctx, env);
    if (/(just (browsing|looking|exploring)|not sure|exploring)/.test(t)) { say('That’s a great place to start. I can show homes from our current selection, describe neighborhoods, or explain how a valuation works. Which sounds most useful?'); return { replies: R, ctx }; }

    say('I don’t have that information, and I don’t want to guess. I can speak to the current listings, neighborhoods, the valuation process, and arranging a showing. For anything else, our team will know best.');
    offer('Contact agent', ctx.focus || null, 'Would you like to share your contact details so someone can follow up?');
    return { replies: R, ctx };
  }

  /* ---------- widget ---------- */
  function mount(opt) {
    opt = opt || {};
    const preview = !!opt.preview;
    if (document.getElementById('egChat')) return ui.chat;
    const root = document.createElement('div'); root.id = 'egChat'; root.className = 'eg-chat';
    root.innerHTML = `<button class="eg-fab" aria-label="Open the assistant" data-open><span class="dot" aria-hidden="true">E</span>Ask the assistant</button>
      <div class="eg-panel" role="dialog" aria-label="The Ellison Group assistant">
        <div class="eg-head"><span class="dot" aria-hidden="true">E</span><div class="t"><b>Ellison Assistant</b><span>SIMULATED AI · PROTOTYPE</span></div>
          <button data-min aria-label="Minimize">–</button><button data-close aria-label="Close">×</button></div>
        <div class="eg-sim">Simulated assistant: local mock logic, no AI service. ${preview ? 'Preview mode: nothing is saved.' : ''}</div>
        <div class="eg-msgs" role="log" aria-live="polite"></div>
        <div class="eg-chips" aria-label="Suggested questions"></div>
        <form class="eg-form"><input aria-label="Message" placeholder="Type your message…" autocomplete="off"><button aria-label="Send">→</button></form>
        <div class="eg-foot"><span>Not a person. No email or booking is sent.</span><button data-new type="button">Start over</button></div>
      </div>`;
    document.body.appendChild(root);
    const $ = (s) => root.querySelector(s), msgsEl = $('.eg-msgs'), input = $('.eg-form input');
    const local = { messages: [], ctx: {}, convId: null };
    let ctx, convId, busy = false;
    try { const s = JSON.parse(sessionStorage.getItem(SESSION) || 'null'); if (s && !preview) { ctx = s.ctx || {}; convId = s.convId; if (convId && !EG.getConv(convId)) convId = null; } } catch (e) { /* ignore */ }
    ctx = ctx || {};
    const persist = () => { if (!preview) try { sessionStorage.setItem(SESSION, JSON.stringify({ ctx, convId })); } catch (e) { /* ignore */ } };
    const S = () => EG.settings();
    const conv = () => (preview ? local : convId ? EG.getConv(convId) : null);
    const msgs = () => { const c = conv(); return c ? c.messages : []; };

    function ensureConv() {
      if (preview) return local;
      if (convId && EG.getConv(convId)) return EG.getConv(convId);
      const sl = EG.sessionLead();
      const c = EG.createConversation({ leadId: sl ? sl.id : null, propertyId: ctx.focus || null });
      convId = c.id; persist();
      EG.addMessage(c.id, { sender: 'bot', content: S().chatbot.welcome });
      if (sl) EG.addActivity(sl.id, 'chat', 'AI chatbot conversation started');
      return EG.getConv(convId);
    }
    function add(m) {
      if (preview) { local.messages.push(Object.assign({ id: EG.uid('m'), timestamp: Date.now(), messageType: 'text' }, m)); render(); return; }
      ensureConv(); EG.addMessage(convId, m);
    }
    const thumb = (p) => (typeof window.art === 'function' ? window.art(p.type, p.id) : '');
    const card = (p) => `<button class="eg-pc" data-prop="${p.id}" type="button"><span class="th">${thumb(p)}</span><span><b>${esc(p.addr)}</b><span>${p.bd ? `${p.bd} bd · ${p.ba} ba · ${p.sf.toLocaleString()} sf` : 'Vacant lot'} · ${p.st}</span><em>${money(p.p)}</em></span></button>`;

    function render() {
      const list = msgs(); const c = conv(); const last = list[list.length - 1];
      let h = '';
      const showWelcome = !list.length;
      if (showWelcome) h += `<div class="eg-m bot">${esc(S().chatbot.welcome)}</div>`;
      list.forEach((m) => {
        if (m.messageType === 'properties') { h += `<div class="eg-props">${(m.propIds || []).map(EG.prop).filter(Boolean).map(card).join('')}</div>`; return; }
        if (m.sender === 'system') { h += `<div class="eg-m system">${esc(m.content)}</div>`; return; }
        const who = m.sender === 'agent' ? `<small>${esc(EG.agentName(c && c.assignedAgent))} · team member (simulated)</small>` : '';
        h += `<div class="eg-m ${m.sender}">${who}${esc(m.content)}</div>`;
      });
      if (last && last.messageType === 'capture-offer' && last.intent && !(c && c.agentManaged)) {
        const g = S().capture.google;
        h += `<div class="eg-offer">${g ? '<button class="eg-btn solid" data-off="google">Continue with Google (simulated)</button>' : ''}<button class="eg-btn" data-off="form">Enter contact details</button>${last.intent === 'Valuation request' ? '<button class="eg-btn" data-off="valuation">Open valuation form</button>' : ''}<button class="eg-btn" data-off="browse">Continue browsing</button></div>`;
      }
      h += '<div class="eg-typing" aria-label="The assistant is typing"><i></i><i></i><i></i></div>';
      msgsEl.innerHTML = h;
      msgsEl.querySelectorAll('[data-prop]').forEach((b) => (b.onclick = () => { ctx.focus = +b.dataset.prop; persist(); ui.openProperty && ui.openProperty(+b.dataset.prop); }));
      msgsEl.querySelectorAll('[data-off]').forEach((b) => (b.onclick = () => offerClick(b.dataset.off, last)));
      msgsEl.scrollTop = msgsEl.scrollHeight;
      chips();
    }
    function chips() {
      const ch = $('.eg-chips'); const used = msgs().some((m) => m.sender === 'visitor');
      ch.style.display = used ? 'none' : '';
      ch.innerHTML = S().chatbot.prompts.map((p) => `<button type="button" data-q="${esc(p)}">${esc(p)}</button>`).join('');
      ch.querySelectorAll('button').forEach((b) => (b.onclick = () => send(b.dataset.q)));
    }
    const typing = (on) => { const t = msgsEl.querySelector('.eg-typing'); if (t) { t.classList.toggle('on', on); msgsEl.scrollTop = msgsEl.scrollHeight; } };
    const wait = (ms) => new Promise((r) => setTimeout(r, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms));

    function finalize(intent, pid, lead) {
      const p = EG.prop(pid), first = lead.name.split(' ')[0];
      const c = ensureConv();
      if (!preview) {
        if (!c.leadId) EG.updateConv(c.id, { leadId: lead.id });
        EG.addInquiry({ leadId: lead.id, propertyId: pid, type: intent, message: 'Requested through the AI chatbot conversation.', conversationId: c.id });
        EG.updateConv(c.id, { status: 'Needs Follow-up', propertyId: c.propertyId || pid || null }, `Chatbot conversation marked Needs Follow-up (${intent})`);
      }
      const what = { 'Showing request': `a showing request${p ? ' for ' + p.addr : ''}`, 'Contact agent': 'a request for an agent to contact you', 'Valuation request': 'a valuation request', 'Property question': 'your question' }[intent] || 'your request';
      add({ sender: 'bot', content: `Thanks, ${first}. I’ve logged ${what} for the team. This is a prototype, so no email was sent and no agent has been notified yet.${intent === 'Showing request' ? ' Which days and times work best for you?' : ''}` });
    }
    function offerClick(kind, last) {
      if (kind === 'browse') { add({ sender: 'bot', content: 'No problem. I’m here whenever you’d like to keep exploring.' }); return; }
      if (kind === 'valuation') { if (opt.onValuation) opt.onValuation(); else ui.toast('The valuation form is on the public site.'); return; }
      const c = ensureConv(), intent = last.intent, pid = last.propertyId;
      ui.openCapture({ start: kind, channel: 'chatbot', conversationId: preview ? null : c.id, propertyId: pid, intent, preview,
        onSuccess: (lead) => {
          add({ sender: 'system', content: `Contact details shared via ${kind === 'google' ? 'Google sign-in (simulated)' : 'contact form'}.` });
          finalize(intent, pid, preview ? { name: lead.name } : lead);
        } });
    }

    async function send(text) {
      text = (text || '').trim(); if (!text || busy) return;
      input.value = ''; busy = true;
      const c0 = conv();
      add({ sender: 'visitor', content: text });
      const c = conv();
      if (c && c.agentManaged) {
        const lastSys = msgs().slice(-2).some((m) => m.sender === 'system' && /passed to/.test(m.content));
        if (!lastSys) add({ sender: 'system', content: `Your message was passed to ${EG.agentName(c.assignedAgent)} (simulated). Replies will appear here.` });
        busy = false; return;
      }
      render(); typing(true); await wait(650 + Math.random() * 500);
      const sl = !preview && EG.sessionLead();
      if (sl && c && !c.leadId) EG.updateConv(c.id, { leadId: sl.id });
      const res = respond(text, ctx, { preview });
      persist();
      for (const r of res.replies) {
        if (r.t === 'text') add({ sender: 'bot', content: r.c });
        else if (r.t === 'props') { ctx.lastResults = r.ids; add({ sender: 'bot', content: '', messageType: 'properties', propIds: r.ids }); }
        else if (r.t === 'offer') add({ sender: 'bot', content: r.c, messageType: 'capture-offer', intent: r.intent, propertyId: r.propertyId });
        else if (r.t === 'action' && r.act === 'finalize') {
          const lead = sl || (preview ? { name: 'Visitor' } : null);
          if (lead) { add({ sender: 'system', content: `Using the details you shared earlier (${lead.email || 'preview'}).` }); finalize(r.intent, r.propertyId, lead); }
        }
        if (res.replies.length > 1) { render(); typing(true); await wait(380); }
      }
      persist(); typing(false); render(); busy = false;
    }

    /* open / close / minimize */
    const open = () => { root.classList.add('open'); root.classList.remove('min'); render(); setTimeout(() => input.focus(), 50); };
    root.querySelector('[data-open]').onclick = open;
    root.querySelector('[data-close]').onclick = () => root.classList.remove('open', 'min');
    root.querySelector('[data-min]').onclick = () => root.classList.toggle('min');
    root.querySelector('.eg-form').onsubmit = (e) => { e.preventDefault(); send(input.value); };
    root.querySelector('[data-new]').onclick = () => { if (preview) { local.messages = []; } else { convId = null; } ctx = {}; persist(); render(); ui.toast('Started a new conversation.'); };
    root.addEventListener('keydown', (e) => { if (e.key === 'Escape') root.classList.remove('open', 'min'); });
    if (!preview) EG.on(() => { apply(); if (root.classList.contains('open') && !busy) render(); });
    function apply() { root.style.display = S().chatbot.enabled ? '' : 'none'; }
    apply(); render();

    ui.chat = {
      open, root, apply, send,
      askAbout(pid) {
        const p = EG.prop(pid); if (!p) return; ctx.focus = pid; ctx.lastResults = [pid]; persist();
        open(); ensureConv();
        if (!preview) { const c = EG.getConv(convId); if (!c.propertyId) EG.updateConv(c.id, { propertyId: pid }); }
        add({ sender: 'bot', content: `I can help with ${p.addr}. ${EG.propLine(p)} What would you like to know?` });
      },
      reset() { local.messages = []; convId = null; ctx = {}; persist(); render(); }
    };
    return ui.chat;
  }
  ui.mountChat = mount;
  ui.chatRespond = respond;
})();
