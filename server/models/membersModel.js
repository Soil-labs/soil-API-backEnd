const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const SALT_I = 10;

const memberSchema = mongoose.Schema({
  _id: {
    type: String,
    unique: true,
  },

  discordName: {
    type: String,
    maxlength: 100,
  },
  discordAvatar: String,
  discriminator: String,
  bio: String,

  onbording: {
    signup: {
      type: Boolean,
      default: false,
    },
    percentage: {
      type: Number,
      default: 0,
    },
  },

  content: {
    interest: String,
    mostProud: String,
    showCaseAbility: String,
  },
  interest: String,

  invitedBy: String, // ID

  hoursPerWeek: Number,
  timeZone: String,

  serverID: [String],

  tweets: [String],

  skills: [
    {
      id: mongoose.Schema.ObjectId,
      authors: [String],
      communityLevel: Number,
      selfEndorsedLevel: Number,
      level: {
        type: String,
        enum: ["learning", "junior", "mid", "senior"],
      },
    },
  ],

  nodes: [
    {
      _id: mongoose.Schema.ObjectId,
      orderIndex: Number,
      level: Number,
      weight: Number,
      aboveNodes: [mongoose.Schema.ObjectId],
    },
  ],

  projects: [
    {
      projectID: mongoose.Schema.ObjectId,
      roleID: mongoose.Schema.ObjectId,
      champion: Boolean,
      phase: {
        type: String,
        enum: ["shortlisted", "engaged", "committed", "rejected", "invited"],
        default: "shortlisted",
      },
    },
  ],
  archiveProjects: [mongoose.Schema.ObjectId],

  previousProjects: [
    {
      title: String,
      description: String,
      positionName: String,
      link: String,
      picture: String,
      startDate: Date,
      endDate: Date,
    },
  ],

  links: [
    {
      name: String,
      url: String,
    },
  ],

  attributes: {
    totalVotes: Number,

    Director: Number,
    Motivator: Number,
    Inspirer: Number,
    Helper: Number,
    Supporter: Number,
    Coordinator: Number,
    Observer: Number,
    Reformer: Number,
  },

  network: [
    {
      memberID: String,
      endorcment: [
        {
          skillID: mongoose.Schema.ObjectId,
          registeredAt: Date,
        },
      ],
    },
  ],

  gardenUpdate: {
    epicID: [mongoose.Schema.ObjectId],
    taskID: [mongoose.Schema.ObjectId],
  },

  budget: {
    totalBudget: String,
    token: String,
    perHour: String,
    perMonth: String,
  },

  registeredAt: Date,

  memberRole: mongoose.Schema.ObjectId,

  chat: {
    numChat: {
      type: Number,
      default: 0,
    },
    numReply: {
      type: Number,
      default: 0,
    },
  },

  endorsements: [
    {
      endorser: String, //memberID
      endorsementMessage: String,
      arweaveTransactionID: String, //transactionID saved to Arweave
    },
  ],

  preferences: {
    interestedMatch: Boolean,
    notify: Boolean,
    findUser: {
      interestedMatch: Boolean,
      notify: Boolean,
      percentage: Number, // the percentage of the match should be higher than this number to be notified
      pastSearch: [
        {
          nodesID: [mongoose.Schema.ObjectId],
        },
      ],
    },
    findCoFounder: {
      interestedMatch: Boolean,
      notify: Boolean,
      percentage: Number, // the percentage of the match should be higher than this number to be notified
      pastSearch: [
        {
          nodesID: [mongoose.Schema.ObjectId],
        },
      ],
    },
    findMentor: {
      interestedMatch: Boolean,
      notify: Boolean,
      percentage: Number, // the percentage of the match should be higher than this number to be notified
      pastSearch: [
        {
          nodesID: [mongoose.Schema.ObjectId],
        },
      ],
    },
    findMentee: {
      interestedMatch: Boolean,
      notify: Boolean,
      percentage: Number, // the percentage of the match should be higher than this number to be notified
      pastSearch: [
        {
          nodesID: [mongoose.Schema.ObjectId],
        },
      ],
    },
    findProject: {
      interestedMatch: Boolean,
      notify: Boolean,
      percentage: Number, // the percentage of the match should be higher than this number to be notified
      pastSearch: [
        {
          nodesID: [mongoose.Schema.ObjectId],
        },
      ],
    },
  },
});

const Members = mongoose.model("Members", memberSchema);
module.exports = { Members };
