import { Router } from 'express'
import { redis } from '../om/client.js'
import { bankTransactionRepository as bankRepo  } from '../om/bankTransaction-repository.js'

export const transactionRouter = Router()

const TRANSACTION_RATE_MS = 10000
const TRANSACTIONS_STREAM = "transactions"
const BALANCE_TS = 'balance_ts';
const SORTED_SET_KEY = 'bigspenders';
let balance = 100000.00;

/* fetch all transactions up to an hour ago */
transactionRouter.get('/balance', async (req, res) => {
  const balance = await redis.ts.range(
    BALANCE_TS,
    Date.now() - (1000 * 60 * 5),
    Date.now())

  let balancePayload = balance.map((entry) => {
    return {
      'x': entry.timestamp,
      'y': entry.value
    }
  })
  res.send(balancePayload)
})

/* fetch top 5 biggest spenders */
transactionRouter.get('/biggestspenders', async (req, res) => {
  const range = await redis.zRangeByScoreWithScores(SORTED_SET_KEY, 0, Infinity)
  let series = []
  let labels = []
  
  range
    .slice(0,5)
    .forEach((spender) => {
    series.push(parseFloat(spender.score.toFixed(2)))
    labels.push(spender.value)
  })
  
  res.send({series, labels})
  
})


transactionRouter.get('/search', async (req, res) => {
  const term = req.query.term

  let results

  if(term.length>=3){
    results = await bankRepo.search()
      .where('description').matches(term)
      .or('fromAccountName').matches(term)
      .or('transactionType').equals(term)
      .return.all({ pageSize: 1000})
  }
  res.send(results)
})

/* return ten most recent transactions */
transactionRouter.get('/transactions', async (req, res) => {
  const transactions = await bankRepo.search()
    .sortBy('transactionDate', 'DESC')
    .return.all({ pageSize: 10})
  res.send(transactions.slice(0, 10))
})
