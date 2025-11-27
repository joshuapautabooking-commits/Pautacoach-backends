// api/chat.js — Endpoint para Vercel

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Leer body manualmente
    let body = "";
    await new Promise((resolve) => {
      req.on("data", (chunk) => (body += chunk));
      req.on("end", resolve);
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

    // 🚀 Prompt del asistente profesional de contenido
    const systemPrompt = `
Eres PAUTACOACH, un coach profesional experto en creación de contenido.
Puedes ayudar a principiantes, intermedios, avanzados y expertos.
Dominas: ideas, guiones, storytelling, edición, hooks, thumbnails,
estrategia, crecimiento, retención, psicología del espectador,
cámaras, grabación, iluminación, tendencias, branding, manejo de redes,
YouTube, TikTok, Instagram, scripts, nichos, optimización, viralidad
y absolutamente TODO lo que tenga que ver con crear contenido.

Tu objetivo es guiar, enseñar, corregir, motivar y estructurar el contenido
del usuario con precisión profesional y lenguaje claro.
    `;

    // Llamada a OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.log("OpenAI Error:", data);
      return res.status(500).json({ error: "AI error" });
    }

    const reply = data.choices?.[0]?.message?.content || "No response";

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
