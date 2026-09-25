/* =========================================================
   CONFIGURACIÓN — edita solo esta parte
   - pista:    el acertijo que ve ella
   - ayuda:    pista más directa si se queda pegada
   - codigo:   palabra escrita en la tarjeta de cada mini regalo
   - letra:    letra que gana (juntas forman su nombre)
   - mensaje:  lo que aparece al encontrarlo
   - x, y:     posición del pin en el mapa (0–496, 0–520)
   ========================================================= */
const CONFIG = {
  nombre: "Paulina",
  cartaFinal: "Gracias por llenar mis días de risas.\nFeliz cumpleaños, mi amor.",
  spots: [
    {
      titulo: "Donde empieza todo",
      pista: "Toda aventura parte en la puerta. Busca donde duermen las llaves de la casa.",
      ayuda: "Junto a la puerta de entrada, en el colgador que dice CASA.",
      codigo: "AMOR", letra: "P",
      mensaje: "¡Primera encontrada! Vas muy bien.",
      x: 198, y: 478
    },
    {
      titulo: "Caras conocidas",
      pista: "Aquí hay muchas caras que te quieren. Revisa bien el marco.",
      ayuda: "En el pasillo, el cuadro grande con el collage de fotos. Mira detrás de una esquina.",
      codigo: "ABRAZO", letra: "A",
      mensaje: "Dos de siete. Ya llevas una sonrisa extra.",
      x: 190, y: 360
    },
    {
      titulo: "Garritas",
      pista: "Donde Cookie se afila las uñas, algo te espera cerca de la escalera.",
      ayuda: "El pilar de la baranda que tiene la cuerda enrollada. Revisa los primeros escalones.",
      codigo: "BESO", letra: "U",
      mensaje: "¡Tres! Cookie aprueba.",
      x: 22, y: 205
    },
    {
      titulo: "Aroma de mañana",
      pista: "Hace vapor, suena fuerte y huele rico. Me despierta casi tanto como tú.",
      ayuda: "En el comedor, el rincón donde está la cafetera.",
      codigo: "RISA", letra: "L",
      mensaje: "Cuatro. Esto ya merece un cafecito.",
      x: 457, y: 30
    },
    {
      titulo: "En sintonía",
      pista: "Si pudiera, te dedicaría una canción por esta radio antigua.",
      ayuda: "El mueble blanco del comedor, junto a la radio café.",
      codigo: "MIMO", letra: "I",
      mensaje: "¡Cinco! Ya casi.",
      x: 471, y: 200
    },
    {
      titulo: "Rayas y flores",
      pista: "Entre cojines a rayas, justo bajo un ramo que nunca se marchita.",
      ayuda: "En el sofá de la sala, entre los cojines que quedan bajo el cuadro de flores.",
      codigo: "CARIÑO", letra: "N",
      mensaje: "Seis de siete. ¡Queda una!",
      x: 169, y: 64
    },
    {
      titulo: "Vidrio arriba, madera abajo",
      pista: "La mesa que está al centro de todo tiene un segundo piso. Asómate.",
      ayuda: "La mesa de centro de la sala: revisa la repisa de abajo.",
      codigo: "SIEMPRE", letra: "A",
      mensaje: "¡Las tienes todas!",
      x: 245, y: 134
    }
  ],
  final: { x: 73, y: 241 }
};

/* ========================================================= */

const STORAGE_KEY = "busqueda-tesoro-v1";
const $ = (id) => document.getElementById(id);
const total = CONFIG.spots.length;
let state = { started: false, found: 0 };

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = { ...state, ...JSON.parse(raw) };
  } catch (e) { /* sin almacenamiento: se juega igual */ }
  if (new URLSearchParams(location.search).has("reset")) state = { started: false, found: 0 };
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}

// Compara sin importar mayúsculas, tildes ni espacios
function normalize(s) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").toUpperCase();
}

/* ---------- Letras ---------- */
function renderLetters() {
  const box = $("letters");
  box.innerHTML = "";
  CONFIG.spots.forEach((s, i) => {
    const el = document.createElement("span");
    el.className = "slot" + (i < state.found ? " is-on" : "");
    el.textContent = s.letra;
    box.appendChild(el);
  });
  $("progressText").textContent = state.found < total
    ? `${state.found} de ${total} regalos encontrados`
    : "¡Todas las letras! Toca el regalo del mapa";
}

/* ---------- Mapa ---------- */
const NS = "http://www.w3.org/2000/svg";
function makePin(x, y, label, cls, onTap) {
  const g = document.createElementNS(NS, "g");
  g.setAttribute("class", "pin " + cls);
  g.setAttribute("tabindex", "0");
  g.setAttribute("role", "button");
  if (cls.includes("current")) {
    const ring = document.createElementNS(NS, "circle");
    ring.setAttribute("cx", x); ring.setAttribute("cy", y); ring.setAttribute("r", 15);
    ring.setAttribute("class", "ring");
    g.appendChild(ring);
  }
  const c = document.createElementNS(NS, "circle");
  c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", 15);
  c.setAttribute("class", "base");
  const t = document.createElementNS(NS, "text");
  t.setAttribute("x", x); t.setAttribute("y", y + 1);
  t.textContent = label;
  g.append(c, t);
  g.addEventListener("click", onTap);
  g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onTap(); } });
  return g;
}

function renderMap() {
  const pins = $("pins");
  pins.innerHTML = "";
  CONFIG.spots.forEach((s, i) => {
    let cls, label;
    if (i < state.found) { cls = "pin--done"; label = s.letra; }
    else if (i === state.found) { cls = "pin--current"; label = String(i + 1); }
    else { cls = "pin--locked"; label = "?"; }
    pins.appendChild(makePin(s.x, s.y, label, cls, () => {
      if (i < state.found) toast(`${s.titulo}: ya lo encontraste`);
      else if (i === state.found) $("codeInput").focus();
      else toast("Todavía no. Sigue la pista actual.");
    }));
  });
  const done = state.found >= total;
  pins.appendChild(makePin(
    CONFIG.final.x, CONFIG.final.y, "🎁",
    "pin--final " + (done ? "pin--current" : "pin--locked"),
    () => done ? showFinale() : toast(`Faltan ${total - state.found} regalos para abrir este`)
  ));
}

/* ---------- Pista ---------- */
function renderClue() {
  const card = $("clueCard");
  if (state.found >= total) {
    $("clueStep").textContent = "Sorpresa final";
    $("clueTitle").textContent = "Ya tienes todas las letras";
    $("clueText").textContent = "Tu regalo te espera en el mueble bajo el televisor.";
    $("codeForm").hidden = true;
    $("helpBtn").hidden = true;
    $("clueHelp").hidden = true;
    return;
  }
  const s = CONFIG.spots[state.found];
  $("clueStep").textContent = `Pista ${state.found + 1} de ${total}`;
  $("clueTitle").textContent = s.titulo;
  $("clueText").textContent = s.pista;
  $("clueHelp").textContent = s.ayuda;
  $("clueHelp").hidden = true;
  $("helpBtn").hidden = false;
  $("codeForm").hidden = false;
  $("codeInput").value = "";
  $("codeError").textContent = "";
  card.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderAll() { renderLetters(); renderMap(); renderClue(); }

/* ---------- Acciones ---------- */
$("startBtn").addEventListener("click", () => {
  state.started = true; save();
  $("intro").hidden = true;
  $("game").hidden = false;
  renderAll();
});

$("helpBtn").addEventListener("click", () => { $("clueHelp").hidden = false; });

$("codeForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("codeInput");
  const s = CONFIG.spots[state.found];
  if (!input.value.trim()) {
    $("codeError").textContent = "Escribe la palabra que viene en la tarjeta del regalo.";
    return;
  }
  if (normalize(input.value) === normalize(s.codigo)) {
    state.found++; save();
    if (navigator.vibrate) navigator.vibrate([40, 40, 80]);
    showFound(s);
  } else {
    $("codeError").textContent = "Esa no es. Revisa la tarjeta del regalo que encontraste.";
    input.classList.remove("shake"); void input.offsetWidth; input.classList.add("shake");
  }
});

function showFound(s) {
  $("foundLetter").textContent = s.letra;
  $("foundTitle").textContent = `Ganaste la letra ${s.letra}`;
  $("foundText").textContent = s.mensaje;
  $("foundNext").textContent = state.found >= total ? "Abrir la sorpresa" : "Siguiente pista";
  $("foundModal").hidden = false;
  $("foundNext").focus();
}
$("foundNext").addEventListener("click", () => {
  $("foundModal").hidden = true;
  renderAll();
  if (state.found >= total) setTimeout(showFinale, 250);
});

function showFinale() {
  const nameBox = $("finaleName");
  nameBox.innerHTML = "";
  CONFIG.spots.forEach((s, i) => {
    const el = document.createElement("span");
    el.textContent = s.letra;
    el.style.animationDelay = `${i * 0.12}s`;
    nameBox.appendChild(el);
  });
  $("finaleLetter").textContent = CONFIG.cartaFinal;
  $("finale").hidden = false;
  confetti();
}
$("mapBtn").addEventListener("click", () => { $("finale").hidden = true; });

$("resetBtn").addEventListener("click", () => {
  if (confirm("¿Borrar el progreso y empezar de cero?")) {
    state = { started: false, found: 0 }; save();
    location.reload();
  }
});

let toastTimer;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- Confeti ---------- */
function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cv = $("confetti"), ctx = cv.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const colors = ["#E8A33D", "#E2566E", "#7FA58B", "#FBE9E4", "#9CC3DA"];
  const bits = Array.from({ length: 160 }, () => ({
    x: Math.random() * innerWidth,
    y: -20 - Math.random() * innerHeight,
    w: 6 + Math.random() * 6, h: 8 + Math.random() * 8,
    vy: 2 + Math.random() * 3, vx: -1 + Math.random() * 2,
    r: Math.random() * Math.PI, vr: -0.1 + Math.random() * 0.2,
    c: colors[Math.floor(Math.random() * colors.length)]
  }));
  const start = performance.now();
  (function frame(now) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    bits.forEach(b => {
      b.x += b.vx; b.y += b.vy; b.r += b.vr;
      if (b.y > innerHeight + 20 && now - start < 5000) { b.y = -20; b.x = Math.random() * innerWidth; }
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r);
      ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      ctx.restore();
    });
    if (now - start < 8000) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })(start);
}

/* ---------- Inicio ---------- */
load();
$("introName").textContent = CONFIG.nombre;
document.title = `La búsqueda de ${CONFIG.nombre}`;
if (state.started) {
  $("intro").hidden = true;
  $("game").hidden = false;
  renderAll();
}
