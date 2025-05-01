// 创建插件
const myPlugin = {
  install(app) {
    app.component("my-plugin-component", {
      render(createElem) {
        return createElem("div", {}, "{{message}}", createElem("slot"));
      },
      data() {
        return {
          message: "Hello from plugin!",
        };
      },
      created() {
        this.data.message = this.props.message;
      },
    });
  },
};

// 安装插件
$.use(myPlugin);
