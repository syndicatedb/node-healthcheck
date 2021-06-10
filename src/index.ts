export enum StatusEnum {
  FAIL = 'fail',
  PASS = 'pass',
  WARN = 'warn',
}

const DEFAULT_ENDPOINT = '/.well-known/health'

export type CheckExecutor = () => CheckExecutorData | Promise<CheckExecutorData>
type CheckExecutorData = {
  componentId?: any
  componentType?: string
  metricValue?: any
  metricUnit?: any
  status: StatusEnum
  time?: Date
  output?: any
}
export type Check<T = void> = (opts: T) => CheckData

type CheckData = {
  componentName: string
  metrics: Metric[]
}
type Metric = {
  metricName: string
  checkExecutor: CheckExecutor
  opts?: Opts
}
type Opts = { minCacheMs?: number; path?: string }

export default class HealthCheck {
  private checks: any[] = []
  private opts: Opts
  constructor(opts?: Opts) {
    this.opts = opts || {}
  }

  /**
   * Figures out what URI path the endpoint should be mapped to, by checking:
   * 1. Explicit opts object, that the checker was initialized with, if any
   * 2. Env variable `NODE_HEALTH_ENDPOINT_PATH`
   * 3. Defaults to "/health"
   */
  private getHealthUri() {
    return this.opts.path || process.env.NODE_HEALTH_ENDPOINT_PATH || DEFAULT_ENDPOINT
  }
  /**
   * Middleware handler for Express.js
   */
  public express() {
    return async (req: any, res: any, next: any) => {
      const requestPath = req.originalUrl

      if (requestPath !== this.getHealthUri()) return next()
      if (!this.checkToken(req.headers.authorization)) {
        res.status(401)
        return res.send('not authorized')
      }
      const response = await this.healthResponse(this.opts)

      res.set('Content-Type', 'application/health+json; charset=utf-8')
      return res.status(this.getHttpCode(response.status)).send(response)
    }
  }

  public koa() {
    return async (ctx: any, next: any) => {
      const requestPath = ctx.request.originalUrl

      if (requestPath !== this.getHealthUri()) return next()
      if (!this.checkToken(ctx.headers.authorization)) {
        ctx.status = 401

        return (ctx.body = 'not authorized')
      }

      const response = await this.healthResponse(this.opts)
      ctx.response.status = this.getHttpCode(response.status)
      ctx.body = response
      // Make sure this comes after ctx.body : https://github.com/koajs/koa/issues/1120
      ctx.set('Content-Type', 'application/health+json; charset=utf-8')
    }
  }

  public http() {
    return (request: any, response: any) => {
      const requestPath = request.url
      if (requestPath !== this.getHealthUri()) return false
      ;(async () => {
        const responseContent = await this.healthResponse(this.opts)
        response.writeHead(this.getHttpCode(response.status), {
          'Content-Type': 'application/health+json; charset=utf-8',
        })
        response.end(JSON.stringify(responseContent))
      })()

      return true
    }
  }
  private checkToken(token: string) {
    const envToken = process.env.HEALTH_CHECK_TOKEN
    if (envToken) {
      if (envToken !== token) {
        return false
      }
    }
    return true
  }
  private getHttpCode(status: StatusEnum) {
    if (status === StatusEnum.PASS) {
      return 200
    } else if (status === StatusEnum.WARN) {
      return 300
    }
    return 400
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
  private add(componentName: string, metricName: string, checkExecutor: CheckExecutor, opts: Opts = {}) {
    const key = `${componentName}:${metricName}`
    const newCheck: any = {}
    newCheck.key = key

    // checkExecutor can be an async function returning promise of values
    if (typeof checkExecutor === 'function') {
      newCheck.executor = checkExecutor
    } else {
      throw new Error(`Callback for ${key} must be a function`)
    }
    newCheck.minCacheMs = opts.minCacheMs || 0
    this._addCheck(newCheck)
  }

  public addCheck(check: CheckData) {
    check.metrics.forEach((metric) => {
      this.add(check.componentName, metric.metricName, metric.checkExecutor, metric.opts)
    })
  }

  private async healthResponse(opts: Opts): Promise<any> {
    const response: any = {}
    let overallStatus = StatusEnum.PASS
    response.description = process.env.npm_package_description || undefined
    response.version = process.env.npm_package_version
    const currRun = this.getChecksForCurrentRun()
    const results = await Promise.all(currRun.promises!)
    const currResponses: any = {}
    for (let idx = 0; idx < results.length; idx++) {
      const nowTs = Date.now()
      const ts = new Date(nowTs).toISOString()

      const result = results[idx]
      if (!result.time) result.time = ts
      //result.time = ts;
      const key = currRun.keys[idx]
      currResponses[key] = result
      // refresh cache
      this._setCheckProp(key, 'lastRun', nowTs)
      this._setCheckProp(key, 'cachedValue', result)
    }

    response.checks = {}
    this.checks.map((check) => {
      const savedCheck = this._getCheck(check.key)
      const value = savedCheck.cachedValue

      try {
        response.checks[check.key] = this.parseDetail(value, check.key)
      } catch (err) {
        response.checks[check.key] = {}
        response.checks[check.key].status = StatusEnum.FAIL
        response.checks[check.key].output = err.message
      }
      overallStatus = this.worstStatus(overallStatus, response.checks[check.key].status)
    })

    if (Object.keys(response.checks).length === 0) {
      // see: https://github.com/inadarei/maikai/issues/11
      delete response.checks
    }
    response.status = overallStatus
    return response
  }

  /**
   * Get only checks that should execute in current run, taking caching
   * instructions into consideration
   *
   */
  private getChecksForCurrentRun() {
    const resp: {
      promises?: Promise<any>[]
      keys?: any
    } = {}
    const currRun = this.checks.filter((check) => {
      const lastRun = check.lastRun || -1
      const isLastLookupStale = Date.now() - lastRun > check.minCacheMs
      return isLastLookupStale
    })

    // Executor function needs to return a Promise
    // Following map gives a list of promises. If the check returned a promise,
    // then that will be the result, and if it did not, the async will wrap the
    // result in a promise.
    resp.promises = currRun.map(async (check) => check.executor())
    resp.keys = currRun.map((check) => check.key)

    return resp
  }

  private worstStatus(one: any, two: any) {
    let result = StatusEnum.PASS
    if (one === StatusEnum.WARN || two === StatusEnum.WARN) result = StatusEnum.WARN
    if (one === StatusEnum.FAIL || two === StatusEnum.FAIL) result = StatusEnum.FAIL
    return result
  }

  private parseDetail(rawDetails: any, prop: any) {
    const sanitized = this.pickAllowedValues(rawDetails)
    if (!sanitized.status) {
      throw new Error(`Status for ${prop} may not be missing`)
    }

    if (!this.isAllowedStatus(sanitized.status)) {
      throw new Error(`${prop} checker returned unknown status: ${sanitized.status}`)
    }

    return sanitized
  }

  private pickAllowedValues(obj: any) {
    const allowedValues = ['componentId', 'componentType', 'metricValue', 'metricUnit', 'status', 'time', 'output']

    const newObj: any = {}
    for (const prop of Object.keys(obj)) {
      if (obj.hasOwnProperty(prop) && allowedValues.includes(prop)) {
        newObj[prop] = obj[prop]
      }
    }
    return newObj
  }

  private isAllowedStatus(status: StatusEnum) {
    return Object.values(StatusEnum).includes(status)
  }

  /**
   * Get a check object by its key
   * @param {*} key
   * @return may return undefined if a check with this key doesn't exist
   */
  private _getCheck(key: any) {
    const found = this.checks.find((el) => el.key === key)
    return found
  }

  /**
   * Add a new check to the internal checks array
   * @param {*} aCheck
   */
  private _addCheck(aCheck: any) {
    if (!aCheck.key) {
      throw new Error('Cannot add a check with an empty key')
    }

    const foundIndex = this.checks.findIndex((el) => el.key === aCheck.key)
    if (foundIndex !== -1) {
      throw new Error('Calling identical addCheck() multiple times is not allowed')
    }
    this.checks.push(aCheck)
  }

  /**
   * Set a value of a property on an existing healthcheck
   * @param {*} aCheck
   * @param {*} propName
   * @param {*} propValue
   */
  private _setCheckProp(checkKey: any, propName: any, propValue: any) {
    const foundIndex = this.checks.findIndex((el) => el.key === checkKey)
    if (foundIndex === -1) {
      throw new Error(`Cannot set a value on a check with a nonexistent key ${checkKey}`)
    }

    this.checks[foundIndex][propName] = propValue
  }
}

export * from './checks'
