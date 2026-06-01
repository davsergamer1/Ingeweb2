import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Inicializar Firebase Admin con variables de entorno
const firebaseApp = initializeApp({
  credential: cert({
    projectId:     process.env.FIREBASE_PROJECT_ID,
    clientEmail:   process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:    process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore(firebaseApp);

// ──────────────────────────────────────────
// GUARDAR análisis en Firestore
// ──────────────────────────────────────────
export async function guardarAnalisis({ codigo, resultado, lenguaje = "Desconocido" }) {
  try {
    const docRef = await db.collection("analisis").add({
      codigo,
      resultado,
      lenguaje,
      creadoEn: FieldValue.serverTimestamp(),
      caracteres: codigo.length,
      lineas: codigo.split("\n").length,
    });
    console.log("✅ Análisis guardado:", docRef.id);
    return docRef.id;
  } catch (err) {
    console.error("❌ Error guardando en Firebase:", err.message);
    return null;
  }
}

// ──────────────────────────────────────────
// OBTENER últimos N análisis
// ──────────────────────────────────────────
export async function obtenerHistorial(limite = 20) {
  try {
    const snapshot = await db
      .collection("analisis")
      .orderBy("creadoEn", "desc")
      .limit(limite)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Convertir Timestamp a ISO string para JSON
      creadoEn: doc.data().creadoEn?.toDate().toISOString() ?? null,
    }));
  } catch (err) {
    console.error("❌ Error leyendo historial:", err.message);
    return [];
  }
}

// ──────────────────────────────────────────
// ELIMINAR un análisis por ID
// ──────────────────────────────────────────
export async function eliminarAnalisis(id) {
  try {
    await db.collection("analisis").doc(id).delete();
    return true;
  } catch (err) {
    console.error("❌ Error eliminando:", err.message);
    return false;
  }
}

// ──────────────────────────────────────────
// ESTADÍSTICAS globales (opcional)
// ──────────────────────────────────────────
export async function obtenerStats() {
  try {
    const snapshot = await db.collection("analisis").get();
    const docs = snapshot.docs.map((d) => d.data());
    const totalCaracteres = docs.reduce((sum, d) => sum + (d.caracteres || 0), 0);

    const lenguajes = {};
    docs.forEach((d) => {
      const lang = d.lenguaje || "Desconocido";
      lenguajes[lang] = (lenguajes[lang] || 0) + 1;
    });

    return {
      totalAnalisis: docs.length,
      totalCaracteres,
      lenguajes,
    };
  } catch (err) {
    console.error("❌ Error obteniendo stats:", err.message);
    return null;
  }
}

export { db };