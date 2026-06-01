import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Groq from "groq-sdk";
import { guardarAnalisis, obtenerHistorial, eliminarAnalisis } from "./firebase.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../frontend")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ── GROQ ──
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── ANALIZAR ──
app.post("/analizar", async (req, res) => {
  try {
    const { codigo } = req.body;

    if (!codigo || !codigo.trim()) {
      return res.status(400).json({ resultado: "⚠️ No se recibió código." });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Eres un experto en programación que detecta automáticamente el lenguaje de un código.
Analiza el código del usuario y responde SIEMPRE en español.
Estructura tu respuesta exactamente así:

Primero indica el lenguaje detectado en una línea: "Lenguaje detectado: [lenguaje]"

Luego divide tu análisis en estas secciones con estos emojis exactos:

🔴 Errores
(lista los errores encontrados, o indica que no hay errores)

🟡 Mejoras
(lista las mejoras sugeridas)

🟢 Buenas prácticas
(lista las buenas prácticas encontradas en el código)`
        },
        {
          role: "user",
          content: `Analiza este código:\n\n${codigo}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const resultado = completion.choices[0]?.message?.content || "No se pudo obtener respuesta.";

    // Detectar lenguaje
    const langMatch =
      resultado.match(/lenguaje[^:]*:\s*\*?\*?([^\n*]+)\*?\*?/i) ||
      resultado.match(/detectado[^:]*:\s*\*?\*?([^\n*]+)\*?\*?/i);
    const lenguaje = langMatch ? langMatch[1].trim() : "Desconocido";

    // Guardar en Firebase
    const id = await guardarAnalisis({ codigo, resultado, lenguaje });

    res.json({ resultado, id, lenguaje });

  } catch (error) {
    console.error("ERROR /analizar:", error.message || error);
    res.status(500).json({ resultado: "❌ Error al analizar. Revisa los logs del servidor." });
  }
});

// ── HISTORIAL ──
app.get("/historial", async (req, res) => {
  try {
    const limite = parseInt(req.query.limite) || 20;
    const data = await obtenerHistorial(limite);
    res.json(data);
  } catch (error) {
    console.error("ERROR /historial:", error.message);
    res.status(500).json([]);
  }
});

// ── ELIMINAR ──
app.delete("/historial/:id", async (req, res) => {
  try {
    const ok = await eliminarAnalisis(req.params.id);
    res.json({ ok });
  } catch (error) {
    console.error("ERROR DELETE:", error.message);
    res.status(500).json({ ok: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});
