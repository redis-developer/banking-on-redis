import { createClient } from 'redis'

import { config } from '../config.js'

export const redis = createClient({
  socket: {
    host: config.redisHost,
    port: config.redisPort
  },
  username: config.redisUsername,
  password: config.redisPassword
})

redis.on('error', error => console.log('Redis Client Error', error))

await redis.connect()
