import { Check, StatusEnum } from '../index'

export interface IQueue {
  checkExchange?: (exchange: string) => Promise<any>
  checkQueue: (queue: string) => Promise<any>
}
interface IOpts {
  queue: IQueue
  queueName: string
  exchangeName?: string
  componentName?: string
}
const adapter: Check<IOpts> = (opts) => ({
  componentName: opts.componentName || 'queue',
  metrics: [
    {
      metricName: 'check',
      checkExecutor: async () => {
        try {
          if (opts.exchangeName) {
            if (opts.queue.checkExchange) await opts.queue.checkExchange(opts.exchangeName)
          }
          const queue = await opts.queue.checkQueue(opts.queueName)
          if (queue.consumerCount === 0) {
            return {
              status: StatusEnum.FAIL,
              metricUnit: 'consumers',
              metricValue: queue.consumerCount,
            }
          }
          return {
            status: StatusEnum.PASS,
            metricUnit: 'consumers',
            metricValue: queue.consumerCount,
          }
        } catch (e) {
          return {
            status: StatusEnum.FAIL,
          }
        }
      },
    },
  ],
})

export default adapter
