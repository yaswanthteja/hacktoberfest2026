import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const ollamaUrl = "http://127.0.0.1:11434";
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function send(response, status, body, type = "application/json; charset=utf-8") {
  response.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(typeof body === "string" ? body : JSON.stringify(body));
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 16000) throw new Error("Request is too large");
  }
  return JSON.parse(body || "{}");
}

async function getModels() {
  const response = await fetch(`${ollamaUrl}/api/tags`, {
    signal: AbortSignal.timeout(2500),
  });
  if (!response.ok) throw new Error("Ollama is not responding");
  const data = await response.json();
  return (data.models || []).map((model) => model.name).filter(Boolean);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (url.pathname === "/api/models" && request.method === "GET") {
    try {
      send(response, 200, { available: true, models: await getModels() });
    } catch {
      send(response, 200, { available: false, models: [] });
    }
    return;
  }

  if (url.pathname === "/api/recommend" && request.method === "POST") {
    try {
      const input = await readJson(request);
      const model = String(input.model || "");
      const candidates = Array.isArray(input.candidates) ? input.candidates.slice(0, 20) : [];
      const models = await getModels();
      if (!models.includes(model)) {
        send(response, 400, { error: "Choose a model installed in Ollama." });
        return;
      }
      if (!candidates.length) {
        send(response, 400, { error: "There are no matching activities." });
        return;
      }

      const safeCandidates = candidates.map((item) => ({
        id: String(item.id || "").slice(0, 50),
        title: String(item.title || "").slice(0, 100),
        description: String(item.description || "").slice(0, 240),
        minutes: Number(item.minutes) || 0,
        effort: String(item.effort || "").slice(0, 30),
        setting: String(item.setting || "").slice(0, 30),
      }));
      const prompt = JSON.stringify({
        preferences: {
          setting: String(input.preferences?.setting || "either"),
          minutes: Number(input.preferences?.minutes) || 20,
          energy: String(input.preferences?.energy || "gentle"),
        },
        activities: safeCandidates,
      });
      const ollamaResponse = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(90000),
        body: JSON.stringify({
          model,
          stream: false,
          format: {
            type: "object",
            properties: {
              activityId: { type: "string" },
              nudge: { type: "string" },
            },
            required: ["activityId", "nudge"],
            additionalProperties: false,
          },
          options: { temperature: 0.35, num_ctx: 1024, num_predict: 100 },
          messages: [
            {
              role: "system",
              content:
                "You are Outside In, a gentle activity guide. Choose exactly one activity from the supplied list that best fits the person's time, setting, and energy. Never invent activities or health claims. Return its exact id and one friendly, practical nudge of at most 16 words. The goal is to help the person put their phone away.",
            },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (!ollamaResponse.ok) {
        send(response, 502, { error: "The local model could not make a pick." });
        return;
      }
      const result = await ollamaResponse.json();
      const content = JSON.parse(result.message?.content || "{}");
      const chosen = safeCandidates.find((item) => item.id === content.activityId);
      if (!chosen) {
        send(response, 502, { error: "The model returned an unknown activity." });
        return;
      }
      send(response, 200, {
        activityId: chosen.id,
        nudge: String(content.nudge || "Ready when you are.").slice(0, 140),
        model: result.model || model,
      });
    } catch (error) {
      send(response, 502, {
        error: error.name === "TimeoutError" ? "The local model took too long." : "The local model is unavailable.",
      });
    }
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    send(response, 405, { error: "Method not allowed." });
    return;
  }

  const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = resolve(root, `.${pathname}`);
  if (!filePath.startsWith(`${root}\\`) && filePath !== root) {
    send(response, 404, { error: "Not found." });
    return;
  }

  try {
    const content = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch {
    send(response, 404, { error: "Not found." });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Outside In is ready at http://localhost:${port}`);
});