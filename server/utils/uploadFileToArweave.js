const Arweave = require("arweave");
const { Blob } = require("buffer");
const { tmpdir } = require("os");
const Path = require("path");
const Crypto = require("crypto");
const fs = require("fs");

const { kty, n, e, d, p, q, dp, dq, qi } = process.env;

const ARWEAVE_KEY = { kty, n, e, d, p, q, dp, dq, qi };

//initialize arweave
const arweave = Arweave.init({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});

const temFile = () => {
  return Path.join(
    tmpdir(),
    `endorsement.${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.json`
  );
};

const _buildJSONFile = (fileObject) => {
  const filePath = temFile();
  fs.writeFileSync(filePath, JSON.stringify(fileObject), "utf8");
  return filePath;
};

async function getWalletAddress(key) {
  const walletAddress = await arweave.wallets.jwkToAddress(key);
  console.log("wallet address is ", walletAddress);
  return walletAddress;
}

async function getWalletBalance(address) {
  const balance = await arweave.wallets.getBalance(address);
  let winston = balance;
  let ar = arweave.ar.winstonToAr(balance);
  console.log(winston);
  //125213858712
  console.log(ar);
  //0.125213858712
  return winston;
}

const uploadFileToArweave = async (fileObject) => {
  try {
    const file = _buildJSONFile(fileObject);
    let data = fs.readFileSync(file);
    //check if we have a balance in wallet
    const walletAddress = await getWalletAddress(ARWEAVE_KEY);
    const balance = await getWalletBalance(walletAddress);

    if (balance < 5000) {
    } //contact admin to top up the balance

    //create a transaction:
    let transaction = await arweave.createTransaction(
      { data: data },
      ARWEAVE_KEY
    );
    transaction.addTag("Content-Type", "text/plain");
    //sign the transaction
    await arweave.transactions.sign(transaction, ARWEAVE_KEY);
    //submit the transaction using post (small file)
    const response = await arweave.transactions.post(transaction);
    console.log("transaction ID", transaction.id);
    fs.unlinkSync(file);
    console.log("response", response);
    if (response.status == 200) {
      return transaction.id;
    } else {
      throw new Error("File upload to Arweave failed");
    }
  } catch (error) {
    console.log("error uploading file", error);
  }
};

module.exports = { uploadFileToArweave };
