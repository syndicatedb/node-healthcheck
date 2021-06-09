## START

```js
import HealthCheck from 'node-healthcheck'
const healthCheck = new HealthCheck()
```

## addCheck

```js
healthCheck.addCheck('q', 'ww', () => {
  return {
    status: StatusEnum.PASS,
  }
})
```

## addAdapter

```js
import { upTimeAdapter, memoryUsageAdapter } from 'node-healthcheck'

healthCheck.addAdapter(upTimeAdapter())
healthCheck.addAdapter(memoryUsageAdapter())
```

## koa

```js
import Koa from 'koa'

const server = new Koa()

const listenServer = server.use(healthCheck.koa()).listen(3000)
```

## express

```js
import express from 'express'
const server = express()
server.use(healthCheck.express())
server.listen(3000)
```

## default endpoint

```
/.well-known/health
```

## .env

```
# url
NODE_HEALTH_ENDPOINT_PATH=/.health

# auth token
HEALTH_CHECK_TOKEN=aufhhjksjdghwoaihjgkjfsdg

```

## auth 
Если есть HEALTH_CHECK_TOKEN то едпоинт требует авторизации

```
header authorization

```
