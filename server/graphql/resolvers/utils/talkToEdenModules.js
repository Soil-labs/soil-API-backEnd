// const { Conversation } = require("../../../models/conversationModel");
const { Members } = require("../../../models/membersModel");
const { Position } = require("../../../models/positionModel");

const { printC } = require("../../../printModule");

// const { useGPT4chat,summarizeOldConversationMessages,upsertEmbedingPineCone} = require("../utils/aiExtraModules");

async function talkToEdenMain(varT) {

  let {message,convData} = varT;
  

  printC(convData, "1", "convData", "g");


  



}



module.exports = {
  talkToEdenMain,
};
