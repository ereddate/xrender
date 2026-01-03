import { XProgress } from './xprogress.js';

const xProgressPlugin = {
  install(app, options = {}) {
    const progress = new XProgress(options);
    
    app.XProgress = XProgress;
    app.$progress = progress;
    
    app.progress = {
      start: () => progress.start(),
      set: (n) => progress.set(n),
      inc: (amount) => progress.inc(amount),
      done: (force) => progress.done(force),
      remove: () => progress.remove(),
      configure: (opts) => progress.configure(opts),
      isStarted: () => progress.isStarted(),
      reset: () => progress.reset()
    };
    
    return progress;
  }
};

export default xProgressPlugin;
