import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Load the dictionary on startup for rapid accessing
  let keywords: any[] = [];
  try {
    const dictionaryPath = path.join(process.cwd(), "src", "data", "dictionary.json");
    const rawDict = JSON.parse(fs.readFileSync(dictionaryPath, "utf-8"));
    keywords = rawDict.keywords || [];
    console.log(`Loaded ${keywords.length} keywords of search index.`);
  } catch (e) {
    console.error("Failed to load dictionary.json for semantic search server-side", e);
  }

  // API Route - Health Check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      keywordsCount: keywords.length,
      hasSystemKey: !!process.env.GEMINI_API_KEY
    });
  });

  // API Route - Semantic/Intelligence AI Search
  app.post("/api/ai-search", async (req, res) => {
    try {
      const { q, apiKey: bodyApiKey } = req.body;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Missing query parameter 'q'" });
      }

      const apiKey = (req.headers["x-api-key"] as string) || bodyApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
        return res.status(400).json({ error: "Saját Gemini API kulcs (BYOK) megadása szükséges az AI kereséshez." });
      }

      // Compact payload to stay fast and cheap
      const compactKeywords = keywords.map((k) => ({
        id: k.id,
        label: k.label,
        description: k.description,
        group: k.group,
      }));

      const ai = new GoogleGenAI({
        apiKey: apiKey.trim(),
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const userPrompt = `
Szótári kifejezések (Dictionary Keywords):
${JSON.stringify(compactKeywords)}

Felhasználói keresőszó/szándék (User Search Term): "${q}"

Feladat: Találj meg legfeljebb 12 leginkább releváns vagy kapcsolódó kulcsszót a listából a felhasználó elgondolása, szándéka alapján.
Nagyon fontos a szemantika! Ha a felhasználó pl. azt írja be, hogy "biztonság", akkor ne csak azokat hozd be, amelyekben szerepel a szó, hanem a kapcsolódó fogalmakat is (pl. "auth", "csrf", "xss", "security", "passkey" stb.). Ha azt írja "gyors", akkor "performance_budget", "lazy_loading", "cache" stb.
Minden egyezéshez (match) írj egy közvetlen, rövid magyar nyelvű indoklást (szerethető, szakmai hangnemben, max 1.5 mondat), hogy ez miért releváns most!
Készíts egy egy-két mondatos, bátorító és koncepcionális magyar nyelvű összefoglalót is a keresett területről.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: "Te egy szuper-intelligens magyar programozói tudásgömb keresőmotor asszisztense vagy. Feladatod a felhasználói lekérdezések szemantikus megfeleltetése a szótárunk kulcsszavainak ID-jára. Mindig pontosan az elvárt JSON sémát add vissza, külső formázó kódblokkok nélkül.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matches: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    matchReason: { type: Type.STRING },
                  },
                  required: ["id", "matchReason"],
                },
              },
              aiSummary: {
                type: Type.STRING,
                description: "Összefoglaló segítség vagy meglátás a keresett szándékról magyarul.",
              },
            },
            required: ["matches", "aiSummary"],
          },
        },
      });

      const text = response.text || "{}";
      const data = JSON.parse(text);
      res.json(data);
    } catch (error: any) {
      console.error("Semantic AI Search Error:", error);
      res.status(500).json({ error: error.message || "Failed to process intelligent semantic search" });
    }
  });

  // Handle Vite middleware configuration dynamically
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Knowledge map multi-mode server listening on port ${PORT}`);
  });
}

startServer();
