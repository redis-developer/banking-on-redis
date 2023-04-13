# Using Streams #

What's an event stream.

## Addings Events to a Stream ##

127.0.0.1:6379> XADD incoming:transactions * to 5558675309 from 2015551212 amount 12.34
"1681332388416-0"
127.0.0.1:6379> XADD incoming:transactions * to 2015551212 from 5558675309 amount 100.99
"1681332426711-0"

## Reading Events ##

127.0.0.1:6379> XREAD STREAMS incoming:transactions 0-0
1) 1) "incoming:transactions"
   2) 1) 1) "1681332388416-0"
         2) 1) "to"
            2) "5558675309"
            3) "from"
            4) "2015551212"
            5) "amount"
            6) "12.34"
      2) 1) "1681332426711-0"
         2) 1) "to"
            2) "2015551212"
            3) "from"
            4) "5558675309"
            5) "amount"
            6) "100.99"

Read from the last one.

127.0.0.1:6379> XREAD STREAMS incoming:transactions 1681332426711-0
(nil)

Not it only returns things *after* the id.

Read from the first one

127.0.0.1:6379> XREAD STREAMS incoming:transactions 1681332388416-0
1) 1) "incoming:transactions"
   2) 1) 1) "1681332426711-0"
         2) 1) "to"
            2) "2015551212"
            3) "from"
            4) "5558675309"
            5) "amount"
            6) "100.99"


You can specify how many items you want back. You'll get at most that many.

127.0.0.1:6379> XREAD COUNT 1 STREAMS incoming:transactions 0-0
1) 1) "incoming:transactions"
   2) 1) 1) "1681332388416-0"
         2) 1) "to"
            2) "5558675309"
            3) "from"
            4) "2015551212"
            5) "amount"
            6) "12.34"


127.0.0.1:6379> XREAD COUNT 10 STREAMS incoming:transactions 0-0
1) 1) "incoming:transactions"
   2) 1) 1) "1681332388416-0"
         2) 1) "to"
            2) "5558675309"
            3) "from"
            4) "2015551212"
            5) "amount"
            6) "12.34"
      2) 1) "1681332426711-0"
         2) 1) "to"
            2) "2015551212"
            3) "from"
            4) "5558675309"
            5) "amount"
            6) "100.99"


### Reading from Multiple Streams

- reading from multiple streams
- reading the same stream more than once

## Waiting for Events

- XREAD BLOCK, do it from the CLI, not the workbench

Do a few more. Make up whatever data you want. Add some fields. Be creative!

XADD foo * a b c d e f



## Removing Events

XDEL foo 12345-1

XTRIM MAXLIN 10
XTRIM MINID

## Other Useful Commands ##

### XRANGE
XRANGE 0-0 12345-0
XRANGE foo - +

XLEN foo