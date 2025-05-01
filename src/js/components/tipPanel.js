const tipPanel = $.component("Tip", {
  render(createElem) {
    return `<div class="tip">${this.data.text}</div>`;
  },
  data() {
    return {
      text: "test Tip!",
    };
  },
});

export default tipPanel;
