import myBtn from "./myBtn.js";
import myAddBtn from "./myAddBtn.js";
import tipPanel from "./tipPanel.js";
import "../../css/header.scss";

const myHeader = $.component("MyHeader", {
  render(createElem) {
    return createElem(
      "header",
      { class: "header", "v-bind:text": "text", ":style": "styleObj" },
      createElem("slot", { name: "text" }),
      createElem(myBtn, { text: "$t('header')" }),
      createElem(myAddBtn, { text: "$t('header')" }),
      tipPanel,
      createElem("p", {}, "{{formattedDate}}"),
      createElem("my-plugin-component", {
        message: "plugin! props",
        slot: createElem("p", {}, "$t('header')"),
      })
    );
  },
  data() {
    return {
      text: "header",
      styleObj: {
        backgroundColor: "#efefef",
      },
    };
  },
  computed: {
    formattedDate() {
      return new Date().toISOString().slice(0, 10);
    },
  },
});

export default myHeader;
