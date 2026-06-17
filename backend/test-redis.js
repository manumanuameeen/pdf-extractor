const Redis = require('ioredis');
require('dotenv').config();

const url = process.env.REDIS_URL;
console.log('Attempting to connect to:', url);

const redis = new Redis(url, {
  maxRetriesPerRequest: 1,
  showFriendlyErrorStack: true
});

redis.on('error', (err) => {
  console.error('REDIS ERROR EVENT:', err);
});

redis.on('connect', () => {
  console.log('SUCCESS: Connected to Redis!');
  process.exit(0);
});

setTimeout(() => {
  console.log('TIMEOUT: Could not connect within 5 seconds');
  process.exit(1);
}, 5000);
