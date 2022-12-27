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

  state: { // if this node is approved to be on the Knowedge Graph 
    type: String,
    enum: ["waiting","rejected","approved"],
    default: "approved"
  },



  match: {
    recalculateProjectRoles: {
      type: Boolean,
      default: true
    },
    distanceProjectRoles: {
      hop0: [mongoose.Schema.ObjectId],
      hop1: [mongoose.Schema.ObjectId],
      hop2: [mongoose.Schema.ObjectId],
      hop3: [mongoose.Schema.ObjectId],
    },
    
    recalculateMembers: {
      type: Boolean,
      default: true
    },
    distanceMembers: {
      hop0: [String],
      hop1: [String],
      hop2: [String],
      hop3: [String],
    }
  },


  matchByServer_update: { // when there is any part of the array matchByServer that needs update, this one will become true 
    type: Boolean,
    default: true
  },
  matchByServer:[{
    serverID: String,
    match: {
      recalculateProjectRoles: {
        type: Boolean,
        default: true
      },
      distanceProjectRoles: {
        hop0: [mongoose.Schema.ObjectId],
        hop1: [mongoose.Schema.ObjectId],
        hop2: [mongoose.Schema.ObjectId],
        hop3: [mongoose.Schema.ObjectId],
      },
      
      recalculateMembers: {
        type: Boolean,
        default: true
      },
      distanceMembers: {
        hop0: [String],
        hop1: [String],
        hop2: [String],
        hop3: [String],
      }
    },
  }],

  registeredAt: Date,


});


const Node = mongoose.model("Node", nodeSchema);
module.exports = { Node };
