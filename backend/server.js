import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Necesario para __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir frontend
app.use(express.static(__dirname));

// API Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post("/analizar", async (req, res) => {
  try {
    const { codigo } = req.body;

    const prompt = `
Eres un experto en programación.

Analiza este código y responde en español:

🔴 Errores
🟡 Mejoras
🟢 Buenas prácticas

Código:
${codigo}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    res.json({ resultado: response.text });

  } catch (error) {
    console.error("ERROR REAL:", error);
    res.json({ resultado: "Error con IA (Gemini v3)" });
  }
});

// 🔥 IMPORTANTE: puerto dinámico
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});