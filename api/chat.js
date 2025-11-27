// api/chat.js – Endpoint para Vercel (serverless function)

export default async function handler(req, res) {
  // ✅ CORS: permitir llamadas desde tu web
  res.setHeader("Access-Control-Allow-Origin", "*"); // si quieres, cámbialo por "https://pautaluvana.com"
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Responder al preflight (OPTIONS)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ✅ Solo aceptamos POST para el chat
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 👉 Leer body manualmente (para funcionar sin frameworks)
  let body = "";
  await new Promise((resolve, reject) => {
    req.on("data", (chunk) => (body += chunk));
    req.on("end", resolve);
    req.on("error", reject);
  });

  let parsed;
  try {
    parsed = JSON.parse(body || "{}");
  } catch (e) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const { message } = parsed;
  if (!message) {
    return res.status(400).json({ error: "Missing message field" });
  }

  // ✅ Leer API KEY desde variables de entorno en Vercel
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
  }

  // 🧠 Prompt del asistente profesional de contenido
  const systemPrompt = `
Eres PAUTACOACH, un coach profesional experto en creación de contenido.
Puedes ayudar a principiantes, intermedios, avanzados y expertos.

Dominas: ideas, guiones, storytelling, edición, hooks, thumbnails,
estrategia, crecimiento, retención, psicología del espectador,
cámaras, grabación, iluminación, tendencias, branding, manejo de redes,
calendario de contenido, monetización, lanzamientos y colaboraciones.

Trabajas con cualquier formato: Reels, Shorts, TikToks, lives, podcasts,
videoclips, y todo lo que un creador pueda necesitar.

Tu estilo: profesional, claro, directo, creativo, amigable, cero tecnicismos innecesarios.
Responde como un coach que está al lado del creador guiándolo paso por paso.
`;

  try {
    // ✅ Llamada al modelo de OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);
      return res.status(500).json({ error: "Error calling OpenAI API" });
    }

    const reply =
      data.choices?.[0]?.message?.content?.trim() ||
      "Lo siento, ahora mismo no puedo responder. Intenta de nuevo en un momento.";

    // ✅ Respuesta al frontend
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
