const historialData = [];

/* ── THEME ── */
function toggleModo() {
  const isLight = document.body.classList.toggle("light");
  const icon = document.getElementById("theme-icon");
  if (isLight) {
    icon.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
  } else {
    icon.innerHTML = '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
  }
}

/* ── META COUNTER ── */
function actualizarMeta() {
  const val = document.getElementById("codigo").value;
  const chars = val.length;
  const lines = val ? val.split("\n").length : 0;
  document.getElementById("meta-chars").innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" width="11" height="11"><path d="M4 7h16M4 12h10M4 17h14"/></svg>
    ${chars.toLocaleString()} chars`;
  document.getElementById("meta-lines").innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" width="11" height="11"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/></svg>
    ${lines} líneas`;
}

/* ── HELPERS ── */
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ── RENDER RESULT ── */
function renderResultado(texto) {
  // Detect language
  const langMatch =
    texto.match(/lenguaje[^:]*:\s*\*?\*?([^\n*]+)\*?\*?/i) ||
    texto.match(/detectado[^:]*:\s*\*?\*?([^\n*]+)\*?\*?/i);
  if (langMatch) {
    document.getElementById("lang-pill").textContent = langMatch[1].trim();
  }

  // Split into sections
  const sectionMap = {
    "🔴": { cls: "err",  label: "Errores" },
    "🟡": { cls: "warn", label: "Mejoras" },
    "🟢": { cls: "good", label: "Buenas prácticas" },
  };

  const parts = texto.split(/(🔴[^\n]*|🟡[^\n]*|🟢[^\n]*)/g);
  let html = "";
  let currentEmoji = null;
  let currentBody = "";
  let preamble = "";

  function flush() {
    if (!currentEmoji) return;
    const s = sectionMap[currentEmoji];
    html += `
      <div class="r-section ${s.cls}">
        <div class="r-section-head">
          <span class="r-section-dot"></span>
          ${s.label}
        </div>
        <div class="r-section-body">${escapeHtml(currentBody.trim())}</div>
      </div>`;
  }

  for (const part of parts) {
    const emoji = part[0];
    if (sectionMap[emoji]) {
      flush();
      currentEmoji = emoji;
      currentBody = "";
    } else {
      if (!currentEmoji) preamble += part;
      else currentBody += part;
    }
  }
  flush();

  // Preamble
  let pre = "";
  const cleaned = preamble.replace(/\*\*/g, "").trim();
  if (cleaned) {
    pre = `<div class="r-preamble">
      <svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
      ${escapeHtml(cleaned)}
    </div>`;
  }

  document.getElementById("resultado").innerHTML = pre + html;

  // Stats
  const errN  = (texto.match(/🔴/g) || []).length;
  const warnN = (texto.match(/🟡/g) || []).length;
  const goodN = (texto.match(/🟢/g) || []).length;
  document.getElementById("stat-errors").textContent  = errN;
  document.getElementById("stat-mejoras").textContent = warnN;
  document.getElementById("stat-buenas").textContent  = goodN;

  if (errN + warnN + goodN > 0) {
    document.getElementById("stats-row").style.display = "grid";
  }
}

/* ── CLEAR ── */
function limpiar() {
  document.getElementById("codigo").value = "";
  document.getElementById("resultado").innerHTML =
    `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span>El resultado aparecerá aquí</span></div>`;
  document.getElementById("result-card").classList.remove("visible");
  document.getElementById("stats-row").style.display = "none";
  document.getElementById("lang-pill").textContent = "auto-detect";
  actualizarMeta();
}

function limpiarHistorial() {
  historialData.length = 0;
  renderHistorial();
}

/* ── COPY ── */
function copiarResultado() {
  const text = document.getElementById("resultado").innerText;
  navigator.clipboard.writeText(text);
}

/* ── ANALYZE ── */
async function analizarCodigo() {
  const codigo = document.getElementById("codigo").value;
  const resultadoDiv = document.getElementById("resultado");
  const loading = document.getElementById("loading");
  const resultCard = document.getElementById("result-card");
  const btn = document.getElementById("btn-analizar");

  if (!codigo.trim()) {
    resultadoDiv.innerHTML = `<div class="empty-state"><span>⚠️ Ingresa código primero.</span></div>`;
    resultCard.classList.add("visible");
    return;
  }

  loading.classList.add("visible");
  btn.disabled = true;
  resultCard.classList.remove("visible");

  try {
    const res = await fetch("/analizar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo }),
    });
    const data = await res.json();
    renderResultado(data.resultado);
    historialData.push({ codigo, resultado: data.resultado, id: data.id });
    renderHistorial();
    resultCard.classList.add("visible");
  } catch {
    resultadoDiv.innerHTML = `<div class="empty-state"><span>❌ Error conectando con el servidor.</span></div>`;
    resultCard.classList.add("visible");
  }

  loading.classList.remove("visible");
  btn.disabled = false;
}

/* ── HISTORIAL ── */
function renderHistorial() {
  const lista = document.getElementById("historial");
  lista.innerHTML = "";

  if (!historialData.length) {
    lista.innerHTML = `<li style="pointer-events:none;opacity:.4;font-size:11px;">Sin consultas aún</li>`;
    return;
  }

  [...historialData].reverse().forEach((item, i) => {
    const li = document.createElement("li");
    const first = item.codigo.trim().split("\n")[0] || "";
    li.textContent = first.slice(0, 30) + (first.length > 30 ? "…" : "") || `Consulta ${historialData.length - i}`;
    li.title = `Consulta ${historialData.length - i}`;
    li.onclick = () => {
      document.getElementById("codigo").value = item.codigo;
      actualizarMeta();
      renderResultado(item.resultado);
      document.getElementById("result-card").classList.add("visible");
    };
    lista.appendChild(li);
  });
}

/* ── KEYBOARD SHORTCUTS ── */
document.addEventListener("DOMContentLoaded", () => {
  renderHistorial();

  const ta = document.getElementById("codigo");
  ta.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      analizarCodigo();
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const s = ta.selectionStart;
      ta.value = ta.value.substring(0, s) + "  " + ta.value.substring(ta.selectionEnd);
      ta.selectionStart = ta.selectionEnd = s + 2;
      actualizarMeta();
    }
  });
});