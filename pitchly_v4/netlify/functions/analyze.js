exports.handler = async function (event) {
  const cors = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: cors, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: cors, body: JSON.stringify({ error: "Method Not Allowed" }) };

  let idea, lang;
  try {
    const b = JSON.parse(event.body || "{}");
    idea = b.idea; lang = b.lang || "ru";
  } catch {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Invalid body" }) };
  }

  if (!idea) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "No idea" }) };

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return { statusCode: 500, headers: cors, body: JSON.stringify({ error: "GROQ_API_KEY не настроен в Netlify Environment Variables" }) };

  const sysRu = `Ты эксперт по анализу бизнес-идей. Верни ТОЛЬКО валидный JSON без markdown и пояснений:
{"relevance":<0-100>,"relevanceVerdict":"<1 строка>","monetization":<0-100>,"monetizationVerdict":"<1 строка>","pitch":"<3-4 предложения>","bizModel":"<2-3 предложения>","upgradeNeeded":<true или false>,"upgradeText":"<текст или пустая строка>","betterIdea":"<текст или пустая строка>","slides":[{"title":"Проблема","content":"<текст>"},{"title":"Решение","content":"<текст>"},{"title":"Аудитория","content":"<текст>"},{"title":"Монетизация","content":"<текст>"},{"title":"Первый шаг","content":"<текст>"}],"niches":["<ниша1>","<ниша2>","<ниша3>"],"legal":["<пункт1>","<пункт2>","<пункт3>"]}`;

  const sysEn = `You are a business idea analyst. Return ONLY valid JSON without markdown:
{"relevance":<0-100>,"relevanceVerdict":"<1 line>","monetization":<0-100>,"monetizationVerdict":"<1 line>","pitch":"<3-4 sentences>","bizModel":"<2-3 sentences>","upgradeNeeded":<true or false>,"upgradeText":"<text or empty>","betterIdea":"<text or empty>","slides":[{"title":"Problem","content":"<text>"},{"title":"Solution","content":"<text>"},{"title":"Audience","content":"<text>"},{"title":"Monetization","content":"<text>"},{"title":"First Step","content":"<text>"}],"niches":["<niche1>","<niche2>","<niche3>"],"legal":["<item1>","<item2>","<item3>"]}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1500,
        temperature: 0.7,
        messages: [
          { role: "system", content: lang === "en" ? sysEn : sysRu },
          { role: "user", content: idea }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) return { statusCode: 500, headers: cors, body: JSON.stringify({ error: data.error?.message || "Groq error" }) };

    const raw = data.choices[0].message.content;
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");
    const result = JSON.parse(match[0]);

    return { statusCode: 200, headers: cors, body: JSON.stringify(result) };
  } catch (err) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
