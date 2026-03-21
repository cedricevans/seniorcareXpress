// Simple in-memory cache for temporary invite codes
// In production, use Redis or database
const cache = new Map();

const setCache = (key, value, ttlMs = 24 * 60 * 60 * 1000) => {
  cache.set(key, value);
  setTimeout(() => cache.delete(key), ttlMs);
};

const getCache = (key) => cache.get(key);

const deleteCache = (key) => cache.delete(key);

export { setCache, getCache, deleteCache };
