"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const adapter = () => ({
    componentName: 'app',
    metrics: [
        {
            metricName: 'upTime',
            checkExecutor: () => {
                return {
                    status: index_1.StatusEnum.PASS,
                    metricUnit: 's',
                    metricValue: process.uptime(),
                };
            },
        },
    ],
});
exports.default = adapter;
//# sourceMappingURL=upTime.js.map