// 错误边界和异常处理器 - 优雅地处理组件错误
export class ErrorBoundaryManager {
  constructor(options = {}) {
    this.boundaries = new Map(); // 错误边界映射
    this.errorHandlers = new Map(); // 错误处理器
    this.fallbackComponents = new Map(); // 回退组件
    this.errorLog = []; // 错误日志
    this.options = {
      enableErrorBoundary: options.enableErrorBoundary !== false,
      enableErrorLogging: options.enableErrorLogging !== false,
      enableErrorRecovery: options.enableErrorRecovery !== false,
      maxErrorLogSize: options.maxErrorLogSize || 100,
      errorReportingEndpoint: options.errorReportingEndpoint || null,
      ...options
    };
    this.globalErrorHandlers = [];
  }

  // 创建错误边界
  createErrorBoundary(name, config = {}) {
    const boundaryConfig = {
      name,
      fallback: config.fallback || this._createDefaultFallback(),
      onError: config.onError || this._handleBoundaryError.bind(this),
      onRecover: config.onRecover || this._handleRecovery.bind(this),
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      enableRecovery: config.enableRecovery !== false,
      ...config
    };

    const component = this._createBoundaryComponent(boundaryConfig);
    this.boundaries.set(name, component);
    return component;
  }

  // 创建边界组件
  _createBoundaryComponent(config) {
    const self = this;
    const component = {
      name: `ErrorBoundary_${config.name}`,
      isErrorBoundary: true,
      fallback: config.fallback, // 添加 fallback 属性
      onError: config.onError, // 添加 onError 属性
      state: {
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: 0
      }
    };

    // 定义方法以确保它们可以被正确绑定
    component.componentDidCatch = function(error, errorInfo) {
      this.setState({
        hasError: true,
        error,
        errorInfo
      });

      // 记录错误
      self._logError(error, errorInfo);

      // 调用错误处理器
      if (config.onError) {
        config.onError(error, errorInfo);
      }
    };

    component.handleRetry = function() {
      if (this.state.retryCount < config.retryAttempts) {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          retryCount: this.state.retryCount + 1
        });

        if (config.onRecover) {
          config.onRecover();
        }
      }
    };

    component.render = function(createElem) {
      if (this.state.hasError) {
        const fallbackResult = config.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          retryCount: this.state.retryCount,
          retry: component.handleRetry.bind(this),
          retryAttempts: config.retryAttempts
        });
        
        // 如果 fallback 返回一个带有 render 方法的对象，则调用 render 方法
        if (fallbackResult && typeof fallbackResult.render === 'function') {
          return fallbackResult.render(createElem);
        }
        
        // 否则直接返回结果
        return fallbackResult;
      }

      return this.props.children;
    };

    return component;
  }

  // 创建默认回退组件
  _createDefaultFallback() {
    return function({ error, retryCount, retryAttempts, retry }) {
      return {
        render(createElem) {
          return createElem('div', { class: 'error-boundary-fallback' }, [
            createElem('h3', {}, ['组件渲染失败']),
            createElem('div', { class: 'error-details' }, [
              createElem('p', {}, ['抱歉，组件出现了错误']),
              error && createElem('details', {}, [
                createElem('summary', {}, ['错误详情']),
                createElem('pre', {}, [error.toString()])
              ])
            ]),
            retryCount < retryAttempts && createElem('button', {
              '@click': retry,
              class: 'retry-button'
            }, [`重试 (${retryCount + 1}/${retryAttempts})`]),
            createElem('button', {
              '@click': () => window.location.reload(),
              class: 'reload-button'
            }, ['刷新页面'])
          ]);
        }
      };
    };
  }

  // 处理边界错误
  _handleBoundaryError(error, errorInfo) {
    if (this.options.enableErrorLogging) {
      console.error('错误边界捕获到错误:', error, errorInfo);
    }

    // 发送错误报告
    if (this.options.errorReportingEndpoint) {
      this._sendErrorReport(error, errorInfo);
    }
  }

  // 处理恢复
  _handleRecovery() {
    if (this.options.enableErrorLogging) {
      console.log('组件从错误中恢复');
    }
  }

  // 记录错误
  _logError(error, errorInfo) {
    const errorEntry = {
      timestamp: Date.now(),
      error: error, // 存储实际的 Error 对象
      errorInfo: errorInfo, // 添加 errorInfo 属性
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.errorLog.push(errorEntry);

    // 限制日志大小
    if (this.errorLog.length > this.options.maxErrorLogSize) {
      this.errorLog.shift();
    }

    // 发送错误报告
    if (this.options.errorReportingEndpoint) {
      this._sendErrorReport(error, errorInfo);
    }
  }

  // 导出错误日志
  exportErrorLog() {
    return this.errorLog.map(entry => ({
      timestamp: entry.timestamp,
      error: entry.error,
      errorInfo: entry.errorInfo,
      stack: entry.stack,
      componentStack: entry.componentStack,
      userAgent: entry.userAgent,
      url: entry.url
    }));
  }

  // 注册错误处理器
  registerErrorHandler(errorType, handler) {
    this.errorHandlers.set(errorType, handler);
  }

  // 处理错误
  handleError(errorType, error, errorInfo) {
    const handler = this.errorHandlers.get(errorType);
    if (handler) {
      if (errorInfo) {
        handler(error, errorInfo);
      } else {
        handler(error);
      }
    } else {
      console.warn(`未找到错误类型 "${errorType}" 的处理器`);
    }
  }

  // 发送错误报告
  async _sendErrorReport(error, errorInfo) {
    try {
      const report = {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      };

      await fetch(this.options.errorReportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(report)
      });
    } catch (reportError) {
      console.warn('错误报告发送失败:', reportError);
    }
  }

  // 注册全局错误处理器
  registerGlobalErrorHandler(handler) {
    this.globalErrorHandlers.push(handler);
  }

  // 移除全局错误处理器
  removeGlobalErrorHandler(handler) {
    const index = this.globalErrorHandlers.indexOf(handler);
    if (index > -1) {
      this.globalErrorHandlers.splice(index, 1);
    }
  }

  // 触发全局错误处理器
  _triggerGlobalHandlers(error, errorInfo) {
    this.globalErrorHandlers.forEach(handler => {
      try {
        handler(error, errorInfo);
      } catch (handlerError) {
        console.error('全局错误处理器执行失败:', handlerError);
      }
    });
  }

  // 初始化全局错误处理
  initGlobalErrorHandling() {
    // 捕获未处理的Promise错误
    window.addEventListener('unhandledrejection', (event) => {
      this._handleUnhandledRejection(event);
    });

    // 捕获JavaScript运行时错误
    window.addEventListener('error', (event) => {
      this._handleRuntimeError(event);
    });

    // 捕获资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this._handleResourceError(event);
      }
    }, true);
  }

  // 处理未处理的Promise拒绝
  _handleUnhandledRejection(event) {
    const error = new Error(`Unhandled Promise Rejection: ${event.reason}`);
    error.stack = event.reason?.stack || '';
    
    this._handleError(error, {
      type: 'unhandledrejection',
      reason: event.reason
    });

    // 防止控制台显示未处理的错误
    event.preventDefault();
  }

  // 处理运行时错误
  _handleRuntimeError(event) {
    const error = new Error(event.message);
    error.stack = event.error?.stack || '';
    
    this._handleError(error, {
      type: 'runtime',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  }

  // 处理资源加载错误
  _handleResourceError(event) {
    const error = new Error(`Resource loading failed: ${event.target.src || event.target.href}`);
    
    this._handleError(error, {
      type: 'resource',
      target: event.target,
      source: event.target.src || event.target.href
    });
  }

  // 统一错误处理
  _handleError(error, context) {
    // 调用全局错误处理器
    this.globalErrorHandlers.forEach(handler => {
      try {
        handler(error, context);
      } catch (handlerError) {
        console.error('全局错误处理器执行失败:', handlerError);
      }
    });

    // 记录错误
    if (this.options.enableErrorLogging) {
      console.error('捕获到错误:', error, context);
    }
  }

  // 创建异常包装器
  wrapComponent(component, errorBoundaryName) {
    const boundary = this.boundaries.get(errorBoundaryName);
    if (!boundary) {
      console.warn(`错误边界 "${errorBoundaryName}" 不存在`);
      return component;
    }

    return {
      ...component,
      _errorBoundary: errorBoundaryName,
      originalRender: component.render,
      render: function(...args) {
        try {
          return this.originalRender ? this.originalRender.apply(this, args) : null;
        } catch (error) {
          // 错误会被错误边界捕获
          throw error;
        }
      }
    };
  }

  // 获取错误日志
  getErrorLog() {
    return [...this.errorLog];
  }

  // 清除错误日志
  clearErrorLog() {
    this.errorLog = [];
  }

  // 获取边界状态
  getBoundaryStatus(name) {
    return this.boundaries.get(name) || null;
  }

  // 手动触发错误（用于测试）
  triggerError(error, context = {}) {
    this._handleError(error, {
      ...context,
      triggeredManually: true
    });
  }

  // 获取错误统计
  getErrorStats() {
    const recentErrors = this.errorLog.filter(entry => {
      const hourAgo = Date.now() - 3600000;
      return entry.timestamp > hourAgo;
    });

    const errorTypes = {};
    recentErrors.forEach(entry => {
      const type = this._categorizeError(entry);
      errorTypes[type] = (errorTypes[type] || 0) + 1;
    });

    return {
      totalErrors: this.errorLog.length,
      errorLogSize: this.errorLog.length, // 添加 errorLogSize 属性
      boundariesCount: this.boundaries.size, // 添加 boundariesCount 属性
      recentErrors: recentErrors.length,
      errorTypes,
      mostCommonError: this._getMostCommonError(errorTypes),
      errorRate: this._calculateErrorRate()
    };
  }

  // 批量处理错误
  handleBatchErrors(errorType, errors) {
    errors.forEach(error => {
      this.handleError(errorType, error);
    });
  }

  // 分类错误
  _categorizeError(errorEntry) {
    if (errorEntry.componentStack) {
      return 'component';
    }
    const errorMessage = errorEntry.error?.toString() || '';
    if (errorMessage.includes('Promise')) {
      return 'promise';
    }
    if (errorMessage.includes('Resource')) {
      return 'resource';
    }
    return 'runtime';
  }

  // 获取最常见错误
  _getMostCommonError(errorTypes) {
    let maxCount = 0;
    let mostCommon = null;
    
    for (const [type, count] of Object.entries(errorTypes)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = type;
      }
    }
    
    return mostCommon;
  }

  // 计算错误率
  _calculateErrorRate() {
    const recentErrors = this.errorLog.filter(entry => {
      const hourAgo = Date.now() - 3600000;
      return entry.timestamp > hourAgo;
    });
    
    // 这里应该基于组件渲染次数计算错误率
    // 目前返回简化版本
    return recentErrors.length;
  }

  // 检查错误边界是否存在
  hasBoundary(name) {
    return this.boundaries.has(name);
  }

  // 删除错误边界
  deleteBoundary(name) {
    return this.boundaries.delete(name);
  }

  // 获取所有边界列表
  getAllBoundaries() {
    return Array.from(this.boundaries.keys());
  }

  // 处理异步错误
  handleAsyncError(boundaryName, error, errorInfo = {}) {
    const boundary = this.boundaries.get(boundaryName);
    if (boundary && boundary.onError) {
      boundary.onError(error, errorInfo);
    }
    this._logError(error, errorInfo);
  }

  // 销毁
  destroy() {
    this.boundaries.clear();
    this.errorHandlers.clear();
    this.fallbackComponents.clear();
    this.globalErrorHandlers = [];
    
    // 移除全局错误监听器
    window.removeEventListener('unhandledrejection', this._handleUnhandledRejection);
    window.removeEventListener('error', this._handleRuntimeError);
  }
}

// 全局错误边界管理器实例
export const errorBoundaryManager = new ErrorBoundaryManager();

// 便捷方法
export const createErrorBoundary = (name, config) => 
  errorBoundaryManager.createErrorBoundary(name, config);

export const wrapWithErrorBoundary = (component, boundaryName) => 
  errorBoundaryManager.wrapComponent(component, boundaryName);

export const registerErrorHandler = (handler) => 
  errorBoundaryManager.registerGlobalErrorHandler(handler);

export const getErrorLog = () => 
  errorBoundaryManager.getErrorLog();

export const triggerError = (error, context) => 
  errorBoundaryManager.triggerError(error, context);