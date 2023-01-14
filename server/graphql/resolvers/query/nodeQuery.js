const { Node } = require("../../../models/nodeModal");
const { Members } = require("../../../models/membersModel");
const { ServerTemplate } = require("../../../models/serverModel");

const mongoose = require("mongoose");

const { ApolloError } = require("apollo-server-express");
const e = require("express");

const DEFAULT_PAGE_LIMIT = 20;

module.exports = {
  findNode: async (parent, args, context, info) => {
    const { _id } = args.fields;
    console.log("Query > findSkill > args.fields = ", args.fields);

    // if (!_id) throw new ApolloError( "You need to specify the id of the skill");

    let searchQuery = {};

    if (_id) {
      searchQuery = { _id: _id };
    } else {
      throw new ApolloError("You need to specify the id of the skill");
    }

    try {
      let nodeData = await Node.findOne(searchQuery);

      return nodeData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill" }
      );
    }
  },
  findNodes: async (parent, args, context, info) => {
    const { _id, node, recalculate_en, show_match_v2, selectedNodes } =
      args.fields;
    console.log("Query > findNode > args.fields = ", args.fields);

    let searchQuery_and = [];

    if (recalculate_en == "Member") {
      searchQuery_and.push({
        "match_v2_update.member": true,
      });
    } else if (recalculate_en == "ProjectRole") {
      searchQuery_and.push({
        "match_v2_update.projectRole": true,
      });
    } else if (recalculate_en == "All") {
      searchQuery_and.push({
        $or: [
          {
            "match_v2_update.projectRole": true,
          },
          {
            "match_v2_update.member": true,
          },
        ],
      });
    }

    if (_id) {
      searchQuery_and.push({ _id: _id });
    } else if (node) {
      searchQuery_and.push({ node: node });
    }

    if (searchQuery_and.length > 0) {
      searchQuery = {
        $and: searchQuery_and,
      };
    } else {
      searchQuery = {};
    }

    try {
      let selectT = "-match_v2"; // optimization because match_v2 is really heavy, the more places we take it out the better
      if (show_match_v2) {
        // except if we want to show it
        selectT = "";
      }

      let nodeData = await Node.find(searchQuery).select(selectT);

      // return {
      //   nodeData,
      //   selectedNodes,
      // };

      if (selectedNodes != undefined) {
        // prepare on context for the selected nodes as an ojbect to be faster to find them on the subNodes
        const entries = selectedNodes.map((str, i) => [str, true]);
        context.selectedNodes = Object.fromEntries(entries);
      }
      return nodeData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill" }
      );
    }
  },
  treeOfRelatedNodes: async (parent, args, context, info) => {
    const { memberID, relatedNodes } = args.fields;
    console.log("Query > treeOfRelatedNodes > args.fields = ", args.fields);

    if (memberID == undefined)
      throw new ApolloError("You need to specify the memberID");

    if (relatedNodes == undefined)
      throw new ApolloError("You need to specify the relatedNodes");

    try {
      // change the array relatedNodes to an object, the key is the nodeID and the value is the info
      let relatedNodes_obj = {};
      relatedNodes.forEach((node) => {
        relatedNodes_obj[node.nodeID] = {
          _id: node.nodeID,
          ...node,
        };
      });
      console.log("relatedNodes_obj = ", relatedNodes_obj);

      let memberData = await Members.findOne({ _id: memberID }).select(
        "_id discordName nodes"
      );

      if (memberData == null) throw new ApolloError("Member not found");

      let nodes_initial = [];
      let nodes_initial_obj = {};
      memberData.nodes.forEach((node) => {
        nodes_initial.push(node._id);
        if (nodes_initial_obj[node._id] == undefined)
          nodes_initial_obj[node._id] = true;
      });

      console.log("nodes_initial = ", nodes_initial);
      // asdf;

      node_general_obj = {};

      node_after = [];

      while (nodes_initial.length > 0) {
        console.log("nodes_initial.length  = ", nodes_initial.length);
        console.log("nodes_initial  = ", nodes_initial);
        console.log("node_general_obj = ", node_general_obj);

        let node_temp = await Node.find({
          _id: nodes_initial,
        }).select("_id name node aboveNodes");

        for (let i = 0; i < node_temp.length; i++) {
          let node = node_temp[i];

          if (node.aboveNodes.length > 0) {
            node.aboveNodes.forEach((node_above) => {
              if (nodes_initial_obj[node_above] == undefined) {
                nodes_initial.push(node_above);
                nodes_initial_obj[node_above] = true;
              }
            });

            node_after.push(node);

            nodes_initial = nodes_initial.filter(
              (_id) => _id.toString() != node._id.toString()
            ); // Delete the node from the array, because I already searched this one
          } else {
            if (node_general_obj[node._id] == undefined) {
              node_general_obj[node._id] = {
                // because there is no more to search this is a level:0 node, rool node
                open: false,
                star: false,
                subNodes: [],
                level: 0,
              };

              nodes_initial = nodes_initial.filter(
                (_id) => _id.toString() != node._id.toString()
              ); // Delete the node from the array, because there is no more to search
            }
          }
        }
      }
      console.log("change = ------------1---------");
      console.log("node_general_obj = ", node_general_obj);
      console.log("node_after = ", node_after.length);

      idx = 0;
      while (node_after.length > 0) {
        let nodeNow = node_after[idx];

        flag_foundPosition = false;
        nodeNow.aboveNodes.forEach((node_above) => {
          if (
            node_general_obj[node_above] &&
            node_general_obj[nodeNow._id] == undefined
          ) {
            node_general_obj[node_above].subNodes.push(nodeNow._id);
            flag_foundPosition = true;

            node_general_obj[nodeNow._id] = {
              open: false,
              star: false,
              subNodes: [],
              level: node_general_obj[node_above].level + 1,
            };
          }
        });
        console.log("nodeNow = ", nodeNow, idx, flag_foundPosition);

        if (flag_foundPosition == true) {
          // console.log("change = ");
          // node_after = node_after.filter(
          //   (_id) => _id.toString() != nodeNow._id.toString()
          // ); // Delete the node from the array, because I already searched this one

          node_after = node_after.filter(function (node) {
            return node._id.toString() != nodeNow._id.toString();
          });
        }
        console.log("node_after = ", node_after.length);

        // asdf;

        idx = idx + 1;
        if (idx >= node_after.length) idx = 0;
      }

      console.log("change = -------------2--------");
      console.log("node_general_obj = ", node_general_obj);
      console.log("node_after = ", node_after);

      // loop throw the object node_general_obj

      final_res = []; // create the final result array using the object node_general_obj
      for (const [key, value] of Object.entries(node_general_obj)) {
        if (value.level == 0) {
          console.log("key = ", key);
          console.log("value = ", value);

          let subNodes = [];
          let flag_open = false;
          for (let i = 0; i < value.subNodes.length; i++) {
            let subNode = value.subNodes[i];
            subNodes.push({
              _id: subNode,
            });
            if (relatedNodes_obj[subNode] != undefined) {
              subNodes[i].star = relatedNodes_obj[subNode].star;
              flag_open = true;
            }
          }
          let node_temp = await Node.findOne({ _id: key }).select(
            "_id name node"
          );
          final_res.push({
            _id: key,
            subNodes: subNodes,
            name: node_temp.name,
            node: node_temp.node,
          });
          if (flag_open == true) final_res[final_res.length - 1].open = true;
        }
      }

      context.relatedNodes_obj = relatedNodes_obj;

      return final_res;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill" }
      );
    }
  },
};
