import { Home, About, NotFound } from "../views";
import { Router } from "../../libs/router";

const routes = [
  { path: "/", component: Home },
  { path: "/about", component: About },
  { path: "*", component: NotFound }, // 404 页面
];

const router = new Router(routes);
// 全局前置守卫
router.beforeEach((to, next) => {
  console.log(`beforeEach Navigated to: ${to.path}`);
  if (to.path === "/admin" && !isAuthenticated) {
    next("/login"); // 重定向到登录页
  } else {
    next(); // 继续路由跳转
  }
});
router.afterEach((to) => {
  console.log(`afterEach Navigated to: ${to.path}`);
  window.scrollTo(0, 0); // 页面滚动到顶部
});

export default router;
