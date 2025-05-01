import { Store } from "../../libs/store";
// 创建store实例
const store = new Store({
  state: {
    count: 0,
    user: null,
  },
  mutations: {
    increment(state) {
      state.count++;
    },
    setUser(state, user) {
      state.user = user;
    },
  },
  actions: {
    async login({ commit }, credentials) {
      // 模拟异步登录
      const user = await fakeLogin(credentials);
      commit("setUser", user);
    },
  },
  getters: {
    isAuthenticated: (state) => !!state.user,
  },
});

export default store;
