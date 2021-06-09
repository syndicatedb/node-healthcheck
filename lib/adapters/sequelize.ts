import { Adapter, StatusEnum } from '../index'
export interface ISequelize {
  query: (sql: string) => any
}
interface IOpts {
  sequelize: ISequelize
  componentName?: string
}
const adapter: Adapter<IOpts> = (opts) => ({
  componentName: opts.componentName||  'sequelize',
  metrics: [
    {
      metricName: 'time connection',
      checkExecutor: async () => {
        try {
          const timeS = new Date()
          await opts.sequelize.query(`select 1+1 as result`)
          const timeF = new Date()

          return {
            status: StatusEnum.PASS,
            metricUnit: 'mc',
            metricValue: timeF.getTime() - timeS.getTime(),
          }
        } catch (err) {
          return {
            status: StatusEnum.FAIL,
          }
        }
      },
    },
    {
      metricName: 'count connections',
      checkExecutor: async () => {
        try {
          const response = await opts.sequelize.query(`select count(*) from pg_stat_activity where state is not null`)
          const result = response[0][0] as any
          return {
            status: StatusEnum.PASS,
            metricUnit: 'connections',
            metricValue: +result.count,
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
