/**
 * Product Hunt API 封装
 * API 文档: https://api.producthunt.com/v2/docs
 */

const PH_API_URL = "https://api.producthunt.com/v2/api/graphql";

export interface PHProduct {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  thumbnail: {
    url: string;
  };
  reviewsCount: number;
  commentsCount: number;
}

/**
 * 获取 Product Hunt 热门产品
 */
export async function getPopularProducts(token: string, limit: number = 20): Promise<PHProduct[]> {
  const query = `
    query {
      posts(first: ${limit}, order: POPULAR) {
        edges {
          node {
            id
            name
            tagline
            description
            url
            thumbnail {
              url
            }
            reviewsCount
            commentsCount
          }
        }
      }
    }
  `;

  const response = await fetch(PH_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Product Hunt API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data.posts.edges.map((edge: any) => edge.node);
}

/**
 * 获取 Product Hunt 今日新品
 */
export async function getNewProducts(token: string, limit: number = 20): Promise<PHProduct[]> {
  const query = `
    query {
      posts(first: ${limit}, order: NEWEST) {
        edges {
          node {
            id
            name
            tagline
            description
            url
            thumbnail {
              url
            }
            reviewsCount
            commentsCount
          }
        }
      }
    }
  `;

  const response = await fetch(PH_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Product Hunt API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data.posts.edges.map((edge: any) => edge.node);
}