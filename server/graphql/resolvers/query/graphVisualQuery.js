const { Members } = require("../../../models/membersModel");
const { Projects } = require("../../../models/projectsModel");
const { Node } = require("../../../models/nodeModal");

const { ApolloError } = require("apollo-server-express");
const mongoose = require("mongoose");

const { generalFunc_neo4j } = require("../../../neo4j/func_neo4j");
const _ = require("lodash");
const e = require("express");

const DEFAULT_PAGE_LIMIT = 20;

const replaceTypeNodes = {
  sub_expertise: true,
  sub_typeProject: true,
};

module.exports = {
  findMemberGraph: async (parent, args, context, info) => {
    // find the graph of the member
    const { memberID, showAvatar } = args.fields;
    console.log("Query > findMemberGraph > args.fields = ", args.fields);

    if (!memberID) throw new ApolloError("The memberID is required");

    try {
      let memberData;
      if (showAvatar == true) {
        memberData = await Members.findOne({ _id: memberID }).select(
          "_id discordName nodes discordAvatar"
        );
      } else {
        memberData = await Members.findOne({ _id: memberID }).select(
          "_id discordName nodes"
        );
      }

      if (!memberData) throw new ApolloError("Member not found");

      // console.log("memberData = ", memberData);

      res = await generalFunc_neo4j({
        request: `//find node -> and node around of Type
        MATCH res = ((n)-[]-(m))
        WHERE n._id = "${memberID}" AND (m:sub_expertise or m:sub_typeProject)
        RETURN res
        `,
      });

      let nodesObj = {};
      let nodesArrID = [];
      let nodesArrReplaceID = [];
      let edgesArr = [];
      let nodesArr = [];
      for (let i = 0; i < res.records.length; i++) {
        let record = res.records[i];

        for (let j = 0; j < record._fields[0].segments.length; j++) {
          let segment = record._fields[0].segments[j];

          let start = segment.start;
          let end = segment.end;

          if (nodesObj[start.properties._id] == undefined) {
            nodesObj[start.properties._id] = {
              _id: start.properties._id,
              name: start.properties.name,
              type: start.labels[0],
              show: true,
            };
            nodesArrID.push(start.properties._id);
            nodesArr.push({
              _id: start.properties._id,
              name: start.properties.name,
              type: start.labels[0],
            });

            if (replaceTypeNodes[start.labels[0]] == true) {
              nodesArrReplaceID.push(start.properties._id);
            }
          }
          if (nodesObj[end.properties._id] == undefined) {
            nodesObj[end.properties._id] = {
              _id: end.properties._id,
              name: end.properties.name,
              type: end.labels[0],
              show: true,
            };
            nodesArrID.push(end.properties._id);
            nodesArr.push({
              _id: end.properties._id,
              name: end.properties.name,
              type: end.labels[0],
            });

            if (replaceTypeNodes[end.labels[0]] == true) {
              nodesArrReplaceID.push(end.properties._id);
            }
          }

          edgesArr.push({
            source: start.properties._id,
            target: end.properties._id,
            type: segment.relationship.type,
          });
        }
      }

      let { nodesArrNew, edgesArrNew } = await replaceSubNodesPlusCalcDistance(
        nodesArr,
        nodesObj,
        nodesArrID,
        edgesArr,
        nodesArrReplaceID
      );

      // console.log("nodesArrNew = ", nodesArrNew);

      return {
        nodes: nodesArrNew,
        edges: edgesArrNew,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findMemberGraph",
        {
          component: "graphVisual > findMemberGraph",
        }
      );
    }
  },
  findProjectGraph: async (parent, args, context, info) => {
    const { projectID } = args.fields;
    console.log("Query > findProjectGraph > args.fields = ", args.fields);

    if (!projectID) throw new ApolloError("The projectID is required");

    try {
      let projectData = await Projects.findOne({ _id: projectID }).select(
        "_id nodes"
      );

      if (!projectData) throw new ApolloError("Project not found");

      console.log("projectData = ", projectData);

      res = await generalFunc_neo4j({
        request: `
        MATCH res = ((n)-[]-(m)-[]-(o))
        WHERE n._id = "${projectID}" AND (m:Role) AND (o:sub_expertise or o:sub_typeProject)
        RETURN res
        `,
      });

      nodesObj = {};
      edgesArr = [];

      for (let i = 0; i < res.records.length; i++) {
        let record = res.records[i];

        for (let j = 0; j < record._fields[0].segments.length; j++) {
          let segment = record._fields[0].segments[j];

          let start = segment.start;
          let end = segment.end;
          if (nodesObj[start.properties._id] == undefined) {
            nodesObj[start.properties._id] = {
              _id: start.properties._id,
              name: start.properties.name,
              type: start.labels[0],
            };
          }
          if (nodesObj[end.properties._id] == undefined) {
            nodesObj[end.properties._id] = {
              _id: end.properties._id,
              name: end.properties.name,
              type: end.labels[0],
            };
          }

          edgesArr.push({
            source: start.properties._id,
            target: end.properties._id,
            type: segment.relationship.type,
          });
        }
      }

      let nodesArr = [];
      for (let key in nodesObj) {
        nodesArr.push({
          _id: nodesObj[key]._id,
          name: nodesObj[key].name,
          type: nodesObj[key].type,
        });
      }

      //console.log("nodesObj = ", nodesObj);
      //console.log("edgesArr = ", edgesArr);

      return {
        nodes: nodesArr,
        edges: edgesArr,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findProjectGraph",
        {
          component: "graphVisual > findProjectGraph",
        }
      );
    }
  },
  findMemberToProjectGraph: async (parent, args, context, info) => {
    const { memberID, projectID } = args.fields;
    console.log(
      "Query > findMemberToProjectGraph > args.fields = ",
      args.fields
    );

    if (!memberID) throw new ApolloError("The memberID is required");

    try {
      let memberData = await Members.findOne({ _id: memberID }).select("_id");

      if (!memberData) throw new ApolloError("Member not found");

      console.log("memberData = ", memberData);

      if (projectID == undefined || projectID == "") {
        res = await generalFunc_neo4j({
          request: `
            MATCH res = ((m)-[]-(o)-[]-(r)-[]-(p))
            WHERE m._id = "${memberID}" AND (p:Project) AND (r: Role) AND (o:sub_expertise or o:sub_typeProject)
            RETURN res
        `,
        });
      } else {
        res = await generalFunc_neo4j({
          request: `
              MATCH res = ((m)-[]-(o)-[]-(r)-[]-(p))
              WHERE m._id = "${memberID}" AND (p._id="${projectID}") AND (r: Role) AND (o:sub_expertise or o:sub_typeProject)
              RETURN res
        `,
        });
      }

      nodesObj = {};
      edgesArr = [];

      for (let i = 0; i < res.records.length; i++) {
        let record = res.records[i];

        for (let j = 0; j < record._fields[0].segments.length; j++) {
          let segment = record._fields[0].segments[j];

          let start = segment.start;
          let end = segment.end;
          if (nodesObj[start.properties._id] == undefined) {
            nodesObj[start.properties._id] = {
              _id: start.properties._id,
              name: start.properties.name,
              type: start.labels[0],
            };
          }
          if (nodesObj[end.properties._id] == undefined) {
            nodesObj[end.properties._id] = {
              _id: end.properties._id,
              name: end.properties.name,
              type: end.labels[0],
            };
          }

          edgesArr.push({
            source: start.properties._id,
            target: end.properties._id,
            type: segment.relationship.type,
          });
        }
      }

      let nodesArr = [];
      for (let key in nodesObj) {
        nodesArr.push({
          _id: nodesObj[key]._id,
          name: nodesObj[key].name,
          type: nodesObj[key].type,
        });
      }

      //console.log("nodesObj = ", nodesObj);
      //console.log("edgesArr = ", edgesArr);

      const uniqueEdges = _.uniqWith(edgesArr, _.isEqual);

      return {
        nodes: nodesArr,
        edges: uniqueEdges,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findMemberToProjectGraph",
        {
          component: "graphVisual > findMemberToProjectGraph",
        }
      );
    }
  },
  findMemberToMemberGraph: async (parent, args, context, info) => {
    const { memberOneID, memberTwoID } = args.fields;
    console.log(
      "Query > findMemberToMemberGraph > args.fields = ",
      args.fields
    );

    if (!memberOneID && !memberTwoID)
      throw new ApolloError("The memberIDs is required");

    try {
      let memberData = await Members.find({
        _id: [memberOneID, memberTwoID],
      }).select("_id");

      if (memberData && memberData.length < 2)
        throw new ApolloError("Member data not found");

      console.log("memberData = ", memberData);

      res = await generalFunc_neo4j({
        request: `
        MATCH res = ((m)-[]-()-[]-()-[]-(o))
        WHERE m._id = "${memberOneID}" AND o._id = "${memberTwoID}"
        RETURN res
        `,
      });

      nodesObj = {};
      edgesArr = [];

      for (let i = 0; i < res.records.length; i++) {
        let record = res.records[i];

        for (let j = 0; j < record._fields[0].segments.length; j++) {
          let segment = record._fields[0].segments[j];

          let start = segment.start;
          let end = segment.end;
          if (nodesObj[start.properties._id] == undefined) {
            nodesObj[start.properties._id] = {
              _id: start.properties._id,
              name: start.properties.name,
              type: start.labels[0],
            };
          }
          if (nodesObj[end.properties._id] == undefined) {
            nodesObj[end.properties._id] = {
              _id: end.properties._id,
              name: end.properties.name,
              type: end.labels[0],
            };
          }

          edgesArr.push({
            source: start.properties._id,
            target: end.properties._id,
            type: segment.relationship.type,
          });
        }
      }

      let nodesArr = [];
      for (let key in nodesObj) {
        nodesArr.push({
          _id: nodesObj[key]._id,
          name: nodesObj[key].name,
          type: nodesObj[key].type,
        });
      }

      //console.log("nodesObj = ", nodesObj);
      //console.log("edgesArr = ", edgesArr);

      const uniqueEdges = _.uniqWith(edgesArr, _.isEqual);

      return {
        nodes: nodesArr,
        edges: uniqueEdges,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findMemberToProjectGraph",
        {
          component: "graphVisual > findMemberToProjectGraph",
        }
      );
    }
  },
  findMultipleMembersProjectsGraph: async (parent, args, context, info) => {
    const { membersID, projectsID } = args.fields;
    console.log(
      "Query > findMultipleMembersProjectsGraph > args.fields = ",
      args.fields
    );

    // if (!memberOneID && !memberTwoID)
    //   throw new ApolloError("The memberIDs is required");

    try {
      let membersData = await Members.find({
        _id: membersID,
      }).select("_id");

      let projectsData = await Projects.find({
        _id: projectsID,
      }).select("_id");

      // console.log("membersData = ", membersData);
      // console.log("projectsData = ", projectsData);
      // asdf;

      membersIDString = `['`;
      membersData.map((member, index) => {
        if (index == membersData.length - 1) {
          membersIDString += `${member._id}']`;
        } else {
          membersIDString += `${member._id}', '`;
        }
      });
      console.log("membersIDString = ", membersIDString);

      projectsIDString = `['`;
      projectsData.map((project, index) => {
        if (index == projectsData.length - 1) {
          projectsIDString += `${project._id}']`;
        } else {
          projectsIDString += `${project._id}', '`;
        }
      });
      console.log("projectsIDString = ", projectsIDString);
      // asdf;

      res = await generalFunc_neo4j({
        request: `
        MATCH ms = ((x) - []-(z) - []-(m:Member)-[r*2..3]-(p:Project)-[] - (q))
        WHERE m._id IN ${membersIDString}
        AND p._id IN ${projectsIDString}
        RETURN ms
        `,
      });

      nodesObj = {};
      edgesArr = [];

      for (let i = 0; i < res.records.length; i++) {
        let record = res.records[i];

        for (let j = 0; j < record._fields[0].segments.length; j++) {
          let segment = record._fields[0].segments[j];

          let start = segment.start;
          let end = segment.end;
          if (nodesObj[start.properties._id] == undefined) {
            nodesObj[start.properties._id] = {
              _id: start.properties._id,
              name: start.properties.name,
              type: start.labels[0],
            };
          }
          if (nodesObj[end.properties._id] == undefined) {
            nodesObj[end.properties._id] = {
              _id: end.properties._id,
              name: end.properties.name,
              type: end.labels[0],
            };
          }

          edgesArr.push({
            source: start.properties._id,
            target: end.properties._id,
            type: segment.relationship.type,
          });
        }
      }

      let nodesArr = [];
      for (let key in nodesObj) {
        nodesArr.push({
          _id: nodesObj[key]._id,
          name: nodesObj[key].name,
          type: nodesObj[key].type,
        });
      }

      //console.log("nodesObj = ", nodesObj);
      //console.log("edgesArr = ", edgesArr);

      const uniqueEdges = _.uniqWith(edgesArr, _.isEqual);

      return {
        nodes: nodesArr,
        edges: uniqueEdges,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findMemberToProjectGraph",
        {
          component: "graphVisual > findMemberToProjectGraph",
        }
      );
    }
  },
  findOneMemberToMembersGraph: async (parent, args, context, info) => {
    const { memberID } = args.fields;
    console.log(
      "Query > findOneMemberToMembersGraph > args.fields = ",
      args.fields
    );

    if (!memberID) throw new ApolloError("The memberID is required");

    try {
      let memberData = await Members.find({ _id: memberID }).select("_id");

      if (!memberData) throw new ApolloError("Member data not found");

      console.log("memberData = ", memberData);

      res = await generalFunc_neo4j({
        request: `
        MATCH res = ((m)-[]-()-[]-()-[]-(o:Member)) 
         WHERE m._id = "${memberID}"
         RETURN res
        `,
      });

      nodesObj = {};
      edgesArr = [];

      for (let i = 0; i < res.records.length; i++) {
        let record = res.records[i];

        for (let j = 0; j < record._fields[0].segments.length; j++) {
          let segment = record._fields[0].segments[j];

          let start = segment.start;
          let end = segment.end;
          if (nodesObj[start.properties._id] == undefined) {
            nodesObj[start.properties._id] = {
              _id: start.properties._id,
              name: start.properties.name,
              type: start.labels[0],
            };
          }
          if (nodesObj[end.properties._id] == undefined) {
            nodesObj[end.properties._id] = {
              _id: end.properties._id,
              name: end.properties.name,
              type: end.labels[0],
            };
          }

          edgesArr.push({
            source: start.properties._id,
            target: end.properties._id,
            type: segment.relationship.type,
          });
        }
      }

      let nodesArr = [];
      for (let key in nodesObj) {
        nodesArr.push({
          _id: nodesObj[key]._id,
          name: nodesObj[key].name,
          type: nodesObj[key].type,
        });
      }

      //console.log("nodesObj = ", nodesObj);
      //console.log("edgesArr = ", edgesArr);

      const uniqueEdges = _.uniqWith(edgesArr, _.isEqual);

      return {
        nodes: nodesArr,
        edges: uniqueEdges,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findOneMemberToMembersGraph",
        {
          component: "graphVisual > findOneMemberToMembersGraph",
        }
      );
    }
  },
};

// create function that will check for the above nodes and replace with expertise the edges
async function replaceSubNodesPlusCalcDistance(
  nodesArr,
  nodesObj,
  nodesArrID,
  edgesArr,
  nodesArrReplaceID
) {
  console.log("nodesObj = ", nodesObj);
  console.log("nodesArrID = ", nodesArrID);
  console.log("nodesArrReplaceID = ", nodesArrReplaceID);
  let nodesData = await Node.find({ _id: nodesArrReplaceID }).select(
    "_id aboveNodes node"
  );

  console.log("nodesData = ", nodesData);
  // asdf;

  let aboveNodesID = [];
  for (let i = 0; i < nodesData.length; i++) {
    if (nodesObj[nodesData[i]._id] != undefined) {
      aboveNodeID = nodesData[i].aboveNodes[0];
      console.log("nodesData[i].aboveNodes = ", nodesData[i].aboveNodes);
      nodesObj[nodesData[i]._id].aboveNodes = aboveNodeID;

      aboveNodesID.push(aboveNodeID);

      if (nodesObj[aboveNodeID] == undefined) {
        nodesObj[aboveNodeID] = {
          _id: aboveNodeID,
          subNode: nodesData[i]._id,
        };
      }
    }
  }
  console.log("nodesObj = ", nodesObj);

  let aboveNodesData = await Node.find({ _id: aboveNodesID }).select(
    "_id name node"
  );

  console.log("aboveNodesData = ", aboveNodesData);

  for (let i = 0; i < aboveNodesData.length; i++) {
    if (nodesObj[aboveNodesData[i]._id] != undefined) {
      nodesObj[aboveNodesData[i]._id].type = aboveNodesData[i].node;
      nodesObj[aboveNodesData[i]._id].name = aboveNodesData[i].name;
    }
  }
  // console.log("nodesObj = ", nodesObj);

  console.log("edgesArr = ", edgesArr);

  console.log("----------------------");

  let edgesArrNew = [];

  for (let i = 0; i < edgesArr.length; i++) {
    let nodeNow = nodesObj[edgesArr[i].source];
    let edgeSource = edgesArr[i].source;
    let edgeTarget = edgesArr[i].target;

    let flatAddEdge = true;
    if (nodeNow && replaceTypeNodes[nodeNow.type]) {
      console.log("change = ");
      flatAddEdge = false;
    }

    console.log("dokiii = ", i);

    nodeNow = nodesObj[edgesArr[i].target];
    if (nodeNow && replaceTypeNodes[nodeNow.type]) {
      flatAddEdge = false;

      console.log("change = ", nodeNow, i);
      // and then add two, one from source to above node
      edgesArrNew.push({
        source: edgeSource,
        target: nodeNow.aboveNodes,
        distanceRation: 0.7, // Big Distance between the main node and the category
      });
      // and the other one from above to target node
      edgesArrNew.push({
        source: nodeNow.aboveNodes,
        target: edgeTarget,
        distanceRation: 0.2, // small distancec between category and subCategory
      });

      nodesObj[nodeNow.aboveNodes].show = true;
    }

    if (flatAddEdge == true) {
      edgesArrNew.push({
        source: edgeSource,
        target: edgeTarget,
        distanceRation: 0.6, // the distance here is average for this two nodes
      });
    }
  }
  console.log("----------------------");

  console.log("edgesArrNew = ", edgesArrNew);
  console.log("nodesObj = ", nodesObj);

  let nodesArrNew = [];
  for (let key in nodesObj) {
    if (nodesObj[key].show == true) {
      nodesArrNew.push(nodesObj[key]);
    }
  }

  // asdf;
  return {
    nodesArrNew: nodesArrNew,
    edgesArrNew: edgesArrNew,
  };
}
