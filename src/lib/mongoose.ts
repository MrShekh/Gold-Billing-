import mongoose from "mongoose";
import { migrateUserIds } from "./migrateUserId";

// Cached connection to avoid reconnecting on every request in dev mode
interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
    migrated: boolean;
}

declare global {
    // eslint-disable-next-line no-var
    var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache ?? { conn: null, promise: null, migrated: false };
global._mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        throw new Error("Please define the MONGODB_URI environment variable");
    }

    if (cached.conn) {
        // Migration must run even when connection is already cached
        // (e.g., after a hot-reload that preserved the connection but reset module code)
        if (!cached.migrated) {
            cached.migrated = true;
            await migrateUserIds();
        }
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (err) {
        // Don't keep a rejected promise cached — allow a retry on the next request
        cached.promise = null;
        throw err;
    }

    // Run userId migration once per process lifecycle
    if (!cached.migrated) {
        cached.migrated = true;
        await migrateUserIds();
    }

    return cached.conn;
}
