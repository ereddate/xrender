const myAddBtn = $.component("MyAddBtn", {
  render(createElem) {
    return createElem(
      "button",
      { class: "btn", "@click": "clickHandle", ":style": "styleObj" },
      createElem("span", { ":text": "text", "v-if": "isShow === true" }),
      createElem("span", { text: "AddElse", "v-else": "true" }),
      createElem("span", {}, "{{count}}")
    );
  },
  data() {
    return {
      text: this.data.text || "Add",
      isShow: false,
      count: 0,
      styleObj: {},
    };
  },
  created() {
    console.log(this.data);
    console.log("created");
  },
  mounted() {
    this.data.styleObj = {
      border: "0",
      borderRadius: "5px",
      padding: "10px 20px",
      margin: "10px",
      cursor: "pointer",
      backgroundColor: "#8ebf5a",
    };
    console.log("mounted");
  },
  beforeUpdate() {
    console.log("beforeUpdate");
  },
  updated() {
    console.log("updated");
  },
  watch: {
    count(newVal, oldVal) {
      console.log(newVal, oldVal);
    },
  },
  methods: {
    clickHandle() {
      this.data.count++;
    },
  },
});

export default myAddBtn;
