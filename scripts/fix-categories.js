import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixCategories() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/codeaptor');
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;

  // Find tools where category is a string (not ObjectId)
  const badTools = await db.collection('clitools').find({
    $expr: { $eq: [{ $type: '$category' }, 'string'] }
  }).toArray();

  console.log(`Found ${badTools.length} tools with string category`);

  const allCategories = await db.collection('categories').find({}).toArray();
  const catByName = {};
  for (const c of allCategories) {
    catByName[c.name.toLowerCase()] = c._id;
  }
  console.log(`Loaded ${allCategories.length} categories`);

  let fixed = 0;
  for (const tool of badTools) {
    const catName = tool.category.trim();
    const catKey = catName.toLowerCase();
    let catId = catByName[catKey];

    if (!catId) {
      // Try fuzzy match: find first category whose name is contained in or contains this name
      const fuzzy = allCategories.find(c =>
        catName.toLowerCase().includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().includes(catName.toLowerCase())
      );
      if (fuzzy) {
        console.log(`  Fuzzy match "${catName}" -> "${fuzzy.name}"`);
        catId = fuzzy._id;
      } else {
        console.log(`  WARN: No category found for "${catName}", creating it`);
        const result = await db.collection('categories').insertOne({
          name: catName,
          slug: catName.toLowerCase().replace(/\s+/g, '-'),
          description: '',
          displayOrder: 99,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        catId = result.insertedId;
        catByName[catKey] = catId;
      }
    }

    await db.collection('clitools').updateOne(
      { _id: tool._id },
      { $set: { category: catId } }
    );
    fixed++;
  }

  console.log(`Fixed ${fixed} tools`);
  await mongoose.disconnect();
}

fixCategories().catch(err => {
  console.error(err);
  process.exit(1);
});
