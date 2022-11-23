const { Router } = require("express");
const init = require("./init");
const login = require("./login");

const authRoutes = () => {
  const router = Router();

  router.post("/login", login);
  router.get("/init", init);

  return router;
};

module.exports = authRoutes;
