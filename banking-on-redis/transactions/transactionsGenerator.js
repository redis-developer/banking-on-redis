import { redis } from '../om/client.js'
import { bankTransactionRepository } from '../om/bankTransaction-repository.js'
import * as source from './transaction_sources.js'
import { createAmount, getRandom, replacer } from './utilities.js'

const TRANSACTIONS_STREAM = "transactions"
const BALANCE_TS = 'balance_ts';
const SORTED_SET_KEY = 'bigspenders';
let balance = 100000.00;

const streamBankTransaction = async (transaction) => {
  /* convert all numbers to strings */
  const preparedTransaction = JSON.parse(JSON.stringify(transaction, replacer))
  
  await redis.XADD( TRANSACTIONS_STREAM, '*',
  preparedTransaction,
  {
    TRIM: {
      strategy: 'MAXLEN', // Trim by length.
      strategyModifier: '~', // Approximate trimming.
      threshold: 100 // Retain around 1000 entries.
    }
  })
}

const createTransactionAmount = (vendor, random) => {

  let amount = createAmount()
  balance += amount
  balance = parseFloat(balance.toFixed(2))

  redis.ts.add(BALANCE_TS, '*', balance, {'DUPLICATE_POLICY':'first' })
  redis.zIncrBy(SORTED_SET_KEY, (amount * -1), vendor)

  return amount
}

export const createBankTransaction = async (userName) => {
  let vendorsList = source.source
  const random = getRandom()
  const vendor = vendorsList[random % vendorsList.length]
  
  const amount = createTransactionAmount(vendor.fromAccountName, random)
  const transaction = {
    id: random * random,
    fromAccount: Math.floor((random / 2) * 3).toString(),
    fromAccountName: vendor.fromAccountName,
    toAccount: '1580783161', // arbitrary account ID for bob
    toAccountName: userName,
    amount: amount,
    description: vendor.description,
    transactionDate: new Date(),
    transactionType: vendor.type,
    balanceAfter: balance
  }

  const bankTransaction = await bankTransactionRepository.save(transaction)
  streamBankTransaction(bankTransaction)
  console.log('Created bankTransaction')
  return bankTransaction
}



export const getBalanceTS = async () => {
  const balanceTS = await redis.ts.range(
    BALANCE_TS,
    Date.now() - (1000 * 60 * 60 * 24 * 7),
    Date.now())
    console.log(balanceTS)
    return balanceTS
}

export const getBigSpenders = async () => {
  const range = await redis.zRangeByScoreWithScores(SORTED_SET_KEY, 0, Infinity)
  return range
}

export const getTransactions = async () => {
  const transactions = await bankTransactionRepository.search().return.all()
  return transactions
}