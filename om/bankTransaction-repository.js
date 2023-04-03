import { Repository, Schema } from 'redis-om'
import { redis } from './client.js'

const bankTransactionSchema = new Schema('bankTransaction', {
  id: { type: 'string'},
  fromAccount: { type: 'string'}, // random IBAN from fromAccountName
  fromAccountName: { type: 'string'}, // random company form transaction_sources.csv
  toAccount: { type: 'string'}, // generate IBAN from username
  toAccountName: { type: 'string'}, // this would be user, or 'bob'
  amount: { type: 'string'}, // createTransactionAmount using username
  description: { type: 'string'}, // random description associated with above company from transaction_sources.csv
  transactionDate: { type: 'string'}, // now
  transactionType: { type: 'string'}, // random type associated with above company from transaction_sources.csv
  balanceAfter: { type: 'number'} // remaining balance
})

export const bankTransactionRepository = new Repository(bankTransactionSchema, redis)

await bankTransactionRepository.createIndex()
