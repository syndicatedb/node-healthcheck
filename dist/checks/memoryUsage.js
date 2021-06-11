"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const adapter = () => ({
    componentName: 'app',
    metrics: [
        {
            metricName: 'memoryUsage',
            checkExecutor: () => {
                const used = process.memoryUsage().heapUsed;
                return {
                    status: index_1.StatusEnum.PASS,
                    metricUnit: 'byte',
                    metricValue: Math.round(used * 100) / 100,
                };
            },
        },
    ],
});
exports.default = adapter;
//# sourceMappingURL=memoryUsage.js.map