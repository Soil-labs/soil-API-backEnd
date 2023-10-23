const { Router } = require("express");
const cors = require("cors");

const storeCv = require("./storeCv");

const Multer = require("multer");
const multer = new Multer({
  storage: Multer.memoryStorage(),
  limits: { fieldSize: 1 * 1024 * 1024 }, //1MB
});

const storageRoutes = () => {
  const router = Router();

  router.post("/store-cv", cors(), multer.single("pdffile"), storeCv);

  return router;
};

module.exports = { storageRoutes };
