// The demo's clock and vans. A pure model: the page reads it and draws it.
// Times are minutes since midnight. Vans drive in a straight line at a town
// speed (the road is ~1.3x the straight line, at 30 km/h), stop 8 minutes at
// each customer, and Van 1 waits at each door for the visitor to deliver
// (or delivers by itself after a while, so the day never stalls).

export const START = 8 * 60 + 20;
export const END = 11 * 60;
const SERVICE = 8;
const VISITOR_WAIT = 14;
const LATE_AFTER = 5;

export function km(a, b) {
  const R = 6371, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export const driveMinutes = (a, b) => Math.max(3, Math.round(km(a, b) * 1.3 / 30 * 60));
export const hhmm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };

/** Time windows that fit the drive: each customer's window holds their normal arrival; Van 2's late stop is set tight. */
function planWindows(day) {
  for (const v of day.vans) {
    let t = 8 * 60 + 30, pos = day.depot;
    v.stops.forEach((s, i) => {
      t += driveMinutes(pos, s);
      const eta = t;
      const from = Math.floor((eta - 25) / 15) * 15;
      let to = from + 75;
      if (v.delayLeg === i) to = Math.ceil((eta + 10) / 5) * 5;
      s.from = hhmm(from); s.to = hhmm(to);
      t += 10; pos = s;
    });
  }
}

export function createDay(src) {
  const day = JSON.parse(JSON.stringify(src));
  planWindows(day);
  const vans = day.vans.map((v) => ({
    ...v,
    phase: 'depot', idx: -1, pos: { lat: day.depot.lat, lng: day.depot.lng },
    leg: null, waitUntil: null, startAt: v.you ? null : 8 * 60 + 30, lateLogged: false,
    stops: v.stops.map((s) => ({ ...s, status: 'planned', deliveredAt: null, recipient: null, loaded: false, failReason: null, auto: false, invoice: null, paid: false, told: null })),
  }));
  return {
    day, t: START, vans, shiftOn: false, events: [],
    email: { state: 'waiting', at: toMin(day.emailOrder.at) },
    messages: [], invoiceSeq: 1041, done: {}, answeredAt: -999,
  };
}

const vanOf = (st, id) => st.vans.find((v) => v.id === id);
export const customerStop = (st) => vanOf(st, 'v1').stops.find((s) => s.customer);

function log(st, key, vars) { st.events.unshift({ t: st.t, key, vars }); if (st.events.length > 60) st.events.pop(); }

function startLeg(st, v, to, idx) {
  const from = { ...v.pos };
  let minutes = driveMinutes(from, to);
  if (v.delayLeg === idx) minutes += v.delayMinutes;
  v.leg = { from, to, start: st.t, end: st.t + minutes };
  v.phase = idx >= 0 ? 'driving' : 'returning';
  v.idx = idx;
  if (idx >= 0) {
    const s = v.stops[idx];
    s.status = 'on_the_way';
    if (s.customer) {
      st.messages.push({ t: st.t, from: 'biz', key: 'msg.onTheWay', vars: { ref: s.ref } });
      log(st, 'act.tracking', { name: s.name });
    }
  }
}

function nextLeg(st, v) {
  const nextIdx = v.stops.findIndex((s, i) => i > v.idx && s.status === 'planned');
  if (nextIdx >= 0) startLeg(st, v, v.stops[nextIdx], nextIdx);
  else { startLeg(st, v, st.day.depot, -1); }
}

/** A drop is made: proof saved, the invoice goes out with a payment link. */
export function deliver(st, v, s, { recipient, auto = false }) {
  s.status = 'delivered'; s.deliveredAt = st.t; s.recipient = recipient || s.person; s.auto = auto;
  s.invoice = `INV-${++st.invoiceSeq}`;
  log(st, 'act.delivered', { name: s.name });
  log(st, 'act.invoice', { inv: s.invoice, amount: s.amount, name: s.name, money: true });
  if (s.customer) st.messages.push({ t: st.t, from: 'biz', key: 'msg.delivered', vars: { ref: s.ref, time: hhmm(st.t), who: s.recipient, inv: s.invoice, amount: s.amount }, pay: true });
  if (!auto && v.you) st.done.deliver = true;
  v.waitUntil = null;
  nextLeg(st, v);
}

export function fail(st, v, s, why) {
  s.status = 'failed'; s.failReason = why;
  log(st, 'act.failed', { name: s.name, why });
  v.waitUntil = null;
  nextLeg(st, v);
}

/** Advance the clock by `dt` minutes. */
export function tick(st, dt) {
  if (st.t >= END) return;
  st.t = Math.min(END, st.t + dt);
  // Van 1 sets off on its own if the visitor never starts the shift.
  const v1 = vanOf(st, 'v1');
  if (!st.shiftOn && st.t >= 8 * 60 + 45) startShift(st, true);

  for (const v of st.vans) {
    if (v.phase === 'depot' && v.startAt != null && st.t >= v.startAt) { log(st, 'act.leave', { van: v.vehicle }); nextLeg(st, v); }
    if ((v.phase === 'driving' || v.phase === 'returning') && v.leg) {
      const k = Math.min(1, (st.t - v.leg.start) / (v.leg.end - v.leg.start || 1));
      v.pos = { lat: v.leg.from.lat + (v.leg.to.lat - v.leg.from.lat) * k, lng: v.leg.from.lng + (v.leg.to.lng - v.leg.from.lng) * k };
      if (k >= 1) {
        if (v.phase === 'returning') { v.phase = 'done'; v.leg = null; log(st, 'act.back', { van: v.vehicle }); continue; }
        const s = v.stops[v.idx];
        s.status = 'at_door'; v.phase = 'at_stop'; v.leg = null;
        v.waitUntil = st.t + (v.you ? VISITOR_WAIT : SERVICE);
      }
    }
    if (v.phase === 'at_stop' && v.waitUntil != null && st.t >= v.waitUntil) {
      deliver(st, v, v.stops[v.idx], { auto: true });
    }
    // Running late: logged once per van.
    if (!v.lateLogged) {
      const p = predict(st, v).find((x) => x.lateBy > LATE_AFTER);
      if (p) { v.lateLogged = true; log(st, 'act.late', { van: v.vehicle, n: p.lateBy }); }
    }
  }
  if (st.email.state === 'waiting' && st.t >= st.email.at) {
    st.email.state = 'arrived';
    log(st, 'act.email', { from: st.day.emailOrder.from, ref: st.day.emailOrder.stop.ref });
  }
  void v1;
}

export function startShift(st, auto = false) {
  if (st.shiftOn) return;
  st.shiftOn = true;
  const v1 = vanOf(st, 'v1');
  v1.startAt = st.t;
  if (!auto) st.done.shift = true;
  log(st, 'act.shift', { driver: v1.driver });
}

/** Skip the rest of Van 1's drive (for impatient visitors). */
export function skipDrive(st) {
  const v = vanOf(st, 'v1');
  if (v.phase === 'driving' && v.leg) { v.leg.end = st.t; v.leg.start = Math.min(v.leg.start, st.t - 1); tick(st, 0.001); }
}

/** Every stop still to do, with its predicted arrival and how late it is. */
export function predict(st, v) {
  const out = [];
  let t = st.t, pos = { ...v.pos };
  if (v.phase === 'depot') { t = Math.max(st.t, v.startAt ?? st.t); pos = { ...st.day.depot }; }
  if (v.phase === 'driving' && v.leg) { const s = v.stops[v.idx]; t = v.leg.end; out.push({ id: s.id, eta: t, lateBy: Math.max(0, Math.round(t - toMin(s.to))) }); pos = s; t += SERVICE; }
  if (v.phase === 'at_stop') { t = st.t + SERVICE; pos = v.stops[v.idx]; }
  for (const s of v.stops) {
    if (s.status !== 'planned') continue;
    t += driveMinutes(pos, s);
    out.push({ id: s.id, eta: t, lateBy: Math.max(0, Math.round(t - toMin(s.to))) });
    pos = s; t += SERVICE;
  }
  return out;
}

export function lateAlerts(st) {
  const res = [];
  for (const v of st.vans) {
    const p = predict(st, v).find((x) => x.lateBy > LATE_AFTER);
    if (p) res.push({ van: v, stop: v.stops.find((s) => s.id === p.id), eta: p.eta, lateBy: p.lateBy });
  }
  return res;
}

export function tellLate(st, a) {
  a.stop.told = st.t;
  st.done.late = true;
  log(st, 'act.told', { name: a.stop.name });
}

export function confirmEmailOrder(st) {
  st.email.state = 'confirmed';
  st.done.order = true;
  log(st, 'act.confirmed', { ref: st.day.emailOrder.stop.ref });
}

export function markLoaded(st, s) {
  s.loaded = true;
  st.done.scan = true;
  log(st, 'act.loaded', { ref: s.ref, van: vanOf(st, 'v1').vehicle });
}

/** The customer asks something: answered from their own delivery. */
export function customerAsks(st, text) {
  const s = customerStop(st);
  const v = vanOf(st, 'v1');
  st.messages.push({ t: st.t, from: 'me', text });
  const asks = /where|when|eta|arriv|time|track|coming|delivery|order|onde|quando|chega|hora|entrega|encomenda|caminho/i.test(text);
  if (!asks) { st.messages.push({ t: st.t, from: 'biz', key: 'ans.other', vars: {}, auto: true }); return; }
  st.done.ask = true;
  log(st, 'act.asked', { name: s.name, q: text.slice(0, 60) });
  if (s.status === 'delivered') { st.messages.push({ t: st.t, from: 'biz', key: 'ans.delivered', vars: { ref: s.ref, time: hhmm(s.deliveredAt), who: s.recipient }, auto: true }); return; }
  const p = predict(st, v).find((x) => x.id === s.id);
  const eta = p ? hhmm(Math.max(p.eta, toMin(s.from))) : null;
  if (s.status === 'at_door') st.messages.push({ t: st.t, from: 'biz', key: 'ans.atDoor', vars: { ref: s.ref }, auto: true });
  else if (s.status === 'on_the_way') st.messages.push({ t: st.t, from: 'biz', key: 'ans.onTheWay', vars: { ref: s.ref, time: eta || s.to }, auto: true });
  else st.messages.push({ t: st.t, from: 'biz', key: 'ans.planned', vars: { ref: s.ref, from: s.from, to: s.to, exp: eta && st.shiftOn ? eta : '' }, auto: true });
}

export function pay(st, s) {
  s.paid = true;
  log(st, 'act.paid', { name: s.name, amount: s.amount, money: true });
}

export { toMin, LATE_AFTER };
