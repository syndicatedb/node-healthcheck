import { Adapter, StatusEnum } from '../index'

const adapter: Adapter = () => ({
  componentName: 'app',
  metrics: [
    {
      metricName: 'memory usage',
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
