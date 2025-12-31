import { Home, About, NotFound } from "../views";
import { Router } from "../../libs/router";

const routes = [
  { path: "/", component: Home },
  { path: "/about", component: About },
  { path: "*", component: NotFound },
];

const router = new Router(routes);

let isAuthenticated = false;

router.beforeEach((to, next) => {
  console.log(`beforeEach Navigated to: ${to.path}`);
  if (to.path === "/admin" && !isAuthenticated) {
    next("/login");
  } else {
    next();
  }
});

router.afterEach((to) => {
  console.log(`afterEach Navigated to: ${to.path}`);
  window.scrollTo(0, 0);
});

export default router;
