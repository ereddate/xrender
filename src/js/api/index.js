import $ from "../../libs/core.js";
import "../../libs/fetch";
const ajax = new $.Fetch();

// 注册指定格式的模拟数据
ajax.mock(
  "/api/user",
  "GET",
  {
    id: "number",
    name: "string",
    age: ["number", () => Math.floor(Math.random() * 100)],
    isActive: "boolean",
    createdAt: "date",
    tags: [3, "string"],
    city: "string",
    zipCode: "number",
  },
  10
);
ajax.mock(
  "/api/list",
  "GET",
  {
    name: "string",
    age: ["number", () => Math.floor(Math.random() * 100)],
    email: "string",
  },
  10
);
/* request.mock(
  "/api/user",
  "GET",
  {
    code: 200,
    data: {
      id: "number",
      name: "string",
      age: ["number", () => Math.floor(Math.random() * 100)],
      isActive: "boolean",
      createdAt: "date",
      tags: [3, "string"],
      city: "string",
      zipCode: "number",
    },
    message: "Mocked Data",
  },
  ["code", "message"]
); */

// 注册常规格式的模拟数据
ajax.mock("/api/data", "GET", () => ({
  code: 200,
  data: {},
  message: "Mocked Data",
}));

// 发送请求
ajax
  .request({
    url: "/api/user",
    method: "GET",
  })
  .then((response) => {
    console.log(response.data); // 输出: { id: 42, name: 'abc123', age: 25, isActive: true, createdAt: '2023-10-01T12:00:00Z', tags: ['tag1', 'tag2', 'tag3'] }
  });

ajax
  .request({
    url: "/api/data",
    method: "GET",
  })
  .then((response) => {
    console.log(response.data); // 输出: { message: 'Mocked Data' }
  });

export default ajax;
