var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
class Fetch {
  constructor() {
    this.interceptors = {
      request: [],
      response: []
    };
    this.mockData = /* @__PURE__ */ new Map();
    this.activeRequests = /* @__PURE__ */ new Map();
    this.defaultTimeout = 1e4;
    this.maxRetries = 3;
    this.retryDelay = 1e3;
    this.debug = false;
    this.randomGenerators = {
      string: (length = 8) => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < length; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      },
      number: (min = 0, max = 100) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      },
      boolean: () => {
        return Math.random() >= 0.5;
      },
      date: (start = new Date(2020, 0, 1), end = /* @__PURE__ */ new Date()) => {
        return new Date(
          start.getTime() + Math.random() * (end.getTime() - start.getTime())
        );
      },
      array: (length = 5, generator) => {
        return Array.from({ length }, () => generator());
      },
      object: (schema) => {
        const result = {};
        for (const key in schema) {
          result[key] = this._generateRandomData(schema[key]);
        }
        return result;
      }
    };
  }
  // 生成随机数据，跳过指定字段
  _generateRandomData(schema, skipFields = []) {
    if (typeof schema === "function") {
      return schema();
    } else if (typeof schema === "object" && !Array.isArray(schema)) {
      const result = {};
      for (const key in schema) {
        if (skipFields.includes(key)) {
          result[key] = schema[key];
          continue;
        }
        result[key] = this._generateRandomData(schema[key], skipFields);
      }
      return result;
    } else if (Array.isArray(schema)) {
      const [length, generator] = schema;
      if (typeof length === "string" && typeof generator === "function") {
        const re = generator();
        return typeof re === "number" ? re : this._generateRandomData(generator, skipFields);
      }
      return Array.from(
        { length },
        () => this._generateRandomData(generator || "number", skipFields)
      );
    } else if (this.randomGenerators[schema]) {
      return this.randomGenerators[schema]();
    } else {
      return this.randomGenerators.string();
    }
  }
  // 注册模拟数据
  mock(url, method, response, count, skipFields = []) {
    if (Array.isArray(count)) {
      skipFields = count;
      count = 1;
    } else if (typeof response === "function") {
      count = 1;
      skipFields = [];
    }
    this.mockData.set(`${method.toUpperCase()} ${url}`, {
      response,
      count,
      skipFields
    });
  }
  // 添加请求拦截器
  addRequestInterceptor(fulfilled, rejected) {
    this.interceptors.request.push({ fulfilled, rejected });
  }
  // 添加响应拦截器
  addResponseInterceptor(fulfilled, rejected) {
    this.interceptors.response.push({ fulfilled, rejected });
  }
  // 设置默认超时时间
  setDefaultTimeout(timeout) {
    if (typeof timeout !== "number" || timeout <= 0) {
      console.error("[Fetch] Invalid timeout value");
      return;
    }
    this.defaultTimeout = timeout;
  }
  // 设置最大重试次数
  setMaxRetries(retries) {
    if (typeof retries !== "number" || retries < 0) {
      console.error("[Fetch] Invalid retries value");
      return;
    }
    this.maxRetries = retries;
  }
  // 设置重试延迟
  setRetryDelay(delay) {
    if (typeof delay !== "number" || delay <= 0) {
      console.error("[Fetch] Invalid retry delay value");
      return;
    }
    this.retryDelay = delay;
  }
  // 启用/禁用调试模式
  setDebug(enabled) {
    this.debug = enabled;
  }
  // 取消指定请求
  cancel(requestId) {
    if (this.activeRequests.has(requestId)) {
      const { xhr, timeoutId } = this.activeRequests.get(requestId);
      xhr.abort();
      clearTimeout(timeoutId);
      this.activeRequests.delete(requestId);
      if (this.debug) {
        console.log(`[Fetch] Request cancelled: ${requestId}`);
      }
    }
  }
  // 取消所有活动请求
  cancelAll() {
    this.activeRequests.forEach(({ xhr, timeoutId }, requestId) => {
      xhr.abort();
      clearTimeout(timeoutId);
      if (this.debug) {
        console.log(`[Fetch] Request cancelled: ${requestId}`);
      }
    });
    this.activeRequests.clear();
  }
  // 生成唯一请求ID
  _generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  // 延迟函数
  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  // 执行请求拦截器
  _runRequestInterceptors(config) {
    return this.interceptors.request.reduce((promise, interceptor) => {
      return promise.then(interceptor.fulfilled, interceptor.rejected);
    }, Promise.resolve(config));
  }
  // 执行响应拦截器
  _runResponseInterceptors(response) {
    return this.interceptors.response.reduce((promise, interceptor) => {
      return promise.then(interceptor.fulfilled, interceptor.rejected);
    }, Promise.resolve(response));
  }
  // 发送请求
  request(config) {
    const requestId = this._generateRequestId();
    const timeout = config.timeout || this.defaultTimeout;
    const maxRetries = config.maxRetries !== void 0 ? config.maxRetries : this.maxRetries;
    const retryDelay = config.retryDelay !== void 0 ? config.retryDelay : this.retryDelay;
    if (this.debug) {
      console.log(`[Fetch] Starting request: ${requestId}`, config);
    }
    const attemptRequest = (attempt = 0) => {
      return this._runRequestInterceptors(config).then((config2) => {
        const mockKey = `${config2.method.toUpperCase()} ${config2.url}`;
        if (this.mockData.has(mockKey)) {
          const { response, count, skipFields } = this.mockData.get(mockKey);
          const data = Array.from(
            { length: count },
            () => this._generateRandomData(response, skipFields)
          );
          return Promise.resolve({
            data: count === 1 ? data[0] : data,
            status: 200,
            statusText: "OK",
            config: config2,
            requestId
          });
        }
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open(config2.method || "GET", config2.url, true);
          if (config2.headers) {
            Object.keys(config2.headers).forEach((key) => {
              xhr.setRequestHeader(key, config2.headers[key]);
            });
          }
          const timeoutId = setTimeout(() => {
            xhr.abort();
            this.activeRequests.delete(requestId);
            reject(new Error(`Request timeout after ${timeout}ms`));
          }, timeout);
          this.activeRequests.set(requestId, { xhr, timeoutId });
          xhr.onload = () => {
            clearTimeout(timeoutId);
            this.activeRequests.delete(requestId);
            const response = {
              data: xhr.response,
              status: xhr.status,
              statusText: xhr.statusText,
              headers: xhr.getAllResponseHeaders(),
              config: config2,
              request: xhr,
              requestId
            };
            if (xhr.status >= 200 && xhr.status < 300) {
              this._runResponseInterceptors(response).then(resolve, reject);
            } else {
              const error = new Error(`Request failed with status ${xhr.status}`);
              error.response = response;
              reject(error);
            }
          };
          xhr.onerror = () => {
            clearTimeout(timeoutId);
            this.activeRequests.delete(requestId);
            reject(new Error("Network Error"));
          };
          xhr.ontimeout = () => {
            clearTimeout(timeoutId);
            this.activeRequests.delete(requestId);
            reject(new Error(`Request timeout after ${timeout}ms`));
          };
          xhr.timeout = timeout;
          try {
            xhr.send(config2.data);
          } catch (error) {
            clearTimeout(timeoutId);
            this.activeRequests.delete(requestId);
            reject(error);
          }
        });
      }).catch(async (error) => {
        if (attempt < maxRetries && this._shouldRetry(error)) {
          if (this.debug) {
            console.log(`[Fetch] Retrying request: ${requestId}, attempt ${attempt + 1}/${maxRetries}`);
          }
          await this._delay(retryDelay * (attempt + 1));
          return attemptRequest(attempt + 1);
        }
        throw error;
      });
    };
    return attemptRequest();
  }
  // 判断是否应该重试
  _shouldRetry(error) {
    if (error.message.includes("timeout") || error.message.includes("Network Error")) {
      return true;
    }
    if (error.response && error.response.status >= 500) {
      return true;
    }
    return false;
  }
}
__publicField(Fetch, "version", "1.1.0");
const xFetch = {
  install(app) {
    app.Fetch = Fetch;
  }
};
$ && $.use(xFetch);
export {
  Fetch,
  xFetch as default
};
//# sourceMappingURL=xrender-fetch-1.0.0.es.js.map
