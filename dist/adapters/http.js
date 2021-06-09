"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const axios_1 = __importDefault(require("axios"));
const MAX_TIMEOUT = 4000;
const adapter = (opts) => ({
    componentName: opts.componentName || 'externalApi',
    metrics: [
        {
            metricName: 'check',
            checkExecutor: async () => {
                try {
                    const timeS = new Date();
                    await axios_1.default({
                        method: opts.method,
                        url: opts.url,
                        params: opts.params,
                        data: opts.body,
                    });
                    const timeF = new Date();
                    const timeout = timeF.getTime() - timeS.getTime();
                    if (timeout > MAX_TIMEOUT) {
                        return {
                            status: index_1.StatusEnum.WARN,
                            time: new Date(),
                            metricUnit: 'mc',
                            metricValue: timeout,
                        };
                    }
                    return {
                        status: index_1.StatusEnum.PASS,
                        time: new Date(),
                        metricUnit: 'mc',
                        metricValue: timeout,
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
//# sourceMappingURL=http.js.map