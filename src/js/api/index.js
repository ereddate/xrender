import $ from "../../libs/core.js";
import "../../libs/fetch";
const ajax = new $.Fetch();

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

ajax.mock("/api/data", "GET", () => ({
  code: 200,
  data: {},
  message: "Mocked Data",
}));

ajax
  .request({
    url: "/api/user",
    method: "GET",
  })
  .then((response) => {
    console.log(response.data);
  });

ajax
  .request({
    url: "/api/data",
    method: "GET",
  })
  .then((response) => {
    console.log(response.data);
  });

export default ajax;
