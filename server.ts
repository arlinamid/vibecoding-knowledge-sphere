import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const AI_SEARCH_MAX_QUERY_LENGTH = 120;

interface KeywordSearchRecord {
  id: string;
  label: string;
  description: string;
  group: string;
}

interface AiSearchRequestBody {
  q?: unknown;
  apiKey?: unknown;
}

interface DictionaryManifest {
  category_files?: Array<{
    group: string;
    file: string;
    keyword_count: number;
  }>;
}

interface DictionaryCategoryFile {
  group: string;
  keywords?: KeywordSearchRecord[];
}

interface LegacyDictionaryGroup {
  keywords?: Record<string, string>;
}

interface LegacyDictionaryRoot {
  main_groups?: {
    groups?: unknown;
  };
  [key: string]: unknown;
}

interface DictionaryCategoryEntry {
  group: string;
  file: string;
  keyword_count: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readJsonFile<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch {
    return null;
  }
}

function isKeywordSearchRecord(value: unknown): value is KeywordSearchRecord {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    typeof value.description === "string" &&
    typeof value.group === "string"
  );
}

function readLegacyDictionary(): LegacyDictionaryRoot | null {
  const candidates = [
    path.join(process.cwd(), "src", "data", "dictionary.json"),
    path.join(process.cwd(), "src", "data", "user_dictionary.json"),
  ];

  for (const candidate of candidates) {
    const dictionary = readJsonFile<LegacyDictionaryRoot>(candidate);
    if (dictionary) {
      return dictionary;
    }
  }

  return null;
}

function getLegacyGroupNames(legacyDictionary: LegacyDictionaryRoot | null): string[] {
  if (!legacyDictionary || !Array.isArray(legacyDictionary.main_groups?.groups)) {
    return [];
  }

  return legacyDictionary.main_groups.groups.filter((group): group is string => typeof group === "string");
}

function buildLegacyKeywordsForGroup(
  legacyDictionary: LegacyDictionaryRoot | null,
  groupName: string,
): KeywordSearchRecord[] {
  if (!legacyDictionary) return [];

  const group = legacyDictionary[groupName];
  if (!isRecord(group) || !isRecord(group.keywords)) {
    return [];
  }

  const legacyGroup = group as LegacyDictionaryGroup;
  return Object.entries(legacyGroup.keywords || {})
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .map(([label, description]) => ({
      id: `${groupName}.${label}`,
      label,
      description,
      group: groupName,
    }));
}

function readSplitCategory(dictionaryDir: string, entry: DictionaryCategoryEntry): KeywordSearchRecord[] | null {
  const categoryPath = path.join(dictionaryDir, entry.file);
  const category = readJsonFile<DictionaryCategoryFile>(categoryPath);
  if (!category || category.group !== entry.group || !Array.isArray(category.keywords)) {
    return null;
  }

  const records = category.keywords.filter(isKeywordSearchRecord);
  return records.length > 0 ? records : null;
}

function getDictionaryCategoryEntries(
  dictionaryDir: string,
  manifest: DictionaryManifest | null,
  legacyDictionary: LegacyDictionaryRoot | null,
): DictionaryCategoryEntry[] {
  const entries = new Map<string, DictionaryCategoryEntry>();

  for (const entry of manifest?.category_files || []) {
    entries.set(entry.group, entry);
  }

  if (fs.existsSync(dictionaryDir)) {
    for (const file of fs.readdirSync(dictionaryDir)) {
      if (!file.endsWith(".json") || file === "manifest.json") {
        continue;
      }

      const category = readJsonFile<DictionaryCategoryFile>(path.join(dictionaryDir, file));
      if (
        category &&
        typeof category.group === "string" &&
        Array.isArray(category.keywords) &&
        !entries.has(category.group)
      ) {
        entries.set(category.group, {
          group: category.group,
          file,
          keyword_count: category.keywords.length,
        });
      }
    }
  }

  for (const group of getLegacyGroupNames(legacyDictionary)) {
    if (!entries.has(group)) {
      entries.set(group, {
        group,
        file: `${group}.json`,
        keyword_count: 0,
      });
    }
  }

  return Array.from(entries.values());
}

function loadDictionaryKeywords(): KeywordSearchRecord[] {
  const dictionaryDir = path.join(process.cwd(), "src", "data", "dictionary");
  const manifestPath = path.join(dictionaryDir, "manifest.json");
  const manifest = readJsonFile<DictionaryManifest>(manifestPath);
  const legacyDictionary = readLegacyDictionary();
  const entries = getDictionaryCategoryEntries(dictionaryDir, manifest, legacyDictionary);

  const keywords = entries.flatMap((entry) => {
    const splitKeywords = readSplitCategory(dictionaryDir, entry);
    return splitKeywords || buildLegacyKeywordsForGroup(legacyDictionary, entry.group);
  });

  if (keywords.length > 0) {
    return keywords;
  }

  return getLegacyGroupNames(legacyDictionary).flatMap((group) =>
    buildLegacyKeywordsForGroup(legacyDictionary, group),
  );
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Load the dictionary on startup for rapid accessing
  const keywords = loadDictionaryKeywords();
  console.log(`Loaded ${keywords.length} keywords of search index.`);

  // API Route - Health Check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      keywordsCount: keywords.length,
      hasSystemKey: !!process.env.GEMINI_API_KEY
    });
  });

  // API Route - Semantic/Intelligence AI Search
  app.post("/api/ai-search", async (req, res) => {
    try {
      const body = req.body as AiSearchRequestBody;
      const q = typeof body.q === "string" ? body.q.trim() : "";

      if (!q) {
        return res.status(400).json({ error: "Missing query parameter 'q'" });
      }

      if (q.length > AI_SEARCH_MAX_QUERY_LENGTH) {
        return res.status(400).json({ error: `Az intelligens (AI) keresés legfeljebb ${AI_SEARCH_MAX_QUERY_LENGTH} karakter hosszúságú lehet.` });
      }

      const headerApiKey = req.headers["x-api-key"];
      const requestApiKey = Array.isArray(headerApiKey) ? headerApiKey[0] : headerApiKey;
      // Supported for backward compatibility with legacy clients sending keys in the request body
      const bodyApiKey = typeof body.apiKey === "string" ? body.apiKey : undefined;
      const apiKey = requestApiKey || bodyApiKey || process.env.GEMINI_API_KEY;
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
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
          ],
        },
      });

      const text = response.text || "{}";
      const data = JSON.parse(text);
      res.json(data);
    } catch (error: unknown) {
      console.error("Semantic AI Search Error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to process intelligent semantic search"
      });
    }
  });

  // Handle Vite middleware configuration dynamically
  if (process.env.NODE_ENV !== "production") {
    const disableHmr = process.env.DISABLE_HMR === "true";
    const hmrPort = Number(process.env.VITE_HMR_PORT) || undefined;
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: disableHmr ? false : hmrPort ? { port: hmrPort } : undefined,
        watch: disableHmr ? null : undefined,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Knowledge map multi-mode server listening on port ${PORT}`);
  });
}

startServer();
