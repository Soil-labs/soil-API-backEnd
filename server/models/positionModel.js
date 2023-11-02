const mongoose = require("mongoose");
require("dotenv").config();

const positionModel = mongoose.Schema({
  name: String,
  icon: String,
  url: String,
  companyID: mongoose.Schema.ObjectId,
  mainUserID: String,
  cardsPositionCalculated: Boolean,
  prioritiesPositionCalculated: Boolean,
  conduct: {
    number: String,
    whatsappNumber: String,
    email: String,
    telegram: String,
    telegramChatID: String,
    telegramConnectionCode: String,
  },
  stateEdenChat: {
    positionIDs: [mongoose.Schema.ObjectId],
    categoryChat: {
      type: String,
      enum: [
        "REJECT_CANDIDATE",
        "ACCEPT_CANDIDATE",
        "ASK_CANDIDATE",
        "PITCH_POSITION_CANDIDATE",
      ],
    },
  },
  employees: [
    {
      typeT: String,
      userID: String,
    },
  ],
  questionsToAsk: [
    {
      questionID: mongoose.Schema.ObjectId,
      bestAnswer: String,
    },
  ],
  memory: {
    core: String,
  },
  positionsRequirements: {
    originalContent: String,
    content: String,
    notesRequirConv: String,
    roleDescription: [String],
    benefits: [String],
    positionMemory: [
      {
        memoryContent: String,
        pineConeID: String,
      },
    ],
    positionPreparationMemory: Boolean,
    tradeOffs: [
      {
        tradeOff1: String,
        tradeOff2: String,
        reason: String,
        selected: String,
      },
    ],
    priorities: [
      {
        priority: String,
        reason: String,
      },
    ],
    keyAttributes: [
      {
        attribute: String,
      },
    ],
    futurePotential: [
      {
        attribute: String,
      },
    ],
  },
  nodes: [
    {
      nodeID: mongoose.Schema.ObjectId,
    },
  ],
  convRecruiter: [
    {
      userID: String,
      conversationID: mongoose.Schema.ObjectId,
      readyToDisplay: Boolean,
      positionQuestions: [
        {
          question: String,
          content: String,
        },
      ],
      roleQuestions: [
        {
          question: String,
          content: String,
        },
      ],
      convMemory: [
        {
          memoryContent: String,
          pineConeID: String,
        },
      ],
    },
  ],
  convRecruiterReadyToDisplay: Boolean,
  talentList: [
    {
      name: String,
      talent: [
        {
          userID: String,
        },
      ],
    },
  ],
  interviewQuestionsForPosition: [
    {
      originalQuestionID: mongoose.Schema.ObjectId,
      originalContent: String,
      personalizedContent: String,
    },
  ],
  candidatesReadyToDisplay: Boolean,
  candidatesFlagAnalysisCreated: Boolean,
  candidates: [
    {
      userID: String,
      overallScore: Number,
      skillScore: Number,
      acceptedOrRejected: Boolean,
      readyToDisplay: Boolean,
      conversationID: mongoose.Schema.ObjectId,
      dateApply: Date,
      scoreCardTotal: {
        score: Number,
        scoreCardCalculated: Boolean,
      },
      scoreCardCategoryMemories: [
        {
          category: {
            type: String,
            enum: [
              "TECHNICAL_SKILLS",
              "SOFT_SKILLS",
              "BEHAVIOR",
              "EXPERIENCE",
              "INDUSTRY_KNOWLEDGE",
              "DOMAIN_EXPERTISE",
              "INTERESTS",
              "CORE_VALUES",
              "GOALS",
              "EDUCATION",
              "OTHER",
            ], // ScoreCard = Checks and Balances
          },
          score: Number,
          reason: String,
          priority: Number,
          scoreCardsPosition: [
            {
              cardID: String,
              score: Number,
              reason: String,
              scoreCardsCandidate: [
                {
                  cardID: String, // don't need to save the score and reason because it is already inside the card
                  scoreAlignment: Number,
                },
              ],
            },
          ],
        },
      ],
      summaryQuestions: [
        {
          questionID: mongoose.Schema.ObjectId,
          originalQuestionContent: String,
          questionContent: String,
          questionContentSmall: String,
          answerContent: String,
          answerContentSmall: String,
          bestAnswerPosition: String,
          reason: String,
          score: Number,
          subConversationAnswer: [
            {
              role: String, // user or bot
              content: String,
            },
          ],
        },
      ],
      interviewQuestionsForCandidate: [
        {
          originalQuestionID: mongoose.Schema.ObjectId,
          originalContent: String,
          personalizedContent: String,
        },
      ],
      notesInterview: [
        {
          categoryName: String,
          score: Number,
          reason: [String],
        },
      ],
      averageScoreNotesInterview: Number,
      compareCandidatePosition: {
        CVToPosition: {
          content: String,
          score: Number,
        },
        CV_ConvoToPosition: [
          {
            categoryName: String,
            score: Number,
            reason: [String],
          },
        ],
        CV_ConvoToPositionAverageScore: Number,
        reportPassFail: [
          {
            categoryName: String,
            title: String,
            score: Number,
            reason: String,
            IDb: String,
          },
        ],
      },
      analysisCandidateEdenAI: {
        flagAnalysisCreated: Boolean,
        background: {
          content: String,
          smallVersion: String,
          oneLiner: String,
        },
        fitRequirements: {
          content: String,
        },
        skills: {
          content: String,
        },
      },
      keyAttributes: [
        {
          attribute: String,
          score: Number,
          reason: String,
        },
      ],
      futurePotential: [
        {
          attribute: String,
          score: Number,
          reason: String,
        },
      ],
    },
  ],
  generalDetails: {
    startDate: String,
    visaRequired: Boolean,
    officePolicy: String,
    officeLocation: String,
    contractType: String,
    contractDuration: String,
    yearlySalary: Number,
    socials: {
      portfolio: String,
      linkedin: String,
      twitter: String,
      telegram: String,
      github: String,
      lens: String,
      custom: [String],
    },
  },
  status: {
    type: String,
    enum: ["UNPUBLISHED", "ACTIVE", "ARCHIVED", "DELETED"],
    default: "UNPUBLISHED",
  },

  whoYouAre: String,
  whatTheJobInvolves: String,
});

const Position = mongoose.model("Position", positionModel);
module.exports = { Position };
