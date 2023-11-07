const { Router } = require("express");
const cors = require("cors");

const storeCv = require("./storeCv");
const storeImage = require("./storeImage");
const transcribeWhisper = require("./transcribeWhisper");

const Multer = require("multer");
const multer = new Multer({
  storage: Multer.memoryStorage(),
  limits: { fieldSize: 25 * 1024 * 1024 }, //25MB
});

const storageRoutes = () => {
  const router = Router();

  router.post("/store-cv", multer.single("pdffile"), storeCv);
  router.post("/store-image", multer.single("imgfile"), storeImage);
  router.post(
    "/transcribeWhisper",
    multer.single("audiofile"),
    transcribeWhisper
  ); // New route for audio transcription

  return router;
};

module.exports = { storageRoutes };
