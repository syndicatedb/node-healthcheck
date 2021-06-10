"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const adapter = (opts) => ({
    componentName: opts.componentName || 'sequelize',
    metrics: [
        {
            metricName: 'connectionTime',
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
            metricName: 'connectionsCount',
            checkExecutor: async () => {
                try {
                    const response = await opts.sequelize.query(`select count(*) from pg_stat_activity where state is not null and usename = :username`, {
                        replacements: {
                            username: opts.sequelize.config.username,
                        },
                    });
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