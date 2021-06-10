import { Check, StatusEnum } from '../index'
import * as amqp from 'amqplib'
interface IOpts {
  url: string,
  componentName?:string
}
const adapter: Check<IOpts> = (opts) => ({
  componentName: opts.componentName || 'rabbitMQ',
  metrics: [
    {
      metricName: 'check',
      checkExecutor: async () => {
        try {
          await amqp.connect(opts.url, { timeout: 5000 })
          return {
            status: StatusEnum.PASS,
          }
        } catch (err) {
          return {
            status: StatusEnum.FAIL,
          }
        }
      },
      opts: {
        minCacheMs: 5000,
      },
    },
  ],
})

export default adapter
