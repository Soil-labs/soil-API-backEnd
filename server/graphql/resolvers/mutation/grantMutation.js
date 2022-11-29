const { GrantTemplate } = require("../../../models/grantModel");
const { Node } = require("../../../models/nodeModal");
const { Members } = require("../../../models/membersModel");

const {
  createNode_neo4j,
  createNode_neo4j_field,
  updateNode_neo4j_serverID_f,
  makeConnection_neo4j,
} = require("../../../neo4j/func_neo4j");

const { ApolloError } = require("apollo-server-express");

module.exports = {
  updateGrant: async (parent, args, context, info) => {
    const {
      _id,
      name,
      description,
      smallDescription,
      tags,
      requirments,
      applicationProcess,
      difficulty,
      distributed,
      maxDistributed,
      resources,
      amount,
      avatar,
      serverID,
    } = args.fields;
    console.log("Mutation > updateGrant > args.fields = ", args.fields);

    let fields = {};

    if (_id) fields._id = _id;
    if (name) fields.name = name;
    if (description) fields.description = description;
    if (smallDescription) fields.smallDescription = smallDescription;
    if (tags) fields.tags = tags;
    if (applicationProcess) fields.applicationProcess = applicationProcess;
    if (requirments) fields.requirments = requirments;
    if (difficulty) fields.difficulty = difficulty;
    if (distributed) fields.distributed = distributed;
    if (maxDistributed) fields.maxDistributed = maxDistributed;
    if (resources) fields.resources = resources;
    if (amount) fields.amount = amount;
    if (avatar) fields.avatar = avatar;
    if (serverID) fields.serverID = serverID;

    try {
      let grantData;
      if (_id) {
        grantData = await GrantTemplate.findOne({ _id: _id });
        if (!grantData) {
          grantData = await new GrantTemplate(fields);
          grantData.save();

          await createNode_neo4j({
            node: "Grant",
            id: grantData._id,
            name: grantData.name,
            serverID: grantData.serverID,
          });
        } else {
          grantData = await GrantTemplate.findOneAndUpdate(
            { _id: grantData._id },
            {
              $set: fields,
            },
            { new: true }
          );

          updateNode_neo4j_serverID({
            node: "Grant",
            id: grantData._id,
            serverID: grantData.serverID,
          });
        }
      } else {
        grantData = await new GrantTemplate(fields);
        grantData.save();

        await createNode_neo4j({
          node: "Grant",
          id: grantData._id,
          name: grantData.name,
          serverID: grantData.serverID,
        });
      }

      return grantData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > addNewMember" }
      );
    }
  },
  applyGrant: async (parent, args, context, info) => {
    const { memberID, grantID } = args.fields;
    console.log("Mutation > applyGrant > args.fields = ", args.fields);

    if (!grantID) throw new ApolloError("grantID is required");
    if (!memberID) throw new ApolloError("memberID is required");

    let fields = {};

    if (memberID) fields.memberID = memberID;
    if (grantID) fields.grantID = grantID;

    try {
      let grantData = await GrantTemplate.findOne({ _id: grantID });
      let memberData = await Members.find({ _id: memberID });

      if (!grantData) throw new ApolloError("Grant Don't Exist");
      if (!memberData) throw new ApolloError("Member Don't exist");

      console.log("grantData = ", grantData);
      console.log("memberData = ", memberData);

      if (!grantData.membersApplied.includes(memberID.toString())) {
        grantData.membersApplied.push(memberID.toString());
      }

      await GrantTemplate.findOneAndUpdate(
        { _id: grantData._id },
        { $set: { membersApplied: grantData.membersApplied } },
        { new: true }
      );

      // console.log("memberID = ", memberID);

      return grantData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > addNewMember" }
      );
    }
  },
  addNodesToGrant: async (parent, args, context, info) => {
    const { grantID, nodesID } = args.fields;

    console.log("Mutation > addNodesToGrant > args.fields = ", args.fields);

    if (!grantID) throw new ApolloError("grantID is required");

    try {
      let grantData = await GrantTemplate.findOne({ _id: grantID });
      let nodesData = await Node.find({ _id: nodesID });

      console.log("grantData = ", grantData);
      console.log("nodesData = ", nodesData);

      // check if the nodes are already in the member (grantData.nodes)
      let nodesDataOriginalArray = grantData.nodes.map(function (item) {
        return item._id.toString();
      });

      let nodesIDArray = nodesID.map(function (item) {
        return item.toString();
      });

      let differenceNodes = nodesIDArray.filter(
        (x) => !nodesDataOriginalArray.includes(x)
      );
      console.log("differenceNodes = ", differenceNodes);

      if (differenceNodes.length > 0) {
        let nodesDataNew = [];
        for (let i = 0; i < differenceNodes.length; i++) {
          let nodeID = differenceNodes[i];
          let nodeData = nodesData.find(
            (x) => x._id.toString() == nodeID.toString()
          );
          nodesDataNew.push(nodeData);
          grantData.nodes.push({ _id: nodeID });
        }

        console.log("nodesDataNew = ", nodesDataNew);
        console.log("grantData.nodes = ", grantData.nodes);

        // add only the new ones as relationship on Neo4j
        for (let i = 0; i < nodesDataNew.length; i++) {
          let nodeNow = nodesDataNew[i];
          makeConnection_neo4j({
            node: ["Grant", nodeNow.node],
            id: [grantData._id, nodeNow._id],
            connection: "connection",
          });

          // changeMatchByServer(nodeNow, grantData);
        }
      }

      grantData2 = await GrantTemplate.findOneAndUpdate(
        { _id: grantID },
        {
          $set: {
            nodes: grantData.nodes,
          },
        },
        { new: true }
      );

      return grantData2;
      // return {};
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },
};

// create async function that will change matchByServer
const changeMatchByServer = async (nodeNow, memberData) => {
  // find all the Nodes that need to change around the nodeNow
  // console.log("nodeNow = " , nodeNow)
  let allNodesDistanceR = await findAllNodesDistanceRfromNode_neo4j({
    nodeID: nodeNow._id,
  });

  // console.log("allNodesDistanceR = " , allNodesDistanceR)
  // console.log("change = " , change)

  // find all the node data from the allNodesDistanceR and then loop throw them
  let allNodesDistanceR_Data = await Node.find({ _id: allNodesDistanceR });

  // loop throw all the nodes and change the matchByServer
  for (let i = 0; i < allNodesDistanceR_Data.length; i++) {
    let node_n = allNodesDistanceR_Data[i];

    // / ---------- Change matchByServer -----------
    let matchByServer = node_n.matchByServer;

    console.log("serverID_n ----------= ", memberData.serverID);

    for (let i = 0; i < memberData.serverID.length; i++) {
      let serverID_n = memberData.serverID[i];

      console.log("node_n = ", node_n);
      console.log("matchByServer = ", matchByServer);

      if (matchByServer === undefined) {
        matchByServer = [
          {
            serverID: serverID_n,
            match: {
              recalculateProjectRoles: true,
              distanceProjectRoles: [],

              recalculateMembers: true,
              distanceMembers: [],
            },
          },
        ];
      } else {
        // find the position serverID_n exist on matchByServer dictionary
        let position = matchByServer.findIndex((x) => x.serverID == serverID_n);

        if (position === -1) {
          // if it does not exist, add it
          matchByServer.push({
            serverID: serverID_n,
            match: {
              recalculateProjectRoles: true,
              distanceProjectRoles: [],

              recalculateMembers: true,
              distanceMembers: [],
            },
          });
        } else {
          // if it exist, change it
          matchByServer[position].match.recalculateProjectRoles = true;
          matchByServer[position].match.recalculateMembers = true;
        }
      }
    }
    // ---------- Change matchByServer -----------

    // Update the node
    let nodeData3 = await Node.findOneAndUpdate(
      { _id: node_n._id },
      {
        $set: {
          matchByServer_update: true,
          matchByServer: matchByServer,
        },
      },
      { new: true }
    );
  }
};
