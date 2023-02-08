const mongoose = require("mongoose");
require("dotenv").config();

const projectSchema = mongoose.Schema({
  title: String,
  description: String,
  descriptionOneLine: String,

  emoji: String,
  backColorEmoji: String,

  serverID: [String],
  gardenServerID: String,

  champion: String,

  team: [
    {
      memberID: String,
      roleID: mongoose.Schema.ObjectId,
      phase: {
        type: String,
        enum: ["shortlisted", "engaged", "committed", "rejected", "invited"],
        default: "committed",
      },
    },
  ],

  role: [
    {
      title: String,
      description: String,
      shortDescription: String,
      keyResponsibilities: String,
      openPositions: Number,

      expectations: [String],
      benefits: [String],

      nodes: [
        {
          _id: mongoose.Schema.ObjectId,
        },
      ],

      skills: [
        {
          _id: mongoose.Schema.ObjectId,
          level: String,
        },
      ],
      archive: Boolean,
      dateRangeStart: Date,
      dateRangeEnd: Date,
      hoursPerWeek: String,
      ratePerHour: String,
      budget: {
        totalBudget: String,
        token: String,
        perHour: String,
        perMonth: String,
      },
    },
  ],

  tweets: [
    {
      title: String,
      content: String,
      author: String,
      registeredAt: Date,
      approved: Boolean,
      approved: Boolean,
    },
  ],

  collaborationLinks: [
    {
      title: String,
      link: String,
    },
  ],
  stepsJoinProject: [String],

  budget: {
    totalBudget: String,
    token: String,
    perHour: String,
    acceptEquivalentToken: Boolean,
  },
  dates: {
    kickOff: Date,
    complition: Date,
  },

  garden_teams: [mongoose.Schema.ObjectId],
});

const Projects = mongoose.model("Projects", projectSchema);
module.exports = { Projects };
