const { Router } = require("express");
const storeCv = require("./storeCv");

const Multer = require("multer");
const multer = new Multer({
  storage: Multer.memoryStorage(),
  limits: { fieldSize: 2 * 1024 * 1024 }, //2MB
});

const storageRoutes = () => {
  const router = Router();

  router.post("/store-cv", multer.single("pdffile"), storeCv);

  return router;
};

module.exports = { storageRoutes };
