import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { guardarAnalisis, obtenerHistorial, eliminarAnalisis, obtenerStats } from "./firebase.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Servir frontend
app.use(express.static(path.join(__dirname, "../frontend")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ── GEMINI ──
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── ANALIZAR ──
app.post("/analizar", async (req, res) => {
  try {
    const { codigo } = req.body;

    const prompt = `
Eres un experto en programación que puede detectar automáticamente el lenguaje de un código dado.

Analiza este código y responde en español. Divide tu respuesta en secciones coloreadas:

🔴 Errores
🟡 Mejoras
🟢 Buenas prácticas

Además, indica al inicio qué lenguaje de programación detectaste.

Código:
${codigo}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const resultado = response.text;

    // Detectar lenguaje del resultado
    const langMatch = resultado.match(/lenguaje[^:]*:\s*\*?\*?([^\n*]+)\*?\*?/i)
                   || resultado.match(/detectado[^:]*:\s*\*?\*?([^\n*]+)\*?\*?/i);
    const lenguaje = langMatch ? langMatch[1].trim() : "Desconocido";

    // Guardar en Firebase (no bloqueante)
    const id = await guardarAnalisis({ codigo, resultado, lenguaje });

    res.json({ resultado, id, lenguaje });

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ resultado: "❌ Error con IA (Gemini)" });
  }
});

// ── HISTORIAL desde Firebase ──
app.get("/historial", async (req, res) => {
  const limite = parseInt(req.query.limite) || 20;
  const data = await obtenerHistorial(limite);
  res.json(data);
});

// ── ELIMINAR análisis ──
app.delete("/historial/:id", async (req, res) => {
  const ok = await eliminarAnalisis(req.params.id);
  res.json({ ok });
});

// ── STATS ──
app.get("/stats", async (req, res) => {
  const stats = await obtenerStats();
  res.json(stats);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});