const mongoose = require("mongoose");
require("dotenv").config();


const questionsEdenAIModel = mongoose.Schema({
  content: String,
  contentSmall: String,
  answeredQuestionByUsers: [String],
  questionOwnedByPositions: [mongoose.Schema.ObjectId],
  category: String,
});

const QuestionsEdenAI = mongoose.model("QuestionsEdenAI", questionsEdenAIModel);
module.exports = { QuestionsEdenAI };
