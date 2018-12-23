# Redis Storage for Dashboard

Install this module to use [Redis](https://redis.io) for data storage.

You will need to launch with additional configuration variables:

  STORAGE_ENGINE=@userappstore/storage-redis
  REDIS_URL=redis://localhost:6379

To test this module use [Dashboard](https://github.com/userappstore/dashboard)'s test suite configured with this storage engine.
