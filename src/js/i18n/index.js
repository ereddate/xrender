import { I18n } from "../../libs/i18n";
import zh from "./lang/zh.js";
import en from "./lang/en.js";

const i18n = new I18n({
  locale: "zh",
  messages: { zh, en },
});

export default i18n;
