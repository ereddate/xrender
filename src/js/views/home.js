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
      createElem("router-link", { to: "/about", text: "Go About" }),
      createElem(
        "div",
        {
          ":style": {
            height: "100px",
            width: "100px",
            backgroundColor: "red",
            cursor: "pointer",
          },
          "@tap": "handleTap",
          "@longTap": "handleLongTap",
          "@swipe": "handleSwipe",
          "@pinched": "handlePinched",
        },
        "Tap me!"
      )
    );
  },
  methods: {
    handleTap(e) {
      console.log("Tap event triggered");
    },
    handleLongTap() {
      console.log("LongTap event triggered");
    },
    handleSwipe(e) {
      console.log("Swipe direction:", e.direction);
    },
    handlePinched(e) {
      console.log("Pinched scale:", e.scale);
    },
  },
});

export default Home;
