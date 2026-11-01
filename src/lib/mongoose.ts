import mongoose from "mongoose";

// Cached connection to avoid reconnecting on every request in serverless/dev mode
interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    // eslint-disable-next-line no-var
    var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        throw new Error("Please define the MONGODB_URI environment variable");
    }

    // If we have an active, ready connection, reuse it immediately
    if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn;
    }

    // If disconnected or never connected, initiate connection with proper serverless timeouts
    if (!cached.promise || mongoose.connection.readyState === 0) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 30000,
        }).then((m) => {
            cached.conn = m;
            return m;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (err) {
        // Reset cached promise so next request can retry immediately
        cached.promise = null;
        cached.conn = null;
        throw err;
    }

    return cached.conn;
}
