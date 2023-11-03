const { Router } = require("express");
const cors = require("cors");

const storeCv = require("./storeCv");
const storeImage = require("./storeImage");

const Multer = require("multer");
const multer = new Multer({
  storage: Multer.memoryStorage(),
  limits: { fieldSize: 1 * 1024 * 1024 }, //1MB
});

const storageRoutes = () => {
  const router = Router();

  router.post("/store-cv", multer.single("pdffile"), storeCv);
  router.post("/store-image", multer.single("imgfile"), storeImage);

  return router;
};

module.exports = { storageRoutes };
