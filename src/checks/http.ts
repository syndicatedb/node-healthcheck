import { Check, StatusEnum } from '../index'
import axios, { Method } from 'axios'

const MAX_TIMEOUT = 4000
interface IOpts {
  url: string
  method: Method
  body?: any
  params?: any
  componentName?: string
}

const adapter: Check<IOpts> = (opts) => ({
  componentName: opts.componentName || 'externalApi',
  metrics: [
    {
      metricName: 'check',
      checkExecutor: async () => {
        try {
          const timeS = new Date()
          await axios({
            method: opts.method,
            url: opts.url,
            params: opts.params,
            data: opts.body,
          })
          const timeF = new Date()
          const timeout = timeF.getTime() - timeS.getTime()
          if (timeout > MAX_TIMEOUT) {
            return {
              status: StatusEnum.WARN,
              time: new Date(),
              metricUnit: 'mc',
              metricValue: timeout,
            }
          }
          return {
            status: StatusEnum.PASS,
            time: new Date(),
            metricUnit: 'mc',
            metricValue: timeout,
          }
        } catch (err) {
          return {
            status: StatusEnum.FAIL,
          }
        }
      },
    },
  ],
})

export default adapter
