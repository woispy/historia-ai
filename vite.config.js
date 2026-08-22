import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function aiApiPlugin() {
  return {
    name: "historia-ai-api",
    configureServer(server) {
      server.middlewares.use("/api/ai", handleAIRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/ai", handleAIRequest);
    },
  };
}

async function handleAIRequest(request, response) {
  if (request.method !== "POST") {
    response.statusCode = 405;
    response.end(JSON.stringify({ error: "Method not allowed." }));
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    response.statusCode = 503;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ error: "OPENAI_API_KEY is not configured." }));
    return;
  }

  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 200_000) {
      response.statusCode = 413;
      response.end(JSON.stringify({ error: "Request is too large." }));
      return;
    }
  }

  try {
    const { prompt } = JSON.parse(body);
    if (typeof prompt !== "string" || !prompt.trim()) {
      throw new Error("A prompt is required.");
    }

    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });
    const payload = await openAIResponse.json();

    if (!openAIResponse.ok) {
      throw new Error(payload.error?.message || "OpenAI request failed.");
    }

    response.statusCode = 200;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ text: payload.choices?.[0]?.message?.content || "" }));
  } catch (error) {
    response.statusCode = 400;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ error: error.message }));
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), aiApiPlugin()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "world-geometry",
              test: /[\\/]src[\\/]world[\\/]map[\\/]assets[\\/]geometry[\\/]geometry_country_.*\\.json$/,
              minSize: 20_000,
              maxSize: 350_000,
              priority: 20,
            },
          ],
        },
      },
    },
  },
})
