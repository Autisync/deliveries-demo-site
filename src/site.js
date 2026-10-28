/*!
 * Ribeira Materiais (demo): language switch, the link to a real tracking page
 * in the CRM, and the order form, which arrives in the CRM as a new lead.
 * window.SITE_CONFIG comes from build.mjs.
 */
(function () {
  'use strict';
  var C = window.SITE_CONFIG || {};
  var API = String(C.api || 'https://api.autisync.com/api').replace(/\/+$/, '');
  var APP = String(C.app || 'https://app.autisync.com').replace(/\/+$/, '');

  var EN = {
    'demo.bar': 'Demo website: Ribeira Materiais is an invented business, running on the Autisync CRM and deliveries.',
    'demo.link': 'See how it works',
    'nav.products': 'Products', 'nav.deliveries': 'Deliveries', 'nav.track': 'Track a delivery', 'nav.contact': 'Contact', 'nav.order': 'Order',
    'hero.kicker': 'Warehouse in Marvila · Deliveries across Lisbon',
    'hero.title': 'On site, on time.',
    'hero.lead': 'Cement, bricks, sand, tiles and tools. Order by 6pm and we deliver the next day in a 2-hour window. When the van leaves, you get a link to follow it on your phone.',
    'hero.order': 'Order for delivery', 'hero.track': 'Track my delivery',
    'live.label': 'Right now, on Avenida de Roma', 'live.title': '2 m³ of washed sand and 20 bags of cement',
    'live.s1': 'Loaded', 'live.s2': 'On the way', 'live.s3': 'Delivered', 'live.link': 'Open the real tracking page for this delivery',
    'f1.b': '2-hour window', 'f1.s': 'Pick the day, morning or afternoon',
    'f2.b': 'Follow the van', 'f2.s': 'A link by text when it leaves the yard',
    'f3.b': 'Proof of delivery', 'f3.s': 'Photo, signature and time, in your inbox',
    'f4.b': 'Invoice at the drop', 'f4.s': 'With a link to pay by card',
    'prod.title': 'What we deliver', 'prod.sub': 'Counter prices including VAT. For building sites we quote by quantity and deliver in stages.',
    'cat.cement': 'Cement and mortars', 'cat.cement.d': 'CEM II 32.5 cement, tile adhesive, hydraulic lime.', 'cat.cement.p': 'from €5.90 / bag',
    'cat.brick': 'Bricks and blocks', 'cat.brick.d': '30x20 bricks in 11 and 15 cm, concrete blocks, by the pallet.', 'cat.brick.p': 'from €92 / pallet',
    'cat.yard': 'Sand, gravel and timber', 'cat.yard.d': 'Washed and fine sand, gravel, formwork and joists.', 'cat.yard.p': 'from €38 / m³',
    'cat.tools': 'Tools and finishes', 'cat.tools.d': 'Hand and power tools, paint, tiles and adhesive.', 'cat.tools.p': 'Over 4,000 items',
    'how.title': 'How deliveries work', 'how.sub': 'From our yard to your site, without phoning to ask where the van is.',
    'how.1': 'Order', 'how.1d': 'On the website, by email or WhatsApp. We confirm the day and the delivery window.',
    'how.2': 'Loaded', 'how.2d': 'Every item has a QR label, scanned as it goes into the van. Nothing gets left behind.',
    'how.3': 'On the way', 'how.3d': 'You get a link to follow the van and its arrival time. If it runs late, we tell you.',
    'how.4': 'Delivered', 'how.4d': 'Photo, signature and time, and the invoice with a payment link in your email.',
    'track.title': 'Track my delivery', 'track.sub': 'When the van leaves, we send you a link by text and email. Open it to see the van on the map and the arrival time.',
    'track.note': 'In this demo you can open the real tracking page of a delivery that is on its way now.',
    'track.open': 'See a delivery on its way', 'track.sim': 'See a delivery day from the inside',
    'ph.title': 'Your delivery is on its way', 'ph.eta': 'Arriving around',
    'order.title': 'Order for delivery', 'order.sub': 'Tell us what you need, the address and the day. We confirm the order, the price and the delivery window today.',
    'order.t1': 'Delivery in Lisbon from €25; free over €400', 'order.t2': 'Crane van for pallets and upper floors', 'order.t3': '30-day accounts for builders',
    'form.name': 'Name', 'form.phone': 'Mobile', 'form.email': 'Email', 'form.address': 'Site address', 'form.day': 'Day',
    'form.what': 'What you need', 'form.whatPh': 'E.g. 30 bags of cement, 2 pallets of 30x20x15 bricks', 'form.send': 'Send order',
    'contact.title': 'Yard and counter', 'contact.hours': 'Monday to Friday 7:30–18:00 · Saturday 8:00–13:00',
    'foot.photos': 'Photos: Pexels', 'foot.powered': 'Orders, vans and tracking by',
    'msg.name': 'Please add your name.', 'msg.email': 'That email address doesn’t look right.', 'msg.sending': 'Sending…',
    'msg.thanks': 'Thank you. We’ll confirm the order and the delivery time today.', 'msg.error': 'That didn’t send. Please try again, or call us.',
    'msg.address': 'Address', 'msg.day': 'Day', 'msg.what': 'Order',
  };
  var PT_MSG = {
    'msg.name': 'Indique o seu nome.', 'msg.email': 'O email não parece estar certo.', 'msg.sending': 'A enviar…',
    'msg.thanks': 'Obrigado. Confirmamos a encomenda e a hora de entrega ainda hoje.', 'msg.error': 'Não foi possível enviar. Tente de novo, ou ligue-nos.',
    'msg.address': 'Morada', 'msg.day': 'Dia', 'msg.what': 'Encomenda',
  };

  var PT = {};
  var lang = 'pt';
  function t(k) { return lang === 'en' ? (EN[k] || PT[k] || PT_MSG[k] || '') : (PT[k] || PT_MSG[k] || ''); }

  function setLang(l) {
    lang = l === 'en' ? 'en' : 'pt';
    document.documentElement.lang = lang === 'en' ? 'en' : 'pt-PT';
    Array.prototype.forEach.call(document.querySelectorAll('[data-t]'), function (el) {
      var k = el.getAttribute('data-t');
      el.textContent = lang === 'en' ? (EN[k] || PT[k]) : PT[k];
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-ph]'), function (el) {
      var k = el.getAttribute('data-ph');
      if (!PT['ph:' + k]) PT['ph:' + k] = el.getAttribute('placeholder') || '';
      el.setAttribute('placeholder', lang === 'en' ? EN[k] : PT['ph:' + k]);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-href-en]'), function (el) {
      if (!el.getAttribute('data-href-pt')) el.setAttribute('data-href-pt', el.getAttribute('href'));
      el.setAttribute('href', lang === 'en' ? el.getAttribute('data-href-en') : el.getAttribute('data-href-pt'));
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-lang]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)); });
    try { localStorage.setItem('ribeira-lang', lang); } catch (e) { /* private mode */ }
    var u = new URL(location.href); u.searchParams.set('lang', lang); history.replaceState(null, '', u);
  }

  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  ready(function () {
    // The Portuguese words are the page's own; keep them to switch back.
    Array.prototype.forEach.call(document.querySelectorAll('[data-t]'), function (el) { PT[el.getAttribute('data-t')] = el.textContent; });
    var q = new URLSearchParams(location.search).get('lang');
    var saved = null; try { saved = localStorage.getItem('ribeira-lang'); } catch (e) { /* fine */ }
    setLang(q || saved || ((navigator.language || '').slice(0, 2) === 'pt' ? 'pt' : (navigator.language ? 'en' : 'pt')));
    Array.prototype.forEach.call(document.querySelectorAll('[data-lang]'), function (b) {
      b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
    });

    // A real tracking page in the CRM: the demo delivery that is on its way.
    Array.prototype.forEach.call(document.querySelectorAll('[data-track-demo]'), function (a) {
      if (C.trackToken) a.href = APP + '/apps/track/' + C.trackToken; else a.hidden = true;
    });

    // The phone drawing shows an arrival about a quarter of an hour from now (Lisbon time).
    var eta = document.querySelector('[data-eta]');
    if (eta) {
      eta.textContent = new Intl.DateTimeFormat('pt-PT', { timeZone: 'Europe/Lisbon', hour: '2-digit', minute: '2-digit' })
        .format(new Date(Math.round((Date.now() + 15 * 60000) / 300000) * 300000));
    }

    // The order form: to the website's form in the CRM, as a new lead.
    var formSection = null;
    function findForm() {
      if (formSection) return Promise.resolve(formSection);
      return fetch(API + '/sites/public/render?siteSlug=' + encodeURIComponent(C.siteSlug), { cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw new Error('site'); return r.json(); })
        .then(function (d) {
          var all = [];
          (d.pages || [d.page]).forEach(function (p) { (p && p.sections || []).forEach(function (s) { all.push(s); }); });
          var hit = all.filter(function (s) { return s.section_type === 'contact_form'; })[0];
          if (!hit) throw new Error('form');
          formSection = hit.id;
          return formSection;
        });
    }
    Array.prototype.forEach.call(document.querySelectorAll('form[data-enquiry]'), function (form) {
      var status = form.querySelector('[data-status]');
      var button = form.querySelector('button[type="submit"]');
      var say = function (msg, kind) { status.textContent = msg; status.setAttribute('data-kind', kind || ''); };
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (form.website && form.website.value) return;
        var v = function (n) { return (form.elements[n] && form.elements[n].value || '').trim(); };
        if (v('fullName').length < 2) return say(t('msg.name'), 'error');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('email'))) return say(t('msg.email'), 'error');
        var message = [
          v('what') && (t('msg.what') + ': ' + v('what')),
          v('address') && (t('msg.address') + ': ' + v('address')),
          v('day') && (t('msg.day') + ': ' + v('day')),
        ].filter(Boolean).join('\n');
        var data = { fullName: v('fullName'), phone: v('phone'), email: v('email'), message: message };
        var qs = new URLSearchParams(location.search);
        button.disabled = true;
        say(t('msg.sending'));
        findForm().then(function (id) {
          return fetch(API + '/sites/public/forms/' + id + '/submit', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: data, utm: { source: qs.get('utm_source') || '', medium: qs.get('utm_medium') || '', campaign: qs.get('utm_campaign') || '' }, tracking: { page: location.href } }),
          });
        }).then(function (r) {
          if (!r.ok) throw new Error('send');
          form.reset();
          say(t('msg.thanks'), 'ok');
        }).catch(function () {
          say(t('msg.error'), 'error');
        }).then(function () { button.disabled = false; });
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function (el) { el.textContent = new Date().getFullYear(); });
  });
})();
