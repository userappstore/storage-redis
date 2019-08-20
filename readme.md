# Redis Storage for Dashboard

Install this module to use [Redis](https://redis.io) for data storage.

You will need to launch with additional configuration variables:

  STORAGE_ENGINE=@userdashboard/storage-redis
  REDIS_URL=redis://localhost:6379

To test this module use [Dashboard](https://github.com/userdashboard/dashboard)'s test suite configured with this storage engine.

# Dashboard

Dashboard is a NodeJS project that provides a reusable account management system for web applications. 

Dashboard proxies your application server to create a single website where pages like signing in or changing your password are provided by Dashboard.  Your application server can be anything you want, and use Dashboard's API to access data as required.

Using modules you can expand Dashboard to include organizations, subscriptions powered by Stripe, or a Stripe Connect platform.

- [Developer documentation home](https://userdashboard.github.io/home)
- [Administrator documentation home](https://userdashboard.github.io/administrators/home)
- [User documentation home](https://userdashboard.github.io/users/home)

#### Development

Development takes place on [Github](https://github.com/userdashboard/storage-redis) with releases on [NPM](https://www.npmjs.com/package/@userdashboard/storage-redis).

#### License

This software is distributed under the MIT license.