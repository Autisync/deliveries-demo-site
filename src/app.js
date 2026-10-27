// Autisync Deliveries — the live demo page. Draws the model in sim.js on
// three screens: the office board, the driver's phone, the customer's phone.
import { DAYS } from './data.js';
import { T, fill } from './i18n.js';
import * as S from './sim.js';

const CFG = window.SITE_CONFIG || {};
const RATE = 1; // demo minutes per real second, at 1x
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let lang = pickLang();
let st;
let playing = false;
let speed = 1;
const ui = { tab: 'office', ctab: 'track', seen: 0, sheet: null, paysheet: null };
const keys = {};

function pickLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'pt' || q === 'en') return q;
  try { const s = localStorage.getItem('dl-demo-lang'); if (s === 'pt' || s === 'en') return s; } catch { /* private mode */ }
  return (navigator.language || '').toLowerCase().startsWith('pt') ? 'pt' : 'en';
}
const t = (k, v) => fill(T[lang][k] ?? T.en[k] ?? k, v);
const day = () => st.day;
const v1 = () => st.vans.find((v) => v.id === 'v1');
const cust = () => S.customerStop(st);
const money = (n) => new Intl.NumberFormat(day().locale, { style: 'currency', currency: day().currency }).format(n);
const initials = (n) => n.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
const stColor = { planned: 'var(--planned)', on_the_way: 'var(--onway)', at_door: '#EA580C', delivered: 'var(--done)', failed: 'var(--fail)' };
const stHex = { planned: '#64748B', on_the_way: '#D97706', at_door: '#EA580C', delivered: '#16A34A', failed: '#DC2626' };
const link = (ref) => `autisync.link/t/${ref.replace('E-', '')}`;
const firstName = (n) => n.split(/\s+/)[0];

/** Draw `html` into `el` only when `key` changed since last time. */
function paint(id, key, html) {
  if (keys[id] === key) return false;
  keys[id] = key;
  const el = document.getElementById(id);
  if (el) morph(el, html);
  return true;
}

// Patch the live DOM to match `html`, keeping the elements that are still there,
// so a button isn't swapped out under a click and animations don't replay.
function morph(el, html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  patchChildren(el, tpl.content);
}
function patchChildren(a, b) {
  const an = [...a.childNodes], bn = [...b.childNodes];
  bn.forEach((y, i) => {
    const x = an[i];
    if (!x) a.appendChild(y);
    else if (x.nodeType !== y.nodeType || x.nodeName !== y.nodeName) a.replaceChild(y, x);
    else if (x.nodeType !== 1) { if (x.nodeValue !== y.nodeValue) x.nodeValue = y.nodeValue; }
    else {
      for (const at of [...x.attributes]) if (!y.hasAttribute(at.name)) x.removeAttribute(at.name);
      for (const at of [...y.attributes]) if (x.getAttribute(at.name) !== at.value) x.setAttribute(at.name, at.value);
      patchChildren(x, y);
    }
  });
  for (let i = bn.length; i < an.length; i++) an[i].remove();
}

const icon = {
  play: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>',
  pause: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
  restart: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
  alert: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  mail: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
  phone: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
  nav: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>',
  scan: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></svg>',
  camera: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
  box: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>',
  truck: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  send: '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M3.4 20.4 21.9 12 3.4 3.6 3.4 10l13 2-13 2z"/></svg>',
  home: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
};

// A parcel at a door, drawn: the photo the driver takes in the demo.
const PHOTO = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260"><rect width="400" height="260" fill="#C9BFAE"/><rect x="0" y="220" width="400" height="40" fill="#8C877E"/><rect x="140" y="30" width="120" height="190" fill="#2F3B4C"/><rect x="152" y="42" width="96" height="178" fill="#3A495D"/><circle cx="236" cy="132" r="5" fill="#D9B45B"/><rect x="60" y="150" width="120" height="74" rx="4" fill="#A9773F"/><rect x="60" y="150" width="120" height="16" fill="#93652F"/><rect x="112" y="150" width="16" height="74" fill="#C9A06A"/><rect x="74" y="178" width="42" height="26" rx="2" fill="#F6F3EC"/><rect x="290" y="170" width="54" height="54" rx="27" fill="#5E7D4F"/></svg>`);

function qrSvg(seed, size = 66) {
  let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const rnd = () => ((h = (h * 1103515245 + 12345) >>> 0) / 4294967296);
  const n = 21, cell = size / n; let r = '';
  const finder = (x, y) => x < 7 && y < 7 || x >= n - 7 && y < 7 || x < 7 && y >= n - 7;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let on;
    if (finder(x, y)) { const fx = x >= n - 7 ? x - (n - 7) : x; const fy = y >= n - 7 ? y - (n - 7) : y; on = fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4); }
    else on = rnd() > 0.52;
    if (on) r += `<rect x="${(x * cell).toFixed(2)}" y="${(y * cell).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}"/>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="#111">${r}</svg>`;
}
function barsSvg(seed, w = 150, hgt = 26) {
  let h = 7; for (const c of seed) h = (h * 17 + c.charCodeAt(0)) >>> 0;
  let x = 0, r = '';
  while (x < w) { h = (h * 1664525 + 1013904223) >>> 0; const bw = 1 + (h % 3); if ((h >> 5) & 1) r += `<rect x="${x}" y="0" width="${bw}" height="${hgt}"/>`; x += bw + 1; }
  return `<svg width="${w}" height="${hgt}" viewBox="0 0 ${w} ${hgt}" fill="#111">${r}</svg>`;
}

// ── Static words ─────────────────────────────────────────────────────────────

function renderStatic() {
  document.documentElement.lang = lang;
  document.title = t('meta.title');
  const d = DAYS[lang];
  const driver = d.vans[0].driver.split(' ')[0];
  const customer = firstName(d.vans[0].stops.find((s) => s.customer).name);
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t, { driver, customer }); });
  $('[data-t-html="hero.text"]').innerHTML = esc(t('hero.text', { driver: '\u0001', customer: '\u0002' }))
    .replace('\u0001', `<b>${esc(driver)}</b>`).replace('\u0002', `<b>${esc(customer)}</b>`);
  $('#label-driver').textContent = t('pane.driver', { driver });
  $('#label-customer').textContent = t('pane.customer', { customer });
  const cta = lang === 'pt' ? (CFG.ctaPt || 'https://www.autisync.com/pt/marcar') : (CFG.ctaEn || 'https://www.autisync.com/book');
  document.querySelectorAll('.cta-link').forEach((a) => { a.href = cta; });
  document.querySelectorAll('[data-lang]').forEach((b) => b.classList.toggle('on', b.dataset.lang === lang));
  $('#foot-demo').textContent = t('foot.demo', { business: d.business });
  const li = (k, mark) => `<li><i>${mark}</i><span>${esc(t(k))}</span></li>`;
  $('#replaces').innerHTML = `
    <div class="rep before"><h3>${esc(t('rep.before'))}</h3><ul>${[1, 2, 3, 4, 5].map((i) => li(`rep.b${i}`, i)).join('')}</ul></div>
    <div class="rep after"><h3>${esc(t('rep.after'))}</h3><ul>${[1, 2, 3, 4, 5].map((i) => li(`rep.a${i}`, '✓')).join('')}</ul></div>`;
}

// ── Controls, tabs, "try this" ───────────────────────────────────────────────

function renderControls() {
  const minute = Math.floor(st.t);
  const pct = Math.round(((st.t - S.START) / (S.END - S.START)) * 100);
  paint('controls', `${lang}|${minute}|${playing}|${speed}`, `
    <div class="clock"><b>${S.hhmm(minute)}</b><span>${esc(t('ctl.clock'))}</span></div>
    <div class="ctl">
      <button class="play" type="button" data-act="toggle-play" aria-label="${esc(t(playing ? 'ctl.pause' : 'ctl.play'))}">${playing ? icon.pause : icon.play}</button>
      <div class="seg" role="group" aria-label="${esc(t('ctl.speed'))}">
        ${[1, 2, 4].map((x) => `<button type="button" data-act="speed" data-v="${x}" class="${speed === x ? 'on' : ''}">${x}×</button>`).join('')}
      </div>
      <button class="ghost-dark" type="button" data-act="restart">${icon.restart}${esc(t('ctl.restart'))}</button>
    </div>
    <div class="dayline" aria-hidden="true"><i style="width:${pct}%"></i></div>`);
}

function renderTabs() {
  const unread = st.messages.length > ui.seen && ui.tab !== 'customer';
  paint('tabs', `${lang}|${ui.tab}|${unread}`, ['office', 'driver', 'customer'].map((k) =>
    `<button type="button" role="tab" aria-selected="${ui.tab === k}" class="${ui.tab === k ? 'on' : ''}" data-act="tab" data-v="${k}">${esc(t(`tab.${k}`))}${k === 'customer' && unread ? '<span class="unread"></span>' : ''}</button>`).join(''));
  document.querySelectorAll('.pane').forEach((p) => p.classList.toggle('on', p.dataset.pane === ui.tab));
}

function renderTry() {
  const d = day();
  const lateVan = st.vans.find((v) => v.delayLeg != null);
  const items = [
    ['shift', t('try.shift', { driver: firstName(v1().driver) })],
    ['ask', t('try.ask', { customer: firstName(cust().name) })],
    ['late', t('try.late', { van: lateVan.vehicle })],
    ['deliver', t('try.deliver')],
    ['order', t('try.order')],
    ['scan', t('try.scan', { driver: firstName(v1().driver) })],
  ];
  const n = items.filter(([k]) => st.done[k]).length;
  paint('try', `${lang}|${JSON.stringify(st.done)}|${d.business}`, `
    <div class="try-head"><h2>${esc(t('try.title'))}</h2><span>${n}/${items.length}</span></div>
    <ol>${items.map(([k, txt]) => `<li class="${st.done[k] ? 'done' : ''}">${esc(txt)}</li>`).join('')}</ol>`);
}

// ── The office ───────────────────────────────────────────────────────────────

function renderOffice() {
  const minute = Math.floor(st.t);
  const all = st.vans.flatMap((v) => v.stops);
  const counts = { planned: 0, on_the_way: 0, delivered: 0, failed: 0 };
  for (const s of all) counts[s.status === 'at_door' ? 'on_the_way' : s.status] += 1;
  const alerts = S.lateAlerts(st);
  const em = day().emailOrder;

  const topKey = `${lang}|${minute}|${JSON.stringify(counts)}|${alerts.map((a) => a.stop.id + a.lateBy + a.stop.told).join()}|${st.email.state}`;
  const bar = ['delivered', 'on_the_way', 'failed', 'planned'].map((k) => counts[k]
    ? `<span style="width:${(counts[k] / all.length) * 100}%;background:${stHex[k]};opacity:${k === 'planned' ? 0.3 : 1}"></span>` : '').join('');
  paint('o-top', topKey, `
    <div class="o-head"><h3>${esc(t('off.title'))}</h3><span class="live"><i></i>${esc(t('off.live'))}</span></div>
    <div class="card kpi">
      <div class="kpi-top">
        <div class="kpi-big">${counts.delivered}<small>/${all.length}</small><em>${esc(t('off.delivered'))}</em></div>
        <ul class="legend">
          ${['planned', 'on_the_way', 'delivered'].map((k) => `<li><span class="dot" style="background:${stHex[k]}"></span>${esc(t(`st.${k}`))} <b>${counts[k]}</b></li>`).join('')}
          ${alerts.length ? `<li style="color:#B91C1C;font-weight:600">${esc(t('off.late', { n: alerts.length }))}</li>` : ''}
        </ul>
      </div>
      <div class="bar">${bar}</div>
    </div>
    ${alerts.map((a) => `
      <div class="alert">
        <span class="ic">${icon.alert}</span>
        <p><b>${esc(t('off.alert', { van: a.van.vehicle, n: a.lateBy }))}</b>${esc(t('off.alertNext', { name: a.stop.name, ref: a.stop.ref, time: S.hhmm(a.eta) }))}</p>
        ${a.stop.told != null ? `<span class="told">✓ ${esc(t('off.told', { time: S.hhmm(a.stop.told) }))}</span>`
          : `<button class="btn btn-red btn-sm" type="button" data-act="tell" data-v="${a.stop.id}">${esc(t('off.tell'))}</button>`}
      </div>`).join('')}
    ${st.email.state === 'arrived' ? `
      <div class="card check">
        <div class="check-head"><span class="ic">${icon.mail}</span><div><b>${esc(t('off.check'))}</b><span>${esc(t('off.checkHint'))}</span></div></div>
        <div class="check-body">
          <div class="mail"><b>${esc(t('off.from'))}: ${esc(em.from)}</b> · ${esc(em.subject)}<br>${esc(em.body)}</div>
          <dl class="read">
            <dt>${lang === 'pt' ? 'Cliente' : 'Customer'}</dt><dd>${esc(em.stop.name)} · ${esc(em.stop.person)}</dd>
            <dt>${lang === 'pt' ? 'Morada' : 'Address'}</dt><dd>${esc(em.stop.address)}</dd>
            <dt>${lang === 'pt' ? 'Quando' : 'When'}</dt><dd>${esc(t('off.tomorrow'))} ${esc(em.stop.from)}–${esc(em.stop.to)}</dd>
            <dt>${lang === 'pt' ? 'Artigos' : 'Items'}</dt><dd>${esc(em.stop.items)}</dd>
            <dt>${esc(t('off.order'))}</dt><dd>${esc(em.stop.order)}</dd>
          </dl>
          <div><button class="btn btn-ink btn-sm" type="button" data-act="confirm-order">${icon.check} ${esc(t('off.looksRight'))}</button></div>
        </div>
      </div>` : st.email.state === 'confirmed' ? `<div class="card confirmed">✓ ${esc(t('off.checked', { ref: em.stop.ref, van: st.vans[2].vehicle }))}</div>` : ''}
  `);

  // Routes, one card per van.
  const routesKey = `${lang}|${minute}|${st.vans.map((v) => v.phase + v.idx + v.stops.map((s) => s.status + (s.loaded ? 'L' : '')).join('')).join('|')}`;
  paint('o-routes', routesKey, st.vans.map((v) => {
    const pred = new Map(S.predict(st, v).map((p) => [p.id, p]));
    const done = v.stops.filter((s) => s.status === 'delivered').length;
    const state = v.phase === 'depot' ? t('off.depot') : v.phase === 'done' ? t('off.back') : t('off.liveAt', { time: S.hhmm(minute) });
    return `<section class="card">
      <div class="route-head">
        <span class="avatar" style="background:${v.color}">${esc(initials(v.driver))}</span>
        <div class="who"><b>${esc(v.driver)} <span style="color:var(--soft);font-weight:500">· ${esc(v.vehicle)}</span></b>
          <span><i class="dot" style="background:${v.phase === 'depot' || v.phase === 'done' ? '#C8C3B8' : '#22C55E'}"></i>${esc(state)}</span></div>
        <div class="mini">${done}/${v.stops.length}<i><b style="width:${(done / v.stops.length) * 100}%;background:${v.color}"></b></i></div>
      </div>
      <ol class="stops">${v.stops.map((s, i) => {
        const p = pred.get(s.id);
        const late = p && p.lateBy > S.LATE_AFTER;
        const pin = s.status === 'delivered' ? icon.check : s.status === 'failed' ? '✕' : i + 1;
        return `<li class="stop" style="--rail:${v.color}33">
          <div class="rail"><span class="pin" style="background:${stHex[s.status]}">${pin}</span></div>
          <div class="body">
            <div class="l1"><b>${esc(s.name)}</b><span class="pill ${s.status}">${esc(t(`st.${s.status}`))}</span>${late ? `<span class="pill late">${esc(t('off.lateBy', { n: p.lateBy }))}</span>` : ''}</div>
            <div class="l2"><span>${s.from}–${s.to}</span>${p ? `<span>${esc(t('off.eta', { time: S.hhmm(p.eta) }))}</span>` : ''}${s.status === 'delivered' ? `<span>✓ ${S.hhmm(s.deliveredAt)}</span>` : ''}${s.loaded && s.status !== 'delivered' ? `<span>▣ ${esc(t('drv.loaded'))}</span>` : ''}</div>
          </div>
        </li>`;
      }).join('')}</ol>
    </section>`;
  }).join(''));

  // Activity
  paint('o-activity', `${lang}|${st.events.length}|${st.events[0]?.t}`, `
    <h4>${esc(t('off.activity'))}</h4>
    ${st.events.length ? `<ol>${st.events.slice(0, 30).map((e) => `<li><time>${S.hhmm(e.t)}</time><span>${esc(t(e.key, e.vars.money ? { ...e.vars, amount: money(e.vars.amount) } : e.vars))}</span></li>`).join('')}</ol>`
      : `<p class="empty">${esc(t('off.noActivity'))}</p>`}`);

  updateOfficeMap();
}

// ── Maps ─────────────────────────────────────────────────────────────────────

const maps = { office: null, customer: null };
const TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

function makeMap(el, center, zoom) {
  if (!window.L) return null;
  const m = window.L.map(el, { zoomControl: true, scrollWheelZoom: false, attributionControl: true, zoomSnap: 0.25 }).setView(center, zoom);
  m.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
  window.L.tileLayer(TILES, { maxZoom: 18, attribution: ATTR }).addTo(m);
  return { m, layer: window.L.layerGroup().addTo(m), vans: new Map(), stops: new Map(), lines: new Map() };
}
const vanIcon = (v) => window.L.divIcon({ className: '', iconSize: null, html: `<div class="van-chip"><i style="background:${v.color}">${icon.truck.replace('currentColor', '#fff')}</i>${esc(firstName(v.driver))}</div>` });
const stopIcon = (s, n) => window.L.divIcon({ className: '', iconSize: [22, 22], iconAnchor: [11, 11], html: `<div class="stop-pin" style="background:${stHex[s.status]}">${s.status === 'delivered' ? '✓' : s.status === 'failed' ? '✕' : n}</div>` });

function updateOfficeMap() {
  const M = maps.office;
  if (!M) return;
  const L = window.L;
  for (const v of st.vans) {
    v.stops.forEach((s, i) => {
      const k = `${v.id}:${s.id}`;
      let mk = M.stops.get(k);
      if (!mk) { mk = { marker: L.marker([s.lat, s.lng], { icon: stopIcon(s, i + 1) }).bindTooltip(`${s.name} · ${s.ref}`).addTo(M.layer), status: s.status }; M.stops.set(k, mk); }
      if (mk.status !== s.status) { mk.marker.setIcon(stopIcon(s, i + 1)); mk.status = s.status; }
    });
    // The route still to drive, from the van.
    const path = [[v.pos.lat, v.pos.lng]];
    if (v.phase !== 'done') for (const s of v.stops) if (s.status === 'planned' || s.status === 'on_the_way' || s.status === 'at_door') path.push([s.lat, s.lng]);
    let line = M.lines.get(v.id);
    if (!line) { line = L.polyline(path, { color: v.color, weight: 3.5, opacity: 0.85, dashArray: '1 7', lineCap: 'round' }).addTo(M.layer); M.lines.set(v.id, line); }
    else line.setLatLngs(path.length > 1 ? path : []);
    let vm = M.vans.get(v.id);
    if (!vm) { vm = L.marker([v.pos.lat, v.pos.lng], { icon: vanIcon(v), zIndexOffset: 1000 }).addTo(M.layer); M.vans.set(v.id, vm); }
    else vm.setLatLng([v.pos.lat, v.pos.lng]);
  }
}

function setupOfficeMap() {
  const el = document.getElementById('o-map');
  if (maps.office) { maps.office.ro?.disconnect(); maps.office.m.remove(); maps.office = null; }
  maps.office = makeMap(el, day().center, day().zoom);
  if (!maps.office) return;
  const L = window.L;
  L.marker([day().depot.lat, day().depot.lng], { icon: L.divIcon({ className: '', iconSize: [26, 26], iconAnchor: [13, 13], html: `<div class="depot-pin">${icon.home}</div>` }) })
    .bindTooltip(day().depot.name).addTo(maps.office.layer);
  const pts = [[day().depot.lat, day().depot.lng], ...st.vans.flatMap((v) => v.stops.map((s) => [s.lat, s.lng]))];
  const M = maps.office;
  M.fit = () => { if (!el.clientWidth || !el.clientHeight) return; M.m.invalidateSize(); M.m.fitBounds(pts, { padding: [28, 28] }); };
  M.fit();
  // The map's box settles after the route list paints (and on resize / tab switch): fit again.
  M.touched = false;
  M.m.getContainer().addEventListener('pointerdown', () => { M.touched = true; });
  if (window.ResizeObserver) { M.ro = new ResizeObserver(() => { if (!M.touched) { M.fitting = true; M.fit(); M.fitting = false; } else M.m.invalidateSize(); }); M.ro.observe(el); }
  updateOfficeMap();
}

// ── The driver's phone ───────────────────────────────────────────────────────

function nextStopOf(v) {
  if ((v.phase === 'driving' || v.phase === 'at_stop') && v.idx >= 0) return { s: v.stops[v.idx], i: v.idx };
  const i = v.stops.findIndex((s) => s.status === 'planned');
  return i >= 0 ? { s: v.stops[i], i } : null;
}

function renderDriver() {
  const v = v1();
  const minute = Math.floor(st.t);
  const total = v.stops.length;
  const done = v.stops.filter((s) => s.status === 'delivered').length;
  const next = nextStopOf(v);
  const pred = new Map(S.predict(st, v).map((p) => [p.id, p]));
  const key = `${lang}|${minute}|${st.shiftOn}|${v.phase}|${v.idx}|${v.stops.map((s) => s.status + (s.loaded ? 'L' : '')).join('')}`;
  const later = v.stops.filter((s, i) => s.status === 'planned' && (!next || i !== next.i));
  const finished = v.stops.filter((s) => s.status === 'delivered' || s.status === 'failed');

  let nextHtml = '';
  if (next) {
    const { s, i } = next;
    const p = pred.get(s.id);
    const late = p && p.lateBy > S.LATE_AFTER;
    const onWay = s.status === 'on_the_way' || s.status === 'at_door';
    let actions = '';
    if (v.phase === 'depot') actions = `<p class="driving" style="background:var(--paper);color:var(--muted)">${esc(t('drv.waitShift'))}</p>`;
    else if (v.phase === 'driving') actions = `<div class="driving">${icon.truck} ${esc(t('drv.driving', { time: S.hhmm(v.leg.end) }))}</div><button class="skip" type="button" data-act="skip">${esc(t('drv.skip'))}</button>`;
    else if (v.phase === 'at_stop') actions = `<div class="driving" style="background:#F0FDF4;color:#166534">📍 ${esc(t('drv.atDoor'))}</div>
      <button class="dbig green" type="button" data-act="open-deliver">${icon.check} ${esc(t('drv.deliver'))}</button>
      <button class="dbig quiet" type="button" data-act="open-fail">${esc(t('drv.fail'))}</button>`;
    nextHtml = `<h4 class="d-title">${esc(t('drv.next'))}</h4>
      <div class="dcard">
        <div class="dtop"><span class="badge" style="background:${onWay ? 'var(--gold)' : 'var(--ink)'}">${i + 1}</span>
          <div style="min-width:0"><h5>${esc(s.name)}</h5><p class="addr">${esc(s.address)}</p></div></div>
        <div class="chips">
          <span class="chip">🕑 ${s.from}–${s.to}</span>
          ${p ? `<span class="chip">≈ ${S.hhmm(p.eta)}</span>` : ''}
          ${late ? `<span class="chip red">${esc(t('off.lateBy', { n: p.lateBy }))}</span>` : ''}
          ${s.loaded ? `<span class="chip green">✓ ${esc(t('drv.loaded'))}</span>` : ''}
          <span class="chip" style="color:var(--muted)">${s.ref}</span>
        </div>
        <div class="dnote"><b>${esc(t('drv.items'))}:</b> ${esc(s.items)} · ${esc(t('drv.notes', { person: s.person }))}</div>
        <div class="drow"><button class="dbtn" type="button" tabindex="-1">${icon.phone} ${esc(t('drv.call'))}</button><button class="dbtn" type="button" tabindex="-1">${icon.nav} ${esc(t('drv.navigate'))}</button></div>
        ${actions}
      </div>`;
  }

  paint('d-content', key, `
    <div class="d-head">
      <div class="row"><span>${esc(day().business)}</span><span class="veh">${esc(v.vehicle)}</span></div>
      <h4>${esc(t('drv.hello', { name: firstName(v.driver) }))}</h4>
      <div class="d-prog"><span>${esc(t('drv.progress', { done, total }))}</span><span>${total - done ? esc(t('drv.left', { n: total - done - finished.filter((s) => s.status === 'failed').length })) : '✓'}</span></div>
      <div class="d-bar"><i style="width:${(done / total) * 100}%"></i></div>
      <div class="shift">
        <span class="sd" style="background:${st.shiftOn ? '#22C55E' : 'rgba(255,255,255,.3)'}"></span>
        <p><b>${esc(st.shiftOn ? t('drv.shiftOn') : t('drv.shiftOff'))}</b>${st.shiftOn ? '' : esc(t('drv.shiftHint'))}</p>
        <button class="toggle ${st.shiftOn ? 'on' : 'nudge'}" type="button" role="switch" aria-checked="${st.shiftOn}" aria-label="${esc(t('drv.startShift'))}" data-act="shift"><i></i></button>
      </div>
    </div>
    <div class="d-body">
      ${next ? nextHtml : `<div class="dcard" style="margin-top:14px;text-align:center;font-weight:700">✓ ${esc(t('drv.allDone'))}</div>`}
      ${later.length ? `<h4 class="d-title">${esc(t('drv.later'))} <span>· ${later.length}</span></h4><div class="later">${later.map((s) => {
        const p = pred.get(s.id);
        return `<div class="lrow"><span class="badge">${v.stops.indexOf(s) + 1}</span><div style="min-width:0"><b>${esc(s.name)}</b><span>${s.from}–${s.to}${p ? ` · ≈ ${S.hhmm(p.eta)}` : ''}</span></div>${s.loaded ? '<span class="ok">✓</span>' : ''}</div>`;
      }).join('')}</div>` : ''}
      ${finished.length ? `<h4 class="d-title">${esc(t('drv.done'))} <span>· ${finished.length}</span></h4><div class="later">${finished.map((s) =>
        `<div class="lrow"><span class="badge" style="background:${stHex[s.status]}">${s.status === 'delivered' ? '✓' : '✕'}</span><div style="min-width:0"><b>${esc(s.name)}</b><span>${s.status === 'delivered' ? `${S.hhmm(s.deliveredAt)} · ${esc(t('cus.receivedBy', { name: s.recipient }))}` : esc(s.failReason)}</span></div></div>`).join('')}</div>` : ''}
    </div>`);
}

function openSheet(kind) {
  const host = $('#driver');
  closeSheet();
  const v = v1();
  const nx = nextStopOf(v);
  const el = document.createElement('div');
  el.className = 'sheet'; el.id = 'd-sheet';
  ui.sheet = { kind, photo: false, reason: '' };
  if (kind === 'deliver' && nx) {
    el.innerHTML = `<div class="sheet-in">
      <h6>${esc(nx.s.name)}</h6>
      <span class="lab" style="margin-top:0">${esc(t('drv.photo'))}</span>
      <button class="photo-slot" type="button" data-act="photo" style="margin-top:6px">${icon.camera} ${esc(t('drv.takePhoto'))}</button>
      <label class="lab">${esc(t('drv.who'))}<input class="field" id="d-who" value="${esc(nx.s.person)}" autocomplete="off"></label>
      <span class="lab">${esc(t('drv.sign'))}</span>
      <canvas class="sig" id="d-sig" width="560" height="220"></canvas>
      <div class="sig-row"><span>${esc(t('drv.signHint'))}</span><button type="button" data-act="sig-clear">${esc(t('drv.clear'))}</button></div>
      <p class="err" id="d-err" hidden>${esc(t('drv.needPhoto'))}</p>
      <div class="drow" style="margin-top:14px"><button class="dbtn" type="button" data-act="close-sheet" style="flex:0 0 auto;padding-inline:16px">${esc(t('drv.cancel'))}</button>
        <button class="dbig green" style="margin:0;flex:1" type="button" data-act="confirm-deliver">${esc(t('drv.confirm'))}</button></div>
    </div>`;
    host.appendChild(el);
    setupSignature($('#d-sig'));
  } else if (kind === 'fail' && nx) {
    el.innerHTML = `<div class="sheet-in">
      <h6>${esc(t('drv.why'))}</h6>
      <div class="reasons">${['r.nobody', 'r.access', 'r.refused'].map((r) => `<button type="button" data-act="reason" data-v="${esc(t(r))}">${esc(t(r))}</button>`).join('')}</div>
      <div class="drow" style="margin-top:14px"><button class="dbtn" type="button" data-act="close-sheet" style="flex:0 0 auto;padding-inline:16px">${esc(t('drv.cancel'))}</button>
        <button class="dbig" style="margin:0;flex:1;background:#B91C1C;color:#fff" type="button" data-act="confirm-fail">${esc(t('drv.saveFail'))}</button></div>
    </div>`;
    host.appendChild(el);
  } else if (kind === 'scan') {
    const target = v.stops.find((s) => !s.loaded && s.status !== 'delivered' && s.status !== 'failed') || nx?.s || v.stops[0];
    ui.sheet.target = target;
    el.innerHTML = `<div class="sheet-in">
      <h6>${esc(t('drv.scanTitle'))}</h6>
      <div class="viewfinder"><div class="label"><b>${esc(target.ref)}</b>${esc(target.name)}<div style="display:flex;gap:6px;align-items:center;margin-top:5px">${qrSvg(target.ref, 56)}<span style="font-size:9px;color:#555">${esc(target.address)}</span></div><div style="margin-top:5px">${barsSvg(target.ref, 148, 20)}</div></div><div class="frame"></div><div class="beam"></div></div>
      <div id="d-scanres"><button class="dbig ink" type="button" data-act="do-scan">${icon.scan} ${esc(t('drv.scanSample'))}</button></div>
      <button class="dbig" style="background:var(--paper)" type="button" data-act="close-sheet">${esc(t('drv.close'))}</button>
    </div>`;
    host.appendChild(el);
    // It reads the label by itself after a moment, like the camera does.
    ui.sheet.timer = setTimeout(() => scanNow(), 1800);
  }
}
function closeSheet() { const el = $('#d-sheet'); if (el) el.remove(); if (ui.sheet?.timer) clearTimeout(ui.sheet.timer); ui.sheet = null; }

function scanNow() {
  if (!ui.sheet || ui.sheet.kind !== 'scan' || ui.sheet.read) return;
  ui.sheet.read = true;
  const v = v1();
  const s = ui.sheet.target;
  const i = v.stops.indexOf(s);
  const atDoor = v.phase === 'at_stop' && v.stops[v.idx] === s;
  const res = $('#d-scanres');
  if (!res) return;
  res.innerHTML = `<div class="scan-result">✓ ${esc(t('drv.scanMine', { n: i + 1, name: s.name }))}<div style="font-weight:500;font-size:12.5px;color:#3B3A36;margin-top:2px">${esc(s.address)}</div></div>
    ${s.loaded ? '' : `<button class="dbig ink" type="button" data-act="load">${esc(t('drv.loaded'))}</button>`}
    ${atDoor ? `<button class="dbig green" type="button" data-act="scan-deliver">${icon.check} ${esc(t('drv.scanDeliver'))}</button>` : ''}`;
}

function setupSignature(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#14213d';
  let drawing = false;
  const at = (e) => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * (canvas.width / r.width), (e.clientY - r.top) * (canvas.height / r.height)]; };
  canvas.addEventListener('pointerdown', (e) => { drawing = true; canvas.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.moveTo(...at(e)); });
  canvas.addEventListener('pointermove', (e) => { if (!drawing) return; ctx.lineTo(...at(e)); ctx.stroke(); });
  canvas.addEventListener('pointerup', () => { drawing = false; });
  canvas.addEventListener('pointercancel', () => { drawing = false; });
}

// ── The customer's phone ─────────────────────────────────────────────────────

function renderCustomer() {
  const s = cust();
  const v = v1();
  const minute = Math.floor(st.t);
  const unread = st.messages.length > ui.seen;
  paint('c-tabs', `${lang}|${ui.ctab}|${unread}`, `<div class="c-tabs">
    <button type="button" class="${ui.ctab === 'track' ? 'on' : ''}" data-act="ctab" data-v="track">${esc(t('cus.tracking'))}</button>
    <button type="button" class="${ui.ctab === 'chat' ? 'on' : ''}" data-act="ctab" data-v="chat">${esc(t('cus.messages'))}${unread ? `<span class="unread">${st.messages.length - ui.seen}</span>` : ''}</button></div>`);
  $('#c-track').hidden = ui.ctab !== 'track';
  $('#c-chat').hidden = ui.ctab !== 'chat';

  // Tracking page
  const p = S.predict(st, v).find((x) => x.id === s.id);
  const onWay = s.status === 'on_the_way' || s.status === 'at_door';
  const late = p && p.lateBy > S.LATE_AFTER;
  const step = s.status === 'delivered' ? 3 : onWay ? 2 : 1;
  const etaMin = p ? Math.max(p.eta, S.toMin(s.from)) : null;
  const away = p ? Math.max(1, Math.round(p.eta - st.t)) : null;
  const title = s.status === 'delivered' ? t('cus.delivered') : s.status === 'failed' ? t('cus.failed') : onWay ? t('cus.onTheWay') : t('cus.planned');
  let main = '';
  if (s.status === 'delivered') main = `<p class="lbl">${esc(t('cus.deliveredAt'))}</p><p class="big">${S.hhmm(s.deliveredAt)}</p><p class="sub" style="color:var(--muted);font-weight:500">${esc(t('cus.receivedBy', { name: s.recipient }))}</p>`;
  else if (s.status === 'at_door') main = `<p class="lbl">${esc(t('cus.arriving'))}</p><p class="big">${esc(t('cus.now'))}</p><p class="sub">${esc(t('cus.here'))}</p>`;
  else if (onWay && p) main = `<p class="lbl">${esc(t('cus.arriving'))}</p><p class="big">${S.hhmm(etaMin)}</p><p class="sub">${esc(away <= 3 ? t('cus.soon') : t('cus.away', { n: away }))}</p>`;
  else if (s.status === 'planned') main = `<p class="lbl">${esc(t('cus.plannedFor'))}</p><p class="big" style="font-size:26px">${esc(t('cus.between', { from: s.from, to: s.to }))}</p>${p && st.shiftOn ? `<p class="sub">${esc(t('cus.expected', { time: S.hhmm(etaMin) }))}</p>` : ''}`;
  paint('c-trk-top', `${lang}|${minute}|${s.status}|${st.shiftOn}`, `
    <div class="tcard">
      <div class="biz"><b style="color:var(--ink)">${esc(day().business)}</b><span>${esc(s.ref)}</span></div>
      <h5>${esc(title)}</h5>
      ${main}
      ${late && s.status !== 'delivered' ? `<div class="late">${esc(t('cus.late'))}</div>` : ''}
      <ol class="steps">${['cus.s1', 'cus.s2', 'cus.s3'].map((k, i) => `<li class="${i < step ? 'on' : ''} ${i + 1 === step ? 'cur' : ''}"><i>${[icon.box, icon.truck, icon.check][i]}</i>${esc(t(k))}</li>`).join('')}</ol>
    </div>
    ${s.status !== 'delivered' && st.shiftOn ? `<div class="tcard dcard-row" style="padding:12px 14px"><span class="avatar">${esc(firstName(v.driver)[0])}</span>${esc(t('cus.bringing', { name: firstName(v.driver) }))}</div>` : ''}`);
  const mapEl = $('#cmap');
  const showMap = onWay;
  mapEl.style.display = showMap ? '' : 'none';
  if (showMap) {
    if (!maps.customer) {
      maps.customer = makeMap(mapEl, [s.lat, s.lng], 14);
      if (maps.customer) {
        window.L.marker([s.lat, s.lng], { icon: window.L.divIcon({ className: '', iconSize: [20, 20], iconAnchor: [10, 10], html: '<div style="width:20px;height:20px;border-radius:10px;background:#fff;border:6px solid #121417;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>' }) }).addTo(maps.customer.layer);
      }
    }
    if (maps.customer) {
      const M = maps.customer;
      let vm = M.vans.get('v1');
      if (!vm) { vm = window.L.marker([v.pos.lat, v.pos.lng], { icon: vanIcon(v), zIndexOffset: 1000 }).addTo(M.layer); M.vans.set('v1', vm); M.m.fitBounds([[v.pos.lat, v.pos.lng], [s.lat, s.lng]], { padding: [30, 30], maxZoom: 15 }); }
      else vm.setLatLng([v.pos.lat, v.pos.lng]);
      setTimeout(() => M.m.invalidateSize(), 0);
    }
  }
  paint('c-trk-bottom', `${lang}|${s.status}`, s.status === 'delivered'
    ? `<div class="proof"><img src="${PHOTO}" alt=""><p>${lang === 'pt' ? 'Foto na entrega' : 'Photo at the delivery'}</p></div>` : '');

  // Messages
  const common = { name: firstName(s.name), business: day().business };
  paint('c-msgs', `${lang}|${st.messages.length}|${s.paid}`, st.messages.map((m, i) => {
    if (m.from === 'me') return `<div class="bubble me">${esc(m.text)}<small>${S.hhmm(m.t)}</small></div>`;
    const vars = { ...common, ...m.vars, link: '\u0001', pay: '\u0002', amount: m.vars?.amount != null ? money(m.vars.amount) : '' };
    if (m.key === 'ans.planned') vars.exp = m.vars.exp ? t('ans.exp', { time: m.vars.exp }) : '';
    let html = esc(t(m.key, vars)).replace('\u0001', `<button class="lnk" type="button" data-act="open-track">${esc(link(s.ref))}</button>`).replace(': \u0002', '.').replace('\u0002', '');
    if (m.pay) html += `<button class="paybtn ${s.paid ? 'paid' : ''}" type="button" data-act="${s.paid ? '' : 'open-pay'}" data-i="${i}">${s.paid ? esc(t('cus.paid')) : esc(t('cus.pay', { amount: money(m.vars.amount) }))}</button>`;
    return `<div class="bubble biz">${html}${m.auto ? `<span class="auto">${esc(t('cus.auto'))}</span>` : ''}<small>${S.hhmm(m.t)}</small></div>`;
  }).join('')) && requestAnimationFrame(() => { const box = $('#c-msgs'); if (box) box.scrollTop = box.scrollHeight; });
  // Read when the chat is on screen (on a phone, only on the Customer tab).
  if (ui.ctab === 'chat' && (ui.tab === 'customer' || window.matchMedia('(min-width: 761px)').matches)) ui.seen = st.messages.length;
}

function setupCustomer() {
  const s = cust();
  $('#customer').innerHTML = `
    <div class="scroll" id="c-track">
      <div class="c-top" id="c-tabs"></div>
      <div class="trk"><div id="c-trk-top" style="display:grid;gap:10px"></div><div class="cmap" id="cmap"></div><div id="c-trk-bottom"></div></div>
    </div>
    <div class="chat" id="c-chat" hidden>
      <div class="chat-head"><button class="back" type="button" data-act="ctab" data-v="track" aria-label="${esc(t('cus.tracking'))}">‹</button><span class="avatar">${esc(initials(day().business))}</span>
        <div><b>${esc(day().business)}</b><span>${esc(t('cus.online'))}</span></div></div>
      <div class="msgs" id="c-msgs"></div>
      <div class="chips-q"><button type="button" data-act="ask" data-v="${esc(t('cus.chip1'))}">${esc(t('cus.chip1'))}</button><button type="button" data-act="ask" data-v="${esc(t('cus.chip2'))}">${esc(t('cus.chip2'))}</button></div>
      <form class="composer" id="c-form"><input id="c-input" placeholder="${esc(t('cus.type'))}" autocomplete="off" aria-label="${esc(t('cus.type'))}"><button type="submit" aria-label="${esc(t('cus.send'))}">${icon.send}</button></form>
    </div>`;
  void s;
  $('#c-form').addEventListener('submit', (e) => { e.preventDefault(); const i = $('#c-input'); const q = i.value.trim(); if (!q) return; ask(q); i.value = ''; });
  // The tabs live inside the tracking scroll; the chat has its own back arrow.
  if (maps.customer) { maps.customer.m.remove(); maps.customer = null; }
}

function ask(q) {
  S.customerAsks(st, q);
  if (!playing) render();
}

function openPay() {
  const s = cust();
  closePay();
  const el = document.createElement('div');
  el.className = 'sheet'; el.id = 'c-pay';
  el.innerHTML = `<div class="sheet-in paysheet">
    <h6>${esc(t('cus.payTitle', { inv: s.invoice }))}</h6>
    <div style="font-size:13px;color:var(--muted)">${esc(day().business)} · ${esc(s.ref)}</div>
    <div class="amt">${money(s.amount)}</div>
    <div class="cardrow"><span>💳 ${esc(t('cus.payCard'))}</span><span>›</span></div>
    <button class="dbig ink" type="button" data-act="pay-now">${esc(t('cus.payNow'))}</button>
    <button class="dbig" style="background:var(--paper)" type="button" data-act="close-pay">${esc(t('drv.cancel'))}</button>
  </div>`;
  $('#customer').appendChild(el);
}
function closePay() { const el = $('#c-pay'); if (el) el.remove(); }

// ── The loop ─────────────────────────────────────────────────────────────────

function render() {
  renderControls();
  renderTabs();
  renderOffice();
  renderDriver();
  renderCustomer();
  renderTry();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.25, (now - last) / 1000);
  last = now;
  if (playing) {
    S.tick(st, dt * RATE * speed);
    if (st.t >= S.END) playing = false;
  }
  render();
  requestAnimationFrame(frame);
}

function start() {
  closeSheet(); closePay();
  for (const k of Object.keys(keys)) delete keys[k];
  st = S.createDay(DAYS[lang]);
  ui.seen = 0; ui.ctab = 'track';
  $('#office').innerHTML = `<div id="o-top" style="display:grid;gap:12px"></div>
    <div class="o-grid"><div class="routes" id="o-routes"></div><div class="map" id="o-map"></div></div>
    <div class="card activity" id="o-activity"></div>`;
  $('#driver').innerHTML = `<div class="scroll"><div id="d-content"></div></div><div class="scanbar"><button class="dbig ink" style="margin:0" type="button" data-act="open-scan">${icon.scan} ${esc(t('drv.scan'))}</button></div>`;
  setupCustomer();
  renderStatic();
  render();
  setupOfficeMap();
}

// ── Taps ─────────────────────────────────────────────────────────────────────

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act], [data-lang]');
  if (!b) return;
  if (b.dataset.lang) {
    if (b.dataset.lang === lang) return;
    lang = b.dataset.lang;
    try { localStorage.setItem('dl-demo-lang', lang); } catch { /* fine */ }
    const u = new URL(location.href); u.searchParams.set('lang', lang); history.replaceState(null, '', u);
    start();
    return;
  }
  const v = v1();
  const nx = nextStopOf(v);
  switch (b.dataset.act) {
    case 'toggle-play': playing = !playing; if (st.t >= S.END) { start(); playing = true; } break;
    case 'speed': speed = Number(b.dataset.v); break;
    case 'restart': start(); playing = true; break;
    case 'tab': ui.tab = b.dataset.v; if (ui.tab === 'customer' && ui.ctab === 'chat') ui.seen = st.messages.length; setTimeout(() => { maps.office?.m.invalidateSize(); maps.customer?.m.invalidateSize(); }, 30); break;
    case 'ctab': ui.ctab = b.dataset.v; if (ui.ctab === 'chat') ui.seen = st.messages.length; break;
    case 'open-track': ui.ctab = 'track'; break;
    case 'shift': if (!st.shiftOn) { S.startShift(st); if (!playing) playing = true; } break;
    case 'skip': S.skipDrive(st); break;
    case 'open-deliver': openSheet('deliver'); break;
    case 'open-fail': openSheet('fail'); break;
    case 'open-scan': openSheet('scan'); break;
    case 'close-sheet': closeSheet(); break;
    case 'photo': ui.sheet.photo = true; b.innerHTML = `<img src="${PHOTO}" alt="">`; b.style.height = '140px'; b.style.padding = '0'; $('#d-err').hidden = true; break;
    case 'sig-clear': { const c = $('#d-sig'); c.getContext('2d').clearRect(0, 0, c.width, c.height); break; }
    case 'confirm-deliver':
      if (!ui.sheet?.photo) { $('#d-err').hidden = false; break; }
      if (nx && v.phase === 'at_stop') S.deliver(st, v, nx.s, { recipient: $('#d-who').value.trim() || nx.s.person });
      closeSheet();
      break;
    case 'reason': ui.sheet.reason = b.dataset.v; b.parentElement.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); break;
    case 'confirm-fail': if (ui.sheet?.reason && nx) { S.fail(st, v, nx.s, ui.sheet.reason); closeSheet(); } break;
    case 'do-scan': scanNow(); break;
    case 'load': if (ui.sheet?.target) { S.markLoaded(st, ui.sheet.target); const r = $('#d-scanres'); if (r) r.querySelector('[data-act="load"]')?.replaceWith(Object.assign(document.createElement('p'), { className: 'scan-result', textContent: t('drv.loadedOk', { ref: ui.sheet.target.ref }) })); } break;
    case 'scan-deliver': closeSheet(); openSheet('deliver'); break;
    case 'tell': { const a = S.lateAlerts(st).find((x) => x.stop.id === b.dataset.v); if (a) S.tellLate(st, a); break; }
    case 'confirm-order': S.confirmEmailOrder(st); break;
    case 'ask': ask(b.dataset.v); break;
    case 'open-pay': openPay(); break;
    case 'close-pay': closePay(); break;
    case 'pay-now': S.pay(st, cust()); closePay(); break;
    default: break;
  }
  for (const k of ['controls', 'tabs', 'c-tabs', 'c-msgs', 'try']) delete keys[k];
  render();
});

// The map frames the routes again when it gets its real size: a tab opened in
// the background, a window resize, the stage scrolling into view.
const refit = () => { const M = maps.office; if (M && !M.touched) M.fit(); };
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') setTimeout(refit, 50); });
let resizeT; window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(refit, 150); });
new IntersectionObserver((en) => { if (en.some((e) => e.isIntersecting)) refit(); }).observe($('#stage'));

// Plays when the stage comes into view.
start();
const io = new IntersectionObserver((entries) => {
  if (entries.some((e) => e.isIntersecting) && st.t === S.START && !playing) { playing = true; io.disconnect(); }
}, { threshold: 0.35 });
io.observe($('#stage'));
requestAnimationFrame(frame);
