const API_URL = 'https://api.mistral.ai/v1/chat/completions';

export default async function extractWithMistral(rawData) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error('MISTRAL_API_KEY environment variable is required');

  const prompt = `You are a CLI tool cataloger. Extract structured metadata from this raw tool data.
Return ONLY a valid JSON object with no markdown, no comments, no extra text.

Raw data:
${JSON.stringify(rawData, null, 2)}

Required JSON structure:
{
  "displayName": "Human-readable name, capitalize properly (e.g. 'Lazydocker', 'HTTPie')",
  "name": "URL slug — lowercase, hyphens only, no special chars (e.g. 'lazydocker')",
  "description": "2-3 sentence summary of what this CLI tool does",
  "tagline": "One-line tagline under 80 characters",
  "category": "One of: ai, devops, frontend, backend, database, security, productivity, testing, cloud, kubernetes, other",
  "installCommand": "Install command (e.g. 'brew install lazygit' or 'pip install httpie')",
  "packageManager": "One of: npm, pip, brew, go, cargo, apt, scoop, choco, other",
  "language": "Primary programming language (e.g. Go, Python, Rust, TypeScript)",
  "officialUrl": "Main website or GitHub repo URL",
  "features": ["3-5 key features as short phrases"]
}

Fill empty fields with "" (not null).`;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mistral API error ${res.status}: ${err.slice(0, 500)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Mistral returned empty response');

  return JSON.parse(text);
}
