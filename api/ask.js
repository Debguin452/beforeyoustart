export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { question, depth } = req.body;

  if (!question || typeof question !== "string" || question.trim().length < 5) {
    return res.status(400).json({ error: "A valid question is required." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured on the server." });
  }

  const DEPTH_PROMPT = {
    quick: "Concise check: 3-4 challenges, 2 opportunities.",
    standard: "Thorough check: 5-6 challenges, 3-4 opportunities, full details.",
    deep: "Deep analysis: 7-8 challenges, 4-5 opportunities, detailed plan and requirements.",
  };

  const depthInstruction = DEPTH_PROMPT[depth] || DEPTH_PROMPT.standard;

  const prompt = `You are BeforeUstart — a brutally honest AI reality check tool. User wants to know about: "${question.trim()}"

${depthInstruction}

Be specific, concrete, and honest. No sugarcoating. No motivation speeches. Like a wise experienced friend who tells it like it is.

Respond ONLY with a valid JSON object, no markdown, no backticks:
{
  "category": "business|creative|tech|health|social|learning|other",
  "categoryEmoji": "single emoji",
  "realityScore": <10-90, where 10=extremely hard/risky, 90=fairly straightforward>,
  "scoreLabel": "concise honest label e.g. 'Harder than it looks'",
  "verdict": "One specific honest sentence about this exact endeavor",
  "challenges": [{"title":"short title","detail":"2-3 honest sentences","severity":"high|medium|low"}],
  "opportunities": [{"title":"short title","detail":"1-2 sentences on real upside"}],
  "requirements": {"time":"X-Y hrs/week","money":"$X-$Y or Minimal","skills":["skill1","skill2","skill3"]},
  "plan": [
    {"phase":"Days 1-7","focus":"Focus area","action":"Concrete specific action"},
    {"phase":"Days 8-21","focus":"Focus area","action":"Concrete specific action"},
    {"phase":"Days 22-30","focus":"Focus area","action":"Concrete specific action"}
  ],
  "mindset": "2-3 sentences on the essential mindset shift required",
  "successFactors": ["factor1","factor2","factor3"],
  "redFlags": ["flag1","flag2"]
}`;

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      console.error("Anthropic API error:", errBody);
      return res.status(502).json({ error: "AI service error. Please try again." });
    }

    const data = await anthropicRes.json();
    const raw = data.content?.[0]?.text || "";
    const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
