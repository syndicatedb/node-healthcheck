"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusEnum = void 0;
var StatusEnum;
(function (StatusEnum) {
    StatusEnum["FAIL"] = "fail";
    StatusEnum["PASS"] = "pass";
    StatusEnum["WARN"] = "warn";
})(StatusEnum = exports.StatusEnum || (exports.StatusEnum = {}));
const DEFAULT_ENDPOINT = '/.well-known/health';
class HealthCheck {
    constructor(opts) {
        this.checks = [];
        this.opts = opts || {};
    }
    /**
     * Figures out what URI path the endpoint should be mapped to, by checking:
     * 1. Explicit opts object, that the checker was initialized with, if any
     * 2. Env variable `NODE_HEALTH_ENDPOINT_PATH`
     * 3. Defaults to "/health"
     */
    getHealthUri() {
        return this.opts.path || process.env.NODE_HEALTH_ENDPOINT_PATH || DEFAULT_ENDPOINT;
    }
    /**
     * Middleware handler for Express.js
     */
    express() {
        return async (req, res, next) => {
            const requestPath = req.originalUrl;
            if (requestPath !== this.getHealthUri())
                return next();
            if (!this.checkToken(req.headers.authorization)) {
                res.status(401);
                return res.send('not authorized');
            }
            const response = await this.healthResponse(this.opts);
            res.set('Content-Type', 'application/health+json; charset=utf-8');
            return res.status(this.getHttpCode(response.status)).send(response);
        };
    }
    koa() {
        return async (ctx, next) => {
            const requestPath = ctx.request.originalUrl;
            if (requestPath !== this.getHealthUri())
                return next();
            if (!this.checkToken(ctx.headers.authorization)) {
                ctx.status = 401;
                return (ctx.body = 'not authorized');
            }
            const response = await this.healthResponse(this.opts);
            ctx.response.status = this.getHttpCode(response.status);
            ctx.body = response;
            // Make sure this comes after ctx.body : https://github.com/koajs/koa/issues/1120
            ctx.set('Content-Type', 'application/health+json; charset=utf-8');
        };
    }
    http() {
        return (request, response) => {
            const requestPath = request.url;
            if (requestPath !== this.getHealthUri())
                return false;
            (async () => {
                const responseContent = await this.healthResponse(this.opts);
                response.writeHead(this.getHttpCode(response.status), {
                    'Content-Type': 'application/health+json; charset=utf-8',
                });
                response.end(JSON.stringify(responseContent));
            })();
            return true;
        };
    }
    checkToken(token) {
        const envToken = process.env.HEALTH_CHECK_TOKEN;
        if (envToken) {
            if (`Bearer ${envToken}` !== token) {
                return false;
            }
        }
        return true;
    }
    getHttpCode(status) {
        if (status === StatusEnum.PASS) {
            return 200;
        }
        else if (status === StatusEnum.WARN) {
            return 300;
        }
        return 400;
    }
    /**
     * Add a new health checking routine - for a metric, on a component
     *
     * @param {string} componentName - name of the component whose health is being
     * reported
     * @param {string} metricName - name of the metric on a component the value of
     * which is being reported
     * @param {AsyncFunction} checkExecutor - a function to call in an async
     * context to return a promise of values.
     * @param {object} opts - configuration options from the following list:
     *    - minCacheMs {integer}: min cache duration in milliseconds.
     */
    add(componentName, metricName, checkExecutor, opts = {}) {
        const key = `${componentName}:${metricName}`;
        const newCheck = {};
        newCheck.key = key;
        // checkExecutor can be an async function returning promise of values
        if (typeof checkExecutor === 'function') {
            newCheck.executor = checkExecutor;
        }
        else {
            throw new Error(`Callback for ${key} must be a function`);
        }
        newCheck.minCacheMs = opts.minCacheMs || 0;
        this._addCheck(newCheck);
    }
    addCheck(check) {
        check.metrics.forEach((metric) => {
            this.add(check.componentName, metric.metricName, metric.checkExecutor, metric.opts);
        });
    }
    async healthResponse(opts) {
        const response = {};
        let overallStatus = StatusEnum.PASS;
        response.description = process.env.npm_package_description || undefined;
        response.version = process.env.npm_package_version;
        const currRun = this.getChecksForCurrentRun();
        const results = await Promise.all(currRun.promises);
        const currResponses = {};
        for (let idx = 0; idx < results.length; idx++) {
            const nowTs = Date.now();
            const ts = new Date(nowTs).toISOString();
            const result = results[idx];
            if (!result.time)
                result.time = ts;
            //result.time = ts;
            const key = currRun.keys[idx];
            currResponses[key] = result;
            // refresh cache
            this._setCheckProp(key, 'lastRun', nowTs);
            this._setCheckProp(key, 'cachedValue', result);
        }
        response.checks = {};
        this.checks.map((check) => {
            const savedCheck = this._getCheck(check.key);
            const value = savedCheck.cachedValue;
            try {
                response.checks[check.key] = [this.parseDetail(value, check.key)];
            }
            catch (err) {
                response.checks[check.key] = [
                    {
                        status: StatusEnum.FAIL,
                        output: err.message,
                    },
                ];
            }
            overallStatus = this.worstStatus(overallStatus, response.checks[check.key][0].status);
        });
        if (Object.keys(response.checks).length === 0) {
            // see: https://github.com/inadarei/maikai/issues/11
            delete response.checks;
        }
        response.status = overallStatus;
        return response;
    }
    /**
     * Get only checks that should execute in current run, taking caching
     * instructions into consideration
     *
     */
    getChecksForCurrentRun() {
        const resp = {};
        const currRun = this.checks.filter((check) => {
            const lastRun = check.lastRun || -1;
            const isLastLookupStale = Date.now() - lastRun > check.minCacheMs;
            return isLastLookupStale;
        });
        // Executor function needs to return a Promise
        // Following map gives a list of promises. If the check returned a promise,
        // then that will be the result, and if it did not, the async will wrap the
        // result in a promise.
        resp.promises = currRun.map(async (check) => check.executor());
        resp.keys = currRun.map((check) => check.key);
        return resp;
    }
    worstStatus(one, two) {
        let result = StatusEnum.PASS;
        if (one === StatusEnum.WARN || two === StatusEnum.WARN)
            result = StatusEnum.WARN;
        if (one === StatusEnum.FAIL || two === StatusEnum.FAIL)
            result = StatusEnum.FAIL;
        return result;
    }
    parseDetail(rawDetails, prop) {
        const sanitized = this.pickAllowedValues(rawDetails, prop);
        if (!sanitized.status) {
            throw new Error(`Status for ${prop} may not be missing`);
        }
        if (!this.isAllowedStatus(sanitized.status)) {
            throw new Error(`${prop} checker returned unknown status: ${sanitized.status}`);
        }
        return sanitized;
    }
    pickAllowedValues(obj, name) {
        const allowedValues = ['componentId', 'componentType', 'metricValue', 'metricUnit', 'status', 'time', 'output'];
        const newObj = {};
        for (const prop of Object.keys(obj)) {
            if (obj.hasOwnProperty(prop) && allowedValues.includes(prop)) {
                newObj[prop] = obj[prop];
            }
        }
        newObj.name = name;
        return newObj;
    }
    isAllowedStatus(status) {
        return Object.values(StatusEnum).includes(status);
    }
    /**
     * Get a check object by its key
     * @param {*} key
     * @return may return undefined if a check with this key doesn't exist
     */
    _getCheck(key) {
        const found = this.checks.find((el) => el.key === key);
        return found;
    }
    /**
     * Add a new check to the internal checks array
     * @param {*} aCheck
     */
    _addCheck(aCheck) {
        if (!aCheck.key) {
            throw new Error('Cannot add a check with an empty key');
        }
        const foundIndex = this.checks.findIndex((el) => el.key === aCheck.key);
        if (foundIndex !== -1) {
            throw new Error('Calling identical addCheck() multiple times is not allowed');
        }
        this.checks.push(aCheck);
    }
    /**
     * Set a value of a property on an existing healthcheck
     * @param {*} aCheck
     * @param {*} propName
     * @param {*} propValue
     */
    _setCheckProp(checkKey, propName, propValue) {
        const foundIndex = this.checks.findIndex((el) => el.key === checkKey);
        if (foundIndex === -1) {
            throw new Error(`Cannot set a value on a check with a nonexistent key ${checkKey}`);
        }
        this.checks[foundIndex][propName] = propValue;
    }
}
exports.default = HealthCheck;
__exportStar(require("./checks"), exports);
//# sourceMappingURL=index.js.map