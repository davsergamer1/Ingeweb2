const historial = [];

function toggleModo() {
  document.body.classList.toggle("light");
}

async function analizarCodigo() {
  const codigo = document.getElementById("codigo").value;
  const resultadoDiv = document.getElementById("resultado");
  const loading = document.getElementById("loading");

  if (!codigo.trim()) {
    resultadoDiv.textContent = "⚠️ Ingresa código primero.";
    return;
  }

  loading.classList.remove("hidden");
  resultadoDiv.innerHTML = "";

  try {
    const res = await fetch("/analizar", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ codigo })
    });

    const data = await res.json();

    // Resaltar secciones
    let html = data.resultado
      .replace(/🔴 Errores/gi, '<span class="error">🔴 Errores</span>')
      .replace(/🟡 Mejoras/gi, '<span class="mejora">🟡 Mejoras</span>')
      .replace(/🟢 Buenas prácticas/gi, '<span class="buena">🟢 Buenas prácticas</span>');

    resultadoDiv.innerHTML = html;

    historial.push({ codigo, resultado: html });
    actualizarHistorial();

  } catch {
    resultadoDiv.textContent = "❌ Error conectando con el servidor.";
  }

  loading.classList.add("hidden");
}

function limpiar() {
  document.getElementById("codigo").value = "";
  document.getElementById("resultado").textContent = "";
}

function actualizarHistorial() {
  const lista = document.getElementById("historial");
  lista.innerHTML = "";
  historial.forEach((item, i) => {
    const li = document.createElement("li");
    li.textContent = "Consulta " + (i+1);
    li.onclick = () => {
      document.getElementById("codigo").value = item.codigo;
      document.getElementById("resultado").innerHTML = item.resultado;
    };
    lista.appendChild(li);
  });
}