export declare enum StatusEnum {
    FAIL = "fail",
    PASS = "pass",
    WARN = "warn"
}
export declare type CheckExecutor = () => CheckExecutorData | Promise<CheckExecutorData>;
declare type CheckExecutorData = {
    componentId?: any;
    componentType?: string;
    metricValue?: any;
    metricUnit?: any;
    status: StatusEnum;
    time?: Date;
    output?: any;
};
export declare type Adapter<T = void> = (opts: T) => AdapterData;
declare type AdapterData = {
    componentName: string;
    metrics: Metric[];
};
declare type Metric = {
    metricName: string;
    checkExecutor: CheckExecutor;
    opts?: Opts;
};
declare type Opts = {
    minCacheMs?: number;
    path?: string;
};
export default class HealthCheck {
    private checks;
    private opts;
    constructor(opts?: Opts);
    /**
     * Figures out what URI path the endpoint should be mapped to, by checking:
     * 1. Explicit opts object, that the checker was initialized with, if any
     * 2. Env variable `NODE_HEALTH_ENDPOINT_PATH`
     * 3. Defaults to "/health"
     */
    getHealthUri(): string;
    /**
     * Middleware handler for Express.js
     */
    express(): (req: any, res: any, next: any) => Promise<any>;
    koa(): (ctx: any, next: any) => Promise<any>;
    http(): (request: any, response: any) => boolean;
    private getHttpCode;
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
    addCheck(componentName: string, metricName: string, checkExecutor: CheckExecutor, opts?: Opts): void;
    addAdapter(adapter: AdapterData): void;
    healthResponse(opts: Opts): Promise<any>;
    /**
     * Get only checks that should execute in current run, taking caching
     * instructions into consideration
     *
     */
    getChecksForCurrentRun(): {
        promises?: Promise<any>[] | undefined;
        keys?: any;
    };
    worstStatus(one: any, two: any): StatusEnum;
    parseDetail(rawDetails: any, prop: any): any;
    pickAllowedValues(obj: any): any;
    isAllowedStatus(status: StatusEnum): boolean;
    /**
     * Get a check object by its key
     * @param {*} key
     * @return may return undefined if a check with this key doesn't exist
     */
    _getCheck(key: any): any;
    /**
     * Add a new check to the internal checks array
     * @param {*} aCheck
     */
    _addCheck(aCheck: any): void;
    /**
     * Set a value of a property on an existing healthcheck
     * @param {*} aCheck
     * @param {*} propName
     * @param {*} propValue
     */
    _setCheckProp(checkKey: any, propName: any, propValue: any): void;
}
export * from './adapters';
