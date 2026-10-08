import mongoose from "mongoose";

const uri = process.env.MONGODB_URI ?? "";

declare global {
  // eslint-disable-next-line no-var
  var __ptMongoose: Promise<typeof mongoose> | undefined;
}

/** Connect once per server instance. Null when no URI is configured. */
export async function db(): Promise<typeof mongoose | null> {
  if (!uri) return null;
  if (!global.__ptMongoose) {
    global.__ptMongoose = mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  }
  try {
    return await global.__ptMongoose;
  } catch {
    global.__ptMongoose = undefined;
    return null;
  }
}
