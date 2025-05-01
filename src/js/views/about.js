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
      createElem("router-link", { to: "/", text: "Go Home" })
    );
  },
});

export default About;
