import myHeader from "./components/header.js";
import myFooter from "./components/footer.js";
import inputPanel from "./components/inputPanel.js";
import "../css/App.scss";

const App = $.component("App", {
  transition: {
    name: "fade", // 过渡名称
    duration: 500, // 过渡持续时间
  },
  render(createElem) {
    return createElem(
      "div",
      { class: "page" },
      createElem(myHeader, {
        "slot:text": createElem("h2", {}, "Hello World"),
      }),
      createElem(
        "div",
        { class: "content" },
        "$t('content')",
        createElem("h1", {}, "Hello World"),
        inputPanel,
        createElem("p", {}, "{{username}}"),
        createElem("router-view")
      ),
      createElem(myFooter, {
        slot: createElem("p", {}, "Copyright 2025. XRender Demo."),
      })
    );
  },
  data() {
    return {
      username: "Hello World",
    };
  },
});

export default App;
