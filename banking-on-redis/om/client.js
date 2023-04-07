import { createClient } from 'redis'

import { config } from '../config.js'
console.log(config)
export const redis = createClient({
  socket: {
    host: config.redisHost,
    port: config.redisPort
  },
  username: config.redisUsername,
  password: config.redisPassword
})

export const redis2 = redis.duplicate()

redis.on('error', error => console.log('Redis Client Error', error))

await redis.connect()
await redis2.connect()