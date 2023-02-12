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

const coreTypeNodes = {
  Member: true,
  Project: true,
};

const distancesBasedOnNumCoreType = {
  1: {
    close: 0.2,
    far: 0.7,
  },
  2: {
    close: 0.2,
    far: 0.4,
  },
  else: {
    close: 0.3,
    far: 0.35,
  },
};

module.exports = {
  findMemberGraph: async (parent, args, context, info) => {
    // find the graph of the member
    const { memberID, showAvatar, nodeSettings, edgeSettings } = args.fields;
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
        WHERE n._id = "${memberID}" AND (m:sub_expertise or m:sub_typeProject or m:skill)
        RETURN res
        `,
      });

      let { typesNodesReplace, typeNodeSearchAbove } =
        await readSettingsFindReplaceNodesMultiple(nodeSettings, edgeSettings);

      let { nodesObj, edgesArr, nodesArrReplaceID, numberCoreTypeNodes } =
        await neo4jToNodeEdgeGraphSettings(res, typesNodesReplace);

      let { edgesArrNew, nodesObj_ } = await replaceNodes(
        nodesObj,
        edgesArr,
        nodesArrReplaceID,
        typesNodesReplace
      );

      // asf7;
      let { nodesArrNew2, edgesArrNew2 } = await addSettingsNodesSubNodes(
        nodesObj_,
        edgesArrNew,
        nodeSettings,
        edgeSettings
      );

      return {
        nodes: nodesArrNew2,
        edges: edgesArrNew2,
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
    const { projectID, nodeSettings, edgeSettings } = args.fields;
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
        WHERE n._id = "${projectID}" AND (m:Role) AND (o:sub_expertise or o:sub_typeProject or o:skill)
        RETURN res
        `,
      });

      let { typesNodesReplace, typeNodeSearchAbove } =
        await readSettingsFindReplaceNodesMultiple(nodeSettings, edgeSettings);

      let { nodesObj, edgesArr, nodesArrReplaceID, numberCoreTypeNodes } =
        await neo4jToNodeEdgeGraphSettings(res, typesNodesReplace);

      let { edgesArrNew, nodesObj_ } = await replaceNodes(
        nodesObj,
        edgesArr,
        nodesArrReplaceID,
        typesNodesReplace
      );

      // asf7;
      let { nodesArrNew2, edgesArrNew2 } = await addSettingsNodesSubNodes(
        nodesObj_,
        edgesArrNew,
        nodeSettings,
        edgeSettings
      );

      return {
        nodes: nodesArrNew2,
        edges: edgesArrNew2,
      };

      // let { nodesObj, edgesArr, nodesArrReplaceID, numberCoreTypeNodes } =
      //   await neo4jToNodeEdgeGraph(res);

      // let { nodesArrNew, edgesArrNew } = await replaceSubNodesPlusCalcDistance(
      //   nodesObj,
      //   edgesArr,
      //   nodesArrReplaceID,
      //   numberCoreTypeNodes
      // );

      // return {
      //   nodes: nodesArrNew,
      //   edges: edgesArrNew,
      // };
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
    const { memberID, projectID, nodeSettings, edgeSettings } = args.fields;
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
            WHERE m._id = "${memberID}" AND (p:Project) AND (r: Role) AND (o:sub_expertise or o:sub_typeProject or o:skill)
            RETURN res
        `,
        });
      } else {
        res = await generalFunc_neo4j({
          request: `
              MATCH res = ((m)-[]-(o)-[]-(r)-[]-(p))
              WHERE m._id = "${memberID}" AND (p._id="${projectID}") AND (r: Role) AND (o:sub_expertise or o:sub_typeProject or o:skill)
              RETURN res
        `,
        });
      }

      let { typesNodesReplace, typeNodeSearchAbove } =
        await readSettingsFindReplaceNodesMultiple(nodeSettings, edgeSettings);

      let { nodesObj, edgesArr, nodesArrReplaceID, numberCoreTypeNodes } =
        await neo4jToNodeEdgeGraphSettings(res, typesNodesReplace);

      let { edgesArrNew, nodesObj_ } = await replaceNodes(
        nodesObj,
        edgesArr,
        nodesArrReplaceID,
        typesNodesReplace
      );

      let { nodesArrNew2, edgesArrNew2 } = await addSettingsNodesSubNodes(
        nodesObj_,
        edgesArrNew,
        nodeSettings,
        edgeSettings
      );

      return {
        nodes: nodesArrNew2,
        edges: edgesArrNew2,
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
    const { memberOneID, memberTwoID, nodeSettings, edgeSettings } =
      args.fields;
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

      let { typesNodesReplace, typeNodeSearchAbove } =
        await readSettingsFindReplaceNodesMultiple(nodeSettings, edgeSettings);

      let { nodesObj, edgesArr, nodesArrReplaceID, numberCoreTypeNodes } =
        await neo4jToNodeEdgeGraphSettings(res, typesNodesReplace);

      let { edgesArrNew, nodesObj_ } = await replaceNodes(
        nodesObj,
        edgesArr,
        nodesArrReplaceID,
        typesNodesReplace
      );

      // asf7;
      let { nodesArrNew2, edgesArrNew2 } = await addSettingsNodesSubNodes(
        nodesObj_,
        edgesArrNew,
        nodeSettings,
        edgeSettings
      );

      return {
        nodes: nodesArrNew2,
        edges: edgesArrNew2,
      };
      // nodesObj = {};
      // edgesArr = [];

      // for (let i = 0; i < res.records.length; i++) {
      //   let record = res.records[i];

      //   for (let j = 0; j < record._fields[0].segments.length; j++) {
      //     let segment = record._fields[0].segments[j];

      //     let start = segment.start;
      //     let end = segment.end;
      //     if (nodesObj[start.properties._id] == undefined) {
      //       nodesObj[start.properties._id] = {
      //         _id: start.properties._id,
      //         name: start.properties.name,
      //         type: start.labels[0],
      //       };
      //     }
      //     if (nodesObj[end.properties._id] == undefined) {
      //       nodesObj[end.properties._id] = {
      //         _id: end.properties._id,
      //         name: end.properties.name,
      //         type: end.labels[0],
      //       };
      //     }

      //     edgesArr.push({
      //       source: start.properties._id,
      //       target: end.properties._id,
      //       type: segment.relationship.type,
      //     });
      //   }
      // }

      // let nodesArr = [];
      // for (let key in nodesObj) {
      //   nodesArr.push({
      //     _id: nodesObj[key]._id,
      //     name: nodesObj[key].name,
      //     type: nodesObj[key].type,
      //   });
      // }

      // //console.log("nodesObj = ", nodesObj);
      // //console.log("edgesArr = ", edgesArr);

      // const uniqueEdges = _.uniqWith(edgesArr, _.isEqual);

      // return {
      //   nodes: nodesArr,
      //   edges: uniqueEdges,
      // };
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
    const { membersID, projectsID, nodeSettings, edgeSettings } = args.fields;
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

      let { typesNodesReplace, typeNodeSearchAbove } =
        await readSettingsFindReplaceNodesMultiple(nodeSettings, edgeSettings);

      let { nodesObj, edgesArr, nodesArrReplaceID, numberCoreTypeNodes } =
        await neo4jToNodeEdgeGraphSettings(res, typesNodesReplace);

      let { edgesArrNew, nodesObj_ } = await replaceNodes(
        nodesObj,
        edgesArr,
        nodesArrReplaceID,
        typesNodesReplace
      );

      // asf7;
      let { nodesArrNew2, edgesArrNew2 } = await addSettingsNodesSubNodes(
        nodesObj_,
        edgesArrNew,
        nodeSettings,
        edgeSettings
      );

      return {
        nodes: nodesArrNew2,
        edges: edgesArrNew2,
      };

      // let { nodesObj, edgesArr, nodesArrReplaceID, numberCoreTypeNodes } =
      //   await neo4jToNodeEdgeGraph(res);

      // let { nodesArrNew, edgesArrNew } = await replaceSubNodesPlusCalcDistance(
      //   nodesObj,
      //   edgesArr,
      //   nodesArrReplaceID,
      //   numberCoreTypeNodes
      // );

      // return {
      //   nodes: nodesArrNew,
      //   edges: edgesArrNew,
      // };

      // nodesObj = {};
      // edgesArr = [];

      // for (let i = 0; i < res.records.length; i++) {
      //   let record = res.records[i];

      //   for (let j = 0; j < record._fields[0].segments.length; j++) {
      //     let segment = record._fields[0].segments[j];

      //     let start = segment.start;
      //     let end = segment.end;
      //     if (nodesObj[start.properties._id] == undefined) {
      //       nodesObj[start.properties._id] = {
      //         _id: start.properties._id,
      //         name: start.properties.name,
      //         type: start.labels[0],
      //       };
      //     }
      //     if (nodesObj[end.properties._id] == undefined) {
      //       nodesObj[end.properties._id] = {
      //         _id: end.properties._id,
      //         name: end.properties.name,
      //         type: end.labels[0],
      //       };
      //     }

      //     edgesArr.push({
      //       source: start.properties._id,
      //       target: end.properties._id,
      //       type: segment.relationship.type,
      //     });
      //   }
      // }

      // let nodesArr = [];
      // for (let key in nodesObj) {
      //   nodesArr.push({
      //     _id: nodesObj[key]._id,
      //     name: nodesObj[key].name,
      //     type: nodesObj[key].type,
      //   });
      // }

      // //console.log("nodesObj = ", nodesObj);
      // //console.log("edgesArr = ", edgesArr);

      // const uniqueEdges = _.uniqWith(edgesArr, _.isEqual);

      // return {
      //   nodes: nodesArr,
      //   edges: uniqueEdges,
      // };
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

function createNewID(id1, id2) {
  const combined = id1 + id2;
  let newID = btoa(combined);
  newID = newID.slice(-id1.toString().length);
  // newID = newID.substring(0, id1.toString().length);
  return newID;
}

async function neo4jToNodeEdgeGraph(res) {
  let nodesObj = {};
  let nodesArrReplaceID = [];
  let edgesArr = [];
  let numberCoreTypeNodes = 0;
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
          numEdges: 0,
        };

        if (coreTypeNodes[start.labels[0]] == true) {
          // console.log("change = ", start.properties.name, start.labels[0]);
          numberCoreTypeNodes += 1;
        }

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
          numEdges: 0,
        };

        if (coreTypeNodes[end.labels[0]] == true) {
          // console.log("change = ", end.properties.name, end.labels[0]);
          numberCoreTypeNodes += 1;
        }

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

  console.log("numberCoreTypeNodes = ", numberCoreTypeNodes);

  return {
    nodesObj: nodesObj,
    nodesArrReplaceID: nodesArrReplaceID,
    edgesArr: edgesArr,
    numberCoreTypeNodes: numberCoreTypeNodes,
  };
}

async function neo4jToNodeEdgeGraphSettings(res, typesNodesReplace = {}) {
  let nodesObj = {};
  let nodesArrReplaceID = [];
  let edgesArr = [];
  let numberCoreTypeNodes = 0;
  for (let i = 0; i < res.records.length; i++) {
    let record = res.records[i];

    for (let j = 0; j < record._fields[0].segments.length; j++) {
      let segment = record._fields[0].segments[j];

      let start = segment.start;
      let end = segment.end;

      // ------------- Create nodesObj ----------------
      if (nodesObj[start.properties._id] == undefined) {
        nodesObj[start.properties._id] = {
          _id: start.properties._id,
          name: start.properties.name,
          type: start.labels[0],
          show: true,
          numEdges: 0,
          replace: false,
        };
      }
      // ------------- Create nodesObj ----------------

      // ------------- add node for replacement if exist on key ---------
      let key = start.labels[0] + "|" + end.labels[0];

      if (typesNodesReplace[key]) {
        numberCoreTypeNodes += 1;

        nodesArrReplaceID.push(start.properties._id);

        nodesObj[start.properties._id].replace = true;
        nodesObj[start.properties._id].aboveL1Type =
          typesNodesReplace[key].replaceType;
        if (typesNodesReplace[key].extraSplit.length > 0) {
          nodesObj[start.properties._id].aboveL2Type =
            typesNodesReplace[key].extraSplit[0];
        }
      }
      // ------------- add node for replacement if exist on key ---------

      // ------------- Create nodesObj ----------------
      if (nodesObj[end.properties._id] == undefined) {
        nodesObj[end.properties._id] = {
          _id: end.properties._id,
          name: end.properties.name,
          type: end.labels[0],
          show: true,
          numEdges: 0,
          replace: false,
        };
      }
      // ------------- Create nodesObj ----------------

      // ------------- add node for replacement if exist on key ---------

      key = end.labels[0] + "|" + start.labels[0];

      if (typesNodesReplace[key]) {
        numberCoreTypeNodes += 1;

        nodesArrReplaceID.push(end.properties._id);

        nodesObj[end.properties._id].replace = true;
        nodesObj[end.properties._id].aboveL1Type =
          typesNodesReplace[key].replaceType;
        if (typesNodesReplace[key].extraSplit.length > 0) {
          nodesObj[end.properties._id].aboveL2Type =
            typesNodesReplace[key].extraSplit[0];
        }
      }
      // ------------- add node for replacement if exist on key ---------

      edgesArr.push({
        source: start.properties._id,
        target: end.properties._id,
        type: segment.relationship.type,
      });
    }
  }

  return {
    nodesObj: nodesObj,
    nodesArrReplaceID: nodesArrReplaceID,
    edgesArr: edgesArr,
    numberCoreTypeNodes: numberCoreTypeNodes,
  };
}

async function arrayToObject(arrayN, keyName) {
  let objectN = {};

  for (let i = 0; i < arrayN.length; i++) {
    let key = arrayN[i][keyName];
    objectN[key] = arrayN[i];
  }

  return objectN;
}

async function arrayToObjectDoubleKey(
  arrayN,
  keyName1,
  keyName2,
  position = undefined
) {
  let objectN = {};

  for (let i = 0; i < arrayN.length; i++) {
    if (position == undefined) {
      let key1 = arrayN[i][keyName1];
      let key2 = arrayN[i][keyName2];

      let ids = [key1, key2].sort();
      let key = ids.join("_");

      objectN[key] = arrayN[i];
    } else {
      let key1 = arrayN[i][position][keyName1];
      let key2 = arrayN[i][position][keyName2];

      let ids = [key1, key2].sort();
      let key = ids.join("_");

      objectN[key] = arrayN[i];
    }
  }

  return objectN;
}

function returnObjectValueDoubleKey(objectN, keyName1, keyName2) {
  let key1 = keyName1;
  let key2 = keyName2;

  let ids = [key1, key2].sort();
  let key = ids.join("_");

  return objectN[key];
}

async function addSettingsNodesSubNodes(
  nodesObj,
  edgesArr,
  nodeSettings,
  edgeSettings
) {
  nodeSettingsObj = await arrayToObject(nodeSettings, "type");

  edgeSettingsObj = await arrayToObjectDoubleKey(
    edgeSettings,
    "nodeTypeSource",
    "nodeTypeTarget",
    "mainEdge"
  );

  let nodesArrNew = [];
  let nodesArrNewObj = {};

  // ----------- The nodes that we will show to the Graph + settings --------
  for (let key in nodesObj) {
    node = nodesObj[key];

    if (nodeSettingsObj[node.type] && nodesObj[key].showNode == true) {
      // if the type exist on the settings it will be desplayed at the end of the graph
      const settingsN = nodeSettingsObj[node.type];

      nodesArrNew.push({
        ...node,
        ...settingsN,
      });
      nodesArrNewObj[node._id] = node;
    }
  }
  // ----------- The nodes that we will show to the Graph + settings --------

  // ----------- The edges taht we will show to the Graph + settings --------
  let edgesArrNew = [];
  for (let i = 0; i < edgesArr.length; i++) {
    edge = edgesArr[i];

    let edgeSettings = returnObjectValueDoubleKey(
      edgeSettingsObj,
      nodesArrNewObj[edge.source]?.type,
      nodesArrNewObj[edge.target]?.type
    );

    if (edgeSettings && edgeSettings?.splitEdge == undefined) {
      edgesArrNew.push({
        ...edge,
        style: {
          stroke: edgeSettings?.mainEdge?.style?.color,
          fill: edgeSettings?.mainEdge?.style?.color,
          ...edgeSettings?.mainEdge?.style,
        },
      });
    }
  }
  // ----------- The edges taht we will show to the Graph + settings --------

  // ---------- If Hidden Edge - You create Fake transparent Edges ------------
  for (let i = 0; i < edgeSettings.length; i++) {
    let edgeSetting = edgeSettings[i];
    // 1) see if there is a hidden edge
    if (edgeSetting?.hiddenEdge == true) {
      // 2) find all the nodes that have the source or target type
      let nodesHiddenEdgeType1 = [];
      let nodesHiddenEdgeType2 = [];
      for (let key in nodesArrNewObj) {
        if (
          edgeSetting?.mainEdge?.nodeTypeSource == nodesArrNewObj[key]?.type
        ) {
          nodesHiddenEdgeType1.push(key);
        }
        if (
          edgeSetting?.mainEdge?.nodeTypeTarget == nodesArrNewObj[key]?.type
        ) {
          nodesHiddenEdgeType2.push(key);
        }
      }
      // 3) create a fake edge between all the nodes that have the source or target type
      for (let i = 0; i < nodesHiddenEdgeType1.length; i++) {
        for (let j = 0; j < nodesHiddenEdgeType2.length; j++) {
          if (nodesHiddenEdgeType1[i] == nodesHiddenEdgeType2[j]) continue;
          edgesArrNew.push({
            source: nodesHiddenEdgeType1[i],
            target: nodesHiddenEdgeType2[j],
            style: {
              stroke: edgeSetting?.mainEdge?.style?.color,
              fill: edgeSetting?.mainEdge?.style?.color,
              distance: edgeSetting?.mainEdge?.style?.distance,
              strength: edgeSetting?.mainEdge?.style?.strength,
            },
          });
        }
      }
    }
  }
  // ---------- If Hidden Edge - You create Fake transparent Edges ------------

  return {
    nodesArrNew2: nodesArrNew,
    edgesArrNew2: edgesArrNew,
    nodeSettingsObj2: nodeSettingsObj,
    edgeSettingsObj2: edgeSettingsObj,
  };
}

async function readSettingsFindReplaceNodes(nodeSettings, edgeSettings) {
  nodeSettingsObj = await arrayToObject(nodeSettings, "type");

  edgeSettingsObj = await arrayToObjectDoubleKey(
    edgeSettings,
    "nodeTypeSource",
    "nodeTypeTarget",
    "mainEdge"
  );

  let typesNodesReplace = {};

  for (let key in edgeSettingsObj) {
    let edgeSettings = edgeSettingsObj[key];

    if (edgeSettings.splitEdge) {
      for (let i = 0; i < edgeSettings.splitEdge.length; i++) {
        let splitEdge = edgeSettings.splitEdge[i];

        typesNodesReplace[splitEdge.nodeTypeSource] = {
          replaceType: splitEdge.nodeTypeMiddle,
          typeTarget: splitEdge.nodeTypeTarget,
          moreThanSplit: edgeSettings.moreThanSplit,
        };
      }
    }
  }
  // console.log("typesNodesReplace = ", typesNodesReplace);
  // asdf2;

  return {
    nodeSettingsObj: nodeSettingsObj,
    edgeSettingsObj: edgeSettingsObj,
    typesNodesReplace: typesNodesReplace,
  };
}

async function readSettingsFindReplaceNodesMultiple(
  nodeSettings,
  edgeSettings
) {
  nodeSettingsObj = await arrayToObject(nodeSettings, "type");

  edgeSettingsObj = await arrayToObjectDoubleKey(
    edgeSettings,
    "nodeTypeSource",
    "nodeTypeTarget",
    "mainEdge"
  );

  let typesNodesReplace = {};
  let typeNodeSearchAbove = {};

  for (let key in edgeSettingsObj) {
    let edgeSettings = edgeSettingsObj[key];

    if (edgeSettings.splitEdge) {
      for (let i = 0; i < edgeSettings.splitEdge.length; i++) {
        let splitEdge = edgeSettings.splitEdge[i];

        const key =
          edgeSettings.mainEdge.nodeTypeSource +
          "|" +
          edgeSettings.mainEdge.nodeTypeTarget;

        if (typesNodesReplace[key] == undefined) {
          typesNodesReplace[key] = {
            replaceType: splitEdge.nodeTypeMiddle,
            typeTarget: splitEdge.nodeTypeTarget,
            moreThanSplit: edgeSettings.moreThanSplit,
            extraSplit: [],
          };

          typeNodeSearchAbove[splitEdge.nodeTypeSource] =
            splitEdge.nodeTypeMiddle;
        } else {
          typesNodesReplace[key].extraSplit.push(splitEdge.nodeTypeMiddle);

          typeNodeSearchAbove[splitEdge.nodeTypeSource] =
            splitEdge.nodeTypeMiddle;
        }
      }
    }
  }

  return {
    typesNodesReplace: typesNodesReplace,
    typeNodeSearchAbove: typeNodeSearchAbove,
  };
}

// create function that will check for the above nodes and replace with expertise the edges
async function replaceSubNodesPlusCalcDistance(
  nodesObj,
  edgesArr,
  nodesArrReplaceID,
  numberCoreTypeNodes
) {
  let nodesData = await Node.find({ _id: nodesArrReplaceID }).select(
    "_id aboveNodes node"
  );

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
  // console.log("nodesObj = ", nodesObj);

  let aboveNodesData = await Node.find({ _id: aboveNodesID }).select(
    "_id name node"
  );

  // console.log("aboveNodesData = ", aboveNodesData);

  for (let i = 0; i < aboveNodesData.length; i++) {
    if (nodesObj[aboveNodesData[i]._id] != undefined) {
      nodesObj[aboveNodesData[i]._id].type = aboveNodesData[i].node;
      nodesObj[aboveNodesData[i]._id].name = aboveNodesData[i].name;
    }
  }
  console.log("nodesObj = ", nodesObj);

  // console.log("edgesArr = ", edgesArr);

  // console.log("----------------------");

  // nodesObj = {
  // '637a9133b8953f12f501e0d6': {
  //   _id: '637a9133b8953f12f501e0d6',
  //   name: 'BluePanda',
  //   type: 'Member',
  //   show: true
  // fakeConnection:{
  //   '908392557258604544':{
  //     fakeID: "NjM3YTkxMzNiODk1M2YxMmY1"
  //   }
  // }
  // },
  // }

  let edgesArrNew = [];

  for (let i = 0; i < edgesArr.length; i++) {
    let edgeSource = edgesArr[i].source;
    let edgeTarget = edgesArr[i].target;

    if (nodesObj[edgeSource].numEdges == undefined) {
      nodesObj[edgeSource].numEdges = 1;
    } else {
      nodesObj[edgeSource].numEdges++;
    }

    if (nodesObj[edgeTarget].numEdges == undefined) {
      nodesObj[edgeTarget].numEdges = 1;
    } else {
      nodesObj[edgeTarget].numEdges++;
    }

    let flatAddEdge = true;

    let nodeNow = nodesObj[edgeSource];
    let fakeID;
    if (
      nodeNow &&
      replaceTypeNodes[nodeNow.type] &&
      !replaceTypeNodes[nodesObj[edgeTarget].type]
    ) {
      flatAddEdge = false;

      if (
        nodesObj[nodeNow.aboveNodes].fakeConnection &&
        nodesObj[nodeNow.aboveNodes].fakeConnection[edgeTarget]
      ) {
        // fake node exist
        fakeID = nodesObj[nodeNow.aboveNodes].fakeConnection[edgeTarget].fakeID;
      } else {
        // fake node DONT exist
        fakeID = createNewID(edgeTarget, nodeNow.aboveNodes);

        nodesObj[nodeNow.aboveNodes].fakeConnection = {
          ...nodesObj[nodeNow.aboveNodes].fakeConnection,
          [edgeTarget]: {
            fakeID: fakeID,
          },
        };
      }

      let distanceNow;

      if (distancesBasedOnNumCoreType[numberCoreTypeNodes]) {
        distanceNow = distancesBasedOnNumCoreType[numberCoreTypeNodes];
      } else {
        distanceNow = distancesBasedOnNumCoreType["else"];
      }

      // and then add two, one from source to above node
      edgesArrNew.push({
        source: fakeID,
        target: edgeTarget,
        distanceRation: distanceNow.far, // Big Distance between the main node and the category
      });
      // and the other one from above to target node
      edgesArrNew.push({
        source: edgeSource,
        target: fakeID,
        distanceRation: distanceNow.close, // small distancec between category and subCategory
      });

      if (nodeNow.aboveNodes && nodesObj[nodeNow.aboveNodes]) {
        nodesObj[nodeNow.aboveNodes].show = true;
      }
      // nodesObj[nodeNow.aboveNodes].show = true;
    }

    // console.log("dokiii = ", i);

    nodeNow = nodesObj[edgeTarget];
    if (
      nodeNow &&
      replaceTypeNodes[nodeNow.type] &&
      !replaceTypeNodes[nodesObj[edgeSource].type]
    ) {
      flatAddEdge = false;

      if (
        nodesObj[nodeNow.aboveNodes].fakeConnection &&
        nodesObj[nodeNow.aboveNodes].fakeConnection[edgeSource]
      ) {
        // fake node don exist
        fakeID = nodesObj[nodeNow.aboveNodes].fakeConnection[edgeSource].fakeID;
      } else {
        // fake node DONT exist
        fakeID = createNewID(edgeSource, nodeNow.aboveNodes);
        nodesObj[nodeNow.aboveNodes].fakeConnection = {
          [edgeSource]: {
            fakeID: fakeID,
          },
        };
      }

      let distanceNow;

      if (distancesBasedOnNumCoreType[numberCoreTypeNodes]) {
        distanceNow = distancesBasedOnNumCoreType[numberCoreTypeNodes];
      } else {
        distanceNow = distancesBasedOnNumCoreType["else"];
      }

      // console.log("change = ", nodeNow, i);
      // and then add two, one from source to above node
      edgesArrNew.push({
        source: edgeSource,
        target: fakeID,
        distanceRation: distanceNow.far, // Big Distance between the main node and the category
      });
      // and the other one from above to target node
      edgesArrNew.push({
        source: fakeID,
        target: edgeTarget,
        distanceRation: distanceNow.close, // small distancec between category and subCategory
      });

      if (nodeNow.aboveNodes && nodesObj[nodeNow.aboveNodes]) {
        nodesObj[nodeNow.aboveNodes].show = true;
      }
      // nodesObj[nodeNow.aboveNodes].show = true;
    }

    if (flatAddEdge == true) {
      edgesArrNew.push({
        source: edgeSource,
        target: edgeTarget,
        distanceRation: 0.5, // the distance here is average for this two nodes
      });
    }
  }

  let nodesArrNew = [];

  for (let key in nodesObj) {
    let extraInfo = {};
    if (replaceTypeNodes[nodesObj[key].type]) {
      const dem = nodesObj[key].numEdges ** 0.65;
      extraInfo = {
        extraDistanceRation: 1 - 1 / dem,
      };
      // console.log("change = " + nodesObj[key].type, extraInfo);
    }
    if (nodesObj[key].show == true) {
      if (nodesObj[key].fakeConnection) {
        for (let key2 in nodesObj[key].fakeConnection) {
          nodesArrNew.push({
            ...extraInfo,
            _id: nodesObj[key].fakeConnection[key2].fakeID,
            name: nodesObj[key].name,
            type: nodesObj[key].type,
            originalNode: key,
            show: true,
          });
        }
      } else {
        nodesArrNew.push({
          ...extraInfo,
          ...nodesObj[key],
        });
      }
    }
  }

  // asdf;
  return {
    nodesArrNew: nodesArrNew,
    edgesArrNew: edgesArrNew,
  };
}

// async function readSettingsFindReplaceNodes(nodeSettings, edgeSettings) {
//   nodeSettingsObj = await arrayToObject(nodeSettings, "type");

//   edgeSettingsObj = await arrayToObjectDoubleKey(
//     edgeSettings,
//     "nodeTypeSource",
//     "nodeTypeTarget",
//     "mainEdge"
//   );

//   let typesNodesReplace = {};

//   for (let key in edgeSettingsObj) {
//     let edgeSettings = edgeSettingsObj[key];

//     if (edgeSettings.splitEdge) {
//       for (let i = 0; i < edgeSettings.splitEdge.length; i++) {
//         let splitEdge = edgeSettings.splitEdge[i];

//         typesNodesReplace[splitEdge.nodeTypeSource] = {
//           replaceType: splitEdge.nodeTypeMiddle,
//           typeTarget: splitEdge.nodeTypeTarget,
//           moreThanSplit: edgeSettings.moreThanSplit,
//         };
//       }
//     }
//   }
//   // console.log("typesNodesReplace = ", typesNodesReplace);
//   // asdf2;

//   return {
//     nodeSettingsObj: nodeSettingsObj,
//     edgeSettingsObj: edgeSettingsObj,
//     typesNodesReplace: typesNodesReplace,
//   };
// }

async function searchAboveNodesOneLayer(searchNodes, nodesObj_n) {
  // -------------- Find replace Nodes ------------
  let nodesData = await Node.find({ _id: searchNodes }).select(
    "_id name node aboveNodes"
  );

  // console.log("searchNodes = ", searchNodes);
  let aboveNodesID = [];
  for (let i = 0; i < nodesData.length; i++) {
    if (nodesObj_n[nodesData[i]._id] != undefined) {
      nodesObj_n[nodesData[i]._id].type = nodesData[i].node;
      nodesObj_n[nodesData[i]._id].name = nodesData[i].name;
      nodesObj_n[nodesData[i]._id].aboveNodes = nodesData[i].aboveNodes;
    } else {
      nodesObj_n[nodesData[i]._id] = {
        _id: nodesData[i]._id,
        name: nodesData[i].name,
        type: nodesData[i].node,
        aboveNodes: nodesData[i].aboveNodes,
      };
    }

    // if (nodesData[i]._id == "63d1ad93a90f12cef67a7c7b") {
    //   console.log("nodesData[i].aboveNodes = ", nodesData[i].aboveNodes);
    //   asfd23;
    // }

    for (let j = 0; j < nodesData[i].aboveNodes.length; j++) {
      let aboveNodeID = nodesData[i].aboveNodes[j];
      if (nodesObj_n[aboveNodeID] == undefined) {
        aboveNodesID.push(aboveNodeID);

        nodesObj_n[aboveNodeID] = {
          _id: aboveNodeID,
          subNodes: [nodesData[i]._id],
        };
      } else {
        nodesObj_n[aboveNodeID].subNodes.push(nodesData[i]._id);
      }

      // if (
      //   nodesData[i]._id == "63d1ad93a90f12cef67a7c7b" &&
      //   aboveNodeID == "637a912ab8953f12f501e0b8"
      // ) {
      //   console.log("nodesData[i].aboveNodes = ", nodesData[i].aboveNodes);
      //   asfd24;
      // }
    }
  }

  // console.log("aboveNodesID = ", aboveNodesID);

  return {
    searchNodes: aboveNodesID,
    nodesObj_n: nodesObj_n,
  };
}

async function searchAboveNodesAllLayers(searchNodes, nodesObj_n) {
  let resultsL1 = await searchAboveNodesOneLayer(searchNodes, nodesObj_n);

  let resultsL2 = await searchAboveNodesOneLayer(
    resultsL1.searchNodes,
    resultsL1.nodesObj_n
  );

  let resultsL3 = await searchAboveNodesOneLayer(
    resultsL2.searchNodes,
    resultsL2.nodesObj_n
  );

  //  -------------- Add the L1 and L2 of the searchNodes ------------
  const nodesObj_F = resultsL3.nodesObj_n;
  for (let i = 0; i < searchNodes.length; i++) {
    let nodeID = searchNodes[i];
    if (nodesObj_F[nodeID] != undefined) {
      let aboveNodeID = await findAndAddAboveNodes(
        nodesObj_F,
        nodesObj_F[nodeID].aboveNodes,
        nodeID,
        nodesObj_F[nodeID].aboveL1Type
      );

      nodesObj_F[nodeID].aboveL1ID = aboveNodeID;
      nodesObj_n[nodeID].aboveL1ID = aboveNodeID;
      if (nodesObj_n[aboveNodeID] == undefined) {
        nodesObj_n[aboveNodeID] = nodesObj_F[aboveNodeID];
      }

      if (nodesObj_F[nodeID].aboveL2Type != undefined) {
        let aboveNodeID2 = await findAndAddAboveNodes(
          nodesObj_F,
          nodesObj_F[aboveNodeID].aboveNodes,
          nodeID,
          nodesObj_F[nodeID].aboveL2Type
        );

        nodesObj_F[nodeID].aboveL2ID = aboveNodeID2;

        nodesObj_n[nodeID].aboveL2ID = aboveNodeID2;

        if (nodesObj_n[aboveNodeID2] == undefined) {
          nodesObj_n[aboveNodeID2] = nodesObj_F[aboveNodeID];
        }
      }
    }
  }
  //  -------------- Add the L1 and L2 of the searchNodes ------------

  return nodesObj_n;
}

async function findAndAddAboveNodes(
  nodesObj_,
  aboveNodes_T,
  nodeID,
  aboveLType
) {
  let res_aboveNodeID = undefined;
  for (let k = 0; k < aboveNodes_T.length; k++) {
    let aboveNodeID = aboveNodes_T[k];

    if (nodesObj_[aboveNodeID]?.type == aboveLType) {
      res_aboveNodeID = aboveNodeID;

      return res_aboveNodeID;
    }
  }
  return res_aboveNodeID;
}

async function splitEdgeFunc(
  nodesObj,
  edgeFirst,
  edgeSecond,
  typesNodesReplace,
  edgesArrNew
) {
  let flagAddEdge = true;
  // ------------ Split edge source ---------
  let key = nodesObj[edgeFirst].type + "|" + nodesObj[edgeSecond].type;
  if (typesNodesReplace[key]) {
    if (nodesObj[edgeFirst].aboveL1ID != undefined) {
      if (nodesObj[edgeFirst].aboveL2ID != undefined) {
        edgesArrNew.push({
          source: edgeFirst,
          target: nodesObj[edgeFirst].aboveL1ID,
        });

        edgesArrNew.push({
          source: nodesObj[edgeFirst].aboveL1ID,
          target: nodesObj[edgeFirst].aboveL2ID,
        });

        edgesArrNew.push({
          source: nodesObj[edgeFirst].aboveL2ID,
          target: edgeSecond,
        });

        nodesObj[edgeFirst].showNode = true;
        nodesObj[edgeSecond].showNode = true;
        nodesObj[nodesObj[edgeFirst].aboveL1ID].showNode = true;
        nodesObj[nodesObj[edgeFirst].aboveL2ID].showNode = true;

        // console.log("edgesArrNew = ", edgesArrNew);

        flagAddEdge = false;
      } else {
        edgesArrNew.push({
          source: edgeFirst,
          target: nodesObj[edgeFirst].aboveL1ID,
        });
        // and the other one from above to target node
        edgesArrNew.push({
          source: nodesObj[edgeFirst].aboveL1ID,
          target: edgeSecond,
        });

        nodesObj[edgeFirst].showNode = true;
        nodesObj[edgeSecond].showNode = true;
        nodesObj[nodesObj[edgeFirst].aboveL1ID].showNode = true;

        flagAddEdge = false;
      }
    }
  }
  // ------------ Split edge source --------

  return {
    flagAddEdge: flagAddEdge,
    edgesArrNew: edgesArrNew,
    nodesObj: nodesObj,
  };
}

// create function that will check for the above nodes and replace with expertise the edges
async function replaceNodes(
  nodesObj,
  edgesArr,
  nodesArrReplaceID,
  typesNodesReplace
) {
  let nodesObj_n = await searchAboveNodesAllLayers(nodesArrReplaceID, nodesObj);

  nodesObj = nodesObj_n;

  let edgesArrNew = [];

  for (let i = 0; i < edgesArr.length; i++) {
    let edgeSource = edgesArr[i].source;
    let edgeTarget = edgesArr[i].target;

    // ------------ Add number of edges for each node ---------
    if (nodesObj[edgeSource].numEdges == undefined) {
      nodesObj[edgeSource].numEdges = 1;
    } else {
      nodesObj[edgeSource].numEdges++;
    }

    if (nodesObj[edgeTarget].numEdges == undefined) {
      nodesObj[edgeTarget].numEdges = 1;
    } else {
      nodesObj[edgeTarget].numEdges++;
    }
    // ------------ Add number of edges for each node ---------

    // ------------ splitEdgeFunc ------------
    let splitRes1 = await splitEdgeFunc(
      nodesObj,
      edgeSource,
      edgeTarget,
      typesNodesReplace,
      edgesArrNew
    );

    edgesArrNew = splitRes1.edgesArrNew;
    nodesObj = splitRes1.nodesObj;

    let splitRes2 = await splitEdgeFunc(
      nodesObj,
      edgeTarget,
      edgeSource,
      typesNodesReplace,
      edgesArrNew
    );

    edgesArrNew = splitRes2.edgesArrNew;
    nodesObj = splitRes2.nodesObj;
    // ------------ splitEdgeFunc ------------

    // ------------ Dont Split ---------
    if (splitRes1.flagAddEdge == true && splitRes2.flagAddEdge == true) {
      edgesArrNew.push({
        source: edgeSource,
        target: edgeTarget,
        distanceRation: 0.5, // the distance here is average for this two nodes
      });
      // console.log("TOROSDFJSODF = ");

      nodesObj[edgeSource].showNode = true;
      nodesObj[edgeTarget].showNode = true;
    }
    // ------------ Dont Split ---------
  }

  return {
    edgesArrNew: edgesArrNew,
    nodesObj_: nodesObj,
  };
}
