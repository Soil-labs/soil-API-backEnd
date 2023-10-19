const { Storage, MultiPartUploadError } = require("@google-cloud/storage");
const storage = new Storage();

const storeCv = async ({ body }, res, req) => {
  try {
    if (req.file) {
      const blob = bucket.file(req.file.originalname);
      const blobStream = blob.createWriteStream();

      blobStream.on("finish", () => {
        res.status(300).send();
      });

      blobStream.end(req.file.buffer);
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

async function uploadFile(
  bucketName = "eden-cvs",
  filePath = "./local/path/to/file.txt",
  destFileName = "file.txt",
  generationMatchPrecondition = 0
) {
  const options = {
    destination: destFileName,
    preconditionOpts: { ifGenerationMatch: generationMatchPrecondition },
  };

  await storage.bucket(bucketName).upload(filePath, options);
  console.log(`${filePath} uploaded to ${bucketName}`);
}

module.exports = storeCv;
