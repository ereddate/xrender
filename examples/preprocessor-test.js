import { createComponent } from '../../src/libs/sfc/sfc-builder.js';

const componentSource = `
<template>
  <div class="container">
    <h1 class="title">SCSS 和 Less 预处理器测试</h1>
    <div class="scss-box">
      <h2>SCSS 样式</h2>
      <p>这是一个使用 SCSS 编写的样式块</p>
    </div>
    <div class="less-box">
      <h2>Less 样式</h2>
      <p>这是一个使用 Less 编写的样式块</p>
    </div>
    <div class="css-modules">
      <h2>CSS Modules</h2>
      <p>这是一个使用 CSS Modules 的样式块</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello XRender!'
    };
  }
};
</script>

<style lang="scss" scoped>
$primary-color: #3498db;
$secondary-color: #2ecc71;
$border-radius: 8px;

.container {
  padding: 20px;
  font-family: Arial, sans-serif;
  
  .title {
    color: $primary-color;
    text-align: center;
    margin-bottom: 30px;
  }
  
  .scss-box {
    background-color: lighten($primary-color, 40%);
    border: 2px solid $primary-color;
    border-radius: $border-radius;
    padding: 20px;
    margin-bottom: 20px;
    
    h2 {
      color: $primary-color;
      margin-top: 0;
    }
    
    &:hover {
      box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
    }
  }
}
</style>

<style lang="less" scoped>
@primary-color: #e74c3c;
@secondary-color: #f39c12;
@border-radius: 8px;

.less-box {
  background-color: lighten(@primary-color, 40%);
  border: 2px solid @primary-color;
  border-radius: @border-radius;
  padding: 20px;
  margin-bottom: 20px;
  
  h2 {
    color: @primary-color;
    margin-top: 0;
  }
  
  &:hover {
    box-shadow: 0 4px 8px rgba(231, 76, 60, 0.3);
  }
}
</style>

<style module>
@primary-color: #9b59b6;
@border-radius: 8px;

.cssModules {
  background-color: lighten(@primary-color, 40%);
  border: 2px solid @primary-color;
  border-radius: @border-radius;
  padding: 20px;
  
  h2 {
    color: @primary-color;
    margin-top: 0;
  }
  
  &:hover {
    box-shadow: 0 4px 8px rgba(155, 89, 182, 0.3);
  }
}
</style>
`;

export const PreprocessorTestComponent = createComponent(componentSource);
