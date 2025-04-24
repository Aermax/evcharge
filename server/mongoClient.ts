import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/chargepulse";

const client = new MongoClient(uri);
let db: Db;

export async function connectToMongoDB() {
  if (!db) {
    await client.connect();
    db = client.db("your_database_name"); // e.g., "ev_charging"
    console.log("Connected to MongoDB");
  }
  return db;
}
