const { useWhisperAPI } = require("../graphql/resolvers/utils/aiModules");

const transcribeWhisper = async (req, res) => {
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
};

module.exports = transcribeWhisper;
