import Typesense from "typesense";

const TYPESENSE_API_KEY = process.env.TYPESENSE_API_KEY || "xyz123abc456def789";
const TYPESENSE_HOST = process.env.TYPESENSE_HOST || "localhost";
const TYPESENSE_PORT = parseInt(process.env.TYPESENSE_PORT || "8108", 10);
const TYPESENSE_PROTOCOL = process.env.TYPESENSE_PROTOCOL || "http";

const client = new Typesense.Client({
  nodes: [
    {
      host: TYPESENSE_HOST,
      port: TYPESENSE_PORT,
      protocol: TYPESENSE_PROTOCOL,
    },
  ],
  apiKey: TYPESENSE_API_KEY,
  connectionTimeoutSeconds: 5,
});

const COLLECTION_NAME = "clitools";

const COLLECTION_SCHEMA = {
  name: COLLECTION_NAME,
  fields: [
    { name: "_.id", type: "string", optional: false },
    { name: "name", type: "string", optional: false },
    { name: "displayName", type: "string", optional: false },
    { name: "tagline", type: "string", optional: true },
    { name: "description", type: "string", optional: true },
    { name: "category_name", type: "string", facet: true },
    { name: "category_slug", type: "string", facet: true },
    { name: "isFeatured", type: "bool", optional: true },
    { name: "stars", type: "int32" },
    { name: "downloads", type: "int32" },
    { name: "iconUrl", type: "string", optional: true },
    { name: "officialUrl", type: "string", optional: true },
    { name: "installCommand", type: "string", optional: true },
    { name: "packageManager", type: "string", facet: true, optional: true },
  ],
  default_sorting_field: "stars",
};

export { client, COLLECTION_NAME, COLLECTION_SCHEMA };
