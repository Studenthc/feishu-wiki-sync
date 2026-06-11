import type { HNStory } from "./hacker-news";
import type { PHProduct } from "./product-hunt";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GRSAI_CHAT_COMPLETIONS_URL = "https://api.grsai.com/v1/chat/completions";
const APIMART_CHAT_COMPLETIONS_URL =
  "https://api.apimart.ai/api/v1/chat/completions";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash-lite";
const DEFAULT_GRSAI_MODEL = "gemini-2.5-flash";
const DEFAULT_APIMART_MODEL = "deepseek-v4-flash";
const GRSAI_FALLBACK_MODELS = [
  DEFAULT_GRSAI_MODEL,
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
];
const GEMINI_FALLBACK_MODELS = [
  DEFAULT_GEMINI_MODEL,
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
];
const DEFAULT_BATCH_SIZE = 30;
const RETRY_DELAYS_MS = [2_000, 8_000, 20_000];
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const unavailableGeminiModels = new Set<string>();

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
  name: "apimart" | "grsai" | "gemini" | "openai";
  createJson: <T>(instructions: string, payload: unknown) => Promise<T>;
}

export async function localizeProducts(products: PHProduct[]): Promise<PHProduct[]> {
  const provider = getChineseProvider();
  if (!provider || products.length === 0) {
    if (!provider) {
      assertChineseAvailable();
      console.log(
        "跳过中文化 (未设置 APIMART_TEXT_API_KEY、APIMART_API_KEY、GRSAI_API_KEY、GEMINI_API_KEY 或 OPENAI_API_KEY)"
      );
    }
    return products;
  }

  try {
    const localized: LocalizedProduct[] = [];
    for (const chunk of chunkArray(products, getChineseBatchSize())) {
      localized.push(
        ...(await provider.createJson<LocalizedProduct[]>(
          [
            "把 Product Hunt 产品信息改写成中文。",
            "要求：",
            "1. 保留产品名、品牌名、专有名词和 URL 不翻译。",
            "2. taglineZh、descriptionZh、summaryZh 必须是自然中文，不要夹带整句英文。",
            "3. summaryZh 用 1 句中文说明这个产品解决什么问题，控制在 80 字以内。",
            "4. 每个输入 id 都必须返回一条对应 JSON。",
            "5. 只输出 JSON 数组，不要 Markdown。",
          ].join("\n"),
          chunk.map((product) => ({
            id: product.id,
            name: product.name,
            tagline: product.tagline,
            description: product.description,
          }))
        ))
      );
    }

    const byId = new Map(localized.map((item) => [item.id, item]));
    assertLocalizedIds(products, byId, "Product Hunt");
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
      console.log(
        "跳过中文化 (未设置 APIMART_TEXT_API_KEY、APIMART_API_KEY、GRSAI_API_KEY、GEMINI_API_KEY 或 OPENAI_API_KEY)"
      );
    }
    return stories;
  }

  try {
    const localized: LocalizedStory[] = [];
    for (const chunk of chunkArray(stories, getChineseBatchSize())) {
      localized.push(
        ...(await provider.createJson<LocalizedStory[]>(
          [
            "把 HackerNews 新闻信息改写成中文。",
            "要求：",
            "1. titleZh 是自然中文标题；公司名、产品名、论文名、专有名词可保留英文。",
            "2. summaryZh 是 1 句中文简介，说明这条新闻/文章在讲什么，控制在 90 字以内。",
            "3. 不要输出英文整句，不要 Markdown。",
            "4. 每个输入 id 都必须返回一条对应 JSON。",
            "5. 只输出 JSON 数组。",
          ].join("\n"),
          chunk.map((story) => ({
            id: story.id,
            title: story.title,
            source: story.siteName || (story.url ? new URL(story.url).hostname : ""),
            summary: story.summary,
          }))
        ))
      );
    }

    const byId = new Map(localized.map((item) => [item.id, item]));
    assertLocalizedIds(stories, byId, "HackerNews");
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
  const apimartKey =
    process.env.APIMART_TEXT_API_KEY || process.env.APIMART_API_KEY || "";
  const grsaiKey = process.env.GRSAI_API_KEY || "";
  const geminiKey = process.env.GEMINI_API_KEY || "";
  const openaiKey = process.env.OPENAI_API_KEY || "";

  if (apimartKey) {
    const fallbackProviders = getFallbackProviders({
      grsaiKey,
      geminiKey,
      openaiKey,
    });

    return {
      name: "apimart",
      createJson: async (instructions, payload) => {
        try {
          return await withRetry(
            () => createAPIMartChineseJson(apimartKey, instructions, payload),
            `APIMart ${process.env.APIMART_TEXT_MODEL || DEFAULT_APIMART_MODEL}`
          );
        } catch (error) {
          return fallbackToProviders(error, fallbackProviders, instructions, payload);
        }
      },
    };
  }

  if (grsaiKey) {
    const fallbackProviders = getFallbackProviders({ geminiKey, openaiKey });

    return {
      name: "grsai",
      createJson: async (instructions, payload) => {
        try {
          return await createGrsAIChineseJson(grsaiKey, instructions, payload);
        } catch (error) {
          return fallbackToProviders(error, fallbackProviders, instructions, payload);
        }
      },
    };
  }

  if (geminiKey) {
    return {
      name: "gemini",
      createJson: (instructions, payload) =>
        createGeminiChineseJson(geminiKey, instructions, payload),
    };
  }

  if (openaiKey) {
    return {
      name: "openai",
      createJson: (instructions, payload) =>
        createOpenAIChineseJson(openaiKey, instructions, payload),
    };
  }

  return null;
}

function getFallbackProviders({
  grsaiKey = "",
  geminiKey = "",
  openaiKey = "",
}: {
  grsaiKey?: string;
  geminiKey?: string;
  openaiKey?: string;
}): ChineseJsonProvider[] {
  const providers: ChineseJsonProvider[] = [];
  if (grsaiKey) {
    providers.push({
      name: "grsai",
      createJson: <T>(instructions: string, payload: unknown) =>
        createGrsAIChineseJson<T>(grsaiKey, instructions, payload),
    });
  }
  if (geminiKey) {
    providers.push({
      name: "gemini",
      createJson: <T>(instructions: string, payload: unknown) =>
        createGeminiChineseJson<T>(geminiKey, instructions, payload),
    });
  }
  if (openaiKey) {
    providers.push({
      name: "openai",
      createJson: <T>(instructions: string, payload: unknown) =>
        createOpenAIChineseJson<T>(openaiKey, instructions, payload),
    });
  }

  return providers;
}

async function fallbackToProviders<T>(
  originalError: unknown,
  providers: ChineseJsonProvider[],
  instructions: string,
  payload: unknown
): Promise<T> {
  if (providers.length === 0) {
    throw originalError;
  }

  console.warn("当前中文化 provider 失败，尝试其他 provider。");
  let lastError: unknown = originalError;
  for (const provider of providers) {
    try {
      return await provider.createJson<T>(instructions, payload);
    } catch (fallbackError) {
      lastError = fallbackError;
      console.warn(`${provider.name} 中文化失败，继续尝试其他 provider。`);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All Chinese providers failed");
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

async function createAPIMartChineseJson<T>(
  apiKey: string,
  instructions: string,
  payload: unknown
): Promise<T> {
  const timeoutMs =
    Number.parseInt(process.env.APIMART_TEXT_TIMEOUT_MS || "", 10) || 120_000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(process.env.APIMART_TEXT_API_URL || APIMART_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.APIMART_TEXT_MODEL || DEFAULT_APIMART_MODEL,
        stream: false,
        messages: [
          {
            role: "system",
            content: instructions,
          },
          {
            role: "user",
            content: JSON.stringify(payload),
          },
        ],
        max_tokens:
          Number.parseInt(process.env.APIMART_TEXT_MAX_TOKENS || "", 10) || 6000,
        temperature: 0.2,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  const raw = await response.text();
  let data: any;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    throw new ApiError(
      `APIMart API returned invalid JSON: ${raw.slice(0, 200)}`,
      response.status
    );
  }

  if (!response.ok) {
    throw new ApiError(
      `APIMart API error: ${response.status} ${JSON.stringify(
        data?.error || data
      )}`,
      response.status
    );
  }

  const text = extractChatCompletionOutputText(data);
  if (!text) {
    throw new Error("APIMart response missing output text");
  }

  return JSON.parse(stripJsonFence(text)) as T;
}

async function createGrsAIChineseJson<T>(
  apiKey: string,
  instructions: string,
  payload: unknown
): Promise<T> {
  const models = getGrsAIModels();
  let lastError: unknown;

  for (const model of models) {
    try {
      return await withRetry(
        () => createGrsAIChineseJsonWithModel<T>(apiKey, model, instructions, payload),
        `GrsAI ${model}`
      );
    } catch (error) {
      lastError = error;
      console.warn(`GrsAI 模型 ${model} 中文化失败，尝试备用模型。`);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("GrsAI API error: all configured models failed");
}

async function createGrsAIChineseJsonWithModel<T>(
  apiKey: string,
  model: string,
  instructions: string,
  payload: unknown
): Promise<T> {
  const timeoutMs = Number.parseInt(process.env.GRSAI_TIMEOUT_MS || "", 10) || 30_000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(process.env.GRSAI_API_URL || GRSAI_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          {
            role: "system",
            content: instructions,
          },
          {
            role: "user",
            content: JSON.stringify(payload),
          },
        ],
        max_tokens: Number.parseInt(process.env.GRSAI_MAX_TOKENS || "", 10) || 6000,
        temperature: 0.2,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await response.json();
  if (!response.ok) {
    throw new ApiError(
      `GrsAI API error: ${response.status} ${JSON.stringify(data.error || data)}`,
      response.status
    );
  }

  const text = extractGrsAIOutputText(data);
  if (!text) {
    throw new Error("GrsAI response missing output text");
  }

  return JSON.parse(stripJsonFence(text)) as T;
}

async function createGeminiChineseJson<T>(
  apiKey: string,
  instructions: string,
  payload: unknown
): Promise<T> {
  const models = getGeminiModels();
  let lastError: unknown;

  for (const model of models) {
    try {
      return await withRetry(
        () => createGeminiChineseJsonWithModel<T>(apiKey, model, instructions, payload),
        `Gemini ${model}`
      );
    } catch (error) {
      lastError = error;
      if (isRetryableApiError(error)) {
        unavailableGeminiModels.add(model);
      }
      console.warn(`Gemini 模型 ${model} 中文化失败，尝试备用模型。`);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Gemini API error: all configured models failed");
}

async function createGeminiChineseJsonWithModel<T>(
  apiKey: string,
  model: string,
  instructions: string,
  payload: unknown
): Promise<T> {
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
    throw new ApiError(
      `Gemini API error: ${response.status} ${JSON.stringify(data.error || data)}`,
      response.status
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
    throw new ApiError(
      `OpenAI API error: ${response.status} ${JSON.stringify(data.error || data)}`,
      response.status
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

function extractChatCompletionOutputText(data: any): string {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        return part?.text || "";
      })
      .join("\n")
      .trim();
  }

  return "";
}

function extractGrsAIOutputText(data: any): string {
  return extractChatCompletionOutputText(data);
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

class ApiError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
  }
}

async function withRetry<T>(operation: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const shouldRetry = isRetryableApiError(error);
      if (!shouldRetry || attempt === RETRY_DELAYS_MS.length) {
        throw error;
      }

      const delayMs = RETRY_DELAYS_MS[attempt];
      console.warn(
        `${label} 暂时不可用 (${error.statusCode})，${Math.round(
          delayMs / 1000
        )} 秒后重试...`
      );
      await sleep(delayMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`${label} failed`);
}

function getGeminiModels(): string[] {
  const configuredModel = process.env.GEMINI_MODEL?.trim();
  const candidates = configuredModel
    ? [configuredModel, ...GEMINI_FALLBACK_MODELS]
    : GEMINI_FALLBACK_MODELS;

  return [...new Set(candidates.filter(Boolean))].filter(
    (model) => !unavailableGeminiModels.has(model)
  );
}

function getGrsAIModels(): string[] {
  const configuredModel = process.env.GRSAI_MODEL?.trim();
  const candidates = configuredModel
    ? [configuredModel, ...GRSAI_FALLBACK_MODELS]
    : GRSAI_FALLBACK_MODELS;

  return [...new Set(candidates.filter(Boolean))];
}

function isRetryableApiError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    (RETRYABLE_STATUS_CODES.has(error.statusCode) ||
      /load is too high|try again later|temporarily unavailable/i.test(error.message))
  );
}

function getChineseBatchSize(): number {
  const parsed = Number.parseInt(process.env.CHINESE_BATCH_SIZE || "", 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.min(parsed, 20);
  }

  return DEFAULT_BATCH_SIZE;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function assertLocalizedIds<T extends { id: string | number }>(
  sourceItems: T[],
  localizedById: Map<T["id"], unknown>,
  sourceName: string
): void {
  const missingIds = sourceItems
    .map((item) => item.id)
    .filter((id) => !localizedById.has(id));

  if (missingIds.length > 0) {
    assertChineseAvailable(
      new Error(
        `${sourceName} 中文化结果缺少 ${missingIds.length} 条记录: ${missingIds
          .slice(0, 5)
          .join(", ")}`
      )
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
