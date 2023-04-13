## Installation Instructions


1. Clone the repo:
```bash
git clone https://github.com/redis-developer/banking-on-redis.git
```

2. Enter the repository:
```bash
cd banking-on-redis
```

### Running locally with Docker (recommended)

This application can be run locally with Docker. A redis instance and the Node.js server will run concurrently. `nodemon` is being run for local development.  

1. Start the docker image:
```bash
docker-compose up --build
```

Use Redis-insight by opening a browser window to [localhost:8001](localhost:8001)

The main page can be accessed at [localhost:8080](localhost:8080)

You are able to make changes to the code base while the docker instances is running - the server will automatically relaod.

### Running locally with Docker

This method will have you downloading and installing a version of Redis on your machine.  You will start up Redis then start the Banking-On-Redis application.

[Options for installing Redis](https://redis.io/docs/stack/get-started/install/mac-os/) - make sure Redis Stack Server is installed

Ensure that Redis is running locally.

From a command line, send your Redis Server a `PING` to get a response of liveliness:

```bash
redis-cli PING
> PONG
```

If you have any difficulties please see an instructor.