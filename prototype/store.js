/* The Ellison Group — prototype data layer (shared by the public site and /admin).
   Mock data only. State lives in localStorage; nothing leaves the browser. */
(function (global) {
  'use strict';
  const KEY = 'eg_proto_state_v1';
  const SKEY = 'eg_proto_session_v1';
  const DAY = 864e5, HOUR = 36e5, MIN = 6e4;

  /* ---------- properties (same records as the public site) ---------- */
  const PROPS = [
    { id: 1, addr: '6916 Westridge Road', loc: 'Little Rock, AR 72223', area: 'chenal', bd: 5, ba: 5, sf: 6777, p: 1395000, st: 'For Sale', type: 'stone', pt: 'Estate home' },
    { id: 2, addr: '31 La Scala Court', loc: 'Little Rock, AR 72212', area: 'pleasant', bd: 3, ba: 3, sf: 3550, p: 899900, st: 'For Sale', type: 'stucco', pt: 'Single-family' },
    { id: 3, addr: '277 Pleasant Valley Drive', loc: 'Little Rock, AR 72212', area: 'pleasant', bd: 4, ba: 4, sf: 3400, p: 750000, st: 'Pending', type: 'brick', pt: 'Single-family' },
    { id: 4, addr: '69 Valley Estates Cove', loc: 'Little Rock, AR 72212', area: 'pleasant', bd: 5, ba: 5, sf: 5900, p: 749900, st: 'For Sale', type: 'columns', pt: 'Single-family' },
    { id: 5, addr: '301 Valley Club Circle', loc: 'Little Rock, AR 72212', area: 'pleasant', bd: 4, ba: 4, sf: 3370, p: 679900, st: 'For Sale', type: 'brick', pt: 'Single-family' },
    { id: 6, addr: '1820 Main Street', loc: 'Little Rock, AR 72206', area: 'downtown', bd: 5, ba: 3, sf: 4583, p: 675000, st: 'For Sale', type: 'porch', pt: 'Historic home' },
    { id: 7, addr: '16 Robinwood Drive', loc: 'Little Rock, AR 72227', area: 'beyond', bd: 4, ba: 3, sf: 3248, p: 565000, st: 'Pending', type: 'ranch', pt: 'Ranch' },
    { id: 8, addr: '15 El Dorado Drive', loc: 'Little Rock, AR 72212', area: 'pleasant', bd: 4, ba: 3, sf: 3176, p: 499900, st: 'For Sale', type: 'stucco', pt: 'Single-family' },
    { id: 9, addr: '315 Rock Street, Unit 1706', loc: 'Little Rock, AR 72202', area: 'downtown', bd: 2, ba: 2, sf: 1362, p: 400000, st: 'Pending', type: 'tower', pt: 'Condo' },
    { id: 10, addr: '2311 S Louisiana Street', loc: 'Little Rock, AR 72206', area: 'downtown', bd: 3, ba: 3, sf: 2240, p: 330000, st: 'For Sale', type: 'porch', pt: 'Historic home' },
    { id: 11, addr: '14112 John Branch Road', loc: 'Scott, AR 72142', area: 'beyond', bd: 3, ba: 2, sf: 1634, p: 279000, st: 'Pending', type: 'ranch', pt: 'Ranch' },
    { id: 12, addr: '25 Wolfsbridge Loop', loc: 'Little Rock, AR 72227', area: 'beyond', bd: 3, ba: 3, sf: 1497, p: 260000, st: 'Pending', type: 'stucco', pt: 'Single-family' },
    { id: 13, addr: '3 Shaun Road', loc: 'Mayflower, AR 72106', area: 'beyond', bd: 3, ba: 2, sf: 1565, p: 232500, st: 'For Sale', type: 'ranch', pt: 'Ranch' },
    { id: 14, addr: '38 Chalet Street', loc: 'Cabot, AR 72023', area: 'beyond', bd: 3, ba: 2, sf: 1211, p: 192000, st: 'For Sale', type: 'ranch', pt: 'Ranch' },
    { id: 15, addr: 'Lot 152 Woodlawn Drive', loc: 'Fairfield Bay, AR 72088', area: 'beyond', bd: 0, ba: 0, sf: 0, p: 4000, st: 'For Sale', type: 'lot', pt: 'Land' },
    { id: 16, addr: 'Lot 86 Lynn Creek Drive', loc: 'Fairfield Bay, AR 72088', area: 'beyond', bd: 0, ba: 0, sf: 0, p: 4000, st: 'For Sale', type: 'lot', pt: 'Land' }
  ];
  const AREAS = {
    all: { n: 'Little Rock', k: 'Six neighborhoods', d: 'Six neighborhoods, one team that knows them. Select one on the map to see what makes it different.', c: [] },
    heights: { n: 'The Heights', k: 'Neighborhood', d: 'A village-scale pocket west of downtown, known for walkable streets and established homes. Concept copy: to be replaced with Kerry’s own words.', c: ['Walkable', 'Established', 'Close to downtown'] },
    hillcrest: { n: 'Hillcrest', k: 'Neighborhood', d: 'Tree-lined streets and character architecture just north of downtown. Concept copy: to be replaced with Kerry’s own words.', c: ['Character homes', 'Mature trees', 'Central'] },
    downtown: { n: 'Historic Downtown', k: 'Neighborhood', d: 'Porches, history and proximity to the river and the city’s core. Concept copy: to be replaced with Kerry’s own words.', c: ['Historic', 'Porches', 'Urban access'] },
    chenal: { n: 'Chenal', k: 'Neighborhood', d: 'Larger homes, landscaped lots and room to spread out in West Little Rock. Concept copy: to be replaced with Kerry’s own words.', c: ['Spacious', 'Landscaped', 'West Little Rock'] },
    maumelle: { n: 'Maumelle', k: 'Neighborhood', d: 'A planned community northwest of the river with a quieter pace. Concept copy: to be replaced with Kerry’s own words.', c: ['Quiet', 'Planned community', 'Family-friendly'] },
    pleasant: { n: 'Pleasant Valley', k: 'Neighborhood', d: 'Brick homes, golf-course views and generous floor plans in the 72212 area. Concept copy: to be replaced with Kerry’s own words.', c: ['Golf views', 'Brick homes', 'Larger floor plans'] }
  };
  const AREA_LABEL = { chenal: 'Chenal', pleasant: 'Pleasant Valley', downtown: 'Historic Downtown', beyond: 'Beyond Little Rock' };

  const AGENTS = [
    { id: 'kerry', name: 'Kerry Ellison', role: 'Principal Broker' },
    { id: 'angela', name: 'Angela Stowell', role: 'Executive Broker | Agent' },
    { id: 'james', name: 'James Kirk', role: 'REALTOR®' }
  ];
  const STATUSES = ['New', 'Contacted', 'Qualified', 'Appointment Scheduled', 'Nurturing', 'Converted', 'Lost'];
  const CONV_STATUSES = ['Active', 'Needs Follow-up', 'Handed to Agent', 'Closed'];
  const SOURCE_LABEL = { google: 'Google sign-in (simulated)', form: 'Contact form', chatbot: 'AI chatbot (simulated)' };
  const SOURCE_SHORT = { google: 'Google sign-in', form: 'Contact form', chatbot: 'AI chatbot' };
  const INQ_TYPES = ['Showing request', 'Property question', 'Contact agent', 'Saved property', 'Valuation request', 'General'];

  /* ---------- utilities ---------- */
  const uid = (p) => p + '_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '$' + Number(n).toLocaleString('en-US');
  const normEmail = (e) => String(e || '').trim().toLowerCase();
  const fmtDate = (t) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const fmtTime = (t) => new Date(t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const fmtDT = (t) => fmtDate(t) + ' · ' + fmtTime(t);
  const rel = (t) => {
    const d = Date.now() - t, a = Math.abs(d), f = d < 0;
    let s;
    if (a < MIN) return 'just now';
    if (a < HOUR) s = Math.round(a / MIN) + ' min';
    else if (a < DAY) s = Math.round(a / HOUR) + ' hr';
    else if (a < 30 * DAY) s = Math.round(a / DAY) + ' d';
    else s = Math.round(a / (30 * DAY)) + ' mo';
    return f ? 'in ' + s : s + ' ago';
  };
  const prop = (id) => PROPS.find((p) => p.id === +id) || null;
  const agent = (id) => AGENTS.find((a) => a.id === id) || null;
  const agentName = (id) => (agent(id) ? agent(id).name : 'Unassigned');
  const propLine = (p) => p.bd
    ? `${p.addr}, ${p.loc}: ${p.bd} beds, ${p.ba} baths, ${p.sf.toLocaleString()} sq ft, listed at ${money(p.p)} (${p.st}).`
    : `${p.addr}, ${p.loc}: vacant lot, listed at ${money(p.p)} (${p.st}).`;

  /* ---------- defaults ---------- */
  const DEFAULT_SETTINGS = () => ({
    capture: {
      enabled: true,
      google: true,
      triggers: { showing: true, ask: true, save: true, contact: true, assistant: false },
      headline: 'Find your place with us.',
      description: 'Tell us a little about yourself so our team can help you explore this property and find the right home.',
      required: { name: true, email: true, phone: true }
    },
    chatbot: {
      enabled: true,
      welcome: 'Welcome to The Ellison Group. I’m here to help you explore homes, learn about Little Rock neighborhoods, and arrange a conversation with our team. What brings you here today?',
      prompts: [
        'Show me homes in Little Rock.',
        'Tell me about this property.',
        'Help me find the right neighborhood.',
        'I’m thinking about selling my home.',
        'I’d like to schedule a showing.',
        'Connect me with an agent.'
      ]
    },
    admin: { agent: 'kerry' }
  });

  /* ---------- seed ---------- */
  function seed() {
    const now = Date.now();
    const at = (daysAgo) => now - daysAgo * DAY;
    const L = [];
    // [name, source, status, score, agent, props, daysAgo, intent, note]
    const T = [
      ['Avery Collins', 'google', 'Nurturing', 58, 'angela', [8], 38, 'Property question', 'Browsing Pleasant Valley. Wants a heads-up on new listings.'],
      ['Marcus Delaney', 'google', 'Qualified', 84, 'kerry', [1], 3, 'Showing request', 'Relocating for work. Says he is pre-approved; confirm lender before the showing.'],
      ['Priya Raman', 'chatbot', 'New', 63, '', [8, 10], 0.2, 'Property question', ''],
      ['Tomas Berg', 'form', 'Appointment Scheduled', 88, 'james', [4], 5, 'Showing request', 'Showing booked for this weekend. Needs a large yard.'],
      ['Lena Whitfield', 'form', 'Contacted', 66, 'angela', [6], 6, 'Contact agent', 'Prefers phone calls in the evening.'],
      ['Daniel Okoye', 'chatbot', 'Qualified', 79, 'kerry', [2], 4, 'Showing request', 'Interested in La Scala Court. Asked about HOA and school zones.'],
      ['Hannah Pruitt', 'google', 'New', 55, '', [5], 1, 'Saved property', ''],
      ['Ravi Menon', 'form', 'Converted', 96, 'kerry', [3], 40, 'Showing request', 'Offer accepted. Closing coordination in progress.'],
      ['Cecilia Duarte', 'form', 'Nurturing', 47, 'james', [13, 14], 33, 'Property question', 'First-time buyer, saving for down payment. Check in monthly.'],
      ['Owen Blackwell', 'chatbot', 'Contacted', 61, 'james', [10], 8, 'Property question', 'Left voicemail. Likes historic homes.'],
      ['Sophie Lindqvist', 'google', 'New', 52, '', [6], 0.8, 'Saved property', ''],
      ['Grant Holloway', 'form', 'Lost', 22, 'angela', [11], 52, 'Property question', 'Chose another agency.'],
      ['Mei-Ling Zhou', 'form', 'Qualified', 81, 'kerry', [], 9, 'Valuation request', 'Selling a Chenal-area home in spring. Wants a personal valuation.'],
      ['Jerome Baptiste', 'chatbot', 'New', 58, '', [4, 5], 1.5, 'Showing request', ''],
      ['Naomi Eastwood', 'google', 'Contacted', 64, 'angela', [9], 12, 'Property question', 'Downsizing. The condo went pending; sending similar options.'],
      ['Caleb Strand', 'form', 'Nurturing', 44, 'james', [7], 44, 'Contact agent', 'Timing is 6+ months out.'],
      ['Imani Rhodes', 'google', 'Appointment Scheduled', 85, 'kerry', [1, 4], 7, 'Showing request', 'Touring two homes on the same day.'],
      ['Felix Moreau', 'chatbot', 'Contacted', 57, 'angela', [8], 10, 'Property question', ''],
      ['Greta Lund', 'form', 'New', 49, '', [], 2, 'Valuation request', ''],
      ['Omar Haddad', 'form', 'Qualified', 77, 'kerry', [2, 3], 15, 'Showing request', 'Comparing Pleasant Valley homes. Wants comps.'],
      ['Beatrice Cole', 'google', 'Lost', 28, 'james', [12], 45, 'Property question', 'Not responding after three attempts.'],
      ['Isaac Navarro', 'chatbot', 'Nurturing', 51, 'angela', [10], 36, 'Property question', ''],
      ['Willa Fenn', 'form', 'Converted', 93, 'angela', [14], 55, 'Showing request', 'Closed. Asked for a referral card.'],
      ['Declan Ashworth', 'google', 'Contacted', 68, 'kerry', [1], 11, 'Contact agent', 'Asked for the seller disclosures.'],
      ['Tessa Valdez', 'chatbot', 'New', 54, '', [13], 3, 'Property question', ''],
      ['Julian Park', 'form', 'Contacted', 62, 'james', [8], 14, 'Showing request', 'Showing happened; awaiting feedback.'],
      ['Yara Costa', 'google', 'Qualified', 73, 'angela', [6, 10], 35, 'Property question', 'Likes porches and walkability.'],
      ['Bram Hendriks', 'form', 'Nurturing', 41, 'james', [], 30, 'Valuation request', 'Wants a valuation after the school year ends.'],
      ['Odette Marsh', 'chatbot', 'Contacted', 59, 'kerry', [4], 41, 'Property question', ''],
      ['Silas Kane', 'google', 'New', 50, '', [5], 4, 'Showing request', '']
    ];
    const slug = (n) => n.toLowerCase().replace(/[^a-z]+/g, '.');
    T.forEach((t, i) => {
      const created = at(t[6]);
      const lastAct = t[2] === 'New' ? created + 5 * MIN : created + Math.min(t[6] * DAY * 0.6, 12 * DAY) + 2 * HOUR;
      L.push({
        id: 'lead_s' + (i + 1), name: t[0], email: slug(t[0]) + '@example.com', phone: '(501) 555-01' + String(10 + i).slice(-2),
        source: t[1], captureMethod: t[1] === 'chatbot' ? 'form' : t[1], status: t[2], score: t[3], assignedAgent: t[4],
        interestedPropertyIds: t[5].slice(), savedPropertyIds: t[7] === 'Saved property' ? t[5].slice() : [],
        createdAt: created, lastActivityAt: Math.min(lastAct, now - 5 * MIN), intent: t[7],
        notes: t[8] ? [{ id: 'n_s' + i, text: t[8], author: t[4] ? agentName(t[4]) : 'Kerry Ellison', ts: created + 3 * HOUR }] : [],
        tasks: [], consentStatus: 'Consented (demo data)', contactMethod: ['Email', 'Phone', 'Text'][i % 3]
      });
    });
    const byName = (n) => L.find((l) => l.name === n);
    const task = (n, text, dueDays) => byName(n).tasks.push({ id: uid('t'), text, due: at(-dueDays), done: false });
    task('Marcus Delaney', 'Send Chenal comps before the showing', 1);
    task('Tomas Berg', 'Confirm Saturday showing time', 0);
    task('Daniel Okoye', 'Call back about La Scala Court HOA', -1);
    task('Mei-Ling Zhou', 'Prepare valuation packet', 2);
    task('Imani Rhodes', 'Send driving route for two-home tour', 3);
    task('Omar Haddad', 'Pull Pleasant Valley comps', 1);
    task('Lena Whitfield', 'Evening call about 1820 Main Street', -1);
    task('Declan Ashworth', 'Send seller disclosures for Westridge Road', 2);

    // inquiries
    const inquiries = [];
    L.forEach((l) => {
      const pid = l.interestedPropertyIds[0] || null;
      const type = l.intent || 'General';
      const when = l.createdAt + 4 * MIN;
      const st = l.status === 'New' ? 'New' : (l.status === 'Appointment Scheduled' ? 'Scheduled' : 'Responded');
      inquiries.push({
        id: uid('inq'), leadId: l.id, propertyId: pid, inquiryType: type,
        message: type === 'Showing request' ? 'I would like to see this home. Weekday afternoons work best.' : type === 'Valuation request' ? 'Please prepare a valuation for my home.' : type === 'Saved property' ? 'Saved from the listing page.' : type === 'Contact agent' ? 'Please have an agent contact me about this home.' : 'Could you tell me more about this property?',
        preferredShowingDate: type === 'Showing request' ? new Date(when + 6 * DAY).toISOString().slice(0, 10) + ' 14:00' : '',
        status: st, createdAt: when
      });
      if (l.interestedPropertyIds.length > 1) {
        inquiries.push({ id: uid('inq'), leadId: l.id, propertyId: l.interestedPropertyIds[1], inquiryType: 'Property question', message: 'Also curious about this one. How does it compare?', preferredShowingDate: '', status: 'Responded', createdAt: when + Math.min(2 * DAY, (now - when) / 2) });
      }
    });

    // conversations (messages composed from the same property data the engine uses)
    const conversations = [];
    let mseq = 0;
    const msg = (sender, content, ts, type, extra) => Object.assign({ id: 'm_s' + (++mseq), sender, content, timestamp: ts, messageType: type || 'text' }, extra || {});
    const WELCOME = DEFAULT_SETTINGS().chatbot.welcome;
    function conv(lead, flavor, status, agentId, daysAgo, pid, unread) {
      const t0 = lead ? lead.createdAt - 12 * MIN : at(daysAgo);
      const p = prop(pid);
      const m = [msg('bot', WELCOME, t0, 'text')];
      let t = t0 + 40 * 1000;
      const add = (s, c, ty, ex) => { m.push(msg(s, c, t, ty, ex)); t += 55 * 1000; };
      if (flavor === 'search') {
        const ids = PROPS.filter((x) => x.st === 'For Sale' && x.bd >= 3 && x.p <= 500000).map((x) => x.id);
        add('visitor', 'I’m looking for a home under $500,000 with at least three bedrooms.');
        add('bot', `I’d be happy to help. I found ${ids.length} listings in our current selection that may fit your budget. Would you prefer to stay near Pleasant Valley, explore Historic Downtown, or consider other areas around Little Rock?`);
        add('bot', '', 'properties', { propIds: ids });
        add('visitor', `Tell me about ${p.addr}.`);
        add('bot', propLine(p) + ' Would you like me to arrange a showing for this one?');
      } else if (flavor === 'showing') {
        add('visitor', `What can you tell me about ${p.addr}?`);
        add('bot', propLine(p) + ' Would you like me to arrange a showing for this one?');
        add('visitor', 'Yes, I’d like to schedule a showing.');
        add('bot', 'I can help arrange a viewing. Would you like to share your contact details so the team can follow up about this property?', 'capture-offer');
        add('system', 'Contact details shared via contact form (simulated).');
        add('bot', `Thanks, ${lead.name.split(' ')[0]}. I’ve logged a showing request for ${p.addr}. This is a prototype, so no email was sent and no agent has been notified yet.`);
      } else if (flavor === 'sell') {
        add('visitor', 'I’m thinking about selling my home. What does the process look like?');
        add('bot', 'Happy to explain. The valuation request on this site has three short steps: your address, a few details about the home, and how to reach you. A member of the team then prepares the valuation personally. I can’t estimate a price myself. Would you like to share your contact details?', 'capture-offer');
      } else if (flavor === 'browse') {
        add('visitor', 'Which neighborhood has the most character?');
        add('bot', 'Hillcrest and Historic Downtown are both known for character homes. I don’t have listings in Hillcrest in the current selection, but Historic Downtown has a few. Want to see them?');
        add('visitor', 'Maybe later, thanks.');
        add('bot', 'Of course. I’m here whenever you’d like to continue.');
      } else {
        add('visitor', `Is ${p.addr} still available?`);
        add('bot', propLine(p) + (p.st === 'Pending' ? ' It currently shows as Pending, so I can’t promise availability. I can note your interest in similar homes.' : ' Would you like me to arrange a showing for this one?'));
        add('visitor', 'Please have someone call me.');
        add('bot', 'Absolutely. Would you like to share your contact details so the team can follow up?', 'capture-offer');
      }
      if (status === 'Handed to Agent') m.push(msg('system', `${agentName(agentId)} has taken over this conversation (simulated).`, t, 'text'));
      const c = {
        id: uid('conv'), leadId: lead ? lead.id : null, propertyId: pid || null, status, assignedAgent: agentId || '',
        messages: m, notes: [], createdAt: t0, lastActivityAt: m[m.length - 1].timestamp, unread: !!unread, agentManaged: status === 'Handed to Agent'
      };
      conversations.push(c);
      return c;
    }
    conv(byName('Priya Raman'), 'search', 'Needs Follow-up', '', 0, 8, true);
    conv(byName('Daniel Okoye'), 'showing', 'Handed to Agent', 'kerry', 0, 2);
    conv(byName('Owen Blackwell'), 'info', 'Active', 'james', 0, 10);
    conv(byName('Jerome Baptiste'), 'showing', 'Needs Follow-up', '', 0, 4, true);
    conv(byName('Felix Moreau'), 'info', 'Closed', 'angela', 0, 8);
    conv(byName('Isaac Navarro'), 'info', 'Active', 'angela', 0, 10);
    conv(byName('Tessa Valdez'), 'info', 'Needs Follow-up', '', 0, 13, true);
    conv(byName('Odette Marsh'), 'showing', 'Closed', 'kerry', 0, 4);
    conv(null, 'browse', 'Active', '', 1.2, null);
    conv(null, 'sell', 'Needs Follow-up', '', 6, null);
    conversations.sort((a, b) => b.lastActivityAt - a.lastActivityAt);
    // link conversations to leads' interested properties already set above

    // activities
    const activities = [];
    const act = (leadId, type, description, ts) => activities.push({ id: uid('act'), leadId, type, description, timestamp: ts });
    L.forEach((l) => {
      const p = prop(l.interestedPropertyIds[0]);
      act(l.id, 'lead_created', `Lead captured via ${SOURCE_LABEL[l.source]}${p ? ' on ' + p.addr : ''}`, l.createdAt);
      act(l.id, 'inquiry', `${l.intent || 'General'} submitted${p ? ' for ' + p.addr : ''}`, l.createdAt + 4 * MIN);
      if (l.status !== 'New') act(l.id, 'status_change', `Status changed to ${l.status}${l.assignedAgent ? ' by ' + agentName(l.assignedAgent) : ''}`, l.createdAt + 5 * HOUR);
      if (l.assignedAgent) act(l.id, 'assignment', `Assigned to ${agentName(l.assignedAgent)}`, l.createdAt + 2 * HOUR);
    });
    conversations.forEach((c) => { if (c.leadId) act(c.leadId, 'chat', 'AI chatbot conversation linked to lead', c.createdAt + 4 * MIN); });
    activities.sort((a, b) => b.timestamp - a.timestamp);

    return { version: 1, seededAt: now, leads: L, inquiries, conversations, activities, settings: DEFAULT_SETTINGS() };
  }

  /* ---------- state + persistence ---------- */
  let S = null;
  const subs = new Set();
  function valid(o) { return o && o.version === 1 && Array.isArray(o.leads) && Array.isArray(o.inquiries) && Array.isArray(o.conversations) && Array.isArray(o.activities) && o.settings; }
  function mergeSettings(s) {
    const d = DEFAULT_SETTINGS();
    const m = Object.assign({}, d, s || {});
    m.capture = Object.assign({}, d.capture, (s && s.capture) || {});
    m.capture.triggers = Object.assign({}, d.capture.triggers, (s && s.capture && s.capture.triggers) || {});
    m.capture.required = Object.assign({}, d.capture.required, (s && s.capture && s.capture.required) || {});
    m.chatbot = Object.assign({}, d.chatbot, (s && s.chatbot) || {});
    if (!Array.isArray(m.chatbot.prompts)) m.chatbot.prompts = d.chatbot.prompts;
    m.admin = Object.assign({}, d.admin, (s && s.admin) || {});
    return m;
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const o = JSON.parse(raw); if (valid(o)) { o.settings = mergeSettings(o.settings); return o; } }
    } catch (e) { /* fall through to seed */ }
    const s = seed();
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* storage unavailable: stay in memory */ }
    return s;
  }
  function state() { if (!S) S = load(); return S; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } emit(); }
  function emit() { subs.forEach((f) => { try { f(S); } catch (e) { console.error(e); } }); }
  function on(f) { subs.add(f); return () => subs.delete(f); }
  global.addEventListener('storage', (e) => {
    if (e.key === KEY || e.key === null) { S = null; state(); emit(); }
    if (e.key === SKEY) emit();
  });

  function reset() {
    S = seed();
    try { localStorage.setItem(KEY, JSON.stringify(S)); localStorage.removeItem(SKEY); sessionStorage.removeItem('eg_proto_chat_v1'); } catch (e) { /* ignore */ }
    emit();
  }

  /* ---------- session (public visitor) ---------- */
  function session() { try { const o = JSON.parse(localStorage.getItem(SKEY) || 'null'); return o && o.leadId ? o : null; } catch (e) { return null; } }
  function setSession(leadId, method) { try { localStorage.setItem(SKEY, JSON.stringify({ leadId, method, at: Date.now() })); } catch (e) { /* ignore */ } emit(); }
  function clearSession() { try { localStorage.removeItem(SKEY); sessionStorage.removeItem('eg_proto_chat_v1'); } catch (e) { /* ignore */ } emit(); }
  function sessionLead() { const s = session(); return s ? getLead(s.leadId) : null; }

  /* ---------- accessors / mutations ---------- */
  const getLead = (id) => state().leads.find((l) => l.id === id) || null;
  const findLeadByEmail = (e) => state().leads.find((l) => normEmail(l.email) === normEmail(e)) || null;
  function addActivity(leadId, type, description) {
    state().activities.unshift({ id: uid('act'), leadId: leadId || null, type, description, timestamp: Date.now() });
  }
  function touch(lead) { lead.lastActivityAt = Date.now(); }

  function captureLead(o) {
    const s = state(), now = Date.now();
    const method = o.method === 'google' ? 'google' : 'form';
    const source = o.channel === 'chatbot' ? 'chatbot' : method;
    const p = prop(o.propertyId);
    let lead = findLeadByEmail(o.email), isNew = false;
    if (!lead) {
      isNew = true;
      const base = { google: 55, form: 50, chatbot: 52 }[source] + (/Showing/.test(o.intent || '') ? 15 : 0) + (o.phone ? 4 : 0);
      lead = {
        id: uid('lead'), name: String(o.name || '').trim(), email: normEmail(o.email), phone: String(o.phone || '').trim(),
        source, captureMethod: method, status: 'New', score: Math.min(base, 99), assignedAgent: '',
        interestedPropertyIds: [], savedPropertyIds: [], createdAt: now, lastActivityAt: now, intent: o.intent || '',
        notes: [], tasks: [], consentStatus: 'Consented (prototype) ' + fmtDate(now), contactMethod: o.contactMethod || ''
      };
      s.leads.unshift(lead);
      addActivity(lead.id, 'lead_created', `Lead captured via ${SOURCE_LABEL[source]}${method !== source ? ' (' + SOURCE_SHORT[method] + ')' : ''}${p ? ' on ' + p.addr : ''}`);
    } else {
      if (!lead.name && o.name) lead.name = o.name;
      if (!lead.phone && o.phone) lead.phone = o.phone;
      if (o.contactMethod) lead.contactMethod = o.contactMethod;
      touch(lead);
      addActivity(lead.id, 'lead_matched', `Returning visitor matched by email via ${SOURCE_SHORT[method]}${p ? ' on ' + p.addr : ''}`);
    }
    if (p && !lead.interestedPropertyIds.includes(p.id)) lead.interestedPropertyIds.push(p.id);
    if (o.conversationId) {
      const c = s.conversations.find((x) => x.id === o.conversationId);
      if (c) { c.leadId = lead.id; if (p && !c.propertyId) c.propertyId = p.id; addActivity(lead.id, 'chat', 'AI chatbot conversation linked to lead'); }
    }
    save();
    return { lead, isNew };
  }

  function addInquiry(o) {
    const s = state(), lead = getLead(o.leadId), p = prop(o.propertyId);
    const inq = {
      id: uid('inq'), leadId: o.leadId, propertyId: p ? p.id : null, inquiryType: o.type || 'General', message: o.message || '',
      preferredShowingDate: o.preferredShowingDate || '', status: 'New', createdAt: Date.now(), conversationId: o.conversationId || null
    };
    s.inquiries.unshift(inq);
    if (lead) {
      if (p && !lead.interestedPropertyIds.includes(p.id)) lead.interestedPropertyIds.push(p.id);
      lead.score = Math.min(100, lead.score + (inq.inquiryType === 'Showing request' ? 12 : 5));
      if (!lead.intent) lead.intent = inq.inquiryType;
      touch(lead);
      addActivity(lead.id, 'inquiry', `${inq.inquiryType} submitted${p ? ' for ' + p.addr : ''}`);
    }
    save();
    return inq;
  }

  function saveProperty(leadId, propertyId) {
    const lead = getLead(leadId), p = prop(propertyId);
    if (!lead || !p) return false;
    lead.savedPropertyIds = lead.savedPropertyIds || [];
    const had = lead.savedPropertyIds.includes(p.id);
    if (had) lead.savedPropertyIds = lead.savedPropertyIds.filter((x) => x !== p.id);
    else {
      lead.savedPropertyIds.push(p.id);
      if (!lead.interestedPropertyIds.includes(p.id)) lead.interestedPropertyIds.push(p.id);
      lead.score = Math.min(100, lead.score + 3);
    }
    touch(lead);
    addActivity(lead.id, 'saved', `${had ? 'Removed saved property' : 'Saved property'} ${p.addr}`);
    save();
    return !had;
  }

  function updateLead(id, patch, desc) {
    const l = getLead(id); if (!l) return null;
    Object.assign(l, patch); touch(l);
    if (desc) addActivity(id, 'update', desc);
    save(); return l;
  }
  function deleteLead(id) {
    const s = state(), l = getLead(id); if (!l) return;
    s.leads = s.leads.filter((x) => x.id !== id);
    s.inquiries = s.inquiries.filter((x) => x.leadId !== id);
    s.activities = s.activities.filter((x) => x.leadId !== id);
    s.conversations.forEach((c) => { if (c.leadId === id) c.leadId = null; });
    s.activities.unshift({ id: uid('act'), leadId: null, type: 'delete', description: `Demo lead ${l.name} deleted`, timestamp: Date.now() });
    const ss = session(); if (ss && ss.leadId === id) clearSession();
    save();
  }
  function addNote(leadId, text, author) {
    const l = getLead(leadId); if (!l) return;
    l.notes.unshift({ id: uid('n'), text, author: author || 'Admin', ts: Date.now() });
    touch(l); addActivity(leadId, 'note', 'Internal note added'); save();
  }
  function addTask(leadId, text, due) {
    const l = getLead(leadId); if (!l) return;
    l.tasks.push({ id: uid('t'), text, due, done: false });
    addActivity(leadId, 'task', `Follow-up reminder added: ${text}`); save();
  }
  function toggleTask(leadId, taskId) {
    const l = getLead(leadId); const t = l && l.tasks.find((x) => x.id === taskId); if (!t) return;
    t.done = !t.done; addActivity(leadId, 'task', `Follow-up ${t.done ? 'completed' : 'reopened'}: ${t.text}`); save();
  }

  /* conversations */
  const getConv = (id) => state().conversations.find((c) => c.id === id) || null;
  function createConversation(o) {
    const c = { id: uid('conv'), leadId: o.leadId || null, propertyId: o.propertyId || null, status: 'Active', assignedAgent: '', messages: [], notes: [], createdAt: Date.now(), lastActivityAt: Date.now(), unread: false, agentManaged: false };
    state().conversations.unshift(c); save(); return c;
  }
  function addMessage(convId, m) {
    const c = getConv(convId); if (!c) return null;
    const msg = Object.assign({ id: uid('m'), timestamp: Date.now(), messageType: 'text' }, m);
    c.messages.push(msg); c.lastActivityAt = msg.timestamp;
    if (msg.sender === 'visitor') c.unread = true;
    save(); return msg;
  }
  function updateConv(id, patch, leadActivity) {
    const c = getConv(id); if (!c) return null;
    Object.assign(c, patch); c.lastActivityAt = Date.now();
    if (c.leadId && leadActivity) addActivity(c.leadId, 'chat', leadActivity);
    save(); return c;
  }

  /* settings */
  const settings = () => state().settings;
  function setSettings(fn) { fn(state().settings); save(); }
  function resetSettings() { state().settings = DEFAULT_SETTINGS(); save(); }

  /* demo helper: simulate an incoming visitor lead for live-update demos */
  function simulateVisitorLead() {
    const names = ['Rowan Pierce', 'Maribel Soto', 'Everett Lang', 'Noor Siddiqui', 'Callum Reeve', 'Amara Okafor'];
    const n = names[Math.floor(Math.random() * names.length)];
    const open = PROPS.filter((p) => p.st === 'For Sale' && p.bd);
    const p = open[Math.floor(Math.random() * open.length)];
    const email = n.toLowerCase().replace(/[^a-z]+/g, '.') + '.' + Math.floor(Math.random() * 90 + 10) + '@example.com';
    const r = captureLead({ name: n, email, phone: '(501) 555-01' + Math.floor(Math.random() * 90 + 10), method: Math.random() > .5 ? 'google' : 'form', propertyId: p.id, intent: 'Showing request' });
    addInquiry({ leadId: r.lead.id, propertyId: p.id, type: 'Showing request', message: 'Simulated incoming visitor for demo purposes.' });
    return r.lead;
  }

  global.EG = {
    KEY, SKEY, PROPS, AREAS, AREA_LABEL, AGENTS, STATUSES, CONV_STATUSES, SOURCE_LABEL, SOURCE_SHORT, INQ_TYPES,
    uid, esc, money, normEmail, fmtDate, fmtTime, fmtDT, rel, prop, agent, agentName, propLine,
    get: state, save, on, reset, session, setSession, clearSession, sessionLead,
    getLead, findLeadByEmail, captureLead, addInquiry, saveProperty, updateLead, deleteLead, addNote, addTask, toggleTask, addActivity,
    getConv, createConversation, addMessage, updateConv, settings, setSettings, resetSettings, defaults: DEFAULT_SETTINGS, simulateVisitorLead,
    ui: {}
  };
})(window);
