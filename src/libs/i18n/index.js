import IntlMessageFormat from "intl-messageformat";

export class I18n {
  constructor(options) {
    this.name = "i18n";
    this.locale = options.locale || "en";
    this.fallbackLocale = options.fallbackLocale || "en"; // 新增：默认语言
    this.messages = options.messages || {};
    this.formats = options.formats || {};
    this.loading = false; // 新增：加载状态
    this.listeners = new Set(); // 新增：事件监听器
  }
  // 新增：日期格式化
  formatDate(date, options = {}) {
    return new Intl.DateTimeFormat(this.locale, options).format(date);
  }

  // 新增：数字格式化
  formatNumber(number, options = {}) {
    return new Intl.NumberFormat(this.locale, options).format(number);
  }
  // 新增：添加事件监听器
  onLocaleChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  // 修改：获取消息时支持默认语言回退
  getMessage(key) {
    const localeMessages = this.messages[this.locale] || {};
    const fallbackMessages = this.messages[this.fallbackLocale] || {};
    return localeMessages[key] || fallbackMessages[key] || key;
  }
  // 新增：动态加载语言包
  async loadLocale(locale) {
    if (this.loading) return;
    this.loading = true;

    try {
      const response = await fetch(`/locales/${locale}.json`);
      const messages = await response.json();
      this.addMessages(locale, messages);
      this.setLocale(locale);
    } catch (error) {
      console.error(`Failed to load locale: ${locale}`, error);
    } finally {
      this.loading = false;
    }
  }
  t(key, values = {}) {
    const message = this.getMessage(key);
    if (!message) return key;

    const formatter = new IntlMessageFormat(message, this.locale, this.formats);
    return formatter.format({
      ...values,
      count: values.count || 0, // 支持复数处理
    });
  }

  getMessage(key) {
    const localeMessages = this.messages[this.locale] || {};
    return localeMessages[key] || key;
  }

  setLocale(locale) {
    this.locale = locale;
    this.listeners.forEach((callback) => callback(locale));
  }

  addMessages(locale, messages) {
    this.messages[locale] = {
      ...(this.messages[locale] || {}),
      ...messages,
    };
  }
}

const xI18n = {
  install(app) {
    app.I18n = I18n;
    app.$i18n = null;
    /* app.useI18n = function (i18n) {
      this.$i18n = new this.I18n({ ...i18n });
      return this;
    }; */
  },
};

$ && $.use(xI18n);
