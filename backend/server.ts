import express from "express";
import { createServer as createViteServer, loadEnv } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { GEMINI_INTELLIGENCE_PROMPT, GEMINI_PIPELINE_NOTE } from "./intelligence/geminiPrompt";
import { runIntelligencePipeline } from "./intelligence/pipeline";

const CHAT_SYSTEM_PROMPT = `You are ClarityIQ Assistant, an AI guide embedded inside a sales intelligence platform.

Your role is to help users understand, use, and troubleshoot the ClarityIQ system.

Core product capabilities to explain:
- Records meetings
- Transcribes multi-speaker conversations
- Analyzes engagement, sentiment, and buying signals
- Provides Deal Arc and KPI insights

Guidance responsibilities:
- Explain how to start recording
- Explain how transcripts are generated
- Explain how to interpret dashboards
- Explain how to read Deal Arc and KPIs

Analytics explanations must cover:
- Engagement score
- Sentiment trends
- Intent levels (high/medium/low)
- Risk indicators
- Deal momentum

Troubleshooting support:
- Recording not working: check microphone and system audio permissions
- No transcript: verify upload/recording audio exists and processing completed
- Poor speaker separation: explain audio quality, overlap, and noise limitations
- Missing insights: explain dependence on transcript quality and sufficient conversation content

Multi-speaker system explanation:
- Explain diarization simply
- Explain why labels are generic (Speaker 1, Speaker 2)
- Clarify identity is not always guaranteed

Limitations to always communicate honestly:
- Intent and risk are estimates, not guarantees
- Identity may be unknown
- Accuracy depends on audio quality

Response style:
- Friendly, professional, clear
- Concise and actionable
- Use bullet points when helpful
- Avoid long paragraphs and heavy jargon unless asked
- Do not hallucinate features or claim certainty

Product scope guardrails (must follow):
- Only describe capabilities that exist in this app: manual recording/upload, transcript + diarization analysis, Deal Arc/KPI insights, troubleshooting guidance.
- Do not claim calendar auto-join, browser extension flows, CRM sync, Slack bots, or other integrations unless user explicitly says they configured them in this app.
- If unsure whether a feature exists, say: "I may not have enough context to confirm that feature in this workspace."
- Keep each answer short: 4-8 bullets or under 120 words unless user asks for deep detail.
`;

const getLatestUserMessage = (messages: any[]): string => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "user" && typeof messages[i]?.content === "string") {
      return messages[i].content.toLowerCase();
    }
  }
  return "";
};

const buildLocalAssistantReply = (messages: any[], page: string): string => {
  const latest = getLatestUserMessage(messages);

  if (/record|start|mic|microphone|permission/.test(latest)) {
    return [
      "Here is how to start recording in ClarityIQ:",
      "- Click Record in the top bar.",
      "- Allow screen audio + microphone permissions.",
      "- Keep meeting audio audible from your system output.",
      "- Click Stop when done, then run analysis.",
      "- If recording fails, re-check OS/browser permissions and retry.",
    ].join("\n");
  }

  if (/transcript|no transcript|missing transcript|upload/.test(latest)) {
    return [
      "If transcript is missing, try this checklist:",
      "- Confirm the audio file uploaded successfully.",
      "- Ensure the recording actually contains speech.",
      "- Wait for processing to complete before reopening the call.",
      "- Re-upload with a clearer file if the original is silent/corrupted.",
      "- If sidecar is down, fallback v1 still runs for baseline transcription.",
    ].join("\n");
  }

  if (/speaker|diarization|speaker 1|speaker 2|identify/.test(latest)) {
    return [
      "Why you see Speaker 1 / Speaker 2:",
      "- ClarityIQ uses diarization to separate different voices.",
      "- Labels are generic because exact identity is not always known.",
      "- Overlap, noise, and poor audio can reduce separation quality.",
      "- Cleaner audio and less crosstalk improve speaker accuracy.",
    ].join("\n");
  }

  if (/intent|engagement|sentiment|risk|deal arc|kpi|momentum/.test(latest)) {
    return [
      "How to read ClarityIQ analytics:",
      "- Engagement: measures participation and conversational activity.",
      "- Sentiment trend: shows tone shifts through the conversation.",
      "- Intent level: high/medium/low signal of buying interest.",
      "- Risk indicators: highlight warning patterns in the call.",
      "- Deal Arc/Momentum: directional view of deal health over time.",
      "Note: these are estimates based on transcript quality, not guarantees.",
    ].join("\n");
  }

  return [
    `I can help from the ${page} page. Ask me about recording, transcripts, speaker labels, Deal Arc, KPIs, or troubleshooting.`,
    "Quick tips:",
    "- Record with clear audio and minimal overlap.",
    "- Verify uploads when transcript is missing.",
    "- Treat intent/risk as decision support, not certainty.",
  ].join("\n");
};

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
  process.env.SUPABASE_ANON_KEY =
    process.env.SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY;
  process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;

  app.use(express.json({ limit: "8mb" }));

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

  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return res.status(400).json({ ok: false, message: "Gemini API key is missing." });
      }

      const body = req.body || {};
      const modelCandidates = Array.isArray(body.modelCandidates)
        ? body.modelCandidates.filter((modelId: unknown) => typeof modelId === "string" && modelId.trim())
        : [];
      const requestPayload = body.requestPayload || {};
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const fallbackModels = modelCandidates.length > 0 ? modelCandidates : [process.env.GEMINI_MODEL_ID || "gemini-2.5-flash"];

      let lastError: any = null;
      for (const modelId of fallbackModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelId,
            ...requestPayload,
          });

          return res.json({
            ok: true,
            model: modelId,
            text: response.text?.trim() || "",
          });
        } catch (error: any) {
          lastError = error;
        }
      }

      throw lastError || new Error("Gemini generation failed.");
    } catch (error: any) {
      res.status(400).json({
        ok: false,
        message: error?.message || "Gemini generation failed",
      });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const body = req.body || {};
      const page = typeof body.page === "string" ? body.page.slice(0, 80) : "Unknown";
      const incomingMessages = Array.isArray(body.messages) ? body.messages : [];

      const normalizedMessages = incomingMessages
        .map((message: any) => {
          const role = message?.role === "assistant" ? "model" : message?.role === "user" ? "user" : null;
          const content = typeof message?.content === "string" ? message.content.trim() : "";
          if (!role || !content) {
            return null;
          }
          return {
            role,
            parts: [{ text: content.slice(0, 2000) }],
          };
        })
        .filter(Boolean)
        .slice(-12);

      const geminiApiKey = process.env.GEMINI_API_KEY;
      const modelId = process.env.GEMINI_MODEL_ID || env.VITE_GEMINI_MODEL_ID || "gemini-2.5-flash";

      if (!geminiApiKey) {
        return res.json({
          reply: buildLocalAssistantReply(incomingMessages, page),
          source: "local-fallback",
        });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {
              parts: [
                {
                  text: `${CHAT_SYSTEM_PROMPT}\nCurrent page context: ${page}`,
                },
              ],
            },
            contents: normalizedMessages,
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 500,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini request failed (${response.status}): ${errorText.slice(0, 500)}`);
      }

      const data = await response.json();
      const reply = Array.isArray(data?.candidates?.[0]?.content?.parts)
        ? data.candidates[0].content.parts
            .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
            .join("\n")
            .trim()
        : "";

      res.json({
        reply:
          reply ||
          "I could not generate a full response. Please ask again with a specific question such as recording setup, transcript issues, or interpreting intent and risk.",
        source: "gemini",
      });
    } catch (error: any) {
      const body = req.body || {};
      const page = typeof body.page === "string" ? body.page.slice(0, 80) : "Unknown";
      const incomingMessages = Array.isArray(body.messages) ? body.messages : [];

      res.json({
        reply: buildLocalAssistantReply(incomingMessages, page),
        source: "local-fallback",
        message: error?.message || "Chat request failed",
      });
    }
  });

  app.get("/api/intelligence/prompt", (req, res) => {
    res.json({
      prompt_template: GEMINI_INTELLIGENCE_PROMPT,
      pipeline: GEMINI_PIPELINE_NOTE,
    });
  });

  app.post("/api/intelligence/analyze", (req, res) => {
    try {
      const body = req.body || {};
      const result = runIntelligencePipeline({
        transcript: body.transcript || "",
        diarized_sentences: Array.isArray(body.diarized_sentences) ? body.diarized_sentences : [],
        gemini: body.gemini || {},
      });

      res.json({
        ok: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        ok: false,
        message: error?.message || "Failed to run intelligence analysis",
      });
    }
  });

  app.post("/api/intelligence/transcribe", async (req, res) => {
    try {
      const body = req.body || {};
      const meetingId = body.meetingId || `meeting_${Date.now()}`;
      const transcriptHint = body.transcript_hint || "";
      const audioUrl = body.audio_url || "";
      const audioPath = body.audio_path || "";

      const sidecarUrl = process.env.SIDECAR_URL || "http://localhost:8010";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      const sidecarResponse = await fetch(`${sidecarUrl}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId,
          transcript_hint: transcriptHint,
          audio_url: audioUrl,
          audio_path: audioPath,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!sidecarResponse.ok) {
        const sidecarErrorText = await sidecarResponse.text();
        throw new Error(`Sidecar returned ${sidecarResponse.status}: ${sidecarErrorText.slice(0, 500)}`);
      }

      const sidecarData = await sidecarResponse.json();

      const result = runIntelligencePipeline({
        transcript: body.transcript || "",
        diarized_sentences: Array.isArray(sidecarData.diarized_sentences) ? sidecarData.diarized_sentences : [],
        gemini: body.gemini || {},
      });

      res.json({
        ok: true,
        data: {
          ...result,
          speaker_analytics: sidecarData.speakers || [],
          speaker_interest_levels: sidecarData.participants || [],
          meeting_interest_confidence: sidecarData.meeting_interest || {},
        },
      });
    } catch (error: any) {
      res.status(error?.name === "AbortError" ? 504 : 400).json({
        ok: false,
        message: error?.message || "Failed to transcribe and analyze meeting",
        sidecar_url: process.env.SIDECAR_URL || "http://localhost:8010",
      });
    }
  });

  app.post("/api/intelligence/transcribe-v2", async (req, res) => {
    try {
      const body = req.body || {};
      const meetingId = body.meetingId || `meeting_${Date.now()}`;
      const transcriptHint = body.transcript_hint || "";
      const audioUrl = body.audio_url || "";
      const audioPath = body.audio_path || "";

      const sidecarUrl = process.env.SIDECAR_URL || "http://localhost:8010";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      const requestBody = {
        meetingId,
        transcript_hint: transcriptHint,
        audio_url: audioUrl,
        audio_path: audioPath,
      };

      let sidecarResponse = await fetch(`${sidecarUrl}/analyze-v2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (sidecarResponse.status === 404) {
        sidecarResponse = await fetch(`${sidecarUrl}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
      }

      clearTimeout(timeoutId);

      if (!sidecarResponse.ok) {
        const sidecarErrorText = await sidecarResponse.text();
        throw new Error(`Sidecar returned ${sidecarResponse.status}: ${sidecarErrorText.slice(0, 500)}`);
      }

      const sidecarData = await sidecarResponse.json();

      const result = runIntelligencePipeline({
        transcript: body.transcript || "",
        diarized_sentences: Array.isArray(sidecarData.diarized_sentences) ? sidecarData.diarized_sentences : [],
        gemini: body.gemini || {},
      });

      res.json({
        ok: true,
        data: {
          ...result,
          speaker_analytics: sidecarData.speakers || [],
          speaker_interest_levels: sidecarData.participants || [],
          meeting_interest_confidence: sidecarData.meeting_interest || {},
          transcription_source: sidecarData.source || "unknown",
        },
      });
    } catch (error: any) {
      res.status(error?.name === "AbortError" ? 504 : 400).json({
        ok: false,
        message: error?.message || "Failed to transcribe and analyze meeting (v2)",
        sidecar_url: process.env.SIDECAR_URL || "http://localhost:8010",
      });
    }
  });

  app.post("/api/intelligence/kpi", (req, res) => {
    try {
      const result = runIntelligencePipeline({
        transcript: req.body?.transcript || "",
        diarized_sentences: Array.isArray(req.body?.diarized_sentences) ? req.body.diarized_sentences : [],
        gemini: req.body?.gemini || {},
      });
      res.json({ ok: true, data: result.kpi });
    } catch (error: any) {
      res.status(400).json({ ok: false, message: error?.message || "KPI engine failure" });
    }
  });

  app.post("/api/intelligence/risk", (req, res) => {
    try {
      const result = runIntelligencePipeline({
        transcript: req.body?.transcript || "",
        diarized_sentences: Array.isArray(req.body?.diarized_sentences) ? req.body.diarized_sentences : [],
        gemini: req.body?.gemini || {},
      });
      res.json({ ok: true, data: result.risk });
    } catch (error: any) {
      res.status(400).json({ ok: false, message: error?.message || "Risk engine failure" });
    }
  });

  app.post("/api/intelligence/deal-decision", (req, res) => {
    try {
      const result = runIntelligencePipeline({
        transcript: req.body?.transcript || "",
        diarized_sentences: Array.isArray(req.body?.diarized_sentences) ? req.body.diarized_sentences : [],
        gemini: req.body?.gemini || {},
      });
      res.json({ ok: true, data: result.deal });
    } catch (error: any) {
      res.status(400).json({ ok: false, message: error?.message || "Deal decision failure" });
    }
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
