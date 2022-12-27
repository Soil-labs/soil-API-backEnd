const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const SALT_I = 10;

// node = Knowledge Graph Node
// for the AI

const nodeSchema = mongoose.Schema({
  //  The name of the node on Neo4j
  node: String, // Role, topic, type_project, subRole

  name: String,

  relatedNodes: [mongoose.Schema.ObjectId],
  subNodes: [mongoose.Schema.ObjectId],
  aboveNodes: [mongoose.Schema.ObjectId],

  state: {
    // if this node is approved to be on the Knowedge Graph
    type: String,
    enum: ["waiting", "rejected", "approved"],
    default: "approved",
  },

  match: {
    recalculateProjectRoles: {
      type: Boolean,
      default: true,
    },
    distanceProjectRoles: {
      hop0: [mongoose.Schema.ObjectId],
      hop1: [mongoose.Schema.ObjectId],
      hop2: [mongoose.Schema.ObjectId],
      hop3: [mongoose.Schema.ObjectId],
    },

    recalculateMembers: {
      type: Boolean,
      default: true,
    },
    distanceMembers: {
      hop0: [String],
      hop1: [String],
      hop2: [String],
      hop3: [String],
    },
  },

  matchByServer_update: {
    // when there is any part of the array matchByServer that needs update, this one will become true
    type: Boolean,
    default: true,
  },
  matchByServer: [
    {
      serverID: String,
      match: {
        recalculateProjectRoles: {
          type: Boolean,
          default: true,
        },
        distanceProjectRoles: {
          hop0: [mongoose.Schema.ObjectId],
          hop1: [mongoose.Schema.ObjectId],
          hop2: [mongoose.Schema.ObjectId],
          hop3: [mongoose.Schema.ObjectId],
        },

        recalculateMembers: {
          type: Boolean,
          default: true,
        },
        distanceMembers: {
          hop0: [String],
          hop1: [String],
          hop2: [String],
          hop3: [String],
        },
      },
    },
  ],
  match_v2_update: {
    member: {
      type: Boolean,
      default: true,
    },
    projectRole: {
      type: Boolean,
      default: true,
    },
  },
  match_v2: [
    {
      serverID: [String],
      nodeResID: String,
      type: {
        // if this node is approved to be on the Knowedge Graph
        type: String,
        enum: ["Member", "ProjectRole"],
        default: "Member",
      },
      wh_sum: Number, // sum (weight ** hop)
      numPath: Number, // number of paths
    },
  ],
  matchRelativePosition_server: [
    {
      serverID: String,
      MR_Member: [
        {
          nodeID: String,
          path: [
            {
              hop: Number, // 0, 1, 2, 3
              weight: Number, // 0.5, 0.25, 0.125, 0.0625
            },
          ],
        },
      ],
      MR_ProjectRole: [
        {
          nodeID: String,
          path: [
            {
              hop: Number, // 0, 1, 2, 3
              weight: Number, // 0.5, 0.25, 0.125, 0.0625
            },
          ],
        },
      ],
    },
  ],

  registeredAt: Date,
});

const Node = mongoose.model("Node", nodeSchema);
module.exports = { Node };
