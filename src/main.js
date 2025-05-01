import "./css/styles.scss";
import "./libs/core.js";
import "./libs/router";
import router from "./js/router";
import "./libs/store";
import store from "./js/store";
import "./libs/i18n";
import i18n from "./js/i18n";
import "./js/plugins";
import App from "./js/App.js";

$.createApp({
  router,
  store,
  i18n,
  App,
}).$mount("#app");

console.log($);
