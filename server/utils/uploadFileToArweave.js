const Arweave = require("arweave");

const { kty, n, e, d, p, q, dp, dq, qi } = process.env;

const ARWEAVE_KEY = { kty, n, e, d, p, q, dp, dq, qi };

//initialize arweave
const arweave = Arweave.init({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});

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
  console.log(ar);
  return winston;
}

const uploadFileToArweave = async (fileObject) => {
  try {
    //check if we have a balance in wallet
    const walletAddress = await getWalletAddress(ARWEAVE_KEY);
    const balance = await getWalletBalance(walletAddress);

    if (balance < 5000) {
        //contact admin to top up the balance
    } 
    //create a transaction:
    let transaction = await arweave.createTransaction(
      { data: Buffer.from(JSON.stringify(fileObject), "utf8") },
      ARWEAVE_KEY
    );
    transaction.addTag("Content-Type", "text/plain");
    //sign the transaction
    await arweave.transactions.sign(transaction, ARWEAVE_KEY);
    //submit the transaction using post (small file)
    const response = await arweave.transactions.post(transaction);
    console.log("transaction ID", transaction.id);
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
