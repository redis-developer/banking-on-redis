import { Router } from 'express'
import { redis } from '../om/client.js'
import { bankTransactionRepository } from '../om/bankTransaction-repository.js'

export const transactionRouter = Router()

const TRANSACTION_RATE_MS = 10000
const TRANSACTIONS_STREAM = "transactions"
const BALANCE_TS = 'balance_ts';
const SORTED_SET_KEY = 'bigspenders';
let balance = 100000.00;

transactionRouter.get('/balance', async (req, res) => {
  const balance = await redis.ts.range(
    BALANCE_TS,
    Date.now() - (1000 * 60 * 60 * 24 * 7),
    Date.now())

  let balancePayload = balance.map((entry) => {
    return {
      'x': entry.timestamp,
      'y': entry.value
    }
  })
  console.log('/balance called')
  res.send(balancePayload)
})

transactionRouter.get('/biggestspenders', async (req, res) => {
  const range = await redis.zRangeByScoreWithScores(SORTED_SET_KEY, 0, Infinity)
  let series = []
  let labels = []
  
  range.forEach((spender) => {
    series.push(parseFloat(spender.score.toFixed(2)))
    labels.push(spender.value)
  })
  
  res.send({series, labels})
  
})


transactionRouter.get('/search', async (req, res) => {
  res.send({'term': req.query.term})
})


transactionRouter.get('/transactions', async (req, res) => {
  const transactions = await bankTransactionRepository.search().return.all()
  res.send(transactions)
})
