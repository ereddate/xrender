import { Store } from "../../libs/store";

const fakeLogin = async (credentials) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: 1,
        name: 'Test User',
        email: credentials.email || 'test@example.com'
      });
    }, 1000);
  });
};

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
      const user = await fakeLogin(credentials);
      commit("setUser", user);
    },
  },
  getters: {
    isAuthenticated: (state) => !!state.user,
  },
});

export default store;
