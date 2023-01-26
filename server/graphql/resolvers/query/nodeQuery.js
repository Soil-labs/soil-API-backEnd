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
  nodes_autocomplete: async (parent, args, context, info) => {
    const { search } = args.fields;
    console.log("Query > nodes_autocomplete > args.fields = ", args.fields);

    try {
      let nodes_search = await Node.aggregate([
        {
          $search: {
            autocomplete: {
              query: search,
              path: "name",
              fuzzy: {
                maxEdits: 1,
              },
            },
          },
        },
        { $project: { _id: 1, name: 1 } },
      ]);

      // ----------- initialise arrays to find above nodes ----------
      let nodes_initial = []; // this is the ndoes that will be used to find the node tree
      let nodes_initial_obj = {}; // quick index for teh initial nodes
      nodes_search.forEach((node) => {
        nodes_initial.push(node._id);
        if (nodes_initial_obj[node._id] == undefined)
          nodes_initial_obj[node._id] = {
            accepted: true,
            notAcceptedNode: "", // this is the node that is not accepted -> In case that we use the same node level it will rejected it
          };
      });

      node_general_obj = {}; // The general node that hold all the nodes and subNodes, and will be used at the end to create the Tree
      node_after = []; // The nodes that will be used after to search for the subNodes
      // ----------- initialise arrays to find above nodes ----------

      // ------------ find all the initial above Nodes / and aboveAbove Nodes ------------
      let previusLength = nodes_initial.length + 1;
      let sameValue = 0; // protect the While loop from infinite loop
      while (nodes_initial.length > 0 && sameValue < 40) {
        if (previusLength == nodes_initial.length) {
          sameValue++;
        } else {
          sameValue = 0;
        }
        previusLength = nodes_initial.length;

        let node_temp = await Node.find({
          _id: nodes_initial,
        }).select("_id name node aboveNodes");

        for (let i = 0; i < node_temp.length; i++) {
          let node = node_temp[i];

          if (nodes_initial_obj[node._id].notAcceptedNode == node.node) {
            // don't allow the same node level
            nodes_initial = nodes_initial.filter(
              (_id) => _id.toString() != node._id.toString()
            ); // Delete the node from the array, because it is not allowed to be used

            node_after = node_after.filter(
              (node_n) => node_n._id.toString() != node._id.toString()
            ); // Delete the node from the array, because it is not allowed to be used

            continue;
          }

          if (node.aboveNodes.length > 0) {
            node.aboveNodes.forEach((node_above) => {
              if (nodes_initial_obj[node_above] == undefined) {
                nodes_initial.push(node_above);
                nodes_initial_obj[node_above] = {
                  accepted: true,
                  notAcceptedNode: node.node,
                };
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
      // ------------ find all the initial above Nodes / and aboveAbove Nodes ------------

      // ------------ Organise all the Nodes and put then under subNodes inside node_general_obj -----------
      idx = 0;
      previusLength = node_after.length + 1;
      sameValue = 0;
      while (node_after.length > 0 && sameValue < 40) {
        let nodeNow = node_after[idx];

        if (previusLength == node_after.length) {
          sameValue++;
        } else {
          sameValue = 0;
        }
        previusLength = node_after.length;

        flag_foundPosition = true;
        nodeNow.aboveNodes.forEach((node_above) => {
          if (node_general_obj[node_above]) {
            node_general_obj[node_above].subNodes.push(nodeNow._id);

            node_general_obj[nodeNow._id] = {
              open: false,
              star: false,
              subNodes: [],
              level: node_general_obj[node_above].level + 1,
            };
          } else {
            flag_foundPosition = false;
          }
        });

        if (flag_foundPosition == true) {
          node_after = node_after.filter(function (node) {
            return node._id.toString() != nodeNow._id.toString();
          });
        }

        idx = idx + 1;
        if (idx >= node_after.length) idx = 0;
      }
      // ------------ Organise all the Nodes and put then under subNodes inside node_general_obj -----------

      // ------------- Create the Tree -------------
      final_res = []; // create the final result array using the object node_general_obj
      for (const [key, value] of Object.entries(node_general_obj)) {
        if (value.level == 0) {
          let subNodes = [];
          let flag_open = false;
          for (let i = 0; i < value.subNodes.length; i++) {
            // organise them into a tree structure with subNodes and subSubNodes
            let subNode = value.subNodes[i];
            subNodes.push({
              _id: subNode,
              subNodes: node_general_obj[subNode].subNodes,
            });
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
      // ------------- Create the Tree -------------

      context.nodeTree = true;

      return final_res;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill" }
      );
    }
  },
  treeOfRelatedNodes: async (parent, args, context, info) => {
    let { memberID, relatedNodes } = args.fields;
    console.log("Query > treeOfRelatedNodes > args.fields = ", args.fields);

    if (memberID == undefined)
      throw new ApolloError("You need to specify the memberID");

    if (relatedNodes == undefined) relatedNodes = [];

    try {
      // change the array relatedNodes to an object, the key is the nodeID and the value is the info
      let relatedNodes_obj = {};
      relatedNodes.forEach((node) => {
        relatedNodes_obj[node.nodeID] = {
          _id: node.nodeID,
          ...node,
        };
      });

      let memberData = await Members.findOne({ _id: memberID }).select(
        "_id discordName nodes"
      );

      if (memberData == null) throw new ApolloError("Member not found");

      // ----------------- Initialise the arrays and objects for the tree -----------------
      let nodes_initial = []; // this is the ndoes that will be used to find the node tree
      let nodes_initial_obj = {}; // quick index for teh initial nodes
      let memberNode_obj = {}; // quick index for the member nodes
      memberData.nodes.forEach((node) => {
        nodes_initial.push(node._id);
        if (nodes_initial_obj[node._id] == undefined)
          nodes_initial_obj[node._id] = {
            accepted: true,
            notAcceptedNode: "", // this is the node that is not accepted -> In case that we use the same node level it will rejected it
          };
        memberNode_obj[node._id] = node;
      });

      node_general_obj = {}; // The general node that hold all the nodes and subNodes, and will be used at the end to create the Tree
      node_after = []; // The nodes that will be used after to search for the subNodes
      // ----------------- Initialise the arrays and objects for the tree -----------------

      // ------------ find all the initial above Nodes / and aboveAbove Nodes ------------

      let previusLength = nodes_initial.length + 1;
      let sameValue = 0;
      while (nodes_initial.length > 0 && sameValue < 40) {
        if (previusLength == nodes_initial.length) {
          sameValue++;
        } else {
          sameValue = 0;
        }
        previusLength = nodes_initial.length;

        let node_temp = await Node.find({
          _id: nodes_initial,
        }).select("_id name node aboveNodes");

        for (let i = 0; i < node_temp.length; i++) {
          let node = node_temp[i];

          if (nodes_initial_obj[node._id].notAcceptedNode == node.node) {
            nodes_initial = nodes_initial.filter(
              (_id) => _id.toString() != node._id.toString()
            ); // Delete the node from the array, because it is not allowed to be used

            node_after = node_after.filter(
              (node_n) => node_n._id.toString() != node._id.toString()
            ); // Delete the node from the array, because it is not allowed to be used

            continue;
          }

          if (node.aboveNodes.length > 0) {
            node.aboveNodes.forEach((node_above) => {
              if (
                memberNode_obj[node._id] != undefined &&
                memberNode_obj[node._id].aboveNodes != undefined
              ) {
                if (
                  memberNode_obj[node._id].aboveNodes.includes(node_above) && // if the node_above is approved for this specific node
                  nodes_initial_obj[node_above] == undefined // if the node is not yet in the initial nodes
                ) {
                  nodes_initial.push(node_above);
                  nodes_initial_obj[node_above] = {
                    accepted: true,
                    notAcceptedNode: node.node,
                  };
                }
              } else {
                if (nodes_initial_obj[node_above] == undefined) {
                  nodes_initial.push(node_above);
                  nodes_initial_obj[node_above] = {
                    accepted: true,
                    notAcceptedNode: node.node,
                  };
                }
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
      // ------------ find all the initial above Nodes / and aboveAbove Nodes ------------

      // ------------ Organise all the Nodes and put then under subNodes inside node_general_obj -----------
      idx = 0;
      previusLength = node_after.length + 1;
      sameValue = 0;
      while (node_after.length > 0 && sameValue < 40) {
        let nodeNow = node_after[idx];

        if (previusLength == node_after.length) {
          sameValue++;
        } else {
          sameValue = 0;
        }
        previusLength = node_after.length;

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

        if (flag_foundPosition == true) {
          node_after = node_after.filter(function (node) {
            return node._id.toString() != nodeNow._id.toString();
          });
        }
        console.log("node_after = ", node_after.length);

        idx = idx + 1;
        if (idx >= node_after.length) idx = 0;
      }
      // ------------ Organise all the Nodes and put then under subNodes inside node_general_obj -----------

      // ------------- Create the Tree -------------
      final_res = []; // create the final result array using the object node_general_obj
      for (const [key, value] of Object.entries(node_general_obj)) {
        if (value.level == 0) {
          let subNodes = [];
          let flag_open = false; // This flag shows if the node will be open
          let level_root = -1;
          for (let i = 0; i < value.subNodes.length; i++) {
            let subNode = value.subNodes[i];

            // ----------- subSubNode ------------
            let subSubNodes = [];
            let flat_subNodes = false;
            let level_mid = -1;
            let subSubNodesAr = node_general_obj[subNode].subNodes;
            for (let j = 0; j < subSubNodesAr.length; j++) {
              let subSubNode = subSubNodesAr[j];

              subSubNodes.push({
                _id: subSubNode,
              });
              // Put the level based on the memberNode information
              if (
                memberNode_obj[subSubNode] &&
                memberNode_obj[subSubNode].level
              ) {
                subSubNodes[j].level = memberNode_obj[subSubNode].level;
                if (level_mid < memberNode_obj[subSubNode].level)
                  level_mid = memberNode_obj[subSubNode].level;
              }
              if (relatedNodes_obj[subSubNode] != undefined) {
                // put the info about opening the tree based on the relatedNodes for this search
                subSubNodes[j].star = relatedNodes_obj[subSubNode].star;
                flag_open = true;
                flat_subNodes = true;
              }
            }
            // ----------- subSubNode ------------

            //  ---------- subNodes ------------
            subNodes.push({
              _id: subNode,
              subNodes: subSubNodes,
            });
            if (level_mid != -1) subNodes[i].level = level_mid;
            if (memberNode_obj[subNode] && memberNode_obj[subNode].level) {
              // level
              subNodes[i].level = memberNode_obj[subNode].level;

              if (level_root < memberNode_obj[subSubNode].level)
                level_root = memberNode_obj[subSubNode].level;
            }
            if (level_root < level_mid) level_root = level_mid; // level for the rool level

            if (flat_subNodes == true) subNodes[i].open = true;

            if (relatedNodes_obj[subNode] != undefined) {
              subNodes[i].star = relatedNodes_obj[subNode].star;
              flag_open = true;
            }
            //  ---------- subNodes ------------
          }

          //  ------------ root node -------------
          let node_temp = await Node.findOne({ _id: key }).select(
            "_id name node"
          );
          final_res.push({
            _id: key,
            subNodes: subNodes,
            name: node_temp.name,
            node: node_temp.node,
          });

          if (level_root != -1)
            final_res[final_res.length - 1].level = level_root;
          if (memberNode_obj[key] && memberNode_obj[key].level) {
            final_res[final_res.length - 1].level = memberNode_obj[key].level;
          }
          if (flag_open == true) final_res[final_res.length - 1].open = true;
          //  ------------ root node -------------
        }
      }
      // ------------- Create the Tree -------------

      context.relatedNodes_obj = relatedNodes_obj; // This will be used on the nodeResolver, for SubNode
      context.nodeTree = true;

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
