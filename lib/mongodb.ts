import { MongoClient, Collection, Db } from 'mongodb';
import { ScholarshipApplication } from '@/types/scholarship';

const uri = process.env.MONGODB_URI || '';
const dbName = process.env.MONGODB_DB || 'Application-Management-System';
const collectionName = process.env.MONGODB_COLLECTION || 'scholarship-data';

interface MongoGlobal {
  _mongoClientPromise?: Promise<MongoClient>;
}

const globalWithMongo = global as unknown as MongoGlobal;

let clientPromise: Promise<MongoClient> | null = null;

export function isMongoConfigured(): boolean {
  return Boolean(uri && uri.trim().length > 0);
}

export function getMongoClientPromise(): Promise<MongoClient> | null {
  if (!isMongoConfigured()) {
    return null;
  }

  if (process.env.NODE_ENV === 'development') {
    if (!globalWithMongo._mongoClientPromise) {
      const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      globalWithMongo._mongoClientPromise = client.connect();
    }
    return globalWithMongo._mongoClientPromise;
  } else {
    if (!clientPromise) {
      const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      clientPromise = client.connect();
    }
    return clientPromise;
  }
}

export async function getDatabase(): Promise<Db | null> {
  const promise = getMongoClientPromise();
  if (!promise) return null;
  try {
    const client = await promise;
    return client.db(dbName);
  } catch (err) {
    console.error('[MongoDB Error] Failed to connect to database:', err);
    return null;
  }
}

export async function getApplicationsCollection(): Promise<Collection<ScholarshipApplication> | null> {
  const db = await getDatabase();
  if (!db) return null;
  return db.collection<ScholarshipApplication>(collectionName);
}

