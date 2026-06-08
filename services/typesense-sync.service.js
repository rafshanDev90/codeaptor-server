import mongoose from "mongoose";
import "../models/category.model.js";
import CliTool from "../models/clitool.model.js";
import { client, COLLECTION_NAME } from "../config/typesense.js";

function toTypesenseDoc(tool) {
  const cat = tool.category || {};
  return {
    "_.id": tool._id?.toString() || tool._doc?._id?.toString(),
    name: tool.name,
    displayName: tool.displayName,
    tagline: tool.tagline || "",
    description: tool.description || "",
    category_name: cat.name || "",
    category_slug: cat.slug || "",
    isFeatured: tool.isFeatured || false,
    stars: tool.metrics?.stars || 0,
    downloads: tool.metrics?.downloads || 0,
    iconUrl: tool.iconUrl || "",
    officialUrl: tool.officialUrl || "",
    installCommand: tool.installCommand || "",
    packageManager: tool.packageManager || "",
  };
}

let changeStream = null;

export function startSync() {
  if (changeStream) return;

  const pipeline = [
    {
      $match: {
        $or: [
          { operationType: "insert" },
          { operationType: "update" },
          { operationType: "delete" },
        ],
      },
    },
  ];

  const collection = mongoose.connection.collection("clitools");
  changeStream = collection.watch(pipeline, { fullDocument: "updateLookup" });

  changeStream.on("change", async (change) => {
    try {
      if (change.operationType === "delete") {
        await client.collections(COLLECTION_NAME).documents(change.documentKey._id.toString()).delete();
        return;
      }

      const doc = change.fullDocument;
      if (!doc || !doc.isActive) {
        if (change.documentKey) {
          try {
            await client.collections(COLLECTION_NAME).documents(change.documentKey._id.toString()).delete();
          } catch { /* doc may not exist */ }
        }
        return;
      }

      const cat = await mongoose.model("Category").findById(doc.category).lean();
      const tsDoc = toTypesenseDoc({ ...doc, category: cat });

      await client.collections(COLLECTION_NAME).documents().upsert(tsDoc);
    } catch (err) {
      console.error("Typesense sync error:", err.message);
    }
  });

  changeStream.on("error", (err) => {
    console.error("Change Stream error:", err.message);
  });

  console.log("Typesense Change Stream sync started");
}

export function stopSync() {
  if (changeStream) {
    changeStream.close();
    changeStream = null;
    console.log("Typesense Change Stream sync stopped");
  }
}
