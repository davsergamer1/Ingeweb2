import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Evita inicializar dos veces (útil en hot-reload)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Render guarda \n como literal — este replace los convierte en saltos reales
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

// ── GUARDAR ──
export async function guardarAnalisis({ codigo, resultado, lenguaje = "Desconocido" }) {
  try {
    const ref = await db.collection("analisis").add({
      codigo,
      resultado,
      lenguaje,
      caracteres: codigo.length,
      lineas: codigo.split("\n").length,
      creadoEn: FieldValue.serverTimestamp(),
    });
    console.log("✅ Guardado en Firebase:", ref.id);
    return ref.id;
  } catch (err) {
    console.error("❌ Firebase guardar:", err.message);
    return null;
  }
}

// ── OBTENER HISTORIAL ──
export async function obtenerHistorial(limite = 20) {
  try {
    const snap = await db
      .collection("analisis")
      .orderBy("creadoEn", "desc")
      .limit(limite)
      .get();

    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      creadoEn: doc.data().creadoEn?.toDate().toISOString() ?? null,
    }));
  } catch (err) {
    console.error("❌ Firebase historial:", err.message);
    return [];
  }
}

// ── ELIMINAR ──
export async function eliminarAnalisis(id) {
  try {
    await db.collection("analisis").doc(id).delete();
    return true;
  } catch (err) {
    console.error("❌ Firebase eliminar:", err.message);
    return false;
  }
}

export { db };