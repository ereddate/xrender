import ajax from "../api";
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
      ),
      createElem(
        "ul",
        {},
        this.data.items.map((item) =>
          createElem(
            "li",
            {},
            createElem("p", { key: item.name }, item.name),
            createElem("p", { key: item.age + "" }, item.age + ""),
            createElem("p", { key: item.email }, item.email)
          )
        )
      )
    );
  },
  data() {
    return {
      items: [],
    };
  },
  created() {
    const that = this;
    ajax
      .request({
        url: "/api/user",
        method: "GET",
      })
      .then((response) => {
        console.log(response.data);
        that.data.items = response.data;
      });
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
