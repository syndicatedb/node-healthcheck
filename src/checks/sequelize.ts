import { Check, StatusEnum } from '../index'
export interface ISequelize {
  query: (sql: string, opts?: any) => any
  config: { username: string }
}
interface IOpts {
  sequelize: ISequelize
  componentName?: string
}
const adapter: Check<IOpts> = (opts) => ({
  componentName: opts.componentName || 'sequelize',
  metrics: [
    {
      metricName: 'connectionTime',
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
      metricName: 'connectionsCount',
      checkExecutor: async () => {
        try {
          const response = await opts.sequelize.query(
            `select count(*) from pg_stat_activity where state is not null and usename = :username`,
            {
              replacements: {
                username: opts.sequelize.config.username,
              },
            }
          )
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
