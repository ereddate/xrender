const myBtn = $.component("MyBtn", {
  render(createElem) {
    return createElem(
      "button",
      {
        ":class": "active ? 'btn' : 'button'",
        "@click.prevent": "clickHandle",
      },
      createElem("span", { "v-text": "text" })
    );
  },
  data() {
    return {
      text: this.data.text || "Click me",
      active: false,
    };
  },
  created() {
    console.log(this.data);
    console.log("created");
  },
  methods: {
    clickHandle() {
      alert("Hello World");
      this.data.active = this.data.active ? false : true;
    },
  },
});

export default myBtn;
