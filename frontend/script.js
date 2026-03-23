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
  resultadoDiv.textContent = "";

  try {
    const res = await fetch("/analizar", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ codigo })
    });

    const data = await res.json();
    resultadoDiv.textContent = data.resultado;

    historial.push({ codigo, resultado: data.resultado });
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
      document.getElementById("resultado").textContent = item.resultado;
    };
    lista.appendChild(li);
  });
}