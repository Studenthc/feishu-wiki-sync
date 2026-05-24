import type { HNStory } from "./hacker-news";
import type { PHProduct } from "./product-hunt";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

interface LocalizedProduct {
  id: string;
  taglineZh: string;
  descriptionZh: string;
  summaryZh: string;
}

interface LocalizedStory {
  id: number;
  titleZh: string;
  summaryZh: string;
}

export interface ChineseJsonProvider {
  name: "gemini" | "openai";
  createJson: <T>(instructions: string, payload: unknown) => Promise<T>;
}

export async function localizeProducts(products: PHProduct[]): Promise<PHProduct[]> {
  const provider = getChineseProvider();
  if (!provider || products.length === 0) {
    if (!provider) {
      assertChineseAvailable();
      console.log("跳过中文化 (未设置 GEMINI_API_KEY 或 OPENAI_API_KEY)");
    }
    return products;
  }

  try {
    const localized = await provider.createJson<LocalizedProduct[]>(
      [
        "把 Product Hunt 产品信息改写成中文。",
        "要求：",
        "1. 保留产品名、品牌名、专有名词和 URL 不翻译。",
        "2. taglineZh、descriptionZh、summaryZh 必须是自然中文，不要夹带整句英文。",
        "3. summaryZh 用 1 句中文说明这个产品解决什么问题，控制在 80 字以内。",
        "4. 只输出 JSON 数组，不要 Markdown。",
      ].join("\n"),
      products.map((product) => ({
        id: product.id,
        name: product.name,
        tagline: product.tagline,
        description: product.description,
      }))
    );

    const byId = new Map(localized.map((item) => [item.id, item]));
    return products.map((product) => ({
      ...product,
      ...byId.get(product.id),
    }));
  } catch (error) {
    assertChineseAvailable(error);
    console.error("Product Hunt 中文化失败，使用原文继续:", error);
    return products;
  }
}

export async function localizeStories(stories: HNStory[]): Promise<HNStory[]> {
  const provider = getChineseProvider();
  if (!provider || stories.length === 0) {
    if (!provider) {
      assertChineseAvailable();
      console.log("跳过中文化 (未设置 GEMINI_API_KEY 或 OPENAI_API_KEY)");
    }
    return stories;
  }

  try {
    const localized = await provider.createJson<LocalizedStory[]>(
      [
        "把 HackerNews 新闻信息改写成中文。",
        "要求：",
        "1. titleZh 是自然中文标题；公司名、产品名、论文名、专有名词可保留英文。",
        "2. summaryZh 是 1 句中文简介，说明这条新闻/文章在讲什么，控制在 90 字以内。",
        "3. 不要输出英文整句，不要 Markdown。",
        "4. 只输出 JSON 数组。",
      ].join("\n"),
      stories.map((story) => ({
        id: story.id,
        title: story.title,
        source: story.siteName || (story.url ? new URL(story.url).hostname : ""),
        summary: story.summary,
      }))
    );

    const byId = new Map(localized.map((item) => [item.id, item]));
    return stories.map((story) => ({
      ...story,
      ...byId.get(story.id),
    }));
  } catch (error) {
    assertChineseAvailable(error);
    console.error("HackerNews 中文化失败，使用原文继续:", error);
    return stories;
  }
}

export function getChineseProvider(): ChineseJsonProvider | null {
  const geminiKey = process.env.GEMINI_API_KEY || "";
  if (geminiKey) {
    return {
      name: "gemini",
      createJson: (instructions, payload) =>
        createGeminiChineseJson(geminiKey, instructions, payload),
    };
  }

  const openaiKey = process.env.OPENAI_API_KEY || "";
  if (openaiKey) {
    return {
      name: "openai",
      createJson: (instructions, payload) =>
        createOpenAIChineseJson(openaiKey, instructions, payload),
    };
  }

  return null;
}

export function assertChineseAvailable(cause?: unknown): void {
  if (process.env.REQUIRE_CHINESE === "true") {
    throw new Error(
      `REQUIRE_CHINESE=true, but Chinese rewriting is unavailable.${
        cause instanceof Error ? ` ${cause.message}` : ""
      }`
    );
  }
}

async function createGeminiChineseJson<T>(
  apiKey: string,
  instructions: string,
  payload: unknown
): Promise<T> {
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const response = await fetch(
    `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: instructions }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: JSON.stringify(payload) }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `Gemini API error: ${response.status} ${JSON.stringify(data.error || data)}`
    );
  }

  const text = extractGeminiText(data);
  if (!text) {
    throw new Error("Gemini response missing output text");
  }

  return JSON.parse(stripJsonFence(text)) as T;
}

async function createOpenAIChineseJson<T>(
  apiKey: string,
  instructions: string,
  payload: unknown
): Promise<T> {
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
      instructions,
      input: JSON.stringify(payload),
      max_output_tokens: 6000,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `OpenAI API error: ${response.status} ${JSON.stringify(data.error || data)}`
    );
  }

  const text = extractOpenAIOutputText(data);
  if (!text) {
    throw new Error("OpenAI response missing output text");
  }

  return JSON.parse(stripJsonFence(text)) as T;
}

function extractOpenAIOutputText(data: any): string {
  if (typeof data.output_text === "string") {
    return data.output_text;
  }

  const chunks: string[] = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join("\n").trim();
}

function extractGeminiText(data: any): string {
  const parts = data.candidates?.[0]?.content?.parts || [];
  return parts
    .map((part: { text?: string }) => part.text || "")
    .join("\n")
    .trim();
}

function stripJsonFence(text: string): string {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
}
