import mongoose from "mongoose";
import dotenv from "dotenv";
import "../models/category.model.js";
import CliTool from "../models/clitool.model.js";
import { client, COLLECTION_NAME, COLLECTION_SCHEMA } from "../config/typesense.js";

dotenv.config();

function toTypesenseDoc(tool) {
  return {
    "_.id": tool._id.toString(),
    name: tool.name,
    displayName: tool.displayName,
    tagline: tool.tagline || "",
    description: tool.description || "",
    category_name: tool.category?.name || "",
    category_slug: tool.category?.slug || "",
    isFeatured: tool.isFeatured || false,
    stars: tool.metrics?.stars || 0,
    downloads: tool.metrics?.downloads || 0,
    iconUrl: tool.iconUrl || "",
    officialUrl: tool.officialUrl || "",
    installCommand: tool.installCommand || "",
    packageManager: tool.packageManager || "",
  };
}

async function sync() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const collections = await client.collections().retrieve();
    const exists = collections.some((c) => c.name === COLLECTION_NAME);
    if (exists) {
      await client.collections(COLLECTION_NAME).delete();
      console.log("Dropped existing collection");
    }

    await client.collections().create(COLLECTION_SCHEMA);
    console.log("Created Typesense collection");

    const tools = await CliTool.find({ isActive: true }).populate("category", "name slug").lean();
    console.log(`Fetched ${tools.length} tools from MongoDB`);

    const documents = tools.map(toTypesenseDoc);
    const returnDocs = await client.collections(COLLECTION_NAME).documents().import(documents, { action: "upsert" });
    const failures = returnDocs.filter((d) => !d.success);
    if (failures.length > 0) {
      console.error(`${failures.length} documents failed to index:`, failures.slice(0, 3));
    }

    console.log(`Indexed ${documents.length - failures.length} documents into Typesense`);
    process.exit(0);
  } catch (err) {
    console.error("Sync failed:", err.message);
    process.exit(1);
  }
}

sync();
