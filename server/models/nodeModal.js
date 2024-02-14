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
  cleanName: String,

  pineconeID: String, 

  relatedNodes: [mongoose.Schema.ObjectId],

  subNodes: [mongoose.Schema.ObjectId], // Deprecated
  aboveNodes: [mongoose.Schema.ObjectId], // Deprecated
  categoryNodes: [mongoose.Schema.ObjectId], // Deprecated
  groupNodes: [mongoose.Schema.ObjectId], // Deprecated

  state: {
    // if this node is approved to be on the Knowedge Graph
    type: String,
    enum: ["waiting", "rejected", "approved"],
    default: "approved",
  },

  graphNeighbors: [{
    nodeID: mongoose.Schema.ObjectId,
    hopN: Number,
    weightTotal: Number,
    score: Number,
    weightSeparate: [{
      nodeID: mongoose.Schema.ObjectId,
      weight: Number,
      hopNum: Number,
    }],
  }],

  connectedCardMemories: [{
    cardID: mongoose.Schema.ObjectId,
    score: Number,
  }],

  connectedNodes: [{
    nodeID: mongoose.Schema.ObjectId,
    score: Number,
  }],
  


  
  match_v2_update: { // Deprecated
    member: {
      type: Boolean,
      default: true,
    },
    projectRole: {
      type: Boolean,
      default: true,
    },
  },
  match_v2: [ // Deprecated
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

      wh_k: Number, // sum (weight ** hop) * k // k1,k2,k3 -> which is the weighted average
      k_sum: Number, // sum(k) // all the k that was used on the above calcuation

      wh_k_arr: [
        {
          // The array has 3 objects, k1,k2,k3 -> k1= ( first object ) - ( the most relevant paths ) /
          wh_sum: Number, // sum (weight ** hop)
          numPath: Number, // number of paths
        },
      ],

      conn_node_wh: [
        {
          // We save the individual nodes that contributed to this result, and how much they contributed, this is the last node before the member or the proejctRole
          nodeConnID: String, // the nodeID for the connected node
          wh_sum: Number, // sum (weight ** hop)
          numPath: Number, // number of paths
        },
      ],
    },
  ],

  existNeo4j: Boolean, // if this node exists on the Neo4j database

  registeredAt: Date,
});

const Node = mongoose.model("Node", nodeSchema);
module.exports = { Node };
