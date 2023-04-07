export const config = {
    expressPort: process.env.SERVER_PORT ?? 8080,
    redisHost: process.env.REDIS_HOST ?? '127.0.0.1',
    redisPort: process.env.REDIS_PORT ?? 6379,
    redisUsername: process.env.REDIS_USERNAME || 'bob',
    redisPassword: process.env.REDIS_PASSWORD || 'foobared'
}