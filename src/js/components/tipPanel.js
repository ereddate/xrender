const tipPanel = $.component("Tip", {
  render(createElem) {
    return createElem("div", { class: "tip" }, `${this.data.text}`);
  },
  data() {
    return {
      text: "test Tip!",
    };
  },
});

export default tipPanel;
