import { Adapter, StatusEnum } from '../index'

const adapter: Adapter = () => ({
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

export default adapter
