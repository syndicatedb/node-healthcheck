## START

```js
import HealthCheck from 'node-healthcheck'
const healthCheck = new HealthCheck()
```

## addCustomCheck

```js
healthCheck.addCheck({
  componentName: 'app',
  metrics: [
    {
      metricName: 'upTime',
      checkExecutor: () => {
        return {
          status: StatusEnum.PASS,
          metricUnit: 's',
          metricValue: process.uptime(),
        }
      },
    },
  ],
})
```

## addCheck

```js
import { upTime, memoryUsage } from 'node-healthcheck'

healthCheck.addCheck(upTime())
healthCheck.addCheck(memoryUsage())
```
## checks

```js
healthCheck.addCheck(memoryUsage())

healthCheck.addCheck(upTime())

healthCheck.addCheck(
  http({
    url: URL,
    method: 'get',
  })
)

healthCheck.addCheck(queue({ instanse, exchangeName: EX_NAME, queueName: QUEUE_NAME }))

healthCheck.addCheck(rabbitMQ({ url: URL! }))

healthCheck.addCheck(sequelize({ instanse }))

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
