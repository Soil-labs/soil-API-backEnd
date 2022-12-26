const { Router } = require("express");
const init = require("./init");
const login = require("./login");
const token = require("./token");

const authRoutes = () => {
  const router = Router();

  router.post("/login", login);
  router.get("/init", init);
  router.post("/token", token);

  return router;
};

module.exports = authRoutes;
