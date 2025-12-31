import IntlMessageFormat from "intl-messageformat";

export class I18n {
  static version = '1.0.0';
  
  constructor(options) {
    this.name = "i18n";
    this.locale = options.locale || "en";
    this.fallbackLocale = options.fallbackLocale || "en";
    this.messages = options.messages || {};
    this.formats = options.formats || {};
    this.loading = false;
    this.listeners = new Set();
  }

  formatDate(date, options = {}) {
    return new Intl.DateTimeFormat(this.locale, options).format(date);
  }

  formatNumber(number, options = {}) {
    return new Intl.NumberFormat(this.locale, options).format(number);
  }

  onLocaleChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  getMessage(key) {
    const localeMessages = this.messages[this.locale] || {};
    const fallbackMessages = this.messages[this.fallbackLocale] || {};
    return localeMessages[key] || fallbackMessages[key] || key;
  }

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
      count: values.count || 0,
    });
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
  },
};

$ && $.use(xI18n);

export default xI18n;
