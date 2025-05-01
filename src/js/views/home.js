const Home = $.component("home", {
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
