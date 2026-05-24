/**
 * HackerNews API 封装
 * API 文档: https://github.com/hackernews/api
 */

const HN_API_BASE = "https://hacker-news.firebaseio.com/v0";

export interface HNStory {
  id: number;
  title: string;
  titleZh?: string;
  url?: string;
  by: string;
  score: number;
  descendants: number;
  time: number;
  summary?: string;
  summaryZh?: string;
  siteName?: string;
}

/**
 * 获取 HN 热门故事 (Top Stories)
 */
export async function getTopStories(limit: number = 30): Promise<HNStory[]> {
  const ids = await fetchStoryIds("topstories");

  const limitedIds = ids.slice(0, limit);
  const stories = await Promise.all(limitedIds.map((id) => fetchStory(id)));

  return stories.filter(Boolean) as HNStory[];
}

/**
 * 获取 HN 最新故事
 */
export async function getNewStories(limit: number = 30): Promise<HNStory[]> {
  const ids = await fetchStoryIds("newstories");

  const limitedIds = ids.slice(0, limit);
  const stories = await Promise.all(limitedIds.map((id) => fetchStory(id)));

  return stories.filter(Boolean) as HNStory[];
}

async function fetchStoryIds(kind: "topstories" | "newstories"): Promise<number[]> {
  try {
    return await fetchJsonWithRetry<number[]>(`${HN_API_BASE}/${kind}.json`, 2);
  } catch (error) {
    console.error(`HackerNews ${kind} 获取失败:`, error);
    return [];
  }
}

/**
 * 获取单个 story 详情
 */
async function fetchStory(id: number): Promise<HNStory | null> {
  try {
    const story = (await fetchJsonWithRetry(`${HN_API_BASE}/item/${id}.json`, 1)) as HNStory & {
      deleted?: boolean;
      type?: string;
    };
    if (story && !story.deleted && story.type === "story") {
      return enrichStory(story);
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchJsonWithRetry<T>(url: string, retries: number): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetchWithTimeout(url, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return (await res.json()) as T;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 8000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function enrichStory(story: HNStory): Promise<HNStory> {
  if (!story.url) {
    return {
      ...story,
      summary: `这是一条 HackerNews 讨论帖，核心话题是「${story.title}」。`,
    };
  }

  const metadata = await fetchPageMetadata(story.url);
  return {
    ...story,
    summary:
      metadata.description ||
      `这篇来自 ${metadata.siteName || getHostname(story.url)} 的内容正在 HackerNews 上获得讨论，主题是「${story.title}」。`,
    siteName: metadata.siteName,
  };
}

async function fetchPageMetadata(url: string): Promise<{
  description: string;
  siteName: string;
}> {
  try {
    const res = await fetchWithTimeout(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; feishu-wiki-sync/1.0; +https://github.com/)",
          Accept: "text/html,application/xhtml+xml",
        },
      },
      5000
    );

    const contentType = res.headers.get("content-type") || "";
    if (!res.ok || !contentType.includes("text/html")) {
      return { description: "", siteName: getHostname(url) };
    }

    const html = await res.text();
    return {
      description:
        readMetaContent(html, "property", "og:description") ||
        readMetaContent(html, "name", "description") ||
        readMetaContent(html, "name", "twitter:description"),
      siteName:
        readMetaContent(html, "property", "og:site_name") || getHostname(url),
    };
  } catch {
    return { description: "", siteName: getHostname(url) };
  }
}

function readMetaContent(
  html: string,
  keyAttribute: "name" | "property",
  key: string
): string {
  const metaTag = html.match(
    new RegExp(`<meta[^>]+${keyAttribute}=["']${escapeRegExp(key)}["'][^>]*>`, "i")
  )?.[0];

  if (!metaTag) {
    return "";
  }

  const content = metaTag.match(/content=["']([^"']+)["']/i)?.[1] || "";
  return decodeHtmlEntities(content).replace(/\s+/g, " ").trim();
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "来源网站";
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, decimal: string) =>
      String.fromCodePoint(Number.parseInt(decimal, 10))
    )
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * 格式化 Unix 时间戳为可读日期
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
