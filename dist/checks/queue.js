"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const adapter = (opts) => ({
    componentName: opts.componentName || 'queue',
    metrics: [
        {
            metricName: 'check',
            checkExecutor: async () => {
                try {
                    if (opts.exchangeName) {
                        if (opts.queue.checkExchange)
                            await opts.queue.checkExchange(opts.exchangeName);
                    }
                    const queue = await opts.queue.checkQueue(opts.queueName);
                    if (queue.consumerCount === 0) {
                        return {
                            status: index_1.StatusEnum.FAIL,
                            metricUnit: 'consumers',
                            metricValue: queue.consumerCount,
                        };
                    }
                    return {
                        status: index_1.StatusEnum.PASS,
                        metricUnit: 'consumers',
                        metricValue: queue.consumerCount,
                    };
                }
                catch (e) {
                    return {
                        status: index_1.StatusEnum.FAIL,
                    };
                }
            },
        },
    ],
});
exports.default = adapter;
//# sourceMappingURL=queue.js.map