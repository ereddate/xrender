// 注册自定义指令
$.directive("focus", {
  bind(el, value, vm) {
    el.focus();
  },
  update(el, value, vm) {
    if (value) el.focus();
  },
  unbind(el, vm) {
    el.blur();
  },
});

const inputPanel = $.component("InputPanel", {
  render(createElem) {
    return createElem(
      "div",
      { text: "{{username}}" },
      createElem("input", {
        type: "text",
        "@change": "updateUsername",
        ":value": "username",
        "v-focus": true,
      })
    );
  },
  data() {
    return {
      username: "John",
    };
  },
  methods: {
    updateUsername(e) {
      this.data.username = e.target.value;
    },
  },
});

export default inputPanel;
