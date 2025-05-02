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
      $.lazyLoad(
        createElem(myHeader, {
          "slot:text": createElem("h2", {}, "Hello World"),
        }),
        createElem("p", {}, "loading...")
      ),
      createElem("router-view"),
      createElem(
        "transition",
        { name: "scale" },
        createElem(
          "div",
          { class: "content" },
          "$t('content')",
          createElem("h1", {}, "Hello World"),
          $.lazyLoad(inputPanel, createElem("p", {}, "loading...")),
          createElem("p", {}, "{{username}}")
        )
      ),
      createElem(myFooter, {
        slot: $.lazyLoad(
          createElem("p", {}, "Copyright 2025. XRender Demo."),
          createElem("p", {}, "loading...")
        ),
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
