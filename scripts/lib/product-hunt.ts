/**
 * Product Hunt API 封装
 * API 文档: https://api.producthunt.com/v2/docs
 */

const PH_API_URL = "https://api.producthunt.com/v2/api/graphql";

export interface PHProduct {
  id: string;
  name: string;
  tagline: string;
  taglineZh?: string;
  description: string;
  descriptionZh?: string;
  summaryZh?: string;
  url: string;
  thumbnail: {
    url: string;
  };
  reviewsCount: number;
  commentsCount: number;
}

export interface PHQueryOptions {
  postedAfter?: string;
  postedBefore?: string;
}

interface PHGraphQLResponse {
  data?: {
    posts?: {
      edges: {
        node: PHProduct;
      }[];
    };
  };
  errors?: {
    message: string;
  }[];
}

/**
 * 获取 Product Hunt 热门产品
 */
export async function getPopularProducts(
  token: string,
  limit: number = 20,
  options: PHQueryOptions = {}
): Promise<PHProduct[]> {
  const filters = formatPostFilters(options);
  const query = `
    query {
      posts(first: ${limit}, order: VOTES${filters}) {
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

  const data = (await response.json()) as PHGraphQLResponse;
  return readPosts(data);
}

/**
 * 获取 Product Hunt 今日新品
 */
export async function getNewProducts(
  token: string,
  limit: number = 20,
  options: PHQueryOptions = {}
): Promise<PHProduct[]> {
  const filters = formatPostFilters(options);
  const query = `
    query {
      posts(first: ${limit}, order: NEWEST${filters}) {
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

  const data = (await response.json()) as PHGraphQLResponse;
  return readPosts(data);
}

function readPosts(data: PHGraphQLResponse): PHProduct[] {
  if (data.errors?.length) {
    throw new Error(
      `Product Hunt GraphQL error: ${data.errors
        .map((error) => error.message)
        .join("; ")}`
    );
  }

  const edges = data.data?.posts?.edges;
  if (!edges) {
    throw new Error("Product Hunt GraphQL response missing posts");
  }

  return edges.map((edge) => edge.node);
}

function formatPostFilters(options: PHQueryOptions): string {
  const filters: string[] = [];

  if (options.postedAfter) {
    filters.push(`postedAfter: ${JSON.stringify(options.postedAfter)}`);
  }

  if (options.postedBefore) {
    filters.push(`postedBefore: ${JSON.stringify(options.postedBefore)}`);
  }

  return filters.length > 0 ? `, ${filters.join(", ")}` : "";
}
