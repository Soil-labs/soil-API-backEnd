const mongoose = require("mongoose");
require("dotenv").config();


const questionsEdenAIModel = mongoose.Schema({
  content: String,
  answeredQuestionByUsers: [String],
  questionOwnedByCompanies: [mongoose.Schema.ObjectId],
});

const QuestionsEdenAI = mongoose.model("QuestionsEdenAI", questionsEdenAIModel);
module.exports = { QuestionsEdenAI };
