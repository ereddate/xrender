export class XProgress {
  static version = '1.0.0';
  
  constructor(options = {}) {
    this.settings = {
      minimum: 0.08,
      easing: 'linear',
      speed: 200,
      trickle: true,
      trickleSpeed: 200,
      showSpinner: true,
      barSelector: '[role="bar"]',
      parent: 'body',
      template: `
        <div class="xprogress">
          <div class="xprogress-bar" role="bar"></div>
          <div class="xprogress-spinner">
            <div class="xprogress-spinner-icon"></div>
          </div>
        </div>
      `,
      ...options
    };
    
    this.status = null;
    this.trickleTimer = null;
    this.element = null;
    this.barElement = null;
    this.spinnerElement = null;
  }

  configure(options) {
    Object.assign(this.settings, options);
    return this;
  }

  set(n) {
    const started = this.status !== null;
    
    n = Math.min(Math.max(n, this.settings.minimum), 1);
    this.status = n === 1 ? null : n;
    
    if (!started && n !== 1) {
      this.render();
      this.findElements();
      this.startTrickle();
    } else if (n === 1) {
      this.complete();
    }
    
    this.updateProgress(n);
    
    return this;
  }

  start() {
    if (this.status !== null) {
      return this;
    }
    
    this.set(0);
    return this;
  }

  done(force) {
    if (!force && !this.status) {
      return this;
    }
    
    return this.inc(0.3 + 0.5 * Math.random()).set(1);
  }

  inc(amount) {
    let n = this.status;
    
    if (!n) {
      return this.start();
    }
    
    if (typeof amount !== 'number') {
      amount = (1 - n) * Math.random() * 0.1 + 0.025;
    }
    
    n = Math.min(n + amount, 0.994);
    
    return this.set(n);
  }

  complete() {
    this.remove();
    this.stopTrickle();
    return this;
  }

  remove() {
    if (!this.element) {
      return this;
    }
    
    this.element.remove();
    this.element = null;
    this.barElement = null;
    this.spinnerElement = null;
    return this;
  }

  render() {
    if (this.element) {
      return this;
    }
    
    const parent = document.querySelector(this.settings.parent);
    if (!parent) {
      console.error(`[XProgress] Parent element "${this.settings.parent}" not found`);
      return this;
    }
    
    const container = document.createElement('div');
    container.innerHTML = this.settings.template;
    this.element = container.firstElementChild;
    parent.appendChild(this.element);
    
    return this;
  }

  findElements() {
    if (!this.element) {
      return;
    }
    this.barElement = this.element.querySelector(this.settings.barSelector);
    this.spinnerElement = this.element.querySelector('.xprogress-spinner');
    
    if (!this.barElement) {
      console.error('[XProgress] Bar element not found');
    }
    
    if (this.settings.showSpinner && this.spinnerElement) {
      this.spinnerElement.style.display = 'block';
    } else if (this.spinnerElement) {
      this.spinnerElement.style.display = 'none';
    }
  }

  updateProgress(n) {
    if (!this.barElement) {
      return;
    }
    
    const percentage = (n * 100).toFixed(0) + '%';
    this.barElement.style.width = percentage;
    this.barElement.setAttribute('aria-valuenow', percentage);
  }

  startTrickle() {
    if (!this.settings.trickle) {
      return;
    }
    
    this.stopTrickle();
    this.trickleTimer = setInterval(() => {
      this.inc();
    }, this.settings.trickleSpeed);
  }

  stopTrickle() {
    if (this.trickleTimer) {
      clearInterval(this.trickleTimer);
      this.trickleTimer = null;
    }
  }

  isStarted() {
    return this.status !== null;
  }

  reset() {
    this.complete();
    this.status = null;
    return this;
  }

  static create(options) {
    return new XProgress(options);
  }
}

export default XProgress;
