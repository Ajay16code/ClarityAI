import express from "express";
import { createServer as createViteServer, loadEnv } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const projectRoot = path.join(__dirname, '..');
  const frontendRoot = path.join(__dirname, '..', 'frontend');
  const distRoot = path.join(__dirname, '..', 'dist');

  const env = loadEnv(process.env.NODE_ENV || 'development', projectRoot, '');
  process.env.SUPABASE_URL = process.env.SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;

  // API routes go here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/info", (req, res) => {
    res.json({
      name: "ClarityIQ Backend",
      version: "1.0.0",
      description: "Sales Intelligence Application Backend"
    });
  });

  app.get("/api/supabase/health", async (req, res) => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({
        status: "missing-env",
        message: "SUPABASE_URL or SUPABASE_ANON_KEY not found in backend environment.",
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        method: "GET",
        headers: {
          apikey: supabaseAnonKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      res.status(response.ok ? 200 : 502).json({
        status: response.ok ? "reachable" : "unreachable",
        httpStatus: response.status,
        supabaseUrl,
      });
    } catch (error: any) {
      clearTimeout(timeoutId);
      res.status(504).json({
        status: "timeout",
        message: error?.message || "Failed to reach Supabase",
        supabaseUrl,
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      configFile: path.join(projectRoot, 'vite.config.ts'),
      root: frontendRoot,
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(distRoot));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distRoot, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
