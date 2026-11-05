/* SIEN Smart Space · sh.js · lo específico de esta cuenta.
   El kit (interacciones.js) NO SE TOCA. Aquí viven:
   1. Medición: cada sección, clic y resultado emite evento (brief §9) desde
      el prototipo, a window.dataLayer.
   2. Interacciones del one page: panel del héroe, espectro de paquetes,
      módulos, mapa comparativo, acordeones con evento.
   3. Ruta del quiz «Un día en tu casa» (#un-dia-en-tu-casa) y del resultado
      (#tu-casa/CÓDIGO): siete pantallas, reglas deterministas (brief §5.1–5.3)
      y relato de RESPALDO (§5.6). El modelo de IA lo integra SIEN sobre este
      esqueleto; el prototipo nunca entrega una pantalla vacía.
   Nota del prototipo: el código de resultado codifica las respuestas para que
   el enlace compartido funcione sin servidor. En producción el servidor genera
   un código aleatorio de 8 caracteres y guarda el resultado (brief §2, §6). */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var WA_NUM = '525664564795'; 
  var DOMINIO = 'spacehome.tecnologiasien.com';

  /* ── 1 · Medición ────────────────────────────────────────────────────── */
  window.dataLayer = window.dataLayer || [];
  function track(evento, params) {
    var p = Object.assign({ event: evento }, params || {});
    window.dataLayer.push(p);
    if (window.console && console.debug) console.debug('[evento]', evento, params || '');
  }

  /* RC3.2 · seguridad: todo lo que se pinta en el DOM se arma con nodos y
     textContent. Nada de innerHTML: cuando el motor de IA conteste, su texto
     entra por aquí sin poder ejecutar nada. */
  function nodo(tag, cls, texto) { var n = document.createElement(tag); if (cls) n.className = cls; if (texto != null) n.textContent = texto; return n; }
  function icono(id) { var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', 'sh-ico'); s.setAttribute('aria-hidden', 'true'); var u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', '#' + id); s.appendChild(u); return s; }
  function vacia(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  window.shTrack = track;
  window.shMotor = null; /* se asigna abajo · sólo para pruebas del prototipo */

  var seccionActual = 'hero';
  if ('IntersectionObserver' in window) {
    var vistas = {};
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var n = e.target.getAttribute('data-seccion');
        seccionActual = n;
        if (!vistas[n]) { vistas[n] = 1; track('section_view', { seccion: n }); }
        actualizaWA();
      });
    }, { threshold: 0.35 });
    $$('[data-seccion]').forEach(function (s) { io.observe(s); });
  }

  /* WhatsApp flotante: el mensaje precargado identifica la sección de origen */
  var waFlotante = $('[data-wa-flotante]');
  function actualizaWA() {
    if (!waFlotante) return;
    /* v2: el mensaje por origen lo fija la página (MENSAJES en construye.py); aquí solo se mide la sección. */
  }
  actualizaWA();
  $$('[data-wa]').forEach(function (a) {
    a.addEventListener('click', function () { track('whatsapp_click', { origen: a.getAttribute('data-origen') || 'boton', seccion: seccionActual }); });
  });
  if (waFlotante) waFlotante.addEventListener('click', function () { track('whatsapp_click', { origen: 'flotante', seccion: seccionActual }); });

  /* ── 2 · Interacciones del one page ──────────────────────────────────── */
  /* Héroe · el panel respira: la escena de noche va encendiendo tiles */
  var toggles = $$('[data-escena-toggle]');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (toggles.length && !reduce) {
    var i = 0;
    setInterval(function () {
      var t = toggles[i % toggles.length];
      if (t.hasAttribute('data-off')) t.removeAttribute('data-off'); else t.setAttribute('data-off', '');
      i++;
    }, 2800);
  }

  $$('[data-escena]').forEach(function (b) {
    b.addEventListener('click', function () { track('click_escena', { escena: b.getAttribute('data-escena') }); });
  });
  $$('[data-frente]').forEach(function (d) {
    d.addEventListener('toggle', function () { if (d.open) track('expand_frente', { frente: d.getAttribute('data-frente') }); });
  });
  $$('[data-principio]').forEach(function (d) {
    d.addEventListener('toggle', function () { if (d.open) track('expand_principio', { principio: d.getAttribute('data-principio') }); });
  });
  $$('[data-faq]').forEach(function (d) {
    d.addEventListener('toggle', function () { if (d.open) track('faq_expand', { pregunta: d.getAttribute('data-faq') }); });
  });

  /* Espectro de paquetes (sección 3.6) */
  var espectro = $('[data-espectro]');
  if (espectro) {
    $$('.sh-paq', espectro).forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-paq');
        $$('.sh-paq', espectro).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        $$('[data-paq-ficha]', espectro).forEach(function (f) { f.hidden = f.getAttribute('data-paq-ficha') !== k; });
        track('spectrum_select', { paquete: k });
      });
    });
    var detalle = $('[data-modulo-detalle]', espectro);
    $$('.sh-modulo', espectro).forEach(function (b) {
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') === 'true';
        $$('.sh-modulo', espectro).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        if (on) { detalle.textContent = 'Elige un módulo.'; return; }
        b.setAttribute('aria-pressed', 'true');
        vacia(detalle);
        detalle.appendChild(nodo('b', null, b.getAttribute('data-modulo') + ' agrega:'));
        detalle.appendChild(document.createTextNode(' ' + b.getAttribute('data-que') + ' '));
        detalle.appendChild(nodo('b', null, 'Para:'));
        detalle.appendChild(document.createTextNode(' ' + b.getAttribute('data-para')));
        track('select_modulo', { modulo: b.getAttribute('data-modulo') });
      });
    });
  }

  /* Mapa comparativo (sección 3.7) */
  var mapa = $('[data-mapa]');
  if (mapa) {
    function eligeAlt(g) {
      var k = g.getAttribute('data-alt');
      $$('.sh-alt', mapa).forEach(function (x) { x.setAttribute('aria-pressed', x === g ? 'true' : 'false'); });
      $$('[data-alt-ficha]', mapa).forEach(function (f) { f.hidden = f.getAttribute('data-alt-ficha') !== k; });
      track('compare_select', { alternativa: k });
    }
    $$('.sh-alt', mapa).forEach(function (g) {
      g.addEventListener('click', function () { eligeAlt(g); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); eligeAlt(g); } });
    });
  }

  /* ── 3 · Quiz «¿Qué necesita mi espacio?» · cuatro líneas, un motor ──
     RC4. Página propia (que-necesito.html). Rutas por hash:
       (vacío)              → elegir espacio
       #house|#office|#retail|#warehouse → línea precargada, pantalla de entrada
       #resultado/CÓDIGO    → resultado compartible (la letra inicial es la línea)
     Cada línea trae sus preguntas, su motor de paquete, su relato y su cierre.
     El códec es genérico: empaqueta las respuestas en el orden de las
     preguntas (índice para «una», máscara para «varias»). */
  var quiz = $('[data-quiz]'), res = $('[data-resultado]');
  if (!quiz || !res) return;

  function t_(arr, v) { return (arr || []).indexOf(v) >= 0; }

  var LINEAS = {
    house: {
      letra: 'H', nombre: 'casa', marca: 'Smart Space House', pagina: 'house.html',
      entrada: { rotulo: 'Tu casa · 6 preguntas · 2 minutos', h1: '¿Qué necesita tu casa?', lead: 'Contesta seis preguntas y te contamos un día en tu casa: qué haría sola, desde que sales hasta que te duermes, y con qué paquete empieza. Sin registro.' },
      preguntas: [
        { k: 'vivienda', q: '¿Dónde vives?', ayuda: 'Define el retrato y las escenas que aplican a tu casa.', tipo: 'una', ops: [
          { v: 'depa', t: 'Departamento', i: 'i2-edificio' }, { v: 'casa', t: 'Casa', i: 'i2-casa' }, { v: 'obra', t: 'Casa en construcción o remodelación', i: 'i2-obra' } ] },
        { k: 'hogar', q: '¿Quién vive contigo?', ayuda: 'Elige todas las que apliquen.', tipo: 'varias', ops: [
          { v: 'pareja', t: 'Solo o en pareja', i: 'i2-presencia' }, { v: 'ninos', t: 'Con niños', i: 'i2-presencia' }, { v: 'mayores', t: 'Con adultos mayores', i: 'i2-presencia' }, { v: 'mascotas', t: 'Con mascotas', i: 'i2-presencia' }, { v: 'apoyo', t: 'Alguien nos ayuda en casa', i: 'i2-grupo' } ] },
        { k: 'tienes', q: '¿Qué ya tienes conectado?', ayuda: 'Lo que ya tienes se integra si es compatible y estable.', tipo: 'varias', ops: [
          { v: 'bocina', t: 'Bocina', i: 'i2-voz' }, { v: 'camaras', t: 'Cámaras', i: 'i2-camara' }, { v: 'focos', t: 'Focos', i: 'i2-luz' }, { v: 'cerradura', t: 'Cerradura', i: 'i2-candado' }, { v: 'aire', t: 'Aire con control', i: 'i2-clima' }, { v: 'persianas', t: 'Persianas', i: 'i2-persiana' }, { v: 'nada', t: 'Nada todavía', i: 'i2-casa', solo: true } ] },
        { k: 'dejar', q: '¿Qué te gustaría dejar de hacer?', ayuda: 'Hasta tres. Cada una es una escena de tu día.', tipo: 'varias', max: 3, ops: [
          { v: 'cerre', t: 'Preguntarme si cerré', i: 'i2-candado' }, { v: 'apagar', t: 'Apagar todo antes de salir', i: 'i2-luz' }, { v: 'clima', t: 'Enfriar cuartos vacíos', i: 'i2-clima' }, { v: 'fuga', t: 'Enterarme tarde de una fuga', i: 'i2-agua' }, { v: 'pasillo', t: 'Prender la luz del pasillo de madrugada', i: 'i2-luna' }, { v: 'porton', t: 'Preocuparme por el portón', i: 'i2-acceso' }, { v: 'tinaco', t: 'Revisar el tinaco o la bomba', i: 'i2-tinaco' } ] },
        { k: 'alcance', q: '¿Hasta dónde quieres llegar hoy?', ayuda: 'Define tu punto de partida. Después se crece sin cambiar el sistema.', tipo: 'una', ops: [
          { v: 'zona', t: 'Un cuarto o una zona', i: 'i2-sillon' }, { v: 'usamos', t: 'Lo que más usamos', i: 'i2-luz' }, { v: 'completa', t: 'La casa completa', i: 'i2-casa' } ] },
        { k: 'importa', q: '¿Qué es lo que más te importa?', ayuda: 'Define el tono de tu día.', tipo: 'una', ops: [
          { v: 'tranquilidad', t: 'Tranquilidad', i: 'i2-escudo' }, { v: 'comodidad', t: 'Comodidad', i: 'i2-sillon' }, { v: 'ahorro', t: 'Gastar menos', i: 'i2-energia' }, { v: 'privacidad', t: 'Privacidad', i: 'i2-candado' } ] }
      ],
      paqs: ['start', 'comfort', 'secure', 'integral'], ext: ['Departamento', 'Residencia'],
      PAQ: {
        start:    { n: 'House Start',    precio: '$30,086',  para: 'Departamento o casa pequeña, hasta 3 ambientes. Responder a presencia, apertura y fugas sin apps desconectadas.', c: ['Controlador local con respaldo eléctrico', 'Sensores de apertura, movimiento, temperatura y fuga', '2 circuitos de luz', 'Enchufes con medición', '5 automatizaciones'], cierre: 'Cubre lo urgente e integra lo que ya tienes. Todo lo que instales después se suma al mismo sistema.' },
        comfort:  { n: 'House Comfort',  precio: '$49,052',  para: 'Vivienda de hasta 5 ambientes que quiere escenas y confort: clima y luz por zona, buenos días, modo noche, persiana compatible.', c: ['Lo de Start', 'Control de clima compatible', 'Control IR', 'Presencia avanzada', '4 circuitos de luz', '9 automatizaciones'], cierre: 'Cubre lo que más usan, integra lo que ya tienes y crece cuando quieran.' },
        secure:   { n: 'House Secure',   precio: '$68,879',  para: 'Vivienda que quiere ver accesos y tener evidencia: puerta, visitas, cámaras con grabación local, simulación de presencia.', c: ['Controlador con disco local', '2 cámaras con grabador', 'Videoportero IP', 'Cerradura compatible', 'Sensores de apertura y fuga', '9 automatizaciones'], cierre: 'Accesos, evidencia y avisos en una sola lógica, con lo que ya tienes integrado.' },
        integral: { n: 'House Integral', precio: '$120,603', para: 'Casa de hasta 7 ambientes que quiere todo junto: confort, accesos, video, energía y mitigación de agua en una sola lógica.', c: ['Lo de Comfort y Secure', 'Medidor de tablero', 'Electroválvula de agua', '6 circuitos de luz', '16 automatizaciones'], cierre: 'Luz, clima, energía, accesos y agua trabajando como un solo sistema.' }
      },
      ESCENAS: {
        salir:     { n: 'Modo Salir',         i: 'i2-acceso',    m: 'Mañana, al salir', orden: 1 },
        clima:     { n: 'Clima inteligente',  i: 'i2-clima',     m: 'Tarde', orden: 2 },
        llegada:   { n: 'Llegada',            i: 'i2-casa',      m: 'Tarde, al regresar', orden: 3 },
        porton:    { n: 'Portón y cochera',   i: 'i2-acceso',    m: 'Tarde, al regresar', orden: 3 },
        tinaco:    { n: 'Cisterna y tinaco',  i: 'i2-tinaco',    m: 'Cualquier momento', orden: 4 },
        pasillo:   { n: 'Pasillo nocturno',   i: 'i2-luna',      m: 'Madrugada', orden: 5 },
        fuga:      { n: 'Fuga detectada',     i: 'i2-agua',      m: 'Un día entre semana', orden: 6 },
        presencia: { n: 'Presencia simulada', i: 'i2-presencia', m: 'Fin de semana fuera', orden: 7 },
        dormir:    { n: 'Modo dormir',        i: 'i2-luna',      m: 'Noche', orden: 9 }
      },
      motor: function (e) {
        var casa = e.vivienda === 'casa' || e.vivienda === 'obra';
        var d = e.dejar || [], h = e.hogar || [], t = e.tienes || [];
        var prio = [], impl = [];
        if (t_(d, 'cerre') || t_(d, 'apagar')) prio.push('salir');
        if (t_(d, 'fuga')) prio.push('fuga');
        if (t_(d, 'pasillo')) prio.push('pasillo');
        if (t_(d, 'clima')) prio.push('clima');
        if (t_(d, 'tinaco') && casa) prio.push('tinaco');
        if (t_(d, 'porton') && casa) prio.push('porton');
        if ((t_(h, 'ninos') || t_(h, 'mayores')) && prio.indexOf('pasillo') < 0) impl.push('pasillo');
        if (t_(t, 'aire') && prio.indexOf('clima') < 0) impl.push('clima');
        if ((t_(h, 'apoyo') || t_(t, 'cerradura')) && prio.indexOf('porton') < 0) impl.push('llegada');
        if (e.importa === 'tranquilidad') impl.push('presencia');
        var escenas = prio.slice();
        impl.forEach(function (k) { if (escenas.length < 4 && escenas.indexOf(k) < 0) escenas.push(k); });
        ['salir', 'pasillo', 'llegada'].forEach(function (k) { if (escenas.length < 2 && escenas.indexOf(k) < 0) escenas.push(k); });
        escenas = escenas.slice(0, 4);
        var ES = this.ESCENAS;
        escenas.sort(function (a, b) { return ES[a].orden - ES[b].orden; });
        var abre = { tranquilidad: ['salir', 'fuga'], comodidad: ['pasillo', 'llegada'], ahorro: ['clima'], privacidad: ['salir'] }[e.importa] || [];
        for (var i = 0; i < abre.length; i++) { var k = abre[i]; var ix = escenas.indexOf(k); if (ix > 0) { escenas.splice(ix, 1); escenas.unshift(k); break; } }
        escenas.push('dormir');
        var paq = 'start';
        if (e.alcance === 'usamos') { paq = 'comfort'; if (casa && (e.importa === 'tranquilidad' || (t_(d, 'porton') && t_(d, 'cerre')))) paq = 'secure'; }
        else if (e.alcance === 'completa') { if (casa) paq = 'integral'; else paq = e.importa === 'tranquilidad' ? 'secure' : 'comfort'; }
        return { escenas: escenas, paquete: paq, tono: e.importa, notas: [] };
      },
      relato: function (e, r) {
        var depa = e.vivienda === 'depa', viv = depa ? 'departamento' : 'casa';
        var h = e.hogar || [], t = e.tienes || [];
        var ninos = t_(h, 'ninos'), mayores = t_(h, 'mayores'), mascotas = t_(h, 'mascotas'), apoyo = t_(h, 'apoyo');
        var quien = ninos ? 'salen todos con prisa' : (mayores ? 'sale el último de la casa' : 'sales con prisa');
        var focos = t_(t, 'focos') ? 'los focos que ya tenías se apagan' : 'las luces se apagan';
        var bocina = t_(t, 'bocina') ? ' y te avisa por tu bocina y tu teléfono' : ' y te avisa a tu teléfono';
        var camaras = t_(t, 'camaras') ? ' Las cámaras que ya tenías guardan el registro.' : '';
        var aire = t_(t, 'aire') ? 'El aire que ya tienes' : 'El aire';
        var cerr = t_(t, 'cerradura') ? 'la cerradura que ya tienes queda armada' : 'los accesos quedan cerrados';
        var privado = r.tono === 'privacidad' ? ' Todo eso ocurre dentro de tu ' + viv + ', sin pasar por la nube de nadie.' : '';
        var P = {
          salir: function () { return 'Son las 7:40 y ' + quien + '. Cuando la puerta se cierra, tu ' + viv + ' entiende que se quedó ' + (depa ? 'solo' : 'sola') + ': ' + focos + ', el clima baja y ' + cerr + '. No revisas nada desde el coche. La casa ya lo hizo.' + privado; },
          clima: function () { return 'A las 2 de la tarde el sol pega en la recámara principal y nadie está ahí. ' + aire + ' no se enciende para nadie: opera solo cuando hay alguien en el cuarto y la temperatura lo pide. Si alguien abre una ventana con el aire prendido, la casa avisa.' + (mascotas ? ' Lo que el perro necesita se queda encendido; lo demás, no.' : ''); },
          llegada: function () { return 'A las 6:30 llegas. La casa te reconoce: se abre el acceso, se enciende la entrada y todo queda en la escena que dejaste configurada.' + camaras + (apoyo ? ' Cuando la persona que les ayuda entra por la mañana, su acceso es el suyo, con su horario, y tú lo ves.' : ''); },
          porton: function () { return 'A las 6:30 llegas. El portón reconoce tu coche y abre; la luz de la cochera y la entrada se encienden.' + camaras + (apoyo ? ' Cuando la persona que les ayuda entra por la mañana, su acceso es el suyo, con su horario, y tú lo ves.' : ' Nadie se queda afuera esperando a que alguien encuentre el control.'); },
          tinaco: function () { return 'Un jueves la cisterna baja más de lo normal. La bomba arranca cuando debe y se detiene antes de trabajar en seco; el tinaco se llena sin que nadie suba a revisar. Si algo no cuadra con el consumo de siempre, te avisa.'; },
          pasillo: function () { var quienP = ninos ? 'tu hija se levanta al baño' : (mayores ? 'alguien se levanta al baño' : 'te levantas por agua'); return 'A las 3:10 de la mañana ' + quienP + '. El pasillo se enciende a media luz cuando detecta el paso y se apaga solo cuando vuelve a la cama. Nadie prende la luz del techo. Nadie se despierta del todo.'; },
          fuga: function () { return 'Un martes, mientras estás fuera, un sensor bajo el fregadero detecta agua. La casa cierra la llave' + bocina + ' antes de que ' + (depa ? 'el vecino de abajo se entere' : 'el daño llegue al piso') + '.'; },
          presencia: function () { return 'El fin de semana se van dos días. La casa enciende y apaga luces y persianas con un patrón creíble, como si alguien estuviera; los accesos avisan si algo se abre cuando no debería.' + (t_(t, 'camaras') ? ' Las cámaras que ya tenías guardan la evidencia.' : ''); },
          dormir: function () { return 'A las 11 de la noche dices «buenas noches». Las luces bajan, el clima se acomoda para dormir y la casa queda en guardia hasta que amanezca.'; }
        };
        var obra = e.vivienda === 'obra' ? ' Como tu casa está en obra, podemos diseñar la automatización antes de acabados.' : '';
        var paq = this.PAQ[r.paquete];
        return {
          titulo: 'Esto es lo que necesita tu ' + (e.vivienda === 'obra' ? 'casa nueva' : viv),
          relatoTitulo: 'Así sería un día en tu ' + viv,
          parrafos: r.escenas.map(function (k) { return { k: k, texto: P[k]() }; }),
          cierre: { fuerte: 'Tu punto de partida: ' + paq.n + '.', texto: ' ' + paq.cierre + obra + ' El alcance exacto lo definimos en tu casa, en el diagnóstico. Comfort y Secure son alternativas: eliges según lo que quieres resolver.' },
          paq: paq
        };
      },
      tienesNom: { bocina: 'Bocina', camaras: 'Cámaras', focos: 'Focos', cerradura: 'Cerradura', aire: 'Aire con control', persianas: 'Persianas' },
      cta: { h2: 'Antes de cotizar, lo ves funcionar.', p: 'Dinos tu ciudad y tu WhatsApp: te confirmamos si llegamos a tu zona y te mandamos este día para que lo veas con quien decide contigo.', boton: 'Mándamelo por WhatsApp', nota: 'Abre WhatsApp con tu código y tu paquete ya escritos.', empresa: false,
        msg: function (paqN, codigo, ciudad) { return 'Hola SIEN, hice el quiz y mi casa necesita ' + paqN + '. Mi código es ' + codigo + '. Vivo en ' + (ciudad || '[ciudad]') + '.'; } },
      partidaNota: 'Es tu punto de partida, no una cotización. El alcance exacto lo definimos en tu casa.',
      legal: 'El resultado del quiz es un punto de partida, no una cotización ni una promesa de alcance. El alcance exacto lo define el diagnóstico en tu casa ($1,500 + IVA, se bonifica al contratar). Precios de referencia + IVA; Comfort y Secure son alternativas. Pólizas Care por separado.'
    },

    office: {
      letra: 'O', nombre: 'oficina', marca: 'Smart Space Office', pagina: 'office.html',
      entrada: { rotulo: 'Tu oficina · 6 preguntas · 2 minutos', h1: '¿Qué necesita tu oficina?', lead: 'Seis preguntas y te contamos la jornada de tu oficina: qué apagaría sola, qué registraría y con qué paquete empieza. El alcance final lo define la visita técnica. Sin registro.' },
      preguntas: [
        { k: 'tamano', q: '¿Qué tamaño tiene tu oficina?', ayuda: 'Metros y zonas de referencia; la ingeniería se calcula por puntos.', tipo: 'una', ops: [
          { v: 'chica', t: 'Hasta 200 m² · hasta 6 zonas', i: 'i2-sillon' }, { v: 'media', t: 'Hasta 350 m² · hasta 10 zonas', i: 'i2-edificio' }, { v: 'grande', t: 'Hasta 500 m² · hasta 15 zonas', i: 'i2-edificio' }, { v: 'mas', t: 'Más de 500 m² o varios pisos', i: 'i2-mas' } ] },
        { k: 'tenencia', q: '¿El inmueble es suyo o rentan?', ayuda: 'Define qué autorización hace falta antes de instalar.', tipo: 'una', ops: [
          { v: 'propio', t: 'Es nuestro', i: 'i2-edificio' }, { v: 'renta', t: 'Rentamos', i: 'i2-acceso' }, { v: 'corporativo', t: 'Edificio corporativo con administración', i: 'i2-grupo' } ] },
        { k: 'dejar', q: '¿Qué quieres que deje de pasar?', ayuda: 'Hasta tres. Cada una es un momento de la jornada.', tipo: 'varias', max: 3, ops: [
          { v: 'prendido', t: 'Luces y clima prendidos sin nadie', i: 'i2-luz' }, { v: 'recibo', t: 'Enterarme del consumo por el recibo', i: 'i2-energia' }, { v: 'salas', t: 'Salas de juntas con el clima a tope', i: 'i2-clima' }, { v: 'puertas', t: 'Puertas abiertas fuera de horario', i: 'i2-acceso' }, { v: 'aire', t: 'Aire viciado en espacios cerrados', i: 'i2-aire' }, { v: 'cierra', t: 'Depender de quien cierra', i: 'i2-reloj' } ] },
        { k: 'tienes', q: '¿Qué ya tienen instalado?', ayuda: 'Lo que ya tienen se integra si es compatible y no interfiere con el edificio.', tipo: 'varias', ops: [
          { v: 'minisplits', t: 'Minisplits o aire con control', i: 'i2-clima' }, { v: 'camaras', t: 'Cámaras', i: 'i2-camara' }, { v: 'acceso', t: 'Control de acceso', i: 'i2-acceso' }, { v: 'bms', t: 'Sistema central del edificio', i: 'i2-chip' }, { v: 'nada', t: 'Nada todavía', i: 'i2-edificio', solo: true } ] },
        { k: 'horario', q: '¿Cómo opera tu oficina?', ayuda: 'Define cómo se programan apagados y escenas.', tipo: 'una', ops: [
          { v: 'fijo', t: 'Horario fijo, lunes a viernes', i: 'i2-sol' }, { v: 'extendido', t: 'Horario extendido o turnos', i: 'i2-reloj' }, { v: 'hibrido', t: 'Híbrido, ocupación variable', i: 'i2-presencia' } ] },
        { k: 'importa', q: '¿Qué es lo que más te importa?', ayuda: 'Define el tono de la jornada.', tipo: 'una', ops: [
          { v: 'ahorro', t: 'Gastar menos', i: 'i2-energia' }, { v: 'datos', t: 'Saber cómo se ocupa', i: 'i2-grafica' }, { v: 'control', t: 'Accesos y horarios bajo control', i: 'i2-escudo' }, { v: 'confort', t: 'Confort del equipo', i: 'i2-sillon' } ] }
      ],
      paqs: ['core', 'plus', 'multizona'], ext: ['Hasta 200 m²', 'Hasta 500 m²'],
      PAQ: {
        core:      { n: 'Office Core',      precio: '$64,900',  para: 'Oficina de hasta 200 m² y 6 zonas. Apagado programado, ocupación de zonas, eventos de apertura y un punto de energía.', c: ['Controlador con disco y respaldo eléctrico', 'Sensores de apertura, movimiento, temperatura y humedad', '5 circuitos de luz', '1 punto de medición', '8 reglas y escenas', 'Panel general'], cierre: 'Apaga lo que no se usa y te dice cómo se ocupa. Lo que instales después se suma al mismo sistema.' },
        plus:      { n: 'Office Plus',      precio: '$99,900',  para: 'Oficina de hasta 350 m² y 10 zonas. Lo de Core más aire, presencia y clima compatible, con informe por zona.', c: ['Lo de Core, más puntos', 'CO₂, presencia avanzada y controles IR', '8 circuitos de luz', '2 puntos de medición', '14 reglas y escenas', 'Panel por zona'], cierre: 'Clima y aire por zona, con datos para decidir y no con el recibo.' },
        multizona: { n: 'Office MultiZona', precio: '$149,900', para: 'Oficina de hasta 500 m² y 15 zonas. Más puntos, secciones, roles y reportes; hasta dos coordinadores.', c: ['Hasta 2 coordinadores', 'Más puntos por zona', '12 circuitos de luz', '3 puntos de medición', '22 reglas y escenas', 'Panel por zona con roles'], cierre: 'Secciones, roles y reportes para una oficina grande, con site survey y red autorizada.' }
      },
      ESCENAS: {
        llega:   { n: 'Llega el primero',   i: 'i2-luz',     m: '07:30', orden: 1 },
        sala:    { n: 'Sala de juntas',     i: 'i2-clima',   m: '10:00', orden: 2 },
        aire:    { n: 'Aire en la sala',    i: 'i2-aire',    m: '11:30', orden: 3 },
        informe: { n: 'Informe de energía', i: 'i2-grafica', m: '14:00', orden: 4 },
        puertas: { n: 'Puerta fuera de hora', i: 'i2-acceso', m: '19:10', orden: 5 },
        fuera:   { n: 'Fuera de horario',   i: 'i2-luna',    m: '20:15', orden: 6 }
      },
      motor: function (e) {
        var d = e.dejar || [], t = e.tienes || [], notas = [];
        var paq = { chica: 'core', media: 'plus', grande: 'multizona', mas: 'multizona' }[e.tamano] || 'core';
        if (paq === 'core' && (t_(d, 'salas') || t_(d, 'aire') || t_(t, 'minisplits') || e.importa === 'datos')) { paq = 'plus'; notas.push('Subimos a Plus porque lo que quieres resolver pide clima, aire o informe por zona, que Core no incluye.'); }
        if (e.tamano === 'mas') notas.push('Más de 500 m² o varios pisos se dimensiona en la visita técnica; MultiZona es la base.');
        if (e.tenencia !== 'propio') notas.push('Al rentar, la instalación requiere autorización del arrendador o de la administración; lo confirmamos antes de cotizar.');
        if (t_(t, 'bms')) notas.push('Con sistema central del edificio, Smart Space opera sin interferir con él; lo validamos en la visita.');
        var esc = ['llega'];
        if (t_(d, 'salas') || e.importa === 'confort') esc.push('sala');
        if (t_(d, 'aire') && paq !== 'core') esc.push('aire');
        if (t_(d, 'recibo') || e.importa === 'ahorro' || e.importa === 'datos') esc.push('informe');
        if (t_(d, 'puertas') || e.importa === 'control') esc.push('puertas');
        esc.push('fuera');
        esc = esc.filter(function (k, i) { return esc.indexOf(k) === i; }).slice(0, 5);
        var ES = this.ESCENAS; esc.sort(function (a, b) { return ES[a].orden - ES[b].orden; });
        return { escenas: esc, paquete: paq, tono: e.importa, notas: notas };
      },
      relato: function (e, r) {
        var t = e.tienes || [];
        var hib = e.horario === 'hibrido', turnos = e.horario === 'extendido';
        var P = {
          llega: function () { return 'Son las 7:30 y llega la primera persona. Se enciende solo la zona que ocupa; el resto de los circuitos sigue apagado hasta que alguien llega.' + (hib ? ' En un día híbrido, con media oficina vacía, la mitad de la luz y el clima no trabajan para nadie.' : ''); },
          sala: function () { return 'A las 10 empieza la junta. ' + (t_(t, 'minisplits') ? 'El minisplit que ya tienen' : 'El clima de la sala') + ' opera solo con gente adentro y se apaga cuando se vacía, sin que nadie se acuerde del control.'; },
          aire: function () { return 'A las 11:30 la sala lleva hora y media cerrada. El CO₂ sube y la oficina lo registra: ventila o avisa antes de que la junta se vuelva lenta.'; },
          informe: function () { return 'A las 2 de la tarde el panel muestra cuánto consumió cada área esta semana. Decides con números, no con el recibo de la CFE.'; },
          puertas: function () { return 'A las 7:10 de la noche se abre la puerta de servicio. ' + (t_(t, 'acceso') ? 'Tu control de acceso' : 'La oficina') + ' lo registra y avisa al responsable, con hora.'; },
          fuera: function () { return 'A las 8:15 de la noche se apaga lo no esencial, programado' + (turnos ? ' por turno' : '') + '. Nadie depende de quien cierra. Si una puerta se abre después, llega un aviso.'; }
        };
        var paq = this.PAQ[r.paquete];
        return {
          titulo: 'Esto es lo que necesita tu oficina',
          relatoTitulo: 'Así sería la jornada de tu oficina',
          parrafos: r.escenas.map(function (k) { return { k: k, texto: P[k]() }; }),
          cierre: { fuerte: 'Tu punto de partida: ' + paq.n + '.', texto: ' ' + paq.cierre + ' El alcance exacto lo define la visita técnica: zonas, puntos e infraestructura.' },
          paq: paq
        };
      },
      tienesNom: { minisplits: 'Minisplits', camaras: 'Cámaras', acceso: 'Control de acceso', bms: 'Sistema del edificio' },
      cta: { h2: 'El alcance lo define la visita técnica.', p: 'Visita en tu oficina: $2,500 + IVA. Salimos con zonas, puntos y una propuesta cerrada. Dinos tu ciudad y tu WhatsApp y te confirmamos si llegamos a tu zona.', boton: 'Agendar visita por WhatsApp', nota: 'Abre WhatsApp con tu código y tu punto de partida ya escritos.', empresa: true,
        msg: function (paqN, codigo, ciudad, empresa) { return 'Hola SIEN, hice el quiz y mi oficina' + (empresa ? ' (' + empresa + ')' : '') + ' empieza con ' + paqN + '. Mi código es ' + codigo + '. Estamos en ' + (ciudad || '[ciudad]') + '. Quiero agendar la visita técnica.'; } },
      partidaNota: 'Es tu punto de partida, no una cotización. Metros y zonas son de referencia; la ingeniería se calcula por puntos en la visita.',
      legal: 'El resultado del quiz es un punto de partida, no una cotización ni una promesa de alcance. El alcance lo define la visita técnica ($2,500 + IVA). Precios de referencia + IVA. Soporte en horario hábil, sin SLA 24×7. Pólizas Care por separado.'
    },

    retail: {
      letra: 'R', nombre: 'local', marca: 'Smart Space Retail', pagina: 'retail.html',
      entrada: { rotulo: 'Tu local · 6 preguntas · 2 minutos', h1: '¿Qué necesita tu local?', lead: 'Seis preguntas y te contamos la jornada de tu local: qué registraría solo, de la apertura al cierre, y con qué paquete empieza. El alcance final lo define la visita técnica. Sin registro.' },
      preguntas: [
        { k: 'sedes', q: '¿Cuántos locales tienes?', ayuda: 'Red 3 Sedes es el mismo estándar en tres locales de una misma plaza.', tipo: 'una', ops: [
          { v: 'uno', t: 'Uno', i: 'i2-tienda' }, { v: 'dos', t: 'Dos', i: 'i2-tienda' }, { v: 'tres', t: 'Tres o más en la misma plaza', i: 'i2-grupo' }, { v: 'ciudades', t: 'Varios en distintas ciudades', i: 'i2-mas' } ] },
        { k: 'tamano', q: '¿Qué tamaño tiene el local?', ayuda: 'Si tienes varios, el más grande.', tipo: 'una', ops: [
          { v: 'chico', t: 'Hasta 120 m²', i: 'i2-tienda' }, { v: 'medio', t: 'Hasta 200 m²', i: 'i2-tienda' }, { v: 'grande', t: 'Más de 200 m²', i: 'i2-mas' } ] },
        { k: 'giro', q: '¿Qué vendes?', ayuda: 'Define qué registramos y qué no.', tipo: 'una', ops: [
          { v: 'alimentos', t: 'Alimentos o bebidas', i: 'i2-cafetera' }, { v: 'ropa', t: 'Ropa, calzado o accesorios', i: 'i2-tienda' }, { v: 'servicios', t: 'Servicios: salón, clínica, estética', i: 'i2-persona' }, { v: 'otro', t: 'Otro giro', i: 'i2-mas' } ] },
        { k: 'dejar', q: '¿Qué quieres que deje de pasar?', ayuda: 'Hasta tres. Cada una es un momento de la jornada.', tipo: 'varias', max: 3, ops: [
          { v: 'cierre', t: 'No saber a qué hora abrieron o cerraron', i: 'i2-reloj' }, { v: 'luces', t: 'Luces y letrero prendidos toda la noche', i: 'i2-luz' }, { v: 'fuga', t: 'Enterarme tarde de una fuga', i: 'i2-agua' }, { v: 'bodega', t: 'Entradas por la bodega sin aviso', i: 'i2-acceso' }, { v: 'clima', t: 'Clima a tope con el local vacío', i: 'i2-clima' }, { v: 'consumo', t: 'No saber cuánto consume cada local', i: 'i2-energia' } ] },
        { k: 'tienes', q: '¿Qué ya tienes en el local?', ayuda: 'No tocamos punto de venta, cajas ni alarma; se integra lo compatible.', tipo: 'varias', ops: [
          { v: 'camaras', t: 'Cámaras', i: 'i2-camara' }, { v: 'alarma', t: 'Alarma monitoreada', i: 'i2-escudo' }, { v: 'pos', t: 'Punto de venta', i: 'i2-chip' }, { v: 'minisplit', t: 'Minisplit', i: 'i2-clima' }, { v: 'nada', t: 'Nada todavía', i: 'i2-tienda', solo: true } ] },
        { k: 'importa', q: '¿Qué es lo que más te importa?', ayuda: 'Define el tono de la jornada.', tipo: 'una', ops: [
          { v: 'evidencia', t: 'Evidencia de apertura y cierre', i: 'i2-check' }, { v: 'ahorro', t: 'Gastar menos', i: 'i2-energia' }, { v: 'estandar', t: 'Que todos los locales operen igual', i: 'i2-grupo' }, { v: 'tranquilidad', t: 'Tranquilidad cuando no estoy', i: 'i2-escudo' } ] }
      ],
      paqs: ['sede', 'plus', 'red'], ext: ['Un local', 'Tres locales'],
      PAQ: {
        sede: { n: 'Retail Sede',         precio: '$35,900',  para: 'Un local de hasta 120 m². Cierre, horarios, entradas y fugas puntuales, con evidencia de apertura y cierre.', c: ['Controlador y respaldo eléctrico', 'Sensores de apertura, movimiento, temperatura y fuga', '2 circuitos de luz', '2 contactos medidos', '6 automatizaciones', 'Evidencia por local'], cierre: 'Abre, cierra y avisa igual todos los días, sin pedirle nada al personal.' },
        plus: { n: 'Retail Plus',         precio: '$54,900',  para: 'Un local de hasta 200 m². Más áreas, medición de consumo en tablero y clima auxiliar compatible.', c: ['Lo de Sede, más áreas', '4 circuitos de luz', '3 contactos medidos', 'Medidor de tablero y control IR', '10 automatizaciones', 'Evidencia local + resumen'], cierre: 'Más áreas bajo control y el consumo del local en números.' },
        red:  { n: 'Retail Red 3 Sedes',  precio: '$103,900', para: 'Tres locales de hasta 120 m² en una misma plaza. Mismo estándar, misma ejecución y reporte mensual asistido.', c: ['3 controladores, uno por local', 'Sensores por local', '2 circuitos de luz por local', '2 contactos medidos por local', '6 automatizaciones por local', 'Reporte mensual asistido'], cierre: 'El mismo estándar instalado en tres locales, con un solo reporte al mes.' }
      },
      ESCENAS: {
        abre:   { n: 'Abre',               i: 'i2-sol',    m: '08:55', orden: 1 },
        fuga:   { n: 'Una fuga',           i: 'i2-agua',   m: '12:40', orden: 2 },
        clima:  { n: 'Local vacío',        i: 'i2-clima',  m: '15:30', orden: 3 },
        bodega: { n: 'Entrada por bodega', i: 'i2-acceso', m: '17:15', orden: 4 },
        cierra: { n: 'Cierra',             i: 'i2-luna',   m: '21:05', orden: 5 },
        reporte: { n: 'Las tres sedes',    i: 'i2-grafica', m: 'Fin de mes', orden: 6 }
      },
      motor: function (e) {
        var d = e.dejar || [], t = e.tienes || [], notas = [];
        var paq = e.tamano === 'chico' ? 'sede' : 'plus';
        if (paq === 'sede' && (t_(d, 'clima') || t_(d, 'consumo'))) { paq = 'plus'; notas.push('Subimos a Plus porque controlar el clima o medir el consumo del local pide medidor de tablero y control IR, que Sede no incluye.'); }
        if (e.sedes === 'tres' && e.tamano === 'chico') { paq = 'red'; }
        else if (e.sedes === 'tres') notas.push('Red 3 Sedes aplica a locales de hasta 120 m²; con locales más grandes se cotiza Plus por local, con el mismo estándar.');
        if (e.sedes === 'dos') notas.push('Con dos locales se instala el mismo paquete en cada uno; la visita deja una lista de diferencias por inmueble.');
        if (e.sedes === 'ciudades') notas.push('En distintas ciudades se cotiza por local; te confirmamos a qué plazas llegamos en el primer mensaje.');
        if (e.tamano === 'grande') notas.push('Más de 200 m² se dimensiona en la visita técnica; Plus es la base.');
        if (e.giro === 'alimentos') notas.push('Medimos temperatura y humedad generales del local; no es cadena fría certificada ni sustituye el HACCP.');
        var esc = ['abre'];
        if (t_(d, 'fuga') || e.giro === 'alimentos') esc.push('fuga');
        if (t_(d, 'clima') && paq !== 'sede') esc.push('clima');
        if (t_(d, 'bodega') || e.importa === 'tranquilidad') esc.push('bodega');
        esc.push('cierra');
        if (paq === 'red' || e.importa === 'estandar') esc.push('reporte');
        esc = esc.filter(function (k, i) { return esc.indexOf(k) === i; }).slice(0, 5);
        var ES = this.ESCENAS; esc.sort(function (a, b) { return ES[a].orden - ES[b].orden; });
        return { escenas: esc, paquete: paq, tono: e.importa, notas: notas };
      },
      relato: function (e, r) {
        var t = e.tienes || [];
        var P = {
          abre: function () { return 'Son las 8:55 y se abre la cortina. Queda registrado a qué hora abrió el local, sin que nadie lo reporte' + (t_(t, 'pos') ? ' y sin tocar tu punto de venta' : '') + '.'; },
          fuga: function () { return 'A las 12:40 el sensor bajo la tarja detecta agua y avisa al responsable antes de que llegue al ' + (e.giro === 'alimentos' ? 'almacén de insumos' : 'inventario') + '.'; },
          clima: function () { return 'A las 3:30 el local lleva media hora sin clientes. ' + (t_(t, 'minisplit') ? 'El minisplit que ya tienes' : 'El clima auxiliar') + ' baja solo y vuelve cuando entra alguien. El consumo del mes lo ves en el tablero, no en el recibo.'; },
          bodega: function () { return 'A las 5:15 se abre la puerta de la bodega fuera de lo esperado. Llega un aviso al celular del responsable, con hora' + (t_(t, 'camaras') ? ', y las cámaras que ya tienes guardan el registro' : '') + '.'; },
          cierra: function () { return 'A las 9:05 de la noche el local cierra. Luces' + (t_(e.dejar, 'luces') ? ', letrero' : '') + ' y cargas se apagan solas. Queda evidencia de cierre' + (t_(t, 'alarma') ? '; tu alarma sigue siendo tu alarma' : '') + '.'; },
          reporte: function () { return 'A fin de mes recibes un solo documento con apertura, cierre y anomalías de ' + (e.sedes === 'tres' ? 'las tres sedes' : 'tus locales') + '. No es un panel en vivo: es un reporte asistido, igual para todos.'; }
        };
        var paq = this.PAQ[r.paquete];
        return {
          titulo: 'Esto es lo que necesita tu local',
          relatoTitulo: 'Así sería la jornada de tu local',
          parrafos: r.escenas.map(function (k) { return { k: k, texto: P[k]() }; }),
          cierre: { fuerte: 'Tu punto de partida: ' + paq.n + '.', texto: ' ' + paq.cierre + ' El alcance exacto lo define la visita técnica, sin interferir con punto de venta, cajas ni alarma.' },
          paq: paq
        };
      },
      tienesNom: { camaras: 'Cámaras', alarma: 'Alarma monitoreada', pos: 'Punto de venta', minisplit: 'Minisplit' },
      cta: { h2: 'El alcance lo define la visita técnica.', p: 'Visita en tu local: $2,500 + IVA. Probamos apertura y cierre sin tocar tu punto de venta. Dinos tu ciudad y tu WhatsApp y te confirmamos si llegamos a tu zona.', boton: 'Agendar visita por WhatsApp', nota: 'Abre WhatsApp con tu código y tu punto de partida ya escritos.', empresa: true,
        msg: function (paqN, codigo, ciudad, empresa) { return 'Hola SIEN, hice el quiz y mi local' + (empresa ? ' (' + empresa + ')' : '') + ' empieza con ' + paqN + '. Mi código es ' + codigo + '. Estamos en ' + (ciudad || '[ciudad]') + '. Quiero agendar la visita técnica.'; } },
      partidaNota: 'Es tu punto de partida, no una cotización. Cada sede opera por su cuenta; la visita deja una propuesta cerrada por local.',
      legal: 'El resultado del quiz es un punto de partida, no una cotización ni una promesa de alcance. El alcance lo define la visita técnica ($2,500 + IVA). Precios de referencia + IVA. Red 3 Sedes requiere los tres locales en una misma plaza. No es alarma monitoreada ni cadena fría. Pólizas Care por separado.'
    },

    warehouse: {
      letra: 'W', nombre: 'bodega', marca: 'Smart Space Warehouse', pagina: 'warehouse.html',
      entrada: { rotulo: 'Tu bodega · 6 preguntas · 2 minutos', h1: '¿Qué necesita tu bodega?', lead: 'Seis preguntas y te decimos si Warehouse aplica para tu almacén, qué registraría solo y con qué paquete empieza. Sin survey de cobertura no cotizamos; el quiz te dice si vale la pena agendarlo. Sin registro.' },
      preguntas: [
        { k: 'guardas', q: '¿Qué guardas?', ayuda: 'Define si Warehouse aplica. Te lo decimos de frente.', tipo: 'una', ops: [
          { v: 'seco', t: 'Mercancía seca: cajas, tarimas, equipo', i: 'i2-bodega' }, { v: 'ambiente', t: 'Producto sensible a temperatura o humedad, sin norma', i: 'i2-clima' }, { v: 'frio', t: 'Cadena de frío, farmacéuticos regulados o materiales peligrosos', i: 'i2-aviso' } ] },
        { k: 'tamano', q: '¿Qué tamaño tiene la bodega?', ayuda: 'Metros de referencia; la cobertura de radio se valida en sitio, nunca por plano.', tipo: 'una', ops: [
          { v: 'chica', t: 'Hasta 500 m²', i: 'i2-bodega' }, { v: 'media', t: 'Hasta 800 m²', i: 'i2-bodega' }, { v: 'grande', t: 'Más de 800 m²', i: 'i2-mas' } ] },
        { k: 'ver', q: '¿Qué quieres que registre sola?', ayuda: 'Hasta tres. Lo que se sale de la banda avisa; lo demás queda en el resumen.', tipo: 'varias', max: 3, ops: [
          { v: 'temperatura', t: 'Temperatura y humedad', i: 'i2-clima' }, { v: 'accesos', t: 'Accesos fuera de horario', i: 'i2-acceso' }, { v: 'consumo', t: 'Consumo de circuitos auxiliares', i: 'i2-energia' }, { v: 'fuga', t: 'Fugas de agua', i: 'i2-agua' }, { v: 'aire', t: 'CO₂ y aire', i: 'i2-aire' }, { v: 'resumen', t: 'Un resumen semanal sin revisar nada', i: 'i2-grafica' } ] },
        { k: 'racks', q: '¿Cómo está armada por dentro?', ayuda: 'Los racks metálicos tapan la señal; el survey mide la cobertura entre ellos.', tipo: 'una', ops: [
          { v: 'abierta', t: 'Nave abierta o racks bajos', i: 'i2-bodega' }, { v: 'racks', t: 'Racks metálicos altos', i: 'i2-grupo' }, { v: 'mixta', t: 'Mixta, con oficinas o mezzanine', i: 'i2-edificio' } ] },
        { k: 'permisos', q: '¿Quién autoriza instalar en el inmueble?', ayuda: 'Sin autorización del parque o del arrendador no se instala.', tipo: 'una', ops: [
          { v: 'propio', t: 'Nosotros, es nuestra', i: 'i2-check' }, { v: 'arrendador', t: 'El arrendador o el parque, y suele autorizar', i: 'i2-acceso' }, { v: 'prohibido', t: 'El parque o TI no permiten intervenir', i: 'i2-candado' } ] },
        { k: 'importa', q: '¿Qué es lo que más te importa?', ayuda: 'Define el tono de la semana.', tipo: 'una', ops: [
          { v: 'alertas', t: 'Enterarme a tiempo', i: 'i2-aviso' }, { v: 'evidencia', t: 'Evidencia de condiciones y accesos', i: 'i2-check' }, { v: 'ahorro', t: 'Gastar menos en circuitos', i: 'i2-energia' }, { v: 'operar', t: 'Operar sin vigilancia permanente', i: 'i2-presencia' } ] }
      ],
      paqs: ['lite', 'monitor'], ext: ['Hasta 500 m²', 'Hasta 800 m²'],
      PAQ: {
        lite:    { n: 'Warehouse Lite',    precio: '$79,900',  para: 'Bodega seca de hasta 500 m². Registro de condiciones y accesos con avisos básicos; un coordinador, sujeto a survey.', c: ['Controlador con disco y respaldo eléctrico', 'Sensores de apertura, temperatura, humedad y movimiento', '2 relés de circuitos auxiliares', '1 punto de medición', '2 repetidores previstos', '10 reglas y avisos', 'Resumen básico'], cierre: 'Registra condiciones y accesos y avisa cuando algo se sale de la banda.' },
        monitor: { n: 'Warehouse Monitor', precio: '$119,900', para: 'Bodega seca de hasta 800 m². Lo de Lite más fugas, aire y resumen consolidado; hasta dos coordinadores.', c: ['Hasta 2 coordinadores', 'Sensores de fuga y CO₂', '4 relés de circuitos auxiliares', '2 puntos de medición', '5 repetidores previstos', '18 reglas y avisos', 'Resumen consolidado'], cierre: 'Condiciones, accesos, fugas y aire en un solo resumen, sin vigilancia permanente.' }
      },
      ESCENAS: {
        temperatura: { n: 'Temperatura',   i: 'i2-clima',    m: 'Lun 06:10', orden: 1 },
        aire:        { n: 'Humedad y aire', i: 'i2-aire',    m: 'Mié 13:30', orden: 2 },
        fuga:        { n: 'Fuga',          i: 'i2-agua',     m: 'Jue 02:20', orden: 3 },
        acceso:      { n: 'Acceso',        i: 'i2-acceso',   m: 'Vie 19:40', orden: 4 },
        consumo:     { n: 'Circuitos',     i: 'i2-energia',  m: 'Sáb 07:00', orden: 5 },
        resumen:     { n: 'Resumen',       i: 'i2-grafica',  m: 'Dom 08:00', orden: 6 }
      },
      motor: function (e) {
        var v = e.ver || [], notas = [];
        if (e.guardas === 'frio') return { descarte: 'frio', escenas: [], paquete: null, notas: [] };
        if (e.permisos === 'prohibido') return { descarte: 'permisos', escenas: [], paquete: null, notas: [] };
        var paq = e.tamano === 'chica' ? 'lite' : 'monitor';
        if (paq === 'lite' && (t_(v, 'fuga') || t_(v, 'aire') || t_(v, 'resumen') || e.guardas === 'ambiente')) { paq = 'monitor'; notas.push('Subimos a Monitor porque fugas, aire o el resumen consolidado no están en Lite.'); }
        if (e.tamano === 'grande') notas.push('Más de 800 m² se dimensiona en el survey; Monitor es la base.');
        if (e.racks === 'racks') notas.push('Con racks metálicos altos, el survey mide la cobertura de radio entre ellos y define los repetidores; sin ruta de señal, no se instala.');
        if (e.permisos === 'arrendador') notas.push('La autorización del parque o del arrendador se confirma antes de la visita.');
        if (e.guardas === 'ambiente') notas.push('Las bandas de temperatura y humedad son informativas y se fijan contigo; no es metrología certificada.');
        var esc = [];
        if (t_(v, 'temperatura') || e.guardas === 'ambiente') esc.push('temperatura');
        if (t_(v, 'aire') && paq === 'monitor') esc.push('aire');
        if (t_(v, 'fuga') && paq === 'monitor') esc.push('fuga');
        if (t_(v, 'accesos') || e.importa === 'evidencia') esc.push('acceso');
        if (t_(v, 'consumo') || e.importa === 'ahorro') esc.push('consumo');
        if (!esc.length) esc.push('temperatura', 'acceso');
        esc.push('resumen');
        esc = esc.filter(function (k, i) { return esc.indexOf(k) === i; }).slice(0, 5);
        var ES = this.ESCENAS; esc.sort(function (a, b) { return ES[a].orden - ES[b].orden; });
        return { escenas: esc, paquete: paq, tono: e.importa, notas: notas };
      },
      relato: function (e, r) {
        if (r.descarte) {
          var fr = r.descarte === 'frio';
          return {
            titulo: 'Te lo decimos de frente: Warehouse no es para esta bodega',
            relatoTitulo: '',
            parrafos: [],
            descarte: fr ? 'Cámaras de frío, farmacéuticos regulados y materiales peligrosos requieren metrología certificada, cadena fría validada o sistemas normados. Smart Space Warehouse registra condiciones de un almacén seco con bandas informativas; no certifica temperatura ni sustituye esas obligaciones. Si tu operación tiene además una zona seca, cuéntanos y vemos si aplica ahí.'
                        : 'Sin autorización del parque, del arrendador o de TI no podemos instalar sensores, repetidores ni el controlador. Si la autorización se puede gestionar, escríbenos y te decimos qué hace falta pedir; con ella en mano, el quiz vuelve a aplicar.',
            cierre: null, paq: null
          };
        }
        var P = {
          temperatura: function () { return 'El lunes a las 6:10 la bodega amanece fuera de la banda que acordamos. El responsable recibe el aviso antes de que abra, no cuando ya se dio cuenta alguien.'; },
          aire: function () { return 'El miércoles a la 1:30 la humedad sube en la zona de cartón y el CO₂ en el área cerrada. Queda registrado y, si se sale de la banda, avisa.'; },
          fuga: function () { return 'El jueves a las 2:20 de la madrugada un sensor en el baño de la bodega detecta agua. Aviso con hora; nadie llega a un charco el viernes.'; },
          acceso: function () { return 'El viernes a las 7:40 de la noche se abre la puerta de andén fuera de horario. Evento con hora y aviso al responsable' + (e.importa === 'evidencia' ? '; la evidencia queda en el registro' : '') + '.'; },
          consumo: function () { return 'El sábado a las 7 los circuitos auxiliares que nadie usa en fin de semana ya están apagados por regla. El consumo de la semana queda medido, no estimado.'; },
          resumen: function () { return 'El domingo a las 8 llega el resumen de la semana: condiciones, accesos y consumo en un solo documento, ' + (r.paquete === 'monitor' ? 'consolidado' : 'básico') + '. ' + (e.importa === 'operar' ? 'Nadie vigiló nada; todo quedó registrado.' : 'Lo que se salió de la banda ya avisó; lo demás está ahí.'); }
        };
        var paq = this.PAQ[r.paquete];
        return {
          titulo: 'Esto es lo que necesita tu bodega',
          relatoTitulo: 'Así sería una semana en tu bodega',
          parrafos: r.escenas.map(function (k) { return { k: k, texto: P[k]() }; }),
          cierre: { fuerte: 'Tu punto de partida: ' + paq.n + '.', texto: ' ' + paq.cierre + ' El alcance exacto lo define el survey de cobertura: puntos, repetidores y permisos.' },
          paq: paq
        };
      },
      tienesNom: {},
      cta: { h2: 'Sin survey de cobertura no cotizamos.', p: 'Visita técnica con estudio de radio: $4,000 + IVA. Salimos con el mapa de puntos y repetidores de tu bodega. Dinos tu ciudad y tu WhatsApp y te confirmamos si llegamos a tu zona.', boton: 'Agendar survey por WhatsApp', nota: 'Abre WhatsApp con tu código y tu punto de partida ya escritos.', empresa: true,
        msg: function (paqN, codigo, ciudad, empresa) { return 'Hola SIEN, hice el quiz y mi bodega' + (empresa ? ' (' + empresa + ')' : '') + ' empieza con ' + paqN + '. Mi código es ' + codigo + '. Estamos en ' + (ciudad || '[ciudad]') + '. Quiero agendar el survey de cobertura.'; } },
      ctaDescarte: { h2: 'Si crees que sí aplica, cuéntanos.', p: 'Dinos qué guardas, cuántos metros tiene y quién autoriza. Te contestamos de frente en el primer mensaje.', boton: 'Contar mi caso por WhatsApp', nota: 'Abre WhatsApp con tu código ya escrito.',
        msg: function (paqN, codigo, ciudad, empresa) { return 'Hola SIEN, hice el quiz de Warehouse y me dijo que no aplica. Mi código es ' + codigo + '. Mi bodega' + (empresa ? ' (' + empresa + ')' : '') + ' está en ' + (ciudad || '[ciudad]') + ' y guardamos [tipo de mercancía]. Quiero que lo revisen.'; } },
      partidaNota: 'Es tu punto de partida, no una cotización. La cobertura de radio se valida en sitio; sin survey no cotizamos.',
      legal: 'El resultado del quiz es un punto de partida, no una cotización ni una promesa de alcance. El alcance lo define la visita técnica con estudio de cobertura ($4,000 + IVA, obligatoria). Precios de referencia + IVA. No incluye metrología certificada ni cadena de frío; soporte en horario hábil, sin SLA 24×7. Póliza Care por separado.'
    }
  };
  var ORDEN_LINEAS = ['house', 'office', 'retail', 'warehouse'];
  var LETRA = {}; ORDEN_LINEAS.forEach(function (k) { LETRA[LINEAS[k].letra] = k; });

  /* ── Estado y rutas ─────────────────────────────────────────────────── */
  var estado = cargaEstado();
  var linea = null;  /* clave de LINEAS */
  var paso = 0;      /* 0 = entrada, 1..n = pregunta */
  var origenQuiz = 'directo';

  function cargaEstado() { try { return JSON.parse(sessionStorage.getItem('sh-quiz') || '{}'); } catch (e) { return {}; } }
  function guardaEstado() { try { sessionStorage.setItem('sh-quiz', JSON.stringify(estado)); } catch (e) {} }
  function L() { return LINEAS[linea]; }
  function R() { return estado[linea] || (estado[linea] = {}); }

  function ruta() {
    var h = location.hash.replace(/^#\/?/, '');
    var m = h.match(/^resultado\/([A-Z])([A-Z0-9]{6,14})$/i);
    if (m && LETRA[m[1].toUpperCase()]) { abreResultado(LETRA[m[1].toUpperCase()], m[1].toUpperCase() + m[2].toUpperCase()); return; }
    if (LINEAS[h]) { linea = h; estado.linea = h; guardaEstado(); abreQuiz(); return; }
    linea = estado.linea && LINEAS[estado.linea] ? estado.linea : null;
    abreQuiz();
  }
  window.addEventListener('hashchange', ruta);

  function muestra(capa) {
    quiz.hidden = capa !== quiz; res.hidden = capa !== res;
    if (waFlotante) waFlotante.hidden = true; /* dentro del quiz distrae; en el resultado el CTA ya es WhatsApp */
    window.scrollTo(0, 0);
  }
  function pantalla(n) {
    $$('[data-quiz-pantalla]', quiz).forEach(function (p) { p.hidden = p.getAttribute('data-quiz-pantalla') !== n; });
    $('[data-quiz-progreso]', quiz).hidden = n !== 'pregunta';
    $('[data-quiz-barra]', quiz).hidden = n !== 'pregunta';
    quiz.setAttribute('data-pantalla', n);
  }

  function abreQuiz() {
    muestra(quiz);
    if (!linea) { pantalla('espacio'); var f = $('[data-quiz-espacio]', quiz); if (f) f.focus(); return; }
    var E = L().entrada;
    $('[data-quiz-marca]').textContent = L().marca;
    $('[data-quiz-rotulo-entrada]').textContent = E.rotulo;
    $('[data-quiz-h1]').textContent = E.h1;
    $('[data-quiz-lead]').textContent = E.lead;
    var cambiar = $('[data-quiz-cambiar]'); cambiar.hidden = false;
    var r = R();
    if (r.paso && r.paso > 0 && r.paso <= L().preguntas.length) { paso = r.paso; pintaPregunta(); }
    else { paso = 0; pantalla('entrada'); var foco = $('[data-quiz-empezar]', quiz); if (foco) foco.focus(); }
  }

  /* Selector de espacio (entrada desde el Inicio, Blog o FAQs) */
  $$('[data-quiz-espacio]', quiz).forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-quiz-espacio');
      track('quiz_space', { linea: k });
      location.hash = k; /* la ruta hace el resto */
    });
  });
  $('[data-quiz-cambiar]').addEventListener('click', function () {
    linea = null; estado.linea = null; guardaEstado();
    history.pushState('', '', location.pathname); abreQuiz();
  });
  $$('[data-quiz-abrir]').forEach(function (a) {
    a.addEventListener('click', function () { origenQuiz = a.getAttribute('data-origen') || 'directo'; track('quiz_start', { origen: origenQuiz }); });
  });
  $('[data-quiz-empezar]').addEventListener('click', function () { track('quiz_begin', { linea: linea, origen: origenQuiz }); paso = 1; pintaPregunta(); });
  $('[data-quiz-atras]').addEventListener('click', function () {
    if (paso <= 1) { paso = 0; R().paso = 0; guardaEstado(); pantalla('entrada'); return; }
    paso--; pintaPregunta();
  });
  $('[data-quiz-siguiente]').addEventListener('click', avanza);

  function pintaPregunta() {
    var PS = L().preguntas, P = PS[paso - 1], r = R();
    pantalla('pregunta');
    r.paso = paso; guardaEstado();
    $('[data-quiz-rotulo]').textContent = 'Pregunta ' + paso + ' de ' + PS.length;
    $('[data-quiz-pregunta]').textContent = P.q;
    $('[data-quiz-ayuda]').textContent = P.ayuda;
    var prog = $('[data-quiz-progreso]', quiz); vacia(prog);
    PS.forEach(function (x, i) { var b = nodo('i'); if (i < paso - 1) b.setAttribute('data-hecho', ''); if (i === paso - 1) b.setAttribute('data-actual', ''); prog.appendChild(b); });
    var caja = $('[data-quiz-opciones]');
    vacia(caja);
    caja.className = 'sh-opciones' + (P.ops.length === 3 ? ' sh-opciones--3' : '');
    caja.setAttribute('aria-label', P.q);
    var sel = r[P.k] || (P.tipo === 'varias' ? [] : '');
    P.ops.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'sh-op'; b.setAttribute('data-v', o.v);
      if (o.i) b.appendChild(icono(o.i));
      b.appendChild(nodo('span', null, o.t));
      var on = P.tipo === 'varias' ? sel.indexOf(o.v) >= 0 : sel === o.v;
      b.setAttribute(P.tipo === 'varias' ? 'aria-pressed' : 'aria-checked', on ? 'true' : 'false');
      if (P.tipo === 'una') b.setAttribute('role', 'radio');
      b.addEventListener('click', function () { elige(P, o, b); });
      caja.appendChild(b);
    });
    caja.setAttribute('role', P.tipo === 'una' ? 'radiogroup' : 'group');
    var sig = $('[data-quiz-siguiente]');
    sig.hidden = P.tipo !== 'varias';
    sig.disabled = P.tipo === 'varias' ? sel.length === 0 : !sel;
    sig.textContent = paso === PS.length ? 'Ver mi resultado' : 'Siguiente';
    $('[data-quiz-pista]').hidden = P.tipo === 'varias';
    actualizaCuenta(P);
    window.scrollTo(0, 0);
  }
  function actualizaCuenta(P) {
    var c = $('[data-quiz-cuenta]'), r = R();
    if (P.tipo !== 'varias') { c.textContent = ''; return; }
    var n = (r[P.k] || []).length;
    c.textContent = P.max ? n + ' de ' + P.max : (n ? n + ' elegidas' : 'Elige una o más');
    if (P.max) $$('.sh-op', $('[data-quiz-opciones]')).forEach(function (b) { b.disabled = b.getAttribute('aria-pressed') !== 'true' && n >= P.max; });
  }
  function elige(P, o, b) {
    var r = R();
    if (P.tipo === 'una') {
      r[P.k] = o.v; guardaEstado();
      $$('.sh-op', b.parentNode).forEach(function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); });
      track('quiz_step', { linea: linea, paso: paso, respuesta: o.v });
      setTimeout(avanza, 380);
      return;
    }
    var sel = (r[P.k] || []).slice();
    var on = sel.indexOf(o.v) >= 0;
    if (on) sel.splice(sel.indexOf(o.v), 1);
    else {
      if (o.solo) sel = [];
      else sel = sel.filter(function (v) { var op = P.ops.filter(function (x) { return x.v === v; })[0]; return !(op && op.solo); });
      if (P.max && sel.length >= P.max) return;
      sel.push(o.v);
    }
    r[P.k] = sel; guardaEstado();
    $$('.sh-op', b.parentNode).forEach(function (x) { x.setAttribute('aria-pressed', sel.indexOf(x.getAttribute('data-v')) >= 0 ? 'true' : 'false'); });
    $('[data-quiz-siguiente]').disabled = sel.length === 0;
    actualizaCuenta(P);
  }
  function avanza() {
    var PS = L().preguntas, P = PS[paso - 1];
    if (P.tipo === 'varias') track('quiz_step', { linea: linea, paso: paso, respuesta: (R()[P.k] || []).join(',') });
    if (paso < PS.length) { paso++; pintaPregunta(); return; }
    generaResultado();
  }

  /* ── Códec genérico: letra de línea + respuestas empaquetadas + sal ─── */
  function codifica(k, e) {
    var Lk = LINEAS[k], n = 0;
    Lk.preguntas.forEach(function (P) {
      var vals = P.ops.map(function (o) { return o.v; });
      if (P.tipo === 'una') { n = n * vals.length + Math.max(0, vals.indexOf(e[P.k])); }
      else { var m = 0; (e[P.k] || []).forEach(function (v) { var i = vals.indexOf(v); if (i >= 0) m |= (1 << i); }); n = n * Math.pow(2, vals.length) + m; }
    });
    var s = n.toString(36).toUpperCase(); while (s.length < 6) s = '0' + s;
    var sal = Math.floor(Math.random() * 1296).toString(36).toUpperCase(); while (sal.length < 2) sal = '0' + sal;
    return Lk.letra + s + sal;
  }
  function decodifica(k, c) {
    var Lk = LINEAS[k]; var n = parseInt(c.slice(1, -2), 36); if (isNaN(n)) return null;
    var e = {}, PS = Lk.preguntas.slice().reverse();
    PS.forEach(function (P) {
      var vals = P.ops.map(function (o) { return o.v; });
      if (P.tipo === 'una') { e[P.k] = vals[n % vals.length]; n = Math.floor(n / vals.length); }
      else { var base = Math.pow(2, vals.length), m = n % base; n = Math.floor(n / base); e[P.k] = vals.filter(function (v, i) { return m & (1 << i); }); }
    });
    return e;
  }
  window.shMotor = function (k, e) { return LINEAS[k].motor(e); };

  /* ── Resultado ──────────────────────────────────────────────────────── */
  function generaResultado() {
    pantalla('espera');
    var t0 = Date.now(), r = R(), codigo = codifica(linea, r);
    try { sessionStorage.setItem('sh-res-' + codigo, '1'); } catch (e) {}
    var m = L().motor(r);
    track('result_generated', { linea: linea, codigo: codigo, paquete: m.paquete, descarte: m.descarte || '', escenas: m.escenas.join(','), tiempo_ms: 0 });
    setTimeout(function () {
      r.paso = 0; guardaEstado();
      location.hash = 'resultado/' + codigo;
      track('result_view', { linea: linea, codigo: codigo, propio: true, tiempo_ms: Date.now() - t0 });
    }, reduce ? 300 : 1400);
  }

  function abreResultado(k, codigo) {
    var e = decodifica(k, codigo);
    if (!e) { history.replaceState('', '', location.pathname); linea = null; abreQuiz(); return; }
    linea = k;
    var Lk = L(), m = Lk.motor(e), Rr = Lk.relato(e, m);
    var propio = false; try { propio = !!sessionStorage.getItem('sh-res-' + codigo); } catch (x) {}
    if (!propio) track('result_view', { linea: k, codigo: codigo, propio: false });
    muestra(res);
    res.setAttribute('data-linea', k); res.setAttribute('data-codigo', codigo); res.setAttribute('data-paquete', m.paquete || ''); res.setAttribute('data-descarte', m.descarte || '');
    $('[data-res-marca]').textContent = Lk.marca;
    $('[data-res-volver]').setAttribute('href', Lk.pagina);
    $('[data-res-codigo]').textContent = codigo;
    $('[data-res-titulo]').textContent = Rr.titulo;

    /* Punto de partida */
    var partida = $('[data-res-partida]'); partida.hidden = !!m.descarte;
    var descarte = $('[data-res-descarte]'); descarte.hidden = !m.descarte;
    if (m.descarte) { $('[data-res-descarte-texto]').textContent = Rr.descarte; }
    else {
      $('[data-res-paquete-nombre]').textContent = Rr.paq.n;
      var ext = $('[data-res-ext]'); vacia(ext); ext.appendChild(nodo('span', null, Lk.ext[0])); ext.appendChild(nodo('span', null, Lk.ext[1]));
      var eje = $('[data-res-eje]'); vacia(eje); eje.style.setProperty('--n', Lk.paqs.length);
      Lk.paqs.forEach(function (pk) { var s = nodo('span', 'sh-paq'); s.setAttribute('data-res-paq', pk); s.setAttribute('aria-pressed', pk === m.paquete ? 'true' : 'false'); s.appendChild(nodo('i')); s.appendChild(nodo('b', null, Lk.PAQ[pk].n)); eje.appendChild(s); });
      $('[data-res-paquete-titulo]').textContent = Rr.paq.n;
      $('[data-res-paquete-precio]').textContent = 'Desde ' + Rr.paq.precio + ' + IVA';
      $('[data-res-paquete-para]').textContent = Rr.paq.para;
      var chips = $('[data-res-paquete-chips]'); vacia(chips); Rr.paq.c.forEach(function (c) { chips.appendChild(nodo('li', null, c)); });
      var notas = $('[data-res-notas]'); vacia(notas); m.notas.forEach(function (n) { notas.appendChild(nodo('li', null, n)); }); notas.hidden = !m.notas.length;
      $('[data-res-partida-nota]').textContent = Lk.partidaNota;
    }

    /* CTA */
    var C = m.descarte ? Lk.ctaDescarte : Lk.cta;
    $('[data-res-cta-titulo]').textContent = C.h2;
    $('[data-res-cta-texto]').textContent = C.p;
    $('[data-res-enviar-texto]').textContent = C.boton;
    $('[data-res-cta-nota]').textContent = C.nota;
    $('[data-res-empresa-campo]').hidden = !Lk.cta.empresa;
    $('[data-res-ciudad]').setAttribute('placeholder', '¿En qué ciudad está tu ' + Lk.nombre + '?');

    /* Relato */
    var bloqueRelato = $('[data-res-relato-bloque]'); bloqueRelato.hidden = !Rr.parrafos.length;
    $('[data-res-relato-titulo]').textContent = Rr.relatoTitulo;
    var cont = $('[data-res-relato]'); vacia(cont);
    Rr.parrafos.forEach(function (p) {
      var E = Lk.ESCENAS[p.k], art = nodo('article');
      var esc = nodo('div', 'sh-escena'); esc.appendChild(icono(E.i)); esc.appendChild(nodo('small', null, E.m)); esc.appendChild(nodo('b', null, E.n));
      art.appendChild(esc); art.appendChild(nodo('p', null, p.texto)); cont.appendChild(art);
    });
    if (Rr.cierre) { var cierre = nodo('div', 'sh-relato__cierre'), cp = nodo('p'); cp.appendChild(nodo('strong', null, Rr.cierre.fuerte)); cp.appendChild(document.createTextNode(Rr.cierre.texto)); cierre.appendChild(cp); cont.appendChild(cierre); }

    /* Lo que ya tienes */
    var NOM = Lk.tienesNom, ten = (e.tienes || []).filter(function (v) { return NOM[v]; });
    var bt = $('[data-res-tienes]'); bt.hidden = !ten.length || !!m.descarte;
    var tch = $('[data-res-tienes-chips]'); vacia(tch); ten.forEach(function (v) { tch.appendChild(nodo('li', null, NOM[v] + ' · se revisa en la visita')); });

    $('[data-res-legal]').textContent = Lk.legal;
  }

  /* Candado de contacto: validar → abrir canal dentro del gesto */
  var forma = $('[data-res-forma]');
  var enviando = false;
  forma.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var trampa = $('[data-res-trampa]', forma);
    if (trampa && trampa.value) return;
    if (enviando) return;
    var boton = $('[data-res-enviar]', forma);
    enviando = true; boton.disabled = true; boton.setAttribute('aria-busy', 'true');
    setTimeout(function () { enviando = false; boton.disabled = false; boton.removeAttribute('aria-busy'); }, 2500);
    var err = $('[data-res-error]', forma); err.hidden = true;
    var mal = [];
    $$('[data-res-req]', forma).forEach(function (c) { c.removeAttribute('data-mal'); if (!c.value.trim()) { c.setAttribute('data-mal', ''); mal.push(c); } });
    var tel = $('[data-res-tel]', forma); var digitos = tel.value.replace(/\D/g, '');
    if (tel.value.trim() && digitos.length < 10) { tel.setAttribute('data-mal', ''); mal.push(tel); }
    var cons = $('[data-res-consent]', forma);
    if (!cons.checked) mal.push(cons);
    if (mal.length) { err.textContent = !cons.checked && mal.length === 1 ? 'Necesitamos tu consentimiento para mandarte el resultado.' : 'Revisa tu nombre, tu ciudad y un WhatsApp de diez dígitos.'; err.hidden = false; mal[0].focus(); return; }
    var Lk = L(), codigo = res.getAttribute('data-codigo'), descarte = res.getAttribute('data-descarte');
    var ciudadF = ($('[data-res-ciudad]', forma) || { value: '' }).value.trim().slice(0, 60);
    var empresaF = ($('[data-res-empresa]', forma) || { value: '' }).value.trim().slice(0, 80);
    var paqN = (Lk.PAQ[res.getAttribute('data-paquete')] || { n: 'un paquete' }).n;
    track('lead_submit', { linea: linea, codigo: codigo, ciudad: ciudadF, paquete: res.getAttribute('data-paquete'), descarte: descarte });
    /* PENDIENTE · endpoint de registro (decisión SIEN 5): fetch(..., {method:'POST', keepalive:true}); descartar si «sitio_web» viene lleno */
    var C = descarte ? Lk.ctaDescarte : Lk.cta;
    var msg = C.msg(paqN, codigo, ciudadF, empresaF);
    track('whatsapp_click', { origen: 'quiz_' + linea, codigo: codigo });
    var w = window.open('https://wa.me/' + WA_NUM + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    err.textContent = w ? 'Abrimos WhatsApp en otra pestaña con tu código ya escrito. Si tu navegador la bloqueó, escríbenos desde ahí: tu registro ya quedó.' : 'Tu navegador bloqueó la ventana. Escríbenos al WhatsApp del sitio con tu código ' + codigo + '.';
    err.hidden = false;
  });

  $('[data-res-compartir]').addEventListener('click', function () {
    var codigo = res.getAttribute('data-codigo');
    var url = location.origin + location.pathname + '#resultado/' + codigo;
    var aviso = $('[data-res-copiado]');
    function copiado(m) { track('result_share', { linea: linea, codigo: codigo, metodo: m }); aviso.hidden = false; setTimeout(function () { aviso.hidden = true; }, 2600); }
    if (navigator.share) { navigator.share({ title: 'Lo que necesita mi ' + L().nombre, text: 'Mira lo que haría sola.', url: url }).then(function () { copiado('nativo'); }).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { copiado('copiar'); }, function () { window.prompt('Copia el enlace:', url); copiado('prompt'); });
    else { window.prompt('Copia el enlace:', url); copiado('prompt'); }
  });
  $('[data-res-pdf]').addEventListener('click', function () { track('result_pdf', { linea: linea, codigo: res.getAttribute('data-codigo') }); window.print(); });
  $('[data-res-otra]').addEventListener('click', function () {
    linea = null; estado.linea = null; guardaEstado();
    history.pushState('', '', location.pathname); abreQuiz();
  });

  ruta();
})();


/* ── v2.4 · Recorrido de capacidades ─────────────────────────────────────────
   Recorre las ocho capacidades con la luz cálida mientras la sección está en
   pantalla. Hover, foco o clic en una capacidad la activa y pausa el recorrido;
   se reanuda solo a los 5 s sin interacción. Con reduced-motion no recorre. */
(function () {
  var anillo = document.querySelector('[data-anillo]');
  if (!anillo) return;
  var caps = Array.prototype.slice.call(anillo.querySelectorAll('.sh-cap'));
  var centro = anillo.querySelector('.sh-anillo__centro');
  var nombre = anillo.querySelector('[data-anillo-nombre]');
  var texto = anillo.querySelector('[data-anillo-texto]');
  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var i = 0, timer = null, pausa = null, visible = false, PASO = 1400;

  function activa(n, manual) {
    i = (n + caps.length) % caps.length;
    caps.forEach(function (c, k) { c.classList.toggle('activa', k === i); });
    anillo.style.setProperty('--ang', (i * 45) + 'deg'); anillo.style.setProperty('--i', i); anillo.style.setProperty('--n', caps.length);
    if (centro) {
      centro.classList.add('cambia');
      setTimeout(function () {
        nombre.textContent = caps[i].querySelector('b').textContent;
        texto.textContent = caps[i].querySelector('p').textContent;
        centro.classList.remove('cambia');
      }, 180);
    }
    if (manual && window.dataLayer) window.dataLayer.push({ event: 'capacidad_view', capacidad: caps[i].querySelector('b').textContent.toLowerCase() });
  }
  function arranca() { if (reducido || timer || !visible) return; timer = setInterval(function () { activa(i + 1); }, PASO); }
  function para() { clearInterval(timer); timer = null; }
  function interaccion(n) { para(); clearTimeout(pausa); activa(n, true); pausa = setTimeout(arranca, 5000); }

  caps.forEach(function (c, k) {
    var b = c.querySelector('button');
    c.addEventListener('mouseenter', function () { interaccion(k); });
    b.addEventListener('focus', function () { interaccion(k); });
    b.addEventListener('click', function () { interaccion(k); });
  });
  activa(0);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { visible = e.isIntersecting; visible ? arranca() : para(); });
    }, { threshold: 0.35 }).observe(anillo);
  } else { visible = true; arranca(); }
})();


/* ── v2.5 · Encendido en fila ─────────────────────────────────────────────
   Marca [data-encendido] una sola vez cuando la lista entra en pantalla; el
   orden y los tiempos viven en CSS (--k por tarjeta). */
(function () {
  var filas = document.querySelectorAll('[data-encender]');
  if (!filas.length) return;
  function enciende(el) { el.setAttribute('data-encendido', ''); }
  if (!('IntersectionObserver' in window)) { filas.forEach(enciende); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { enciende(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.4 });
  filas.forEach(function (f) { io.observe(f); });
})();


/* ── v3.5 · Blog: filtros por sección ────────────────────────────────── */
(function () {
  var botones = document.querySelectorAll('[data-filtro]');
  if (!botones.length) return;
  var notas = document.querySelectorAll('[data-cat]');
  botones.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-filtro');
      botones.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      notas.forEach(function (n) { n.hidden = f !== 'todas' && n.getAttribute('data-cat') !== f; });
      if (window.shTrack) window.shTrack('blog_filter', { seccion: f });
    });
  });
  document.querySelectorAll('[data-nota]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); if (window.shTrack) window.shTrack('blog_open', { nota: a.getAttribute('data-nota') }); });
  });
})();


/* ── RC4 · Burbujas del héroe B (v2) ──────────────────────────────────────
   Reposo: cada burbuja navega despacio por su zona con un vaivén suave y
   separación mínima garantizada (siembra en rejilla con jitter).
   Cursor dentro: la alineación entra con una rampa de ~1.1 s (mezcla entre
   navegar y seguir), la fila recorre la estela del cursor con separación
   proporcional al tamaño de cada burbuja; al salir, la rampa baja y vuelven
   a navegar desde donde estaban. Sin movimiento con reduced-motion. */
(function () {
  var capa = document.querySelector('[data-burbujas]');
  if (!capa) return;
  var sec = capa.closest('.sh-heroe');
  var B = Array.prototype.slice.call(capa.querySelectorAll('.sh-burbuja'));
  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0, zonaX0 = 0, zonaX1 = 0, raf = 0, sigue = false, mezcla = 0, estela = [], ultimo = 0, tPrev = 0;
  var TAM = [96, 72, 84, 64, 76, 92, 68, 80, 72, 88, 64, 76, 84, 70];
  var MOVIL = false, bs = [];
  var todas = B.map(function (el, i) { return { el: el, d: 72, x: 0, y: 0, vx: 0, vy: 0, f: Math.random() * 6.28, a: 0.5 + Math.random() * 0.5, hx: 0, hy: 0 }; });
  /* la configuración depende del ancho REAL en cada siembra (el panel del artefacto puede abrir angosto y crecer) */
  function configura() {
    MOVIL = window.innerWidth < 960;
    var escala = MOVIL ? 0.58 : 1, cuantas = MOVIL ? 8 : B.length;
    todas.forEach(function (b, i) { b.el.hidden = i >= cuantas; b.d = Math.round(TAM[i % TAM.length] * escala); b.el.style.setProperty('--d', b.d + 'px'); });
    bs = todas.slice(0, cuantas);
  }
  function medir() {
    var r = capa.getBoundingClientRect(); W = r.width; H = r.height;
    var esc = window.innerWidth >= 960;
    zonaX0 = esc ? W * 0.50 : 0; zonaX1 = W;
  }
  function siembra() {
    configura(); medir();
    /* rejilla con jitter: columnas × filas según la zona, celdas barajadas */
    var ancho = zonaX1 - zonaX0, cols = MOVIL ? 4 : Math.max(2, Math.round(ancho / 150)), filas = Math.max(2, Math.ceil(bs.length / cols));
    var cw = ancho / cols, ch = H / filas, celdas = [];
    for (var r = 0; r < filas; r++) for (var c = 0; c < cols; c++) celdas.push([c, r]);
    for (var k = celdas.length - 1; k > 0; k--) { var q = Math.floor(Math.random() * (k + 1)); var tmp = celdas[k]; celdas[k] = celdas[q]; celdas[q] = tmp; }
    bs.forEach(function (b, i) {
      var cel = celdas[i % celdas.length];
      b.x = zonaX0 + cw * (cel[0] + 0.3 + Math.random() * 0.4); b.y = ch * (cel[1] + 0.3 + Math.random() * 0.4);
      b.hx = b.x; b.hy = b.y;
      b.vx = (Math.random() - 0.5) * 0.3; b.vy = (Math.random() - 0.5) * 0.25;
      pinta(b);
    });
  }
  function pinta(b) { b.el.style.setProperty('--x', (b.x - b.d / 2).toFixed(1) + 'px'); b.el.style.setProperty('--y', (b.y - b.d / 2).toFixed(1) + 'px'); }
  function navega(t, dt, suave) {
    var k = dt / 16.7, x0 = zonaX0 * (1 - suave); /* siguiendo al cursor, todo el héroe es zona */
    bs.forEach(function (b, i) {
      /* deriva suave alrededor de su casa + vaivén */
      b.vx += ((b.hx - b.x) * 0.0006 + (Math.random() - 0.5) * 0.03) * k; b.vy += ((b.hy - b.y) * 0.0006 + (Math.random() - 0.5) * 0.03) * k;
      var v = Math.hypot(b.vx, b.vy), max = MOVIL ? 0.22 : 0.35; if (v > max) { b.vx *= max / v; b.vy *= max / v; }
      b.x += b.vx * k; b.y += (b.vy + Math.sin(t / 1100 + b.f) * 0.12 * b.a) * k;
      var m = b.d / 2 + 10;
      if (b.x < x0 + m) { b.x = x0 + m; b.vx = Math.abs(b.vx); } if (b.x > zonaX1 - m) { b.x = zonaX1 - m; b.vx = -Math.abs(b.vx); }
      if (b.y < m) { b.y = m; b.vy = Math.abs(b.vy); } if (b.y > H - m) { b.y = H - m; b.vy = -Math.abs(b.vy); }
      for (var q = 0; q < i; q++) { var o = bs[q], dx = b.x - o.x, dy = b.y - o.y, dist = Math.hypot(dx, dy) || 1, min = (b.d + o.d) / 2 + (MOVIL ? 10 : 18); if (dist < min) { var e = (min - dist) / 2 * (1 - suave); b.x += dx / dist * e; b.y += dy / dist * e; o.x -= dx / dist * e; o.y -= dy / dist * e; } }
    });
  }
  function objetivos() {
    var out = [], acum = 0, j = estela.length - 1, dist = 0;
    for (var i = 0; i < bs.length; i++) {
      if (i > 0) dist += (bs[i - 1].d + bs[i].d) / 2 + 16;
      while (j > 0 && acum + estela[j - 1].l < dist) { acum += estela[j - 1].l; j--; }
      out.push(estela[j] || estela[estela.length - 1]);
    }
    return out;
  }
  function paso(t) {
    var dt = Math.min(40, t - (tPrev || t)); tPrev = t;
    /* rampa de mezcla: sube en ~1.1 s, baja en ~0.9 s */
    mezcla += (sigue ? 1 : -1) * dt / (sigue ? 1100 : 900); mezcla = Math.max(0, Math.min(1, mezcla));
    var suave = mezcla * mezcla * (3 - 2 * mezcla); /* smoothstep */
    navega(t, dt, suave);
    if (suave > 0 && estela.length) {
      var ob = objetivos();
      bs.forEach(function (b, i) { var o = ob[i]; if (!o) return; var g = 0.12 * suave; b.x += (o.x - b.x) * g; b.y += (o.y - b.y) * g; b.vx *= (1 - suave); b.vy *= (1 - suave); });
    }
    bs.forEach(pinta);
    raf = requestAnimationFrame(paso);
  }
  function enciende(on) { bs.forEach(function (b) { b.el.classList.toggle('encendida', on); }); }
  if (!reducido) {
    {
      sec.addEventListener('pointermove', function (e) {
        if (MOVIL || (e.pointerType && e.pointerType !== 'mouse')) return;
        var r = capa.getBoundingClientRect(); var x = e.clientX - r.left, y = e.clientY - r.top;
        if (!sigue) { sigue = true; estela = []; enciende(true); if (window.shTrack) window.shTrack('hero_burbujas', { accion: 'sigue' }); }
        var u = estela[estela.length - 1];
        if (!u || Math.hypot(x - u.x, y - u.y) > 3) { var l = u ? Math.hypot(x - u.x, y - u.y) : 0; if (u) u.l = l; estela.push({ x: x, y: y, l: 0 }); if (estela.length > 160) estela.shift(); }
      });
      sec.addEventListener('pointerleave', function () { sigue = false; enciende(false); bs.forEach(function (b) { b.hx = b.x; b.hy = b.y; }); });
    }
    window.addEventListener('resize', function () { clearTimeout(ultimo); ultimo = setTimeout(siembra, 150); });
    siembra(); raf = requestAnimationFrame(paso);
    document.addEventListener('visibilitychange', function () { if (document.hidden) cancelAnimationFrame(raf); else { tPrev = 0; raf = requestAnimationFrame(paso); } });
  } else { siembra(); }
})();
