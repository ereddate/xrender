import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { XProgress } from '../../src/libs/xprogress/xprogress.js';
import xProgressPlugin from '../../src/libs/xprogress/plugin.js';

describe('XProgress 基础功能测试', () => {
  let progress;
  let mockParent;

  beforeEach(() => {
    mockParent = document.createElement('div');
    mockParent.id = 'mock-parent';
    document.body.appendChild(mockParent);
    
    progress = new XProgress({
      parent: '#mock-parent'
    });
  });

  afterEach(() => {
    if (progress) {
      progress.remove();
    }
    if (mockParent && mockParent.parentNode) {
      mockParent.parentNode.removeChild(mockParent);
    }
  });

  it('应该正确创建 XProgress 实例', () => {
    expect(progress).toBeInstanceOf(XProgress);
    expect(progress.status).toBeNull();
    expect(progress.element).toBeNull();
  });

  it('应该正确设置默认配置', () => {
    const defaultProgress = new XProgress();
    expect(defaultProgress.settings.minimum).toBe(0.08);
    expect(defaultProgress.settings.easing).toBe('linear');
    expect(defaultProgress.settings.speed).toBe(200);
    expect(defaultProgress.settings.trickle).toBe(true);
    expect(defaultProgress.settings.trickleSpeed).toBe(200);
    expect(defaultProgress.settings.showSpinner).toBe(true);
  });

  it('应该能够自定义配置', () => {
    const customProgress = new XProgress({
      minimum: 0.1,
      speed: 300,
      showSpinner: false
    });
    expect(customProgress.settings.minimum).toBe(0.1);
    expect(customProgress.settings.speed).toBe(300);
    expect(customProgress.settings.showSpinner).toBe(false);
  });

  it('应该能够启动进度条', () => {
    progress.start();
    expect(progress.status).not.toBeNull();
    expect(progress.element).not.toBeNull();
    expect(progress.isStarted()).toBe(true);
  });

  it('应该能够设置进度值', () => {
    progress.set(0.5);
    expect(progress.status).toBe(0.5);
    expect(progress.element).not.toBeNull();
  });

  it('应该限制进度值在最小值和1之间', () => {
    progress.set(-0.1);
    expect(progress.status).toBeGreaterThanOrEqual(progress.settings.minimum);
    
    progress.set(1.5);
    expect(progress.status).toBeNull();
  });

  it('应该能够完成进度条', () => {
    progress.start();
    progress.done();
    expect(progress.status).toBeNull();
  });

  it('应该能够强制完成进度条', () => {
    progress.start();
    progress.done(true);
    expect(progress.status).toBeNull();
  });

  it('应该能够增加进度值', () => {
    progress.set(0.3);
    progress.inc(0.2);
    expect(progress.status).toBe(0.5);
  });

  it('应该能够自动增加随机进度值', () => {
    progress.set(0.3);
    const before = progress.status;
    progress.inc();
    const after = progress.status;
    expect(after).toBeGreaterThan(before);
    expect(after).toBeLessThan(1);
  });

  it('应该能够移除进度条', () => {
    progress.start();
    expect(progress.element).not.toBeNull();
    progress.remove();
    expect(progress.element).toBeNull();
  });

  it('应该能够检查进度条状态', () => {
    expect(progress.isStarted()).toBe(false);
    progress.start();
    expect(progress.isStarted()).toBe(true);
    progress.done();
    expect(progress.isStarted()).toBe(false);
  });

  it('应该能够重置进度条', () => {
    progress.start();
    progress.set(0.5);
    progress.reset();
    expect(progress.status).toBeNull();
    expect(progress.element).toBeNull();
  });

  it('应该能够更新配置', () => {
    progress.configure({
      minimum: 0.1,
      speed: 300
    });
    expect(progress.settings.minimum).toBe(0.1);
    expect(progress.settings.speed).toBe(300);
  });

  it('应该能够正确渲染进度条元素', () => {
    progress.render();
    expect(progress.element).not.toBeNull();
    expect(progress.element.classList.contains('xprogress')).toBe(true);
    expect(mockParent.contains(progress.element)).toBe(true);
  });

  it('应该能够找到进度条和加载动画元素', () => {
    progress.render();
    progress.findElements();
    expect(progress.barElement).not.toBeNull();
    expect(progress.spinnerElement).not.toBeNull();
  });

  it('应该能够更新进度条宽度', () => {
    progress.set(0.5);
    expect(progress.barElement.style.width).toBe('50%');
  });

  it('应该能够设置 aria 属性', () => {
    progress.set(0.75);
    expect(progress.barElement.getAttribute('aria-valuenow')).toBe('75%');
  });

  it('应该能够隐藏加载动画', () => {
    const progressNoSpinner = new XProgress({
      parent: '#mock-parent',
      showSpinner: false
    });
    progressNoSpinner.render();
    progressNoSpinner.findElements();
    expect(progressNoSpinner.spinnerElement.style.display).toBe('none');
    progressNoSpinner.remove();
  });
});

describe('XProgress 自动增长测试', () => {
  let progress;
  let mockParent;

  beforeEach(() => {
    mockParent = document.createElement('div');
    mockParent.id = 'mock-parent-trickle';
    document.body.appendChild(mockParent);
    
    progress = new XProgress({
      parent: '#mock-parent-trickle',
      trickle: true,
      trickleSpeed: 100
    });
  });

  afterEach(() => {
    if (progress) {
      progress.reset();
    }
    if (mockParent && mockParent.parentNode) {
      mockParent.parentNode.removeChild(mockParent);
    }
  });

  it('应该能够启动自动增长', () => {
    progress.start();
    expect(progress.trickleTimer).not.toBeNull();
  });

  it('应该能够停止自动增长', () => {
    progress.start();
    progress.stopTrickle();
    expect(progress.trickleTimer).toBeNull();
  });

  it('应该在完成时停止自动增长', () => {
    progress.start();
    progress.done();
    expect(progress.trickleTimer).toBeNull();
  });

  it('应该能够禁用自动增长', () => {
    const noTrickleProgress = new XProgress({
      parent: '#mock-parent-trickle',
      trickle: false
    });
    noTrickleProgress.start();
    expect(noTrickleProgress.trickleTimer).toBeNull();
    noTrickleProgress.remove();
  });

  it('应该自动增加进度值', (done) => {
    progress.set(0.1);
    const initialStatus = progress.status;
    
    setTimeout(() => {
      expect(progress.status).toBeGreaterThan(initialStatus);
      progress.done();
      done();
    }, 150);
  });
});

describe('XProgress 边界情况测试', () => {
  let progress;
  let mockParent;

  beforeEach(() => {
    mockParent = document.createElement('div');
    mockParent.id = 'mock-parent-edge';
    document.body.appendChild(mockParent);
    
    progress = new XProgress({
      parent: '#mock-parent-edge'
    });
  });

  afterEach(() => {
    if (progress) {
      progress.reset();
    }
    if (mockParent && mockParent.parentNode) {
      mockParent.parentNode.removeChild(mockParent);
    }
  });

  it('应该能够处理重复启动', () => {
    progress.start();
    const firstElement = progress.element;
    progress.start();
    expect(progress.element).toBe(firstElement);
  });

  it('应该能够处理重复完成', () => {
    progress.start();
    progress.done();
    const result = progress.done();
    expect(result).toBe(progress);
  });

  it('应该能够处理在未启动时增加进度', () => {
    progress.inc(0.1);
    expect(progress.status).not.toBeNull();
  });

  it('应该能够处理无效的父元素', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const invalidProgress = new XProgress({
      parent: '#non-existent-parent'
    });
    invalidProgress.start();
    expect(invalidProgress.element).toBeNull();
    expect(invalidProgress.barElement).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('应该能够处理进度值超出范围', () => {
    progress.set(1.5);
    expect(progress.status).toBeNull();
    
    progress.set(-0.5);
    expect(progress.status).toBe(0.08);
  });

  it('应该能够处理设置进度为1', () => {
    progress.set(1);
    expect(progress.status).toBeNull();
    expect(progress.element).toBeNull();
  });

  it('应该能够处理多次移除', () => {
    progress.start();
    progress.remove();
    const result = progress.remove();
    expect(result).toBe(progress);
  });

  it('应该能够处理在进度为1时增加进度', () => {
    progress.set(1);
    progress.inc(0.1);
    expect(progress.status).toBeLessThan(1);
  });

  it('应该能够处理重置后重新启动', () => {
    progress.start();
    progress.set(0.5);
    progress.reset();
    progress.start();
    expect(progress.status).not.toBeNull();
    expect(progress.element).not.toBeNull();
  });
});

describe('XProgress 静态方法测试', () => {
  it('应该能够通过静态方法创建实例', () => {
    const progress = XProgress.create({
      minimum: 0.1
    });
    expect(progress).toBeInstanceOf(XProgress);
    expect(progress.settings.minimum).toBe(0.1);
    progress.remove();
  });

  it('应该有版本号', () => {
    expect(XProgress.version).toBe('1.0.0');
  });
});

describe('XProgress 插件测试', () => {
  let mockApp;
  let mockParent;

  beforeEach(() => {
    mockParent = document.createElement('div');
    mockParent.id = 'mock-parent-plugin';
    document.body.appendChild(mockParent);

    mockApp = {
      XProgress: null,
      $progress: null,
      progress: null
    };
  });

  afterEach(() => {
    if (mockApp.$progress) {
      mockApp.$progress.remove();
    }
    if (mockParent && mockParent.parentNode) {
      mockParent.parentNode.removeChild(mockParent);
    }
  });

  it('应该能够安装插件', () => {
    const result = xProgressPlugin.install(mockApp, {
      minimum: 0.1
    });
    expect(mockApp.XProgress).toBe(XProgress);
    expect(mockApp.$progress).toBeInstanceOf(XProgress);
    expect(mockApp.progress).not.toBeNull();
    expect(mockApp.progress.start).toBeInstanceOf(Function);
    expect(mockApp.progress.set).toBeInstanceOf(Function);
    expect(mockApp.progress.done).toBeInstanceOf(Function);
    expect(mockApp.progress.inc).toBeInstanceOf(Function);
    expect(mockApp.progress.remove).toBeInstanceOf(Function);
    expect(mockApp.progress.configure).toBeInstanceOf(Function);
    expect(mockApp.progress.isStarted).toBeInstanceOf(Function);
    expect(mockApp.progress.reset).toBeInstanceOf(Function);
    expect(result).toBeInstanceOf(XProgress);
  });

  it('应该能够通过插件方法控制进度条', () => {
    xProgressPlugin.install(mockApp);
    
    mockApp.progress.start();
    expect(mockApp.$progress.isStarted()).toBe(true);
    
    mockApp.progress.set(0.5);
    expect(mockApp.$progress.status).toBe(0.5);
    
    mockApp.progress.inc(0.2);
    expect(mockApp.$progress.status).toBe(0.7);
    
    mockApp.progress.done();
    expect(mockApp.$progress.isStarted()).toBe(false);
  });

  it('应该能够通过插件方法检查状态', () => {
    xProgressPlugin.install(mockApp);
    expect(mockApp.progress.isStarted()).toBe(false);
    
    mockApp.progress.start();
    expect(mockApp.progress.isStarted()).toBe(true);
    
    mockApp.progress.done();
    expect(mockApp.progress.isStarted()).toBe(false);
  });

  it('应该能够通过插件方法更新配置', () => {
    xProgressPlugin.install(mockApp);
    mockApp.progress.configure({
      minimum: 0.15,
      speed: 400
    });
    expect(mockApp.$progress.settings.minimum).toBe(0.15);
    expect(mockApp.$progress.settings.speed).toBe(400);
  });

  it('应该能够通过插件方法重置进度条', () => {
    xProgressPlugin.install(mockApp);
    mockApp.progress.start();
    mockApp.progress.set(0.5);
    mockApp.progress.reset();
    expect(mockApp.$progress.status).toBeNull();
    expect(mockApp.$progress.element).toBeNull();
  });

  it('应该能够使用默认配置安装插件', () => {
    xProgressPlugin.install(mockApp);
    expect(mockApp.$progress.settings.minimum).toBe(0.08);
    expect(mockApp.$progress.settings.trickle).toBe(true);
  });

  it('应该能够使用自定义配置安装插件', () => {
    xProgressPlugin.install(mockApp, {
      minimum: 0.2,
      trickle: false,
      showSpinner: false
    });
    expect(mockApp.$progress.settings.minimum).toBe(0.2);
    expect(mockApp.$progress.settings.trickle).toBe(false);
    expect(mockApp.$progress.settings.showSpinner).toBe(false);
  });
});

describe('XProgress 完整流程测试', () => {
  let progress;
  let mockParent;

  beforeEach(() => {
    mockParent = document.createElement('div');
    mockParent.id = 'mock-parent-flow';
    document.body.appendChild(mockParent);
    
    progress = new XProgress({
      parent: '#mock-parent-flow',
      trickle: false
    });
  });

  afterEach(() => {
    if (progress) {
      progress.reset();
    }
    if (mockParent && mockParent.parentNode) {
      mockParent.parentNode.removeChild(mockParent);
    }
  });

  it('应该能够完成完整的加载流程', () => {
    progress.start();
    expect(progress.isStarted()).toBe(true);
    
    progress.set(0.3);
    expect(progress.status).toBe(0.3);
    
    progress.set(0.6);
    expect(progress.status).toBe(0.6);
    
    progress.set(0.9);
    expect(progress.status).toBe(0.9);
    
    progress.done();
    expect(progress.isStarted()).toBe(false);
  });

  it('应该能够模拟 AJAX 请求流程', (done) => {
    progress.start();
    expect(progress.isStarted()).toBe(true);
    
    setTimeout(() => {
      progress.set(0.3);
      expect(progress.status).toBe(0.3);
    }, 100);
    
    setTimeout(() => {
      progress.set(0.6);
      expect(progress.status).toBe(0.6);
    }, 200);
    
    setTimeout(() => {
      progress.done();
      expect(progress.isStarted()).toBe(false);
      done();
    }, 300);
  });

  it('应该能够模拟文件上传流程', (done) => {
    progress.start();
    
    const uploadProgress = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1.0];
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      if (currentIndex < uploadProgress.length) {
        progress.set(uploadProgress[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(interval);
        progress.done();
        expect(progress.isStarted()).toBe(false);
        done();
      }
    }, 50);
  });
});

describe('XProgress DOM 操作测试', () => {
  let progress;
  let mockParent;

  beforeEach(() => {
    mockParent = document.createElement('div');
    mockParent.id = 'mock-parent-dom';
    document.body.appendChild(mockParent);
    
    progress = new XProgress({
      parent: '#mock-parent-dom'
    });
  });

  afterEach(() => {
    if (progress) {
      progress.reset();
    }
    if (mockParent && mockParent.parentNode) {
      mockParent.parentNode.removeChild(mockParent);
    }
  });

  it('应该正确添加进度条元素到父容器', () => {
    progress.start();
    expect(mockParent.contains(progress.element)).toBe(true);
  });

  it('应该正确从父容器移除进度条元素', () => {
    progress.start();
    progress.remove();
    expect(mockParent.contains(progress.element)).toBe(false);
  });

  it('应该能够使用自定义模板', () => {
    const customTemplate = `
      <div class="custom-progress">
        <div class="custom-bar" role="bar"></div>
      </div>
    `;
    const customProgress = new XProgress({
      parent: '#mock-parent-dom',
      template: customTemplate,
      barSelector: '.custom-bar'
    });
    customProgress.start();
    expect(customProgress.element.classList.contains('custom-progress')).toBe(true);
    expect(customProgress.barElement.classList.contains('custom-bar')).toBe(true);
    customProgress.remove();
  });

  it('应该能够正确更新 CSS 宽度', () => {
    progress.set(0.25);
    expect(progress.barElement.style.width).toBe('25%');
    
    progress.set(0.75);
    expect(progress.barElement.style.width).toBe('75%');
  });
});

describe('XProgress 性能测试', () => {
  let mockParent;

  beforeEach(() => {
    mockParent = document.createElement('div');
    mockParent.id = 'mock-parent-perf';
    document.body.appendChild(mockParent);
  });

  afterEach(() => {
    if (mockParent && mockParent.parentNode) {
      mockParent.parentNode.removeChild(mockParent);
    }
  });

  it('应该能够处理快速连续更新', () => {
    const progress = new XProgress({
      parent: '#mock-parent-perf',
      trickle: false
    });
    
    for (let i = 0; i < 100; i++) {
      progress.set(i / 100);
    }
    
    expect(progress.status).toBe(0.99);
    progress.remove();
  });

  it('应该能够处理多个实例', () => {
    const progress1 = new XProgress({
      parent: '#mock-parent-perf',
      trickle: false
    });
    const progress2 = new XProgress({
      parent: '#mock-parent-perf',
      trickle: false
    });
    
    progress1.set(0.3);
    progress2.set(0.6);
    
    expect(progress1.status).toBe(0.3);
    expect(progress2.status).toBe(0.6);
    
    progress1.remove();
    progress2.remove();
  });

  it('应该能够正确清理资源', () => {
    const progress = new XProgress({
      parent: '#mock-parent-perf',
      trickle: true,
      trickleSpeed: 50
    });
    
    progress.start();
    expect(progress.trickleTimer).not.toBeNull();
    
    progress.reset();
    expect(progress.trickleTimer).toBeNull();
    expect(progress.element).toBeNull();
    expect(progress.barElement).toBeNull();
    expect(progress.spinnerElement).toBeNull();
  });
});
