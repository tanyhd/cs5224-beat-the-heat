// pages/api/test-mongo.js
import { connectToDb } from "@/services/mongodb";

export default async function handler(req, res) {
  try {
    const db = await connectToDb();
    const collections = await db.collections();
    res.status(200).json({
      message: "MongoDB connected successfully",
      collections: collections.map(c => c.collectionName),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
