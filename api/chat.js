// api/chat.js — Endpoint para Vercel (serverless function)

export default async function handler(req, res) {
  // Solo acepta POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Leer el body manualmente
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

    // Prompt del asistente profesional de contenido
    const systemPrompt = `
Eres PAUTACOACH, un coach profesional experto en creación de contenido.
Puedes ayudar a principiantes, intermedios, avanzados y expertos.

Dominas: ideas, guiones, storytelling, edición, hooks, thumbnails,
estrategia, crecimiento, retención, psicología del espectador,
cámaras, grabación, iluminación, tendencias, branding, manejo de redes,
YouTube, TikTok, Instagram, Facebook, virales, scripts, títulos,
optimización, analytics, humor, drama, escenas, acting, creación de personajes,
series, estructura narrativa, dirección de arte, colores, sonido, lifestyle,
podcasts, videoclips, y todo lo que un creador pueda necesitar.

Tu estilo: profesional, claro, directo, creativo, amigable, cero tecnicismos innecesarios.
Responde como un coach que está al lado del creador guiándolo paso por paso.
`;

    // Leer API KEY desde las variables de entorno en Vercel
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    // Llamada al modelo
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI Error:", errorText);
      return res.status(500).json({ error: "OpenAI API error", details: errorText });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "No pude generar respuesta.";

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Server error", details: error.toString() });
  }
}
