import { Repository, Schema } from 'redis-om'
import { redis } from './client.js'

const bankTransactionSchema = new Schema('bankTransaction', {
  id: { type: 'string'},
  fromAccount: { type: 'string'},
  fromAccountName: { type: 'text'},
  toAccount: { type: 'string'},
  toAccountName: { type: 'text'},
  amount: { type: 'number'},
  description: { type: 'text'},
  transactionDate: { type: 'date', sortable:true},
  transactionType: { type: 'string'},
  balanceAfter: { type: 'number'}
})

export const bankTransactionRepository = new Repository(bankTransactionSchema, redis)

await bankTransactionRepository.createIndex()
