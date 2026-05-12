import mongoose from 'mongoose';

type Cache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

function getCache(): Cache {
  const g = globalThis as unknown as { __mongooseCache?: Cache };
  if (!g.__mongooseCache) g.__mongooseCache = { conn: null, promise: null };
  return g.__mongooseCache;
}

export async function dbConnect() {
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error('DATABASE_URL is not defined');

  const cache = getCache();
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, {
      bufferCommands: false,
    });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
