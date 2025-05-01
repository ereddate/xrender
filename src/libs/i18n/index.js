import IntlMessageFormat from "intl-messageformat";

export class I18n {
  constructor(options) {
    this.name = "i18n";
    this.locale = options.locale || "en";
    this.messages = options.messages || {};
    this.formats = options.formats || {};
  }

  t(key, values = {}) {
    const message = this.getMessage(key);
    if (!message) return key;

    const formatter = new IntlMessageFormat(message, this.locale, this.formats);
    return formatter.format(values);
  }

  getMessage(key) {
    const localeMessages = this.messages[this.locale] || {};
    return localeMessages[key] || key;
  }

  setLocale(locale) {
    this.locale = locale;
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
