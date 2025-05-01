const Home = $.component("home", {
  transition: {
    name: "scale", // 过渡名称
    duration: 300, // 过渡持续时间·
  },
  render(createElem) {
    return createElem(
      "div",
      {},
      "Home",
      createElem("router-link", { to: "/about", text: "Go About" })
    );
  },
});

export default Home;
