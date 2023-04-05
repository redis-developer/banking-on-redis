import { Repository, Schema } from 'redis-om'
import { redis } from './client.js'

const bankTransactionSchema = new Schema('bankTransaction', {
  id: { type: 'string'},
  fromAccount: { type: 'string', indexed: false}, // random IBAN from fromAccountName
  fromAccountName: { type: 'text'}, // random company form transaction_sources.csv
  toAccount: { type: 'string', indexed: false}, // generate IBAN from username
  toAccountName: { type: 'string', indexed: false}, // this would be user, or 'bob'
  amount: { type: 'string', indexed: false}, // createTransactionAmount using username
  description: { type: 'text'}, // random description associated with above company from transaction_sources.csv
  transactionDate: { type: 'string', indexed: false}, // now
  transactionType: { type: 'text'}, // random type associated with above company from transaction_sources.csv
  balanceAfter: { type: 'number', indexed: false} // remaining balance
})

export const bankTransactionRepository = new Repository(bankTransactionSchema, redis)

await bankTransactionRepository.createIndex()
