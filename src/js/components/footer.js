import myBtn from "./myBtn.js";
import "../../css/footer.scss";

const myFooter = $.component("MyFooter", {
  render(createElem) {
    return createElem(
      "footer",
      { class: "footer", text: "$t('footer')" },
      createElem("slot"),
      myBtn
    );
  },
});

export default myFooter;
