### Challenge 0: Create a BankTransaction JSON document

You'll want to store the randomized bank transaction `bankTransaction` in the Redis bankTransaction repository. 

Replace this line with your work:

```javascript
const bankTransaction = transaction
```

### Challenge 1: Add Redis to the Transactions Generator - Add to stream

You'll want to add the randomly generated transaction object to the `transactions` stream. We want the stream to be automatically capped at approximately 100 entries, so make sure to include the `TRIM` object as an option within the stream add call. 

Replace this line with your work:

```javascript
  const result = ''
```

### Challenge 2: Add Redis to the `/transactions` endpoint

You'll want to query Redis for all transactions. Sort by transactionDate in descending order. Return only the first 10 entries. 

Replace this line with your work:

```javascript
  const transactions = []
```

### Challenge 3: Read from the stream of transactions

You'll want to read the most recent entry in the Redis stream with the key `transactions`. Use the `$` symbol to retrieve the most recent entry within your stream read call. Parse through the results until you have a transaction object literal. You'll want to block for at least 10 seconds in order to capture the most recent entry. This call should be made with the second redis connection `redis2` to prevent locking out any other redis calls.

Replace this line with your work:

```javascript
    const result = [ { name: 'transactions', messages: [ {} ] } ]
```

### Challenge 4: Add Redis to the `/search` endpoint

You'll want to search the bankRepo with a term matching `description`, matching `fromAccountName`, or equal to the `transactionType`. Note that `transactionType` is a different field type than `description` and `fromAccountName`, so it may need to use a different Redis Om search method. This search can chain all three field type methods into one big compounded search. 

Replace this line with your work:

```javascript
    results = [{}]
```

If you have any difficulties please see an instructor.