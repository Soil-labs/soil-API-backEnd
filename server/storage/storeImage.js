const { Storage, MultiPartUploadError } = require("@google-cloud/storage");

const projectId = "eden-app-386212";

const storage = new Storage({
  projectId,
  credentials: {
    type: "service_account",
    project_id: "eden-app-386212",
    private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.split(
      String.raw`\n`
    ).join("\n"),
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url:
      "https://www.googleapis.com/robot/v1/metadata/x509/eden-dev%40eden-app-386212.iam.gserviceaccount.com",
    universe_domain: "googleapis.com",
  },
});

const bucket = storage.bucket("eden_companies_images");

const storeCv = async (req, res) => {
  try {
    if (req.file) {
      const blob = bucket.file(req.file.originalname);
      const blobStream = blob.createWriteStream();

      blobStream.on("error", (err) => {
        console.log(err);
        blobStream.end(req.file.buffer);
        throw new Error(err);
      });

      blobStream.on("finish", () => {
        res.status(200).send("Success");
      });

      blobStream.end(req.file.buffer);
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

module.exports = storeCv;
