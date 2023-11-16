require("dotenv").config();

const { Node } = require("../../../models/nodeModal");
const { Members } = require("../../../models/membersModel");
const { Position } = require("../../../models/positionModel");
const { MemoryPinecone } = require("../../../models/memoryPineconeModel");

const { Configuration, OpenAIApi } = require("openai");

const { printC } = require("../../../printModule");


const axios = require("axios");
const { PineconeClient } = require("@pinecone-database/pinecone");

const { REACT_APP_MONGO_DATABASE } = process.env;



function chooseAPIkey(chooseAPI = "") {

  let openAI_keys = [process.env.REACT_APP_OPENAI_1];

  if (chooseAPI == "API 2") {
    openAI_keys = [process.env.REACT_APP_OPENAI_2];
  } else if (chooseAPI == "API 1") {
    openAI_keys = [process.env.REACT_APP_OPENAI_1];
  }

  // randomly choose one of the keys
  let randomIndex = Math.floor(Math.random() * openAI_keys.length);
  let key = openAI_keys[randomIndex];

  return key;
}


async function deletePineCone(deletePineIDs) {
  const pinecone = new PineconeClient();
  await pinecone.init({
    environment: "us-east1-gcp",
    apiKey: "901d81d8-cc8d-4648-aeec-229ce61d476d",
  });

  const index = await pinecone.Index("profile-eden-information");

  try {
    res = await index.delete1({ ids: deletePineIDs });
    // console.log("res = " , res)
  } catch (err) {
    console.log("err = ", err);
  }
}



async function createEmbeddingsGPT(words_n) {
  // words_n = ["node.js", "react", "angular"];
  let OPENAI_API_KEY = chooseAPIkey();
  response = await axios.post(
    "https://api.openai.com/v1/embeddings",
    {
      input: words_n,
      // model: "text-similarity-davinci-001",
      model: "text-embedding-ada-002",
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    }
  );

  res = response.data.data.map((obj) => {
    return obj.embedding;
  });

  // console.log("res = ", res);
  return res;
}


// Generates a random 6-digit ID
async function generateRandomID(numDigit = 8) {
  // Define a string of possible characters to choose from
  const possibleChars = "0123456789abcdefghijklmnopqrstuvwxyz";
  // Initialize an empty string to hold the ID
  let id = "";

  // Loop 6 times to generate each digit of the ID
  for (let i = 0; i < numDigit; i++) {
    // Generate a random index into the possibleChars string
    const randomIndex = Math.floor(Math.random() * possibleChars.length);
    // Get the character at the random index and add it to the ID
    id += possibleChars.charAt(randomIndex);
  }

  // Return the generated ID
  return id;
}



async function upsertEmbedingPineCone(data) {
  const pinecone = new PineconeClient();
  await pinecone.init({
    environment: "us-east1-gcp",
    apiKey: "901d81d8-cc8d-4648-aeec-229ce61d476d",
  });

  const index = await pinecone.Index("profile-eden-information");

  id_message = await generateRandomID(8);

  const embed = await createEmbeddingsGPT(data.text);

  let metadata = {
    text: data.text,
    label: data.label,
  };

  if (data._id) {
    metadata = {
      ...metadata,
      _id: data._id,
    };
  }

  if (data.convKey) {
    metadata = {
      ...metadata,
      convKey: data.convKey,
    };
  }

  if (data.category) {
    metadata = {
      ...metadata,
      category: data.category,
    };
  }

  metadata = {
    ...metadata,
    database: REACT_APP_MONGO_DATABASE,
  };

  printC(metadata, "3", "metadata", "p")



  const upsertRequest = {
    vectors: [
      {
        id: id_message,
        values: embed[0],
        metadata: metadata,
      },
    ],
  };

  // console.log("id_message = ", id_message);

  let upsertResponse = await index.upsert({ upsertRequest });

  upsertResponse = {
    ...upsertResponse,
    pineConeID: id_message,
  };

  return upsertResponse;
}

async function addMemoryPineconeFunc(filter) {


  // --------------- Check fi this memory Exist ----------------
  let flagMemoryExist = false
  let memoryData
  if (filter._id){
    memoryData = await MemoryPinecone.findOne({ _id: filter._id });
    if (memoryData) {
      flagMemoryExist = true

      return {
        done: false,
        memoryData,
      }
    }
  }

  if (filter.pineconeID){
    memoryData = await MemoryPinecone.findOne({ pineconeID: filter.pineconeID });
    if (memoryData) {
      flagMemoryExist = true


      return {
        done: false,
        memoryData,
      }
    }
  }

  if (filter.memory){
    memoryData = await MemoryPinecone.findOne({ memory: filter.memory });
    if (memoryData) {
      flagMemoryExist = true


      return {
        done: false,
        memoryData,
      }
    }
  }
  // --------------- Check fi this memory Exist ----------------


  // --------------- Add memory to Pinecone ----------------
  let filterUpsert = {
    ...filter,
    text: filter.memory,
  }

  if (filter.userID) {
    filterUpsert = {
      ...filterUpsert,
    _id: filter.userID,
    };
  } else if (filter.positionID) {
    filterUpsert = {
      ...filterUpsert,
      _id: filter.positionID,
    };
  }

  filterUpsert = {
    ...filterUpsert,
    database: REACT_APP_MONGO_DATABASE,
  };

  printC(filterUpsert, "3", "filterUpsert", "p")
  // sdf0


  let maxAttempts = 3;
  let numAttempts = 0;
  let success = false;

  while (numAttempts < maxAttempts && !success) {
    try {
      filterUpsert = await upsertEmbedingPineCone(filterUpsert)

      success = true;
    } catch (error) {
      console.error(error);
      numAttempts++;
    }
  }


  filter = {
    ...filter,
    pineconeID: filterUpsert.pineConeID,
    database: REACT_APP_MONGO_DATABASE,
  }
  // --------------- Add memory to Pinecone ----------------


  // --------------- Add memory to DB ----------------

    memoryData = new MemoryPinecone(filter);
    await memoryData.save();

  // --------------- Add memory to DB ----------------




  console.log("change = ",memoryData )
  return {
    done: true,
    memoryData
  } 

  
}



async function findMemoryPineconeFunc(filter) {

  let searchQuery_and = [];
  let searchQuery = {};

  if (filter._id) {
    searchQuery_and.push({ _id: filter._id });
  }

  if (filter.userID) {
    searchQuery_and.push({ userID: filter.userID });
  }

  if (filter.positionID) {
    searchQuery_and.push({ positionID: filter.positionID });
  }

  if (filter.label) {
    searchQuery_and.push({ label: filter.label });
  }

  if (filter.pineconeID) {
    searchQuery_and.push({ pineconeID: filter.pineconeID });
  }

  searchQuery_and.push({ database: REACT_APP_MONGO_DATABASE });
  

  if (searchQuery_and.length > 0) {
    searchQuery = {
      $and: searchQuery_and,
    };
  } else {
    searchQuery = {};
  }

  let memoriesData = await MemoryPinecone.find(searchQuery);

  return memoriesData;
  
}



async function deleteMemoriesPineconeFunc(filter) {


  memoriesData = await findMemoryPineconeFunc(filter)
  

  printC(memoriesData, "3", "memoriesData", "p")

  //create two arrays one with the _id and one with the pineconeID
  let pineconeIDArray = []
  let _idArray = []

  memoriesData.forEach((memory) => {
    pineconeIDArray.push(memory.pineconeID)
    _idArray.push(memory._id)
  })

  printC(pineconeIDArray, "3", "pineconeIDArray", "p")
  printC(_idArray, "3", "_idArray", "p")
  
  // --------------- Delete memory from Pinecone ----------------
  await deletePineCone(pineconeIDArray)
  // --------------- Delete memory from Pinecone ----------------


  // --------------- Delete memory from DB ----------------
  await MemoryPinecone.deleteMany({ _id: { $in: _idArray } });
  // --------------- Delete memory from DB ----------------




  return memoriesData;
  
}


module.exports = {
  addMemoryPineconeFunc,
  findMemoryPineconeFunc,
  deleteMemoriesPineconeFunc,
};
