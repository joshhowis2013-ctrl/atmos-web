import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = Number(process.env.PORT || 3000);
const apiUrl = process.env.MET_OFFICE_WARNINGS_URL;
const apiKey = process.env.MET_OFFICE_API_KEY;
const authHeader = process.env.MET_OFFICE_AUTH_HEADER || "X-API-Key";
const requestTimeoutMs = 10000;

app.use(express.static(path.dirname(fileURLToPath(import.meta.url))));

app.get("/api/warnings", async (_request, response) => {
  if (!apiUrl || !apiKey || apiUrl.includes("replace-with-your")) {
    response.status(503).json({
      status: "not_configured",
      error: "Set MET_OFFICE_WARNINGS_URL and MET_OFFICE_API_KEY in .env, then restart the server."
    });
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    const upstream = await fetch(apiUrl, {
      headers: {
        Accept: "application/json, application/atom+xml, application/xml",
        [authHeader]: apiKey
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    const body = await upstream.text();
    const contentType = upstream.headers.get("content-type") || "";
    if (contentType.includes("xml") || body.trim().startsWith("<")) {
      const items = [...body.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map(match => {
        const entry = match[0];
        const read = tag => entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
        return { title: read("title"), summary: read("summary") || read("description"), areaDesc: read("cap:areaDesc") };
      });
      response.status(upstream.status).json({ items });
      return;
    }
    response.status(upstream.status).type(contentType || "application/json").send(body);
  } catch (error) {
    const reason = error.name === "AbortError" ? "The warnings service timed out after 10 seconds." : "Could not connect to the warnings endpoint.";
    console.error(`Met Office warnings request failed: ${reason} (${error.message})`);
    response.status(502).json({ status: "upstream_error", error: reason });
  }
});

app.listen(port, () => {
  console.log(`Atmos Web running at http://localhost:${port}`);
});
