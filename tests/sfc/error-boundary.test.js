import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundaryManager } from '../../src/libs/sfc/error-boundary-manager.js';

describe('错误边界管理器测试', () => {
  let errorBoundaryManager;
  
  beforeEach(() => {
    errorBoundaryManager = new ErrorBoundaryManager({
      enableErrorBoundary: true,
      enableErrorLogging: true,
      enableErrorRecovery: true,
      maxErrorLogSize: 50
    });
  });
  
  afterEach(() => {
    errorBoundaryManager.clearErrorLog();
  });

  it('应该能够创建错误边界管理器实例', () => {
    expect(errorBoundaryManager).toBeDefined();
    expect(errorBoundaryManager.boundaries).toBeDefined();
    expect(errorBoundaryManager.errorHandlers).toBeDefined();
    expect(errorBoundaryManager.errorLog).toBeDefined();
    expect(errorBoundaryManager.fallbackComponents).toBeDefined();
  });

  it('应该能够创建错误边界', () => {
    const fallback = ({ error, retry }) => 
      createElem('div', {}, ['错误：', error?.message || '未知错误']);

    const boundaryComponent = errorBoundaryManager.createErrorBoundary('test-boundary', {
      fallback,
      retryAttempts: 2,
      retryDelay: 500
    });

    expect(boundaryComponent.isErrorBoundary).toBe(true);
    expect(boundaryComponent.name).toBe('ErrorBoundary_test-boundary');
    expect(errorBoundaryManager.boundaries.has('test-boundary')).toBe(true);
  });

  it('应该能够处理组件错误', () => {
    const errorHandler = vi.fn();
    
    errorBoundaryManager.createErrorBoundary('handler-test', {
      onError: errorHandler
    });

    const boundaryComponent = errorBoundaryManager.boundaries.get('handler-test');
    const error = new Error('Test error');
    const errorInfo = { componentStack: 'Test component stack' };

    // 模拟componentDidCatch
    const mockInstance = {
      setState: vi.fn(),
      props: { children: null }
    };
    
    boundaryComponent.componentDidCatch.call(mockInstance, error, errorInfo);
    
    expect(mockInstance.setState).toHaveBeenCalledWith({
      hasError: true,
      error,
      errorInfo
    });
    
    expect(errorHandler).toHaveBeenCalledWith(error, errorInfo);
  });

  it('应该能够记录错误日志', () => {
    const error = new Error('Test error');
    const errorInfo = { componentStack: 'Test stack' };
    
    errorBoundaryManager._logError(error, errorInfo);
    
    expect(errorBoundaryManager.errorLog).toHaveLength(1);
    expect(errorBoundaryManager.errorLog[0]).toHaveProperty('timestamp');
    expect(errorBoundaryManager.errorLog[0]).toHaveProperty('error');
    expect(errorBoundaryManager.errorLog[0]).toHaveProperty('errorInfo');
    expect(errorBoundaryManager.errorLog[0].error).toBe(error);
  });

  it('应该能够限制错误日志大小', () => {
    // 添加超过最大限制的错误
    for (let i = 0; i < 60; i++) {
      errorBoundaryManager._logError(new Error(`Error ${i}`), { index: i });
    }
    
    // 应该只保留最近的50条错误
    expect(errorBoundaryManager.errorLog.length).toBe(50);
  });

  it('应该能够处理错误恢复', () => {
    const recoveryHandler = vi.fn();
    
    const boundaryComponent = errorBoundaryManager.createErrorBoundary('recovery-test', {
      onRecover: recoveryHandler,
      retryAttempts: 3
    });

    // 模拟初始错误状态
    const mockInstance = {
      state: {
        hasError: true,
        error: new Error('Test error'),
        retryCount: 1
      },
      setState: vi.fn()
    };

    // 调用重试方法
    boundaryComponent.handleRetry.call(mockInstance);

    expect(mockInstance.setState).toHaveBeenCalledWith({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 2
    });
    
    expect(recoveryHandler).toHaveBeenCalled();
  });

  it('应该能够限制重试次数', () => {
    const boundaryComponent = errorBoundaryManager.createErrorBoundary('retry-limit-test', {
      retryAttempts: 2
    });

    // 模拟已达到重试限制的状态
    const mockInstance = {
      state: {
        hasError: true,
        retryCount: 2 // 已达到最大重试次数
      },
      setState: vi.fn()
    };

    // 尝试重试
    boundaryComponent.handleRetry.call(mockInstance);

    // 不应该再次重试
    expect(mockInstance.setState).not.toHaveBeenCalled();
  });

  it('应该能够渲染回退组件', () => {
    const customFallback = ({ error, retryCount, retry }) => ({
      render(createElem) {
        return createElem('div', { class: 'custom-error' }, [
          `Custom Error: ${error?.message}`,
          createElem('button', { onClick: retry }, [`重试 (${retryCount}/3)`])
        ]);
      }
    });

    const boundaryComponent = errorBoundaryManager.createErrorBoundary('fallback-test', {
      fallback: customFallback
    });

    // 模拟错误状态
    const mockInstance = {
      state: {
        hasError: true,
        error: new Error('Custom error'),
        retryCount: 1
      }
    };

    const createElem = (tag, props, children) => ({ tag, props, children });
    const result = boundaryComponent.render.call(mockInstance, createElem);

    expect(result.props.class).toBe('custom-error');
    expect(result.children[0]).toContain('Custom Error: Custom error');
  });

  it('应该能够注册全局错误处理器', () => {
    const globalHandler = vi.fn();
    
    errorBoundaryManager.registerGlobalErrorHandler(globalHandler);
    
    expect(errorBoundaryManager.globalErrorHandlers).toContain(globalHandler);
  });

  it('应该能够移除全局错误处理器', () => {
    const globalHandler = vi.fn();
    
    errorBoundaryManager.registerGlobalErrorHandler(globalHandler);
    errorBoundaryManager.removeGlobalErrorHandler(globalHandler);
    
    expect(errorBoundaryManager.globalErrorHandlers).not.toContain(globalHandler);
  });

  it('应该能够触发全局错误处理器', () => {
    const globalHandler1 = vi.fn();
    const globalHandler2 = vi.fn();
    
    errorBoundaryManager.registerGlobalErrorHandler(globalHandler1);
    errorBoundaryManager.registerGlobalErrorHandler(globalHandler2);
    
    const error = new Error('Global test error');
    const errorInfo = { global: true };
    
    errorBoundaryManager._triggerGlobalHandlers(error, errorInfo);
    
    expect(globalHandler1).toHaveBeenCalledWith(error, errorInfo);
    expect(globalHandler2).toHaveBeenCalledWith(error, errorInfo);
  });

  it('应该能够获取错误统计信息', () => {
    // 添加一些错误
    for (let i = 0; i < 5; i++) {
      errorBoundaryManager._logError(new Error(`Error ${i}`), { index: i });
    }

    const stats = errorBoundaryManager.getErrorStats();
    
    expect(stats).toHaveProperty('totalErrors');
    expect(stats).toHaveProperty('errorLogSize');
    expect(stats).toHaveProperty('boundariesCount');
    expect(stats.totalErrors).toBe(5);
    expect(stats.errorLogSize).toBe(5);
    expect(stats.boundariesCount).toBe(0);
  });

  it('应该能够清除错误日志', () => {
    errorBoundaryManager._logError(new Error('Test error'), {});
    
    expect(errorBoundaryManager.errorLog.length).toBe(1);
    
    errorBoundaryManager.clearErrorLog();
    
    expect(errorBoundaryManager.errorLog.length).toBe(0);
  });

  it('应该能够导出错误日志', () => {
    errorBoundaryManager._logError(new Error('Export test error'), { test: true });
    
    const exported = errorBoundaryManager.exportErrorLog();
    
    expect(Array.isArray(exported)).toBe(true);
    expect(exported.length).toBe(1);
    expect(exported[0]).toHaveProperty('timestamp');
    expect(exported[0]).toHaveProperty('error');
  });

  it('应该能够处理自定义错误处理器', () => {
    const customHandler = vi.fn();
    
    errorBoundaryManager.registerErrorHandler('custom-error', customHandler);
    
    const error = new Error('Custom handler error');
    errorBoundaryManager.handleError('custom-error', error);
    
    expect(customHandler).toHaveBeenCalledWith(error);
  });

  it('应该能够检查错误边界是否存在', () => {
    errorBoundaryManager.createErrorBoundary('existence-test');
    
    expect(errorBoundaryManager.hasBoundary('existence-test')).toBe(true);
    expect(errorBoundaryManager.hasBoundary('non-existent')).toBe(false);
  });

  it('应该能够删除错误边界', () => {
    errorBoundaryManager.createErrorBoundary('delete-test');
    
    expect(errorBoundaryManager.hasBoundary('delete-test')).toBe(true);
    
    errorBoundaryManager.deleteBoundary('delete-test');
    
    expect(errorBoundaryManager.hasBoundary('delete-test')).toBe(false);
  });

  it('应该能够获取所有边界列表', () => {
    errorBoundaryManager.createErrorBoundary('boundary1');
    errorBoundaryManager.createErrorBoundary('boundary2');
    
    const boundaries = errorBoundaryManager.getAllBoundaries();
    
    expect(Array.isArray(boundaries)).toBe(true);
    expect(boundaries).toContain('boundary1');
    expect(boundaries).toContain('boundary2');
  });

  it('应该能够处理异步错误', async () => {
    const asyncError = new Error('Async error');
    const errorHandler = vi.fn();
    
    errorBoundaryManager.createErrorBoundary('async-test', {
      onError: errorHandler
    });

    // 模拟异步错误处理
    try {
      throw asyncError;
    } catch (error) {
      errorBoundaryManager.handleAsyncError('async-test', error);
    }

    expect(errorHandler).toHaveBeenCalledWith(asyncError, expect.any(Object));
  });

  it('应该能够创建默认回退组件', () => {
    const boundaryComponent = errorBoundaryManager.createErrorBoundary('default-fallback-test');
    const config = boundaryComponent;
    
    const fallbackProps = {
      error: new Error('Default test error'),
      retryCount: 1,
      retryAttempts: 3,
      retry: vi.fn()
    };
    
    const createElem = (tag, props, children) => ({ tag, props, children });
    const result = config.fallback(fallbackProps);
    const rendered = result.render(createElem);
    
    expect(rendered.tag).toBe('div');
    expect(rendered.props.class).toBe('error-boundary-fallback');
    expect(rendered.children[0].children[0]).toBe('组件渲染失败');
  });

  it('应该能够处理错误报告端点', () => {
    const mockEndpoint = 'https://api.example.com/errors';
    const manager = new ErrorBoundaryManager({
      errorReportingEndpoint: mockEndpoint,
      enableErrorLogging: false // 禁用本地日志以测试远程报告
    });
    
    const error = new Error('Remote report test');
    const errorInfo = { report: true };
    
    // 模拟fetch
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    
    manager._logError(error, errorInfo);
    
    expect(fetch).toHaveBeenCalledWith(mockEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: expect.stringContaining('Remote report test')
    });
  });

  it('应该能够批量处理错误', () => {
    const batchHandler = vi.fn();
    
    errorBoundaryManager.registerErrorHandler('batch-test', batchHandler);
    
    const errors = [
      new Error('Batch error 1'),
      new Error('Batch error 2'),
      new Error('Batch error 3')
    ];
    
    errorBoundaryManager.handleBatchErrors('batch-test', errors);
    
    expect(batchHandler).toHaveBeenCalledTimes(3);
  });
});