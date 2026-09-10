import mongoose from "mongoose";

/**
 * One-time migration: stamps `userId` onto all documents that are missing it.
 * Finds the first created user and assigns their _id to all un-stamped
 * Customer, Bill, CustomerBalance, and Profile documents.
 *
 * Safe to call repeatedly — documents that already have a userId are skipped.
 */
export async function migrateUserIds() {
    try {
        const UserModel = mongoose.models.User || mongoose.model("User", new mongoose.Schema({}, { strict: false }));
        const firstUser = await UserModel.findOne({}).sort({ createdAt: 1 }).lean() as { _id: mongoose.Types.ObjectId } | null;

        if (!firstUser) return; // No users at all — nothing to migrate

        const userId = firstUser._id.toString();
        const db = mongoose.connection.db;
        if (!db) return;

        // Stamp all documents missing `userId` in each collection
        const collections = ["customers", "bills", "customerbalances", "profiles"];
        for (const col of collections) {
            try {
                const result = await db.collection(col).updateMany(
                    { userId: { $exists: false } },
                    { $set: { userId } }
                );
                if (result.modifiedCount > 0) {
                    console.log(`[migrate] Stamped userId on ${result.modifiedCount} docs in '${col}'`);
                }
            } catch {
                // Collection may not exist yet — ignore
            }
        }
    } catch (err) {
        console.error("[migrate] migrateUserIds failed:", err);
    }
}
