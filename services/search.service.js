import { client, COLLECTION_NAME } from "../config/typesense.js";

export async function searchTools(query, filters = {}) {
  const { category, featured, limit = 50, page = 1 } = filters;

  const searchParameters = {
    q: query,
    query_by: "displayName,name,description,tagline",
    query_by_weights: "10,5,2,1",
    per_page: Math.min(parseInt(limit, 10) || 50, 100),
    page: parseInt(page, 10) || 1,
  };

  const filterByParts = [];
  if (category) {
    filterByParts.push(`category_slug:${category}`);
  }
  if (featured === "true") {
    filterByParts.push("isFeatured:true");
  }
  if (filterByParts.length > 0) {
    searchParameters.filter_by = filterByParts.join(" && ");
  }

  const result = await client.collections(COLLECTION_NAME).documents().search(searchParameters);

  return {
    tools: result.hits.map((hit) => hit.document),
    total: result.found || 0,
    page: result.page || 1,
    pages: Math.ceil((result.found || 0) / searchParameters.per_page),
  };
}

export async function suggestTools(prefix) {
  const result = await client.collections(COLLECTION_NAME).documents().search({
    q: prefix,
    query_by: "displayName,name",
    prefix: true,
    per_page: 8,
  });

  return result.hits.map((hit) => hit.document);
}
