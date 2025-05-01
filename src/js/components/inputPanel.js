const inputPanel = $.component("InputPanel", {
  render(createElem) {
    return createElem(
      "div",
      { text: "{{username}}" },
      createElem("input", {
        type: "text",
        "@change": "updateUsername",
        ":value": "username",
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
