import { Check, StatusEnum } from '../index'

const adapter: Check = () => ({
  componentName: 'app',
  metrics: [
    {
      metricName: 'memoryUsage',
      checkExecutor: () => {
        const used = process.memoryUsage().heapUsed
        return {
          status: StatusEnum.PASS,
          metricUnit: 'b',
          metricValue: Math.round(used * 100) / 100,
        }
      },
    },
  ],
})

export default adapter
