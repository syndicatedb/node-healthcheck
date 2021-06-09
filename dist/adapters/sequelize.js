"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const adapter = (opts) => ({
    componentName: opts.componentName || 'sequelize',
    metrics: [
        {
            metricName: 'time connection',
            checkExecutor: async () => {
                try {
                    const timeS = new Date();
                    await opts.sequelize.query(`select 1+1 as result`);
                    const timeF = new Date();
                    return {
                        status: index_1.StatusEnum.PASS,
                        metricUnit: 'mc',
                        metricValue: timeF.getTime() - timeS.getTime(),
                    };
                }
                catch (err) {
                    return {
                        status: index_1.StatusEnum.FAIL,
                    };
                }
            },
        },
        {
            metricName: 'count connections',
            checkExecutor: async () => {
                try {
                    const response = await opts.sequelize.query(`select count(*) from pg_stat_activity where state is not null`);
                    const result = response[0][0];
                    return {
                        status: index_1.StatusEnum.PASS,
                        metricUnit: 'connections',
                        metricValue: +result.count,
                    };
                }
                catch (err) {
                    return {
                        status: index_1.StatusEnum.FAIL,
                    };
                }
            },
        },
    ],
});
exports.default = adapter;
//# sourceMappingURL=sequelize.js.map