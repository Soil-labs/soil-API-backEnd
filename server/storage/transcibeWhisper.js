const { useWhisperAPI } = require("../utils/aiModules");
const { Router } = require("express");
const cors = require("cors");
const Multer = require("multer");
const { useWhisperAPI } = require("../graphql/resolvers/utils/aiModules");

const multer = new Multer({
  storage: Multer.memoryStorage(),
  limits: { fieleSize: 25 * 1024 * 1024 },
});

const audioRoutes = () => {
  const router = Router();

  router.post(
    "/transcribe-audio",
    multer.single("audiofile"),
    async (req, res) => {
      try {
        if (req.file) {
          const transcription = await useWhisperAPI(req.file.buffer);

          res.status(200).send({ transcription });
        } else {
          res.status(400).send({ error: "No audio file uploaded." });
        }
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
      }
    },
  );

  return router;
};

module.exports = { audioRoutes };
