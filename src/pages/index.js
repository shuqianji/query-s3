import home from "./home/home.vue";
import files from "./files/files.vue";

export default [
  {
    path: "/",
    component: home,
  },
  {
    path: "/list/:prefix/:keyId/:bucket",
    component: files,
  },
];
