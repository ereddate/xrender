// Note: XRender dependency removed to make this module Node.js compatible
// nextTick has been replaced with setTimeout for Node.js compatibility

let currentInstance = null;
let activeEffect = null;
const globalWatchEffects = [];

export function setCurrentInstance(instance) {
  currentInstance = instance;
}

export function getCurrentInstance() {
  return currentInstance;
}

export function getGlobalWatchEffects() {
  return globalWatchEffects;
}

export function ref(value) {
  const refObj = {
    __isRef: true,
    _value: value,
    get value() {
      if (activeEffect && activeEffect.active) {
        activeEffect.deps.add(refObj);
        if (!refObj._deps) {
          refObj._deps = new Set();
        }
        refObj._deps.add(activeEffect);
      }
      return refObj._value;
    },
    set value(newValue) {
      if (newValue !== refObj._value) {
        refObj._value = newValue;
        
        // Trigger any computed properties that depend on this ref
        if (refObj._deps) {
          refObj._deps.forEach(dep => {
            if (typeof dep === 'function') {
              // This is a watcher effect
              try {
                dep();
              } catch (error) {
                console.error('[ref] Error in effect:', error);
              }
            } else if (dep && dep.__isComputed) {
              // This is a computed property, mark it as dirty
              dep._dirty = true;
              // Trigger any effects that depend on this computed
              if (dep._deps) {
                dep._deps.forEach(nestedDep => {
                  if (typeof nestedDep === 'function') {
                    try {
                      nestedDep();
                    } catch (error) {
                      console.error('[ref] Error in nested effect:', error);
                    }
                  } else if (nestedDep && nestedDep.__isComputed) {
                    // Mark nested computed as dirty too
                    nestedDep._dirty = true;
                  }
                });
              }
            }
          });
        }
        
        // Trigger global watch effects
        globalWatchEffects.forEach(effect => {
          if (typeof effect === 'function') {
            try {
              effect();
            } catch (error) {
              console.error('[ref] Error in global watchEffect:', error);
            }
          }
        });
      }
    },
    _deps: new Set()
  };
  
  return refObj;
}

export function reactive(target) {
  if (typeof target !== 'object' || target === null) {
    console.warn('reactive() expects an object, but received:', target);
    return target;
  }

  if (target.__isReactive) {
    return target;
  }

  const deps = new Map();

  const handler = {
    get(target, key, receiver) {
      if (key === '__isReactive') {
        return true;
      }

      if (activeEffect && activeEffect.active) {
        if (!deps.has(key)) {
          deps.set(key, new Set());
        }
        deps.get(key).add(activeEffect);
      }

      const result = Reflect.get(target, key, receiver);

      if (typeof result === 'object' && result !== null && !result.__isReactive) {
        return reactive(result);
      }

      return result;
    },

    set(target, key, value, receiver) {
      const oldValue = target[key];
      const result = Reflect.set(target, key, value, receiver);

      if (oldValue !== value) {
        const keyDeps = deps.get(key);
        if (keyDeps) {
          keyDeps.forEach(effect => {
            if (typeof effect === 'function') {
              try {
                effect();
              } catch (error) {
                console.error('[reactive] Error in effect:', error);
              }
            } else if (effect && effect.active) {
              try {
                effect();
              } catch (error) {
                console.error('[reactive] Error in effect:', error);
              }
            }
          });
          // Clear the deps for this key after triggering effects
          deps.set(key, new Set());
        }
        
        // Trigger global watch effects
        globalWatchEffects.forEach(effect => {
          if (typeof effect === 'function') {
            try {
              effect();
            } catch (error) {
              console.error('[reactive] Error in global watchEffect:', error);
            }
          }
        });
      }

      return result;
    }
  };

  const proxy = new Proxy(target, handler);
  return proxy;
}

const refCallbacks = new WeakMap();

function triggerRefCallbacks(target, key, newValue, oldValue) {
  const callbacks = refCallbacks.get(target);
  if (callbacks) {
    callbacks.forEach(callback => {
      callback(key, newValue, oldValue);
    });
  }
}

export function watch(source, callback, options = {}) {
  const { immediate = false, deep = false } = options;

  let getter;
  if (typeof source === 'function') {
    getter = source;
  } else if (source.__isRef) {
    getter = () => source.value;
  } else {
    getter = () => source;
  }

  let oldValue;
  let cleanup;
  let isSetup = false;
  let stop = () => {};

  const wrappedEffect = () => {
    const prevActiveEffect = activeEffect;
    activeEffect = {
      active: true,
      deps: new Set()
    };
    
    try {
      const newValue = getter();

      if (isSetup) {
        const shouldTrigger = deep && typeof newValue === 'object' && newValue !== null
          ? !deepEqual(newValue, oldValue)
          : newValue !== oldValue;

        if (shouldTrigger) {
          if (cleanup) {
            cleanup();
          }
          const cleanupFn = callback(newValue, oldValue);
          if (cleanupFn) {
            cleanup = cleanupFn;
          }
        }
      }

      oldValue = deep && typeof newValue === 'object' && newValue !== null 
        ? deepClone(newValue) 
        : newValue;
      isSetup = true;
    } finally {
      activeEffect.active = false;
      activeEffect = prevActiveEffect;
    }
  };

  const instance = getCurrentInstance();
  if (instance) {
    if (!instance._watchEffects) {
      instance._watchEffects = [];
    }

    instance._watchEffects.push(wrappedEffect);

    wrappedEffect();

    if (immediate) {
      const newValue = getter();
      const cleanupFn = callback(newValue, undefined);
      if (cleanupFn) {
        cleanup = cleanupFn;
      }
      oldValue = deep && typeof newValue === 'object' && newValue !== null 
        ? deepClone(newValue) 
        : newValue;
    }

    stop = () => {
      const index = instance._watchEffects?.indexOf(wrappedEffect);
      if (index > -1) {
        instance._watchEffects.splice(index, 1);
      }
    };
  } else {
    globalWatchEffects.push(wrappedEffect);

    wrappedEffect();

    if (immediate) {
      const newValue = getter();
      const cleanupFn = callback(newValue, undefined);
      if (cleanupFn) {
        cleanup = cleanupFn;
      }
      oldValue = deep && typeof newValue === 'object' && newValue !== null 
        ? deepClone(newValue) 
        : newValue;
    }
    
    stop = () => {
      const index = globalWatchEffects.indexOf(wrappedEffect);
      if (index > -1) {
        globalWatchEffects.splice(index, 1);
      }
    };
  }

  return stop;
}

export function watchEffect(effect, options = {}) {
  const { flush = 'pre' } = options;

  let cleanup;

  const wrappedEffect = () => {
    if (cleanup) {
      cleanup();
    }

    const prevActiveEffect = activeEffect;
    activeEffect = {
      active: true,
      deps: new Set()
    };
    
    try {
      cleanup = effect(onCleanup);
    } catch (error) {
      console.error('[watchEffect] Error:', error);
    } finally {
      activeEffect.active = false;
      activeEffect = prevActiveEffect;
    }
  };

  const instance = getCurrentInstance();
  if (instance) {
    if (!instance._watchEffects) {
      instance._watchEffects = [];
    }

    if (flush === 'post') {
      if (!instance._postWatchEffects) {
        instance._postWatchEffects = [];
      }
      instance._postWatchEffects.push(wrappedEffect);
    } else if (flush === 'sync') {
      if (!instance._syncWatchEffects) {
        instance._syncWatchEffects = [];
      }
      instance._syncWatchEffects.push(wrappedEffect);
    } else {
      instance._watchEffects.push(wrappedEffect);
    }

    const stop = () => {
      const index = instance._watchEffects?.indexOf(wrappedEffect);
      if (index > -1) {
        instance._watchEffects.splice(index, 1);
      }
    };

    wrappedEffect();

    return stop;
  }

  globalWatchEffects.push(wrappedEffect);
  wrappedEffect();
  
  const stop = () => {
    const index = globalWatchEffects.indexOf(wrappedEffect);
    if (index > -1) {
      globalWatchEffects.splice(index, 1);
    }
  };

  return stop;
}

export function onCleanup(fn) {
  const instance = getCurrentInstance();
  if (instance && instance._watchEffects) {
    const lastEffect = instance._watchEffects[instance._watchEffects.length - 1];
    if (lastEffect) {
      return fn;
    }
  }
  return fn;
}

export function watchPostEffect(effect) {
  return watchEffect(effect, { flush: 'post' });
}

export function watchSyncEffect(effect) {
  return watchEffect(effect, { flush: 'sync' });
}

export function computed(getterOrOptions) {
  let getter;
  let setter;

  if (typeof getterOrOptions === 'function') {
    getter = getterOrOptions;
    setter = () => {
      console.warn('Write operation failed: computed value is readonly');
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  let cachedValue;
  let _dirty = true;
  let _deps = new Set(); // Dependencies that this computed tracks

  const computedRef = {
    __isComputed: true,
    get value() {
      if (_dirty) {
        // Store current active effect for dependency tracking
        const prevActiveEffect = activeEffect;
        
        try {
          // Create a temporary effect for dependency tracking during computation
          activeEffect = {
            active: true,
            deps: new Set()
          };
          
          // Execute the getter to compute value and track dependencies
          cachedValue = getter();
          
          // Update dependencies from the temporary effect
          _deps = new Set(activeEffect.deps);
          
          // Register this computed as a dependency of each tracked dependency
          _deps.forEach(dep => {
            if (dep && dep._deps) {
              dep._deps.add(computedRef);
            }
          });
          
          // Mark as computed (not dirty anymore)
          _dirty = false;
        } finally {
          activeEffect = prevActiveEffect;
        }
      }
      
      // When this computed is accessed by another effect, add it to that effect's dependencies
      if (activeEffect && activeEffect.active) {
        activeEffect.deps.add(computedRef);
      }
      
      return cachedValue;
    },
    set value(newValue) {
      setter(newValue);
      // Mark as dirty to trigger re-computation
      _dirty = true;
    },
    get _dirty() {
      return _dirty;
    },
    set _dirty(value) {
      _dirty = value;
    },
    _deps
  };

  return computedRef;
}

export function toRefs(object) {
  const result = {};

  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      result[key] = toRef(object, key);
    }
  }

  return result;
}

export function toRef(object, key) {
  return {
    get value() {
      return object[key];
    },
    set value(newValue) {
      object[key] = newValue;
    }
  };
}

export function unref(ref) {
  return isRef(ref) ? ref.value : ref;
}

export function isRef(value) {
  return value !== null && typeof value === 'object' && value.__isRef === true;
}

export function toValue(source) {
  return typeof source === 'function' ? source() : unref(source);
}

export function shallowRef(value) {
  return {
    __isRef: true,
    __isShallow: true,
    get value() {
      return value;
    },
    set value(newValue) {
      value = newValue;
    }
  };
}

export function triggerRef(ref) {
  if (ref.__isComputed) {
    ref._dirty = true;
  } else if (ref.__isRef) {
    const oldValue = ref._value;
    ref._value = ref._value;
  }
}

export function customRef(factory) {
  let value;
  let getters = [];
  let setters = [];

  const customRefObj = {
    __isRef: true,
    get value() {
      getters.forEach(getter => getter());
      return value;
    },
    set value(newValue) {
      value = newValue;
      setters.forEach(setter => setter());
    }
  };

  const track = (fn) => {
    getters.push(fn);
  };

  const trigger = (fn) => {
    setters.push(fn);
  };

  factory(track, trigger);

  return customRefObj;
}

export function isProxy(value) {
  return !!(value !== null && typeof value === 'object' && value.__isReactive);
}

export function isReactive(value) {
  return !!(value !== null && typeof value === 'object' && value.__isReactive);
}

export function isReadonly(value) {
  return !!(value !== null && typeof value === 'object' && value.__isReadonly);
}

export function readonly(target) {
  if (typeof target !== 'object' || target === null) {
    return target;
  }

  const handler = {
    get(target, key, receiver) {
      if (key === '__isReadonly') {
        return true;
      }

      const result = Reflect.get(target, key, receiver);

      if (typeof result === 'object' && result !== null) {
        return readonly(result);
      }

      return result;
    },

    set(target, key) {
      console.warn(`Set operation on key "${key}" failed: target is readonly.`);
      return true;
    },

    deleteProperty(target, key) {
      console.warn(`Delete operation on key "${key}" failed: target is readonly.`);
      return true;
    }
  };

  return new Proxy(target, handler);
}

export function shallowReadonly(target) {
  if (typeof target !== 'object' || target === null) {
    return target;
  }

  const handler = {
    get(target, key, receiver) {
      return Reflect.get(target, key, receiver);
    },

    set(target, key) {
      console.warn(`Set operation on key "${key}" failed: target is readonly.`);
      return true;
    },

    deleteProperty(target, key) {
      console.warn(`Delete operation on key "${key}" failed: target is readonly.`);
      return true;
    }
  };

  const proxy = new Proxy(target, handler);
  Object.defineProperty(proxy, '__isReadonly', {
    value: true,
    enumerable: false,
    writable: false,
    configurable: false
  });

  return proxy;
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (obj instanceof Object) {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

export function onMounted(fn) {
  const instance = getCurrentInstance();
  if (instance) {
    if (!instance._mountedHooks) {
      instance._mountedHooks = [];
    }
    instance._mountedHooks.push(fn);
  }
}

export function onUpdated(fn) {
  const instance = getCurrentInstance();
  if (instance) {
    if (!instance._updatedHooks) {
      instance._updatedHooks = [];
    }
    instance._updatedHooks.push(fn);
  }
}

export function onUnmounted(fn) {
  const instance = getCurrentInstance();
  if (instance) {
    if (!instance._unmountedHooks) {
      instance._unmountedHooks = [];
    }
    instance._unmountedHooks.push(fn);
  }
}

export function onBeforeMount(fn) {
  const instance = getCurrentInstance();
  if (instance) {
    if (!instance._beforeMountHooks) {
      instance._beforeMountHooks = [];
    }
    instance._beforeMountHooks.push(fn);
  }
}

export function onBeforeUpdate(fn) {
  const instance = getCurrentInstance();
  if (instance) {
    if (!instance._beforeUpdateHooks) {
      instance._beforeUpdateHooks = [];
    }
    instance._beforeUpdateHooks.push(fn);
  }
}

export function onBeforeUnmount(fn) {
  const instance = getCurrentInstance();
  if (instance) {
    if (!instance._beforeUnmountHooks) {
      instance._beforeUnmountHooks = [];
    }
    instance._beforeUnmountHooks.push(fn);
  }
}

export function onErrorCaptured(fn) {
  const instance = getCurrentInstance();
  if (instance) {
    if (!instance._errorCapturedHooks) {
      instance._errorCapturedHooks = [];
    }
    instance._errorCapturedHooks.push(fn);
  }
}

export function onRenderTracked(fn) {
  const instance = getCurrentInstance();
  if (instance) {
    if (!instance._renderTrackedHooks) {
      instance._renderTrackedHooks = [];
    }
    instance._renderTrackedHooks.push(fn);
  }
}

export function onRenderTriggered(fn) {
  const instance = getCurrentInstance();
  if (instance) {
    if (!instance._renderTriggeredHooks) {
      instance._renderTriggeredHooks = [];
    }
    instance._renderTriggeredHooks.push(fn);
  }
}

export function onActivated(fn) {
  const instance = getCurrentInstance();
  if (instance) {
    if (!instance._activatedHooks) {
      instance._activatedHooks = [];
    }
    instance._activatedHooks.push(fn);
  }
}

export function onDeactivated(fn) {
  const instance = getCurrentInstance();
  if (instance) {
    if (!instance._deactivatedHooks) {
      instance._deactivatedHooks = [];
    }
    instance._deactivatedHooks.push(fn);
  }
}

export function nextTick(fn) {
  // 检查是否可以使用 XRender.nextTick
  if (typeof XRender !== 'undefined' && XRender.nextTick) {
    return new Promise((resolve) => {
      XRender.nextTick(() => {
        if (fn) fn();
        resolve();
      });
    });
  } else {
    // 备选方案：在 Node.js 环境中使用 setTimeout
    return new Promise((resolve) => {
      if (fn) {
        setTimeout(() => {
          fn();
          resolve();
        }, 0);
      } else {
        setTimeout(resolve, 0);
      }
    });
  }
}

export function provide(key, value) {
  const instance = getCurrentInstance();
  if (instance) {
    if (!instance._provides) {
      instance._provides = {};
    }
    instance._provides[key] = value;
  }
}

export function inject(key, defaultValue) {
  const instance = getCurrentInstance();
  if (!instance) {
    return defaultValue;
  }

  // 如果已经注入过，直接返回缓存值
  if (instance._injected && key in instance._injected) {
    return instance._injected[key];
  }

  // 向上查找最近的 provider
  let component = instance.parent;
  while (component) {
    if (component._provides && key in component._provides) {
      const value = component._provides[key];
      
      // 如果值是响应式对象，建立依赖关系
      if (value && typeof value === 'object' && (value.__isRef || value.__isReactive)) {
        // 订阅响应式变化
        if (!instance._injected) {
          instance._injected = {};
        }
        instance._injected[key] = value;
      } else if (!instance._injected) {
        instance._injected = {};
        instance._injected[key] = value;
      }
      
      return value;
    }
    component = component.parent;
  }

  // 如果没有找到，返回默认值
  if (arguments.length > 1) {
    if (!instance._injected) {
      instance._injected = {};
    }
    instance._injected[key] = defaultValue;
    return defaultValue;
  }

  console.warn(`[XRender] injection "${key}" not found`);
  return undefined;
}
