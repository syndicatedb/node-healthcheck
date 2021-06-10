import { Check, StatusEnum } from '../index'

const adapter: Check = () => ({
  componentName: 'app',
  metrics: [
    {
      metricName: 'memoryUsage',
      checkExecutor: () => {
        const used = process.memoryUsage().heapUsed / 1024 / 1024
        return {
          status: StatusEnum.PASS,
          metricUnit: 'MB',
          metricValue: Math.round(used * 100) / 100,
        }
      },
    },
  ],
})

export default adapter
