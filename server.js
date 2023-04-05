import 'dotenv/config'
import * as cron from 'node-cron'

import express from 'express'
import serveStatic from 'serve-static'

import session from 'express-session'
import { RedisStackStore } from 'connect-redis-stack'
import { createBankTransaction } from './transactions/transactionsGenerator.js'
import { config } from './config.js'
import { redis, redis2 } from './om/client.js'
import { accountRouter } from './routers/account-router.js'
import { transactionRouter } from './routers/transaction-router.js'
import { WebSocketServer } from 'ws';

/* configure your session store */
const store = new RedisStackStore({
  client: redis,
  prefix: 'redisBank:',
  ttlInSeconds: 3600
})

const app = express();

app.use(express.json())
app.use(session({
  store: store,
  resave: false,
  saveUninitialized: false,
  secret: '5UP3r 53Cr37'
}))

// set up a basic web sockect server and a set to hold all the sockets
const wss = new WebSocketServer({ port: 80 })
const sockets = new Set()

// when someone connects, add their socket to the set of all sockets
// and remove them if they disconnect
wss.on('connection', socket => {
  sockets.add(socket)
  socket.on('close', () => sockets.delete(socket))
})

const streamKey = 'transactions'
let currentId = '$'

cron.schedule('*/10 * * * * *', async () => {
  const userName = process.env.REDIS_USERNAME
  
  // TODO: should we place this in the transactionGenerator file with its own cron job and have the xread in a while loop here?
  createBankTransaction(userName)
  const result = await redis2.xRead({ key: streamKey, id: currentId }, { COUNT: 1, BLOCK: 10000 });
  
  // pull the values for the event out of the result
  const [ { messages } ] = result
  const [ { id, message } ] = messages
  const event = { ...message }
  sockets.forEach(socket => socket.send(event.transaction))
  
  // update the current id so we get the next event next time
  currentId = id
});

app.use(serveStatic('static', { index: ['index.html'] }))

/* bring in some routers */
app.use('/account', accountRouter)
app.use('/transaction', transactionRouter)

/* websocket poll response */
app.get('/api/config/ws', (req, res) => {
  res.json({"protocol":"ws","host":"localhost", "port": "80", "endpoint":"/websocket"})
})
/* start the server */
app.listen(config.expressPort, () => console.log("Listening on port", config.expressPort))
