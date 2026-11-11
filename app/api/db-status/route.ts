import { NextResponse } from 'next/server';
import { getDatabase, isMongoConfigured } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isMongoConfigured()) {
    return NextResponse.json({
      configured: false,
      connected: false,
      message: 'MONGODB_URI is not set in environment.',
    });
  }

  try {
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json(
        {
          configured: true,
          connected: false,
          error: 'Could not obtain database instance.',
        },
        { status: 500 }
      );
    }

    // Ping the database
    await db.command({ ping: 1 });
    const collectionName = process.env.MONGODB_COLLECTION || 'scholarship-data';
    const count = await db.collection(collectionName).countDocuments();

    return NextResponse.json({
      configured: true,
      connected: true,
      database: db.databaseName,
      collection: collectionName,
      applicationsCount: count,
      message: 'MongoDB Atlas is successfully connected and responsive.',
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        configured: true,
        connected: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

