const About = $.component("about", {
  transition: {
    name: "v", // 过渡名称
    duration: 300, // 过渡持续时间
  },
  render(createElem) {
    return createElem(
      "div",
      {},
      "About",
      createElem("router-link", { to: "/", text: "Go Home" }),
      createElem(function () {
        return `<p :class="pClass">
          ${this.data.msg}
          <button type="button" @click="buttonClickHandle">{{msg}}</button>
        </p>`;
      })
    );
  },
  data() {
    return {
      msg: "About Page",
      pClass: "p_class",
    };
  },
  methods: {
    buttonClickHandle() {
      console.log("About Page Clicked");
    },
  },
});

export default About;
