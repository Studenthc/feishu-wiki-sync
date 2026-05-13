/**
 * HackerNews API 封装
 * API 文档: https://github.com/hackernews/api
 */

const HN_API_BASE = "https://hacker-news.firebaseio.com/v0";

export interface HNStory {
  id: number;
  title: string;
  url: string;
  by: string;
  score: number;
  descendants: number;
  time: number;
}

/**
 * 获取 HN 热门故事 (Top Stories)
 */
export async function getTopStories(limit: number = 30): Promise<HNStory[]> {
  const idsRes = await fetch(`${HN_API_BASE}/topstories.json`);
  const ids: number[] = await idsRes.json();

  const limitedIds = ids.slice(0, limit);
  const stories = await Promise.all(
    limitedIds.map((id) => fetchStory(id))
  );

  return stories.filter(Boolean) as HNStory[];
}

/**
 * 获取 HN 最新故事
 */
export async function getNewStories(limit: number = 30): Promise<HNStory[]> {
  const idsRes = await fetch(`${HN_API_BASE}/newstories.json`);
  const ids: number[] = await idsRes.json();

  const limitedIds = ids.slice(0, limit);
  const stories = await Promise.all(
    limitedIds.map((id) => fetchStory(id))
  );

  return stories.filter(Boolean) as HNStory[];
}

/**
 * 获取单个 story 详情
 */
async function fetchStory(id: number): Promise<HNStory | null> {
  try {
    const res = await fetch(`${HN_API_BASE}/item/${id}.json`);
    const story = await res.json();
    if (story && !story.deleted && story.type === "story") {
      return story as HNStory;
    }
    return null;
  } catch {
    return null;
  }
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