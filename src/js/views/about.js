const About = $.component("about", {
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
