// db.ts
import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI!; // Replace with your URI
const client = new MongoClient(uri, {
  serverApi: { version: '1' },
  tls: true, // or false if you're connecting to localhost without TLS
});

let db: Db;

export async function connectToDatabase() {
  if (!db) {
    await client.connect();
    db = client.db(); // use default database or specify: client.db('your-db-name')
    console.log('✅ MongoDB connected');
  }
  return db;
}

export { db, client };
