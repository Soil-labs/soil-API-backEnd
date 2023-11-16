require("dotenv").config();
const { Members } = require("../../../models/membersModel");
const { Projects } = require("../../../models/projectsModel");
const { Node } = require("../../../models/nodeModal");

const axios = require("axios");

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

const allowNodesNeo4j = async (nodeSettings) => {
  let allowNodes = "";
  if (nodeSettings) {
    nodeSettings.forEach((node) => {
      if (node.type != "Member") {
        allowNodes += `m:${node.type} or `;
      }
    });

    allowNodes = allowNodes.slice(0, -4);

  }
  return allowNodes;
};

function chooseAPIkey() {
  openAI_keys = [process.env.REACT_APP_OPENAI_1];

  // randomly choose one of the keys
  let randomIndex = Math.floor(Math.random() * openAI_keys.length);
  let key = openAI_keys[randomIndex];

  return key;
}


async function useGPTchat(userNewMessage,discussion,systemPrompt,userQuestion = "") {

  discussion.unshift({
    "role": "system", 
    "content": systemPrompt
  });
  
  discussion.push({
    "role": "user",
    // "content": userNewMessage + "\n" + userQuestion
    "content": userQuestion + "\n" + userNewMessage
  })


  

  console.log("discussion = " , discussion)
  // asdf2
  
  let OPENAI_API_KEY = chooseAPIkey();
  response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      messages: discussion,
      model: "gpt-3.5-turbo",
      temperature: 0.3
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    }
  );
  

  return response.data.choices[0].message.content;
}


async function useGPTchatSimple(prompt) {
  
  discussion = [{
    "role": "user",
    "content": prompt
  }]


  
  let OPENAI_API_KEY = chooseAPIkey();
  response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      messages: discussion,
      model: "gpt-3.5-turbo",
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    }
  );

  return response.data.choices[0].message.content;
}

// async function parseCategories(input) {
//   const lines = input.split("\n");
//   const result = [];
//   let currentCategory = null;
//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i].trim();
//     if (line.startsWith("Category:")) {
//       currentCategory = line.substring("Category:".length).trim();
//       result.push({ category: currentCategory, keywords: [] });
//     } else if (line.length > 0 && currentCategory) {
//       result[result.length - 1].keywords.push(line);
//     }
//   }
//   return result;
// }
// function parseCategories(input) {
//   const lines = input.split("\n");
//   const result = [];
//   let currentCategory = null;
//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i].trim();
//     if (line.startsWith("Category:")) {
//       currentCategory = line.substring("Category:".length).trim();
//       // check if the current category already exists in the result array
//       const existingCategory = result.find(c => c.category === currentCategory);
//       if (!existingCategory) {
//         result.push({ category: currentCategory, keywords: [] });
//       } else {
//         // if the category already exists, update the current category to the existing one
//         currentCategory = existingCategory.category;
//       }
//     } else if (line.length > 0 && currentCategory) {
//       // exclude anything in parentheses from being added as a keyword
//       const keyword = line.split("(")[0].trim();
//       result[result.length - 1].keywords.push(keyword);
//     }
//   }
//   return result;
// }
async function parseCategories(input) {
  const lines = input.split("\n");
  const result = [];
  let currentCategory = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("Category:")) {
      currentCategory = line.substring("Category:".length).trim();
      // check if the current category already exists in the result array
      const existingCategory = result.find(c => c.category === currentCategory);
      if (!existingCategory) {
        result.push({ category: currentCategory, keywords: [] });
      } else {
        // if the category already exists, update the current category to the existing one
        currentCategory = existingCategory.category;
      }
    } else if (line.length > 0 && currentCategory) {
      // exclude anything in parentheses from being added as a keyword
      
      let keyword = line.split("(")[0].trim();
      if (keyword.includes(":")) {
        keyword = keyword.split(":");
        keyword = keyword[1].trim();
      }
      if (keyword.length < 40 && keyword.length > 2){
        keyword = keyword.replace("- ","")
        result[result.length - 1].keywords.push(keyword);
      }
    }
  }
  return result;
}

async function addStyleBasedDistance (obj,distance){

  console.log("obj = " , distance, obj)

  if (distance == 0){
    obj = {
      ...obj,
      style: {
        ...obj.style,
        // fill: "#F0F8FC",
        // stroke: "#44B1FF"
        fill: "#9FF8F5",
        stroke: "#57F5F0"
      }
    }
  }
  if (distance == 1){
    obj = {
      ...obj,
      style: {
        ...obj.style,
        // fill: "#F0F8FC",
        // stroke: "#44B1FF"
        fill: "#B3F7F4",
        stroke: "#76F7F0"
      }
    }
  }
  if (distance == 2){
    obj = {
      ...obj,
      style: {
        ...obj.style,
        // fill: "#F5F9FC",
        // stroke: "#79C5FC"
        fill: "#C7F5F3",
        stroke: "#8DF8F5"
      }
    }
  }
  if (distance > 2){
    obj = {
      ...obj,
      style: {
        ...obj.style,
        fill: "#F2FCFB",
        stroke: "#B4FAF3"
      }
    }
  }

  

  return obj
}

async function createNodesEdgesSkillsCategoriesV2 (nodesObj,memberID,nodeSettings, edgeSettings){


  nodeSettingsObj = await arrayToObject(nodeSettings, "type");

  // ----------- Crete Nodes - Edge To Member -------------
  nodeArrNew = []
  nodeObjNew = {}
  edgeArrNew = []
  caetgoryObjNew = {}

  // ----- add member ----
  const settingsN = nodeSettingsObj['Member'];
  let resN = {
    ...settingsN,
    ...nodesObj[memberID],
    type: 'Member',
  }
  nodeObjNew[nodesObj[memberID]._id] = resN
  nodeArrNew.push(resN)
  // ----- add member ----


  for (const [nodeID, node] of Object.entries(nodesObj)) {

    // if (nodeID == "6416ae6948d9ba5ceefb6971"){
    //   console.log("node nodisodeee= " , node)
    //   sdf
    // }
    
    if (node?.graphSubNodes?.length > 1) {
      const settingsN = nodeSettingsObj[node.node];

      let resN = {
        ...settingsN,
        ...node,
        type: node.node,
        node: node.node,
      }
      if (node.node != "Member"){
        // resN = await addStyleBasedDistance(resN,resN.distanceStart)
        resN = await addStyleBasedDistance(resN,3)
      }

      nodeObjNew[node._id] = resN
      nodeArrNew.push(resN)

      caetgoryObjNew[node._id] = node
      
      // ---- create edge with Member ----
      edgeArrNew.push({
        source: memberID,
        target: node._id,
        style: {
          stroke: "#E0E0E0",
          fill: "#E0E0E0",
          distance: 90,
          strength: 0.5
        }
      })
      // ---- create edge with Member ----

      for (let i = 0; i < node.graphSubNodes.length; i++) {
        let nodeCategory = nodesObj[node.graphSubNodes[i]]
        const settingsN = nodeSettingsObj[nodeCategory.node];

        // if (nodeCategory._id == "6416b5f1a59032640bd810fd"){
        //   console.log("change = " ,settingsN)
        //   asdf3
        // }
        let resN = {
          ...settingsN,
          ...nodeCategory,
          type: nodeCategory.node,
          node: nodeCategory.node,
        }
        if (nodeCategory.node != "Member"){
          resN = await addStyleBasedDistance(resN,resN.distanceStart)
        }

        nodeObjNew[nodeCategory._id] = resN
        nodeArrNew.push(resN)

        // ---- create edge with Member ----
        edgeArrNew.push({
          source: node._id,
          target: nodeCategory._id,
          style: {
            stroke: "#E0E0E0",
            fill: "#E0E0E0",
            distance: 90,
            strength: 0.5
          }
        })
        // ---- create edge with Member ----
      }


    } else if (node?.graphSubNodes?.length > 0) {

      if (nodeObjNew["empty"] == undefined){
        const settingsN = nodeSettingsObj["Category"];

        let resN = {
          _id: "empty",
          name: "General",
          type: "Category",
          node: "Category",
          ...settingsN,
        }
        resN = await addStyleBasedDistance(resN,3)
        
        nodeObjNew["empty"] = resN
        nodeArrNew.push(resN)
        // ---- create edge with Member ----
        edgeArrNew.push({
          source: "empty",
          target: memberID,
          style: {
            stroke: "#E0E0E0",
            fill: "#E0E0E0",
            distance: 90,
            strength: 0.5
          }
        })
        // ---- create edge with Member ----

        caetgoryObjNew["empty"] = resN
      }

      let nodeCategory = nodesObj[node.graphSubNodes[0]]

      const settingsN = nodeSettingsObj[nodeCategory.node];

      let resN = {
        ...settingsN,
        ...nodeCategory,
        type: nodeCategory.node,
        node: nodeCategory.node,
      }
      if (nodeCategory.node != "Member"){
        resN = await addStyleBasedDistance(resN,resN.distanceStart)
      }

      nodeObjNew[nodeCategory._id] = resN
      nodeArrNew.push(resN)

      caetgoryObjNew[node._id] = node


      // ---- create edge with Member ----
      edgeArrNew.push({
        source: "empty",
        target: nodeCategory._id,
        style: {
          stroke: "#E0E0E0",
          fill: "#E0E0E0",
          distance: 90,
          strength: 0.5
        }
      })
      // ---- create edge with Member ----
    } 
  }
  // console.log("nodeArrNew = " , nodeArrNew)
  // asdf5x

  // ----------- Create Hidden Edges between categories -----------
  for (const [nodeID1, node1] of Object.entries(caetgoryObjNew)) {

    for (const [nodeID2, node2] of Object.entries(caetgoryObjNew)) {
      // const keysArray = Object.keys(caetgoryObjNew);
      // const randomIndex = Math.floor(Math.random() * keysArray.length);
      // const nodeID2 = keysArray[randomIndex];
 
      if (nodeID1 != nodeID2){
        edgeArrNew.unshift({
          source: nodeID1,
          target: nodeID2,
          style: {
            stroke: "#FFFFFF",
            fill: "#FFFFFF",
            distance: 270,
            strength: 0.5
          }
        })
      }
    }

  }
  // ----------- Create Hidden Edges between categories -----------


  // console.log("nodeObjNew = " , nodeObjNew)
  // console.log("edgeArrNew = " , edgeArrNew)

  // saf9

  return {
    nodesArrNew:nodeArrNew,
    edgesArrNew: edgeArrNew
  }
   


}


async function createNodesEdgesSkillsCategories (nodesObjName,memberID,categorySkillObj,nodeSettings, edgeSettings){


  // console.log("hey = ",nodeSettings)
  
  nodeSettingsObj = await arrayToObject(nodeSettings, "type");

  // console.log("nodeSettingsObj = ", nodeSettingsObj)
  // console.log("nodesObjName = ", nodesObjName)
  // asfd9

  // ----------- Crete Nodes - Edge To Member -------------
  nodeArrNew = []
  nodeObjNew = {}
  edgeArrNew = []
  for (const [nodeName, node] of Object.entries(nodesObjName)) {
    
    const settingsN = nodeSettingsObj[node.type];

    if (node.category || node.type == "Member"){

      let resN = {
        ...settingsN,
        ...node,
      }
      if (node.type != "Member"){
        resN = await addStyleBasedDistance(resN,node.distanceStart)
      }
      nodeObjNew[node._id] = resN
      nodeArrNew.push(resN)

      console.log("resN = " , resN)

      let nodeCategory = node?.category?.replace(" ","_")

      if (nodeCategory == undefined) continue

      // ---- create edge with Member ----
      edgeArrNew.push({
        source: node._id,
        target: nodeCategory,
        style: {
          stroke: "#E0E0E0",
          fill: "#E0E0E0",
          distance: 90,
          strength: 0.5
        }
      })
      // ---- create edge with Member ----
      
      if (nodeObjNew[nodeCategory] == undefined){
        let resN = {
          _id: nodeCategory,
          type: "Category",
          name: node.category,
          style: {
            size: 72,
            fill: "#EBF8FF",
            stroke: "#179FFF"
          }
        }
        resN = await addStyleBasedDistance(resN,categorySkillObj[node.category].distanceStart)

        nodeObjNew[nodeCategory] = resN
        nodeArrNew.push(resN)

        // console.log("resN = " , resN)

        

        // ---- create edge with Member ----
        edgeArrNew.push({
          source: memberID,
          target: nodeCategory,
          style: {
            stroke: "#E0E0E0",
            fill: "#E0E0E0",
            distance: 130,
            strength: 0.5
          }
        })
        // ---- create edge with Member ----
      }
    }

  }
  // ----------- Crete Nodes -------------

  // console.log("edgeArrNew = ", edgeArrNew)
  // asdf14

  // ----------- Create Hidden Edges between categories -----------
  for (const [categoryName1, category1] of Object.entries(categorySkillObj)) {

    for (const [categoryName2, category2] of Object.entries(categorySkillObj)) {

      if (categoryName1 != categoryName2){
        edgeArrNew.push({
          source: categoryName1.replace(" ","_"),
          target: categoryName2.replace(" ","_"),
          style: {
            stroke: "#FFFFFF",
            fill: "#FFFFFF",
            distance: 240,
            strength: 0.5
          }
        })
      }
    }

  }
  // ----------- Create Hidden Edges between categories -----------


  // console.log("nodeObjNew = ", nodeObjNew)
  
  // asdf5

  return {
    nodesArrNew:nodeArrNew,
    edgesArrNew: edgeArrNew
  }
   
}


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

      //  -------------- neo4j Allowed Nodes -------------

      let allowNodes = await allowNodesNeo4j(nodeSettings);

      // console.log("allowNodes = " , allowNodes)
      // sadf9
      //  -------------- neo4j Allowed Nodes -------------

      // res = await generalFunc_neo4j({
      //   request: `//find node -> and node around of Type
      //   MATCH res = ((n)-[]-(m))
      //   WHERE n._id = "${memberID}" AND (m:sub_expertise or m:sub_typeProject or m:skill)
      //   RETURN res
      //   `,
      // });
      res = await generalFunc_neo4j({
        request: `//find node -> and node around of Type
        MATCH res = ((n)-[]-(m))
        WHERE n._id = "${memberID}" AND (${allowNodes})
        RETURN res
        `,
      });

      let { typesNodesReplace, typeNodeSearchAbove } =
        await readSettingsFindReplaceNodesMultiple(nodeSettings, edgeSettings);

      let { nodesObj, edgesArr, nodesArrReplaceID, numberCoreTypeNodes } =
        await neo4jToNodeEdgeGraphSettings(res, typesNodesReplace);

        // console.log("nodesObj = " , nodesObj)
        // asdf32

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

      const edgesArrNew2_unique = _.uniqWith(edgesArrNew2, _.isEqual);
      const nodesArrNew2_unique = _.uniqWith(nodesArrNew2, _.isEqual);

      return {
        nodes: nodesArrNew2_unique,
        edges: edgesArrNew2_unique,
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
  dynamicSearchToProjectGraph: async (parent, args, context, info) => {
    const { nodesID, projectID, nodeSettings, edgeSettings } = args.fields;
    console.log(
      "Query > dynamicSearchToProjectGraph > args.fields = ",
      args.fields
    );

    if (!nodesID) throw new ApolloError("The nodesID is required");

    try {
      let nodesData = await Node.find({ _id: nodesID }).select("_id");

      if (!nodesData) throw new ApolloError("Member not found");

      // console.log("nodesData = ", nodesData);

      let nodeDataIds = [];
      let nodeDataObj = {};
      for (let i = 0; i < nodesData.length; i++) {
        nodeDataIds.push(nodesData[i]._id);
        nodeDataObj[nodesData[i]._id] = nodesData[i];
      }

      const nodeDataIds_str = JSON.stringify(nodeDataIds);
      console.log("nodeDataIds_str = ", nodeDataIds_str);
      // asdf;

      if (projectID == undefined || projectID == "") {
        res = await generalFunc_neo4j({
          request: `
            MATCH res = ((o)-[]-(r)-[]-(p))
            WHERE o._id IN ${nodeDataIds_str} AND (p:Project) AND (r: Role)
            RETURN res
        `,
        });
      } else {
        res = await generalFunc_neo4j({
          request: `
              MATCH res = ((o)-[]-(r)-[]-(p))
              WHERE o._id IN ${nodeDataIds_str} AND (p._id="${projectID}") AND (r: Role)
              RETURN res
        `,
        });
      }

      // console.log("res = ", res);
      // asdf0;

      let { typesNodesReplace, typeNodeSearchAbove } =
        await readSettingsFindReplaceNodesMultiple(nodeSettings, edgeSettings);

      let { nodesObj, edgesArr, nodesArrReplaceID, numberCoreTypeNodes } =
        await neo4jToNodeEdgeGraphSettings(
          res,
          typesNodesReplace,
          true,
          nodeDataObj
        );

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

      const edgesArrNew2_unique = _.uniqWith(edgesArrNew2, _.isEqual);
      const nodesArrNew2_unique = _.uniqWith(nodesArrNew2, _.isEqual);

      return {
        nodes: nodesArrNew2_unique,
        edges: edgesArrNew2_unique,
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
  dynamicSearchGraph: async (parent, args, context, info) => {
    const { nodesID, nodeSettings, edgeSettings } = args.fields;
    console.log("Query > dynamicSearchGraph > args.fields = ", args.fields);

    if (!nodesID) throw new ApolloError("The nodesID is required");

    try {
      let nodesData = await Node.find({ _id: nodesID }).select("_id");

      if (!nodesData) throw new ApolloError("Member not found");

      // console.log("nodesData = ", nodesData);

      let nodeDataIds = [];
      let nodeDataObj = {};
      for (let i = 0; i < nodesData.length; i++) {
        nodeDataIds.push(nodesData[i]._id);
        nodeDataObj[nodesData[i]._id] = nodesData[i];
      }

      const nodeDataIds_str = JSON.stringify(nodeDataIds);
      console.log("nodeDataIds_str = ", nodeDataIds_str);
      // asdf;

      // if (projectID == undefined || projectID == "") {
      //   res = await generalFunc_neo4j({
      //     request: `
      //       MATCH res = ((o)-[]-(r)-[]-(p))
      //       WHERE o._id IN ${nodeDataIds_str} AND (p:Project) AND (r: Role)
      //       RETURN res
      //   `,
      //   });
      // } else {
      //   res = await generalFunc_neo4j({
      //     request: `
      //         MATCH res = ((o)-[]-(r)-[]-(p))
      //         WHERE o._id IN ${nodeDataIds_str} AND (p._id="${projectID}") AND (r: Role)
      //         RETURN res
      //   `,
      //   });
      // }

      res = await generalFunc_neo4j({
        request: `
              MATCH res = (o)
              WHERE o._id IN ${nodeDataIds_str} 
              RETURN res
        `,
      });

      console.log("res = ", res);
      // asdf0;

      // console.log("HEEEEEI = " )
      let { typesNodesReplace, typeNodeSearchAbove } =
        await readSettingsFindReplaceNodesMultiple(nodeSettings, edgeSettings);

      // console.log("HEEEEEI 2= " )

      let { nodesObj, edgesArr, nodesArrReplaceID, numberCoreTypeNodes } =
        await neo4jToNodeEdgeGraphSettings(
          res,
          typesNodesReplace,
          true,
          nodeDataObj
        );

      // console.log("HEEEEEI 3= " )


      // console.log("nodesObj = ", nodesObj);
      // console.log("edgesArr = ", edgesArr);
      // console.log("nodesArrReplaceID = ", nodesArrReplaceID);
      // asdf1;

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

      const edgesArrNew2_unique = _.uniqWith(edgesArrNew2, _.isEqual);
      const nodesArrNew2_unique = _.uniqWith(nodesArrNew2, _.isEqual);

      return {
        nodes: nodesArrNew2_unique,
        edges: edgesArrNew2_unique,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "dynamicSearchGraph",
        {
          component: "graphVisual > dynamicSearchGraph",
        }
      );
    }
  },
  dynamicSearchToMemberCategoryGroup: async (parent, args, context, info) => {
    const { nodesID, memberID, nodeSettings, edgeSettings } = args.fields;
    console.log(
      "Query > dynamicSearchToMemberCategoryGroup > args.fields = ",
      args.fields
    );

    if (!nodesID) throw new ApolloError("The nodesID is required");
    if (!memberID) throw new ApolloError("The memberID is required");
    // try {

      let nodesData = await Node.find({ _id: nodesID }).select("_id name node categoryNodes groupNodes");

      if (!nodesData) throw new ApolloError("node not found");

      // ----------- Find all Member Node Data ---------------
      let memberData = await Members.findOne({
        _id: memberID,
      }).select("nodes");

      if (!memberData) throw new ApolloError("Member not found");

      memberNodesID = memberData.nodes.map((node) => node._id);


      let memberNodesdData = await Node.find({ _id: memberNodesID }).select("_id name node categoryNodes groupNodes"); 


      memberNodesdData = memberNodesdData.slice(0,16) // SOS 🆘 - Delete that, it is only for a super quick clean up of the users that have more than 50 nodes! later we should hvae better way

      // console.log("nodesData = " , nodesData)

      // console.log("memberNodesdData = " , memberNodesdData)
      // asdf5
      // ----------- Find all Member Node Data ---------------


      // ------------ Create node Disctionary and find Categories and Groups ------------
      let nodeDataIds = [];
      let nodeDataObj = {};
      let nodeCategoryGroup = [];
      for (let i = 0; i < nodesData.length; i++) {
        nodeDataIds.push(nodesData[i]._id);

        nodeDataObj[nodesData[i]._id] = {
          ...nodesData[i]._doc,
          originNode: "dynamicSearch",
        }

        for (let j = 0; j < nodesData[i].categoryNodes.length; j++) {
          nodeCategoryGroup.push(nodesData[i].categoryNodes[j]._id);
        }

        for (let j = 0; j < nodesData[i].groupNodes.length; j++) {
          nodeCategoryGroup.push(nodesData[i].groupNodes[j]._id);
        }
      }

      for (let i = 0; i < memberNodesdData.length; i++) {
        nodeDataObj[memberNodesdData[i]._id] = {
          ...memberNodesdData[i]._doc,
          originNode: "Member",
        }

        for (let j = 0; j < memberNodesdData[i].categoryNodes.length; j++) {
          nodeCategoryGroup.push(memberNodesdData[i].categoryNodes[j]._id);
        }

        for (let j = 0; j < memberNodesdData[i].groupNodes.length; j++) {
          nodeCategoryGroup.push(memberNodesdData[i].groupNodes[j]._id);
        }
      }
      // ------------ Create node Disctionary and find Categories and Groups ------------

      // ---------- Find Categories and Groups Data ------------
      let nodeCategoryGroupData = await Node.find({
        _id: nodeCategoryGroup,
      }).select("_id name node");

      for (let i = 0; i < nodeCategoryGroupData.length; i++) {
        nodeDataObj[nodeCategoryGroupData[i]._id] = {
          ...nodeCategoryGroupData[i]._doc,
          originNode: "CategoryGroup",
        }
      }
      // ---------- Find Categories and Groups Data ------------

      const nodeDataIds_str = JSON.stringify(nodeDataIds);
      // console.log("nodeDataIds_str = ", nodeDataIds_str);
      // asdf;

      res = await generalFunc_neo4j({
        request: `
            MATCH res = ((o)-[*1..3]-(m))
            WHERE o._id IN ${nodeDataIds_str} AND (m._id="${memberID}") 
            AND NONE(n IN nodes(res)[1..-1] WHERE "Project" IN labels(n) OR "Member" IN labels(n))
            RETURN res
      `,
      });

      let { typesNodesReplace, typeNodeSearchAbove } =
        await readSettingsFindReplaceNodesMultiple(nodeSettings, edgeSettings);

      let { nodesObj, edgesArr, nodesArrReplaceID, numberCoreTypeNodes } =
        await neo4jToNodeEdgeGraphSettings(
          res,
          typesNodesReplace,
          true,
          nodeDataObj
        );
        // distanceEnd = How close it is to the Member Node, The closer it is the better
        // distanceStart = How far is from the dynamic search, the closer on the dynamic search the better 

      // console.log("nodeDataObj = " , nodeDataObj)
      // console.log("nodesObj = " , nodesObj)

      console.log("next phase = " )
      // sdf9

      // ---------Change distanceEnd for Member Nodes ------
      for (let i = 0; i < memberNodesdData.length; i++) {
        nodesObj[memberNodesdData[i]._id].distanceEnd = 1
      }
      // ---------Change distanceEnd for Member Nodes ------


      // ------------------------- Choose Categories ----------------
      let nodesToShow = []

      for (const [nodeID, node] of Object.entries(nodesObj)) {
        // console.log("node.categoryNodes[i] = " , node)

        if (node?.distanceEnd != 1) continue
        // console.log("node = " , node.name)
        // ----- category -------
        for (let i = 0; i < node?.categoryNodes?.length; i++) {
          let catNode = node.categoryNodes[i]

          if (nodesObj[catNode._id] != undefined){
            console.log("nodesObj[catNode = " , nodesObj[catNode].name)
            if (nodesObj[catNode._id].graphSubNodes == undefined){
              nodesObj[catNode._id].graphSubNodes = [nodeID]
              nodesObj[catNode._id].minimumDistanceStart = node.distanceStart
            } else {
              nodesObj[catNode._id].graphSubNodes.push(nodeID)

              if (node.distanceStart < nodesObj[catNode._id].minimumDistanceStart){
                nodesObj[catNode._id].minimumDistanceStart = node.distanceStart
              }
            }
          }
        }
        // ----- category -------

        // // ----- group -------
        // for (let i = 0; i < node?.groupNodes?.length; i++) {
        //   let catNode = node.groupNodes[i]

        //   if (nodesObj[catNode._id] != undefined){
        //     console.log("nodesObj[catNode = " , nodesObj[catNode].name)
        //     if (nodesObj[catNode._id].graphSubNodes == undefined){
        //       nodesObj[catNode._id].graphSubNodes = [nodeID]
        //       nodesObj[catNode._id].minimumDistanceStart = node.distanceStart
        //     } else {
        //       nodesObj[catNode._id].graphSubNodes.push(nodeID)

        //       if (node.distanceStart < nodesObj[catNode._id].minimumDistanceStart){
        //         nodesObj[catNode._id].minimumDistanceStart = node.distanceStart
        //       }
        //     }
        //   }
        // }
        // // ----- group -------
      }
      console.log("nodesObj = " , nodesObj)
      // asdf10

    // ------------------------- Choose Categories ----------------

      // TODO -> SOS 🆘 -> don't have the categorySkillArr, so the distance of the category inside the functin 

      let { nodesArrNew, edgesArrNew } = await createNodesEdgesSkillsCategoriesV2(nodesObj,memberID, nodeSettings, edgeSettings )


      // const nodesArrNew2_unique = _.uniqWith(nodesArrNew, _.isEqual);
      // const edgesArrNew2_unique = _.uniqWith(edgesArrNew, _.isEqual);


      
      

      // asdf3
        
      



      return {
        nodes: nodesArrNew,
        edges: edgesArrNew,
      }
      // return {
      //   nodes: nodesArrNew2_unique,
      //   edges: edgesArrNew2_unique,
      // }

    // } catch (err) {
    //   throw new ApolloError(
    //     err.message,
    //     err.extensions?.code || "dynamicSearchToMemberCategoryGroup",
    //     {
    //       component: "graphVisual > dynamicSearchToMemberCategoryGroup",
    //     }
    //   );
    // }
  },
  dynamicSearchToMemberGraphGPT: async (parent, args, context, info) => {
    const { nodesID, memberID,conversation,showOnlyRelevant, nodeSettings, edgeSettings } = args.fields;
    // console.log(
    //   "Query > dynamicSearchToMemberGraphGPT > args.fields = ",
    //   args.fields
    // );

    if (!nodesID) throw new ApolloError("The nodesID is required");
    // try {
      
      
    // // ------------------------------
      // let memberData = await Members.findOne({
      //   _id: memberID,
      // }).select("nodes");

      // memberNodesID = memberData.nodes.map((node) => node._id);

      // console.log("memberData = " , memberNodesID)

      // let memberNodesdData = await Node.find({ _id: memberNodesID }).select("_id name type"); 

      // console.log("memberNodesdData = " , memberNodesdData)


    //   systemPrompt = `
    //   Your only task is to uderstand the conversation so far without the last message, then put a probability score if someone can do the job discrived on the conversation having each Skill given
    //   `

      // let message = "Skills: "
      // memberNodesdData.forEach((node) => {
      //   message += node.name + "\n"
      // })

      // responseGPTchat = await useGPTchat(message,conversation,systemPrompt,"1. Separate the Skiis that were given into categories! 2. give me probability if someone can do the job from the conversation having each Skill separately, probability score should be from 0 to 10, be extremly Harsh critic its better to put 0, conversation doesnt include this message!")
      // console.log("responseGPTchat = " , responseGPTchat)


    let nodesData = await Node.find({ _id: nodesID }).select("_id");

    if (!nodesData) throw new ApolloError("node not found");
    if (!memberID) throw new ApolloError("Member not found");

    // ----------- Find all Member Node Data ---------------
    let memberData = await Members.findOne({
      _id: memberID,
    }).select("nodes");

    memberNodesID = memberData.nodes.map((node) => node._id);

    // console.log("memberData = " , memberNodesID)

    let memberNodesdData = await Node.find({ _id: memberNodesID }).select("_id name node"); 

    console.log("memberNodesdData = " , memberNodesdData)
    // asdf5
    // ----------- Find all Member Node Data ---------------


    // console.log("nodesData = ", nodesData);
    // asdf;

    let nodeDataIds = [];
    let nodeDataObj = {};
    for (let i = 0; i < nodesData.length; i++) {
      nodeDataIds.push(nodesData[i]._id);
      nodeDataObj[nodesData[i]._id] = nodesData[i];
    }

    const nodeDataIds_str = JSON.stringify(nodeDataIds);
    // console.log("nodeDataIds_str = ", nodeDataIds_str);
    // asdf;

      res = await generalFunc_neo4j({
        request: `
            MATCH res = ((o)-[*1..3]-(m))
            WHERE o._id IN ${nodeDataIds_str} AND (m._id="${memberID}") 
            AND NONE(n IN nodes(res)[1..-1] WHERE "Project" IN labels(n) OR "Member" IN labels(n))
            RETURN res
      `,
      });

    let { typesNodesReplace, typeNodeSearchAbove } =
      await readSettingsFindReplaceNodesMultiple(nodeSettings, edgeSettings);

    let { nodesObj, edgesArr, nodesArrReplaceID, numberCoreTypeNodes } =
      await neo4jToNodeEdgeGraphSettings(
        res,
        typesNodesReplace,
        true,
        nodeDataObj
      );


      let nodesObjName = {}

      // console.log("nodesObj = " , nodesObj)
      // sadf10

      let skillsPrompt = "Skills: "
      for (const [nodeID, node] of Object.entries(nodesObj)) {
        if (node.distanceEnd == 1){ // Skill is connected to Member
          skillsPrompt += node.name + "\n"

          nodesObjName[node.name] = node
        } 
        if (node.type == "Member"){
          nodesObjName[node.name] = node
        }
      }

      console.log("nodesObjName = " , nodesObjName)
      // sdf6

      memberNodesdData.forEach((node) => {
        if (nodesObjName[node.name] == undefined){
          skillsPrompt += node.name + "\n"

          nodesObjName[node.name] = {
            name: node.name,
            _id: node._id,
            type: node.node,
            distanceEnd: 1,
            distanceStart: 100
          }
        }
      })

      console.log("nodesObjName = " , nodesObjName)
      // asfd7

      // console.log("nodesObjName = " , nodesObjName)
      // saf99

      // console.log("skillsPrompt = " , skillsPrompt)
      // asdf

      let prompt_general = ` Separate the Skills into categories, you can use each skill in only 1 Category, don't use a skill one that 1 time!!! You can have only 1 category if necessary : ${skillsPrompt} `

      prompt_general+= ` Example: 
      Category: X
      skill1
      skill2

      Result:
      `



      res_gpt = await useGPTchatSimple(prompt_general)

      console.log("res_gpt = " , res_gpt)
      // asdf5

      // res_gpt = `
      // Category: Front-End Development
      // JavaScript
      // React
      // Vue.js

      // Category: Back-End Development
      // Express.js
      // Web Development (if focused on server-side development)

      // Note: "Web Development" can be interpreted in different ways, but in this context it's assumed to refer to server-side development skills. If it's meant to encompass front-end skills as well, some adjustments may be necessary.
      // `

      categorySkillArr = await parseCategories(res_gpt)

      // console.log("categorySkillArr = " , categorySkillArr)
      // asdf9

      // ---------------- Put Category on Nodes ---------------
      categorySkillObj = {}
      for (i=0; i<categorySkillArr.length; i++){
        let keywordsN = categorySkillArr[i].keywords 

        flagDistance = 100
        for (j=0; j<keywordsN.length; j++){

          if (nodesObjName[keywordsN[j]]){
            // console.log("I am in = " )
            nodesObjName[keywordsN[j]].category = categorySkillArr[i].category
            // console.log(" nodesObjName[keywordsN[j]] = " ,  nodesObjName[keywordsN[j]])
          }

          if (nodesObjName[keywordsN[j]] && nodesObjName[keywordsN[j]].distanceStart < flagDistance){
            flagDistance = nodesObjName[keywordsN[j]].distanceStart
          }

        }

        categorySkillArr[i].distanceStart = flagDistance
        
        categorySkillObj[categorySkillArr[i].category] = categorySkillArr[i]
        
      }
      console.log("nodesObjName = " , nodesObjName)
      console.log("categorySkillObj = " , categorySkillObj)
      asdf10
      // ---------------- Put Category on Nodes ---------------
    

      // TODO -> SOS 🆘 -> don't have the categorySkillArr, so the distance of the category inside the functin 

      let { nodesArrNew, edgesArrNew } = await createNodesEdgesSkillsCategories(nodesObjName,memberID,categorySkillObj, nodeSettings, edgeSettings )


      // const nodesArrNew2_unique = _.uniqWith(nodesArrNew, _.isEqual);
      // const edgesArrNew2_unique = _.uniqWith(edgesArrNew, _.isEqual);


      
      

      // asdf3
        
      



      return {
        nodes: nodesArrNew,
        edges: edgesArrNew,
      }
      // return {
      //   nodes: nodesArrNew2_unique,
      //   edges: edgesArrNew2_unique,
      // }

    // } catch (err) {
    //   throw new ApolloError(
    //     err.message,
    //     err.extensions?.code || "dynamicSearchToMemberGraphGPT",
    //     {
    //       component: "graphVisual > dynamicSearchToMemberGraphGPT",
    //     }
    //   );
    // }
  },
  dynamicSearchToMemberGraph: async (parent, args, context, info) => {
    const { nodesID, memberID, nodeSettings, edgeSettings } = args.fields;
    console.log(
      "Query > dynamicSearchToMemberGraph > args.fields = ",
      args.fields
    );

    if (!nodesID) throw new ApolloError("The nodesID is required");

    try {
      let nodesData = await Node.find({ _id: nodesID }).select("_id");

      if (!nodesData) throw new ApolloError("Member not found");

      // console.log("nodesData = ", nodesData);
      // asdf;

      let nodeDataIds = [];
      let nodeDataObj = {};
      for (let i = 0; i < nodesData.length; i++) {
        nodeDataIds.push(nodesData[i]._id);
        nodeDataObj[nodesData[i]._id] = nodesData[i];
      }

      const nodeDataIds_str = JSON.stringify(nodeDataIds);
      console.log("nodeDataIds_str = ", nodeDataIds_str);
      // asdf;

      if (memberID == undefined || memberID == "") {
        res = await generalFunc_neo4j({
          request: `

            MATCH res = ((o)-[]-(m))
            WHERE o._id IN ${nodeDataIds_str} AND (m:Member)
            RETURN res
        `,
        });
      } else {
        // res = await generalFunc_neo4j({
        //   request: `
        //       MATCH res = ((o)-[]-(m))
        //       WHERE o._id IN ${nodeDataIds_str} AND (m._id="${memberID}") 
        //       RETURN res
        // `,
        // });
        res = await generalFunc_neo4j({
          request: `
              MATCH res = ((o)-[*1..3]-(m))
              WHERE o._id IN ${nodeDataIds_str} AND (m._id="${memberID}") 
              RETURN res
        `,
        });
      }

      // console.log("res = ", res);
      // asdf0;

      let { typesNodesReplace, typeNodeSearchAbove } =
        await readSettingsFindReplaceNodesMultiple(nodeSettings, edgeSettings);

      let { nodesObj, edgesArr, nodesArrReplaceID, numberCoreTypeNodes } =
        await neo4jToNodeEdgeGraphSettings(
          res,
          typesNodesReplace,
          true,
          nodeDataObj
        );

        

      let { edgesArrNew, nodesObj_ } = await replaceNodes(
        nodesObj,
        edgesArr,
        nodesArrReplaceID,
        typesNodesReplace
      );

      // console.log("nodesObj_ = " , nodesObj_)
      //   console.log("edgesArrNew = " , edgesArrNew)
      //   safd9

      let { nodesArrNew2, edgesArrNew2 } = await addSettingsNodesSubNodes(
        nodesObj_,
        edgesArrNew,
        nodeSettings,
        edgeSettings
      );

      const edgesArrNew2_unique = _.uniqWith(edgesArrNew2, _.isEqual);
      const nodesArrNew2_unique = _.uniqWith(nodesArrNew2, _.isEqual);

      return {
        nodes: nodesArrNew2_unique,
        edges: edgesArrNew2_unique,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "dynamicSearchToMemberGraph",
        {
          component: "graphVisual > dynamicSearchToMemberGraph",
        }
      );
    }
  },
  dynamicSearchToMemberGraphV2: async (parent, args, context, info) => {
    const { nodesID, memberID, nodeSettings, edgeSettings } = args.fields;
    console.log(
      "Query > dynamicSearchToMemberGraphV2 > args.fields = ",
      args.fields
    );

    if (!nodesID) throw new ApolloError("The nodesID is required");

    try {
      let nodesData = await Node.find({ _id: nodesID }).select("_id");

      if (!nodesData) throw new ApolloError("Member not found");

      // console.log("nodesData = ", nodesData);
      // asdf;

      let nodeDataIds = [];
      let nodeDataObj = {};
      for (let i = 0; i < nodesData.length; i++) {
        nodeDataIds.push(nodesData[i]._id);
        nodeDataObj[nodesData[i]._id] = nodesData[i];
      }

      const nodeDataIds_str = JSON.stringify(nodeDataIds);
      console.log("nodeDataIds_str = ", nodeDataIds_str);
      // asdf;

      if (memberID == undefined || memberID == "") {
        res = await generalFunc_neo4j({
          request: `

            MATCH res = ((o)-[]-(m))
            WHERE o._id IN ${nodeDataIds_str} AND (m:Member)
            RETURN res
        `,
        });
      } else {
        // res = await generalFunc_neo4j({
        //   request: `
        //       MATCH res = ((o)-[]-(m))
        //       WHERE o._id IN ${nodeDataIds_str} AND (m._id="${memberID}") 
        //       RETURN res
        // `,
        // });
        res = await generalFunc_neo4j({
          request: `
              MATCH res = ((o)-[*1..3]-(m))
              WHERE o._id IN ${nodeDataIds_str} AND (m._id="${memberID}") 
              AND NONE(n IN nodes(res)[1..-1] WHERE "Project" IN labels(n) OR "Member" IN labels(n))
              RETURN res
        `,
        });
      }

      // console.log("res = ", res);
      // asdf0;

      let { typesNodesReplace, typeNodeSearchAbove } =
        await readSettingsFindReplaceNodesMultiple(nodeSettings, edgeSettings);

      let { nodesObj, edgesArr, nodesArrReplaceID, numberCoreTypeNodes } =
        await neo4jToNodeEdgeGraphSettings(
          res,
          typesNodesReplace,
          true,
          nodeDataObj
        );

        

      let { edgesArrNew, nodesObj_ } = await replaceNodes(
        nodesObj,
        edgesArr,
        nodesArrReplaceID,
        typesNodesReplace
      );

      // console.log("nodesObj_ = " , nodesObj_)

      
      // Core = Member or DynamicSearch
      let { edgesArrAfterReplace, nodesObjAfterReplace,comboArr,comboDict} = await replaceNodesNotConnectedCoreAndCreateCombo(
        nodesObj_,
        edgesArrNew,
      );

      // console.log("nodesObjAfterReplace = " , nodesObjAfterReplace)
      // // asdf1
      // // console.log("comboArr = " , comboArr)
      // // console.log("comboDict = " , comboDict)
      // asdf4

      let { nodesArrNew2, edgesArrNew2 } = await addSettingsNodesSubNodes(
        nodesObjAfterReplace,
        edgesArrAfterReplace,
        nodeSettings,
        edgeSettings,
        comboDict
      );
      // let { nodesArrNew2, edgesArrNew2 } = await addSettingsNodesSubNodes(
      //   nodesObj_,
      //   edgesArrNew,
      //   nodeSettings,
      //   edgeSettings
      // );

      // console.log("nodesArrNew2 = " , nodesArrNew2)
      // asdf9
      const edgesArrNew2_unique = _.uniqWith(edgesArrNew2, _.isEqual);
      const nodesArrNew2_unique = _.uniqWith(nodesArrNew2, _.isEqual);

      return {
        nodes: nodesArrNew2_unique,
        edges: edgesArrNew2_unique,
        combos: comboArr
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "dynamicSearchToMemberGraphV2",
        {
          component: "graphVisual > dynamicSearchToMemberGraphV2",
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

      // console.log("res = " , res)
      // asdf


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

      const nodesArrNew2_unique = _.uniqWith(nodesArrNew2, _.isEqual);
      const edgesArrNew2_unique = _.uniqWith(edgesArrNew2, _.isEqual);

      return {
        nodes: nodesArrNew2_unique,
        edges: edgesArrNew2_unique,
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

async function neo4jToNodeEdgeGraphSettings(
  res,
  typesNodesReplace = {},
  dynamicSearch = false, // dynamic search = give Nodes instead of Member or Project that conencts to nodes
  nodeDataObj = {} // So will have to create a Fake Node to connect everything together
) {
  let nodesObj = {};
  let nodesArrReplaceID = [];
  let edgesArr = [];
  let numberCoreTypeNodes = 0;

  if (dynamicSearch == true) {
    const fakeNodeID = "dynamicsearchnode0123456";
    nodesObj[fakeNodeID] = {
      _id: fakeNodeID,
      name: "Dynamic Node Search",
      type: "dynamicSearch",
      show: true,
      numEdges: 0,
      replace: false,
    };

    // if (typesNodesReplace["dynamicSearch"]) {
    //   nodesArrReplaceID.push(fakeNodeID);

    //   nodesObj[fakeNodeID].replace = true;
    //   nodesObj[fakeNodeID].aboveL1Type = typesNodesReplace[key].replaceType;
    //   if (typesNodesReplace[key].extraSplit.length > 0) {
    //     nodesObj[fakeNodeID].aboveL2Type = typesNodesReplace[key].extraSplit[0];
    //   }
    // }
  }

  // console.log("HEEEEEI 5= " )

  for (let i = 0; i < res.records.length; i++) {
    let record = res.records[i];

    // console.log("HEEEEEI 7= ",record._fields[0].segments )

    let j=0

    for (j = 0; j < record._fields[0].segments.length; j++) {
      // console.log("HEEEEEI 6= " )

      let segment = record._fields[0].segments[j];

      let start = segment.start;
      let end = segment.end;

      // if (j == 2){
      //   console.log("start.properties = " , start.properties)
      //   console.log("end.properties = " , end.properties)
      // }
      // console.log("j = " , j)
      // console.log("HEEEEEI 4= " )

      // ------------- Create nodesObj ----------------
      if (nodesObj[start.properties._id] == undefined) {
        nodesObj[start.properties._id] = {
          _id: start.properties._id,
          name: start.properties.name,
          type: start.labels[0],
          show: true,
          numEdges: 0,
          replace: false,
          distanceEnd: record._fields[0].segments.length - j,
          distanceStart: j
        };
        if (nodeDataObj[start.properties._id]) {
          nodesObj[start.properties._id] = {
            ...nodesObj[start.properties._id],
            ...nodeDataObj[start.properties._id],
          }
        } else {
          nodesObj[start.properties._id].originNode = "transitionNode"
        }
      }
      // ------------- Create nodesObj ----------------

      // ------------- add node for replacement if exist on key ---------
      let key = start.labels[0] + "|" + end.labels[0];
      // if (dynamicSearch == true) {
      //   if (nodeDataObj[start.properties._id]) {
      //     key = nodeDataObj[start.properties._id].type + "|" + end.labels[0];
      //   }
      // }

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
          distanceEnd: record._fields[0].segments.length - j - 1,
          distanceStart: j + 1
        };
        if (nodeDataObj[end.properties._id]) {
          nodesObj[end.properties._id] = {
            ...nodesObj[end.properties._id],
            ...nodeDataObj[end.properties._id],
          }
        } else {
          nodesObj[end.properties._id] = {
            ...nodesObj[end.properties._id],
            originNode: "transitionNode"
          }
        }
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

      if (dynamicSearch == true) {
        // If it is dynamic search you need to connect inupt nodes to search node
        if (nodeDataObj[start.properties._id] != undefined) {
          edgesArr.push({
            source: start.properties._id,
            target: "dynamicsearchnode0123456",
            type: "dynamicSearch",
          });

          key = start.labels[0] + "|" + "dynamicSearch";
          if (typesNodesReplace[key]) {
            nodesArrReplaceID.push(start.properties._id);

            nodesObj[start.properties._id].replace = true;

            nodesObj[start.properties._id].aboveL1Type =
              typesNodesReplace[key].replaceType;

            if (typesNodesReplace[key].extraSplit.length > 0) {
              nodesObj[start.properties._id].aboveL2Type =
                typesNodesReplace[key].extraSplit[0];
            }
          }
        }

        if (nodeDataObj[end.properties._id] != undefined) {
          edgesArr.push({
            source: end.properties._id,
            target: "dynamicsearchnode0123456",
            type: "dynamicSearch",
          });

          key = end.labels[0] + "|" + "dynamicSearch";
          if (typesNodesReplace[key]) {
            nodesArrReplaceID.push(end.properties._id);

            nodesObj[end.properties._id].replace = true;
            nodesObj[end.properties._id].aboveL1Type =
              typesNodesReplace[key].replaceType;
            if (typesNodesReplace[key].extraSplit.length > 0) {
              nodesObj[end.properties._id].aboveL2Type =
                typesNodesReplace[key].extraSplit[0];
            }
          }
        }
      }
    }
    // console.log("record = ", record);
    if (record._fields[0].segments.length == 0) {
      let start = record._fields[0].start;
      // console.log("start = ", start);

      // ------------- Create nodesObj ----------------
      if (nodesObj[start.properties._id] == undefined) {
        nodesObj[start.properties._id] = {
          _id: start.properties._id,
          name: start.properties.name,
          type: start.labels[0],
          show: true,
          numEdges: 0,
          replace: false,
          distanceEnd: record._fields[0].segments.length - j,
          distanceStart: j
        };
      }
      // ------------- Create nodesObj ----------------

      if (dynamicSearch == true) {
        // If it is dynamic search you need to connect inupt nodes to search node
        if (nodeDataObj[start.properties._id] != undefined) {
          edgesArr.push({
            source: start.properties._id,
            target: "dynamicsearchnode0123456",
            type: "dynamicSearch",
          });

          key = start.labels[0] + "|" + "dynamicSearch";
          if (typesNodesReplace[key]) {
            nodesArrReplaceID.push(start.properties._id);

            nodesObj[start.properties._id].replace = true;

            nodesObj[start.properties._id].aboveL1Type =
              typesNodesReplace[key].replaceType;

            if (typesNodesReplace[key].extraSplit.length > 0) {
              nodesObj[start.properties._id].aboveL2Type =
                typesNodesReplace[key].extraSplit[0];
            }
          }
        }
      }

      continue;
    }
    // console.log("change = ------------");
  }

  for (let key in nodeDataObj) {

    if (nodesObj[key] == undefined) {
      nodesObj[key] = {
        ...nodeDataObj[key],
      };
      if (nodeDataObj[key].originNode == "Member"){
        nodesObj[key] = {
          ...nodesObj[key],
          distanceStart: 4,
          distanceEnd: 1,
        }
      }
    }

  }

  // console.log("typesNodesReplace = ", typesNodesReplace);
  // console.log("nodesObj = ", nodesObj);
  // console.log("edgesArr = ", edgesArr);
  // sfd4;

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

  // console.log("objectN = " , objectN)
  // asfd9
  // console.log("key = " , key)

  return objectN[key];
}

async function addSettingsNodesSubNodes(
  nodesObj,
  edgesArr,
  nodeSettings,
  edgeSettings,
  comboDict = undefined
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

    if ( nodesObj[key].type == "Combo") {
      // nodesArrNewObj[key] = node;
      const settingsN = nodeSettingsObj[node.type];

      nodesArrNew.push({
        ...settingsN,
        ...node,
        // size:10,
        label:"",
        name:"",
        comboId: nodesObj[key].comboId,
      });
      nodesArrNewObj[node._id] = node;

      // console.log("nodesArrNewObj[node._id] = " , key)
      // console.log("nodesArrNewObj[node._id] = " , node)
      // console.log("nodesArrNew = " , nodesArrNew[nodesArrNew.length-1])
      // console.log("nodesArrNewObj[node._id] = " , node._id,nodesArrNewObj[node._id])
      // asf123
    }

    if (nodeSettingsObj[node.type] && nodesObj[key].showNode == true) {
      // if the type exist on the settings it will be desplayed at the end of the graph
      const settingsN = nodeSettingsObj[node.type];

      nodesArrNew.push({
        ...node,
        ...settingsN,
      });
      nodesArrNewObj[node._id] = node;

      // console.log("node = " , node)
      // asdf12

      // ------ Add Combo ---------
      if (comboDict && node && node.combo && comboDict[node.combo] && comboDict[node.combo].show == true) {
        // nodesArrNewObj[node._id] = {
        //   ...nodesArrNewObj[node._id],
        //   comboId: "Combo"+node.combo,
        // };

        nodesArrNew[nodesArrNew.length-1] = {
          ...nodesArrNew[nodesArrNew.length-1],
          comboId: "Combo"+node.combo,
        };
        
      }

      if (comboDict && node && node?.core == "Member"){
        nodesArrNew[nodesArrNew.length-1] = {
          ...nodesArrNew[nodesArrNew.length-1],
          style: {
            ...nodesArrNew[nodesArrNew.length-1].style,
            fill: "#EFFCEE",
            stroke: "#ADF0A8",
          }
        };
      } 

      if (comboDict && node && node?.core == "dynamicSearch"){
        nodesArrNew[nodesArrNew.length-1] = {
          ...nodesArrNew[nodesArrNew.length-1],
          style: {
            ...nodesArrNew[nodesArrNew.length-1].style,
            fill: "#EBF8FF",
            stroke: "#179FFF",
          }
        };
      } 
      // ------ Add Combo ---------
    }
  }
  // ----------- The nodes that we will show to the Graph + settings --------

  // console.log("nodesArrNewObj = " , nodesArrNewObj)
  // asdf8

  // ----------- The edges taht we will show to the Graph + settings --------


  let edgesArrNew = [];
  for (let i = 0; i < edgesArr.length; i++) {
    edge = edgesArr[i];

    if (edgeSettings?.length == 0){

    
      edgesArrNew.push({
        ...edge,
        style: {
          stroke: "#E0E0E0",
          fill: "#E0E0E0",
          distance: 90,
          strength: 0.5,
        },
      });
    } else {
      // console.log("dge.source = " , edge.source,nodesArrNewObj[edge.source]?.type)
      // console.log("dge.target = " , edge.target,nodesArrNewObj[edge.target]?.type)
      // console.log("nodesArrNewObj = " , nodesArrNewObj)
      // asdf9
      // console.log("comboN = " , comboN)
      if (edge?.hiddenEdgeCombo == true) {


        edgesArrNew.push({
          ...edge,
          style: {
            color: "#FFFFFF",
            distance: 30,
            strength: 0.5,
          },
        });

        if (nodesArrNewObj[edge.source].numEdgesT == undefined) nodesArrNewObj[edge.source].numEdgesT = -1;
        nodesArrNewObj[edge.source].numEdgesT++;

        if (nodesArrNewObj[edge.target]?.numEdgesT == undefined) nodesArrNewObj[edge.target].numEdgesT = -1;
        nodesArrNewObj[edge.target].numEdgesT++;

        // let comboN = nodesObj[edge.source].combo
        // console.log("comboN = " , comboN)
        // if (comboN != undefined){
        //   // console.log("comboDict[comboN] = " , comboDict)
        //   //   console.log("comboDict[comboN] = " , comboN)
        //   //   console.log("comboDict[comboN] = " , nodesObj[edge.source])
        //   console.log("nodesArrNewObj[edge.source].numEdgesT = " , nodesArrNewObj[edge.source].numEdgesT)
        //     console.log("nodesArrNewObj[edge.target].numEdgesT = " , nodesArrNewObj[edge.target].numEdgesT)
        //   if (nodesArrNewObj[edge.source]?.numEdgesT > comboDict[comboN].maxNumberEdges) comboDict[comboN].maxNumberEdges = nodesArrNewObj[edge.source].numEdgesT;
        //   if (nodesArrNewObj[edge.source]?.numEdgesT < comboDict[comboN].minNumberEdges) comboDict[comboN].minNumberEdges = nodesArrNewObj[edge.source].numEdgesT;
        // }

        // comboN = nodesObj[edge.target].combo
        // if (comboN != undefined){
          
        //   if (nodesArrNewObj[edge.target]?.numEdgesT < comboDict[comboN].minNumberEdges) comboDict[comboN].minNumberEdges = nodesArrNewObj[edge.target].numEdgesT;
        //   if (nodesArrNewObj[edge.target]?.numEdgesT > comboDict[comboN].maxNumberEdges) comboDict[comboN].maxNumberEdges = nodesArrNewObj[edge.target].numEdgesT;
        // }
        // if (nodesArrNewObj[edge.source]?.numEdgesT > maxNumberEdges) maxNumberEdges = nodesArrNewObj[edge.source].numEdgesT;
        // if (nodesArrNewObj[edge.target]?.numEdgesT > maxNumberEdges) maxNumberEdges = nodesArrNewObj[edge.target].numEdgesT;

        // if (nodesArrNewObj[edge.source]?.numEdgesT < minNumberEdges) minNumberEdges = nodesArrNewObj[edge.source].numEdgesT;
        // if (nodesArrNewObj[edge.target]?.numEdgesT < minNumberEdges) minNumberEdges = nodesArrNewObj[edge.target].numEdgesT;

        // if (edge.target == "640a74c52484854db2012c08"){
        //   console.log("edge.source 0= " , edge.source)
        // }

        // if (edge.source == "640a74c52484854db2012c08"){
        //   console.log("edge.target 0= " , edge.target)
        // }

      } else {

        let edgeSettings = returnObjectValueDoubleKey(
          edgeSettingsObj,
          nodesArrNewObj[edge.source]?.type,
          nodesArrNewObj[edge.target]?.type
        );

    
        if (edgeSettings && edgeSettings?.splitEdge == undefined) {

          if (nodesArrNewObj[edge.source].numEdgesT == undefined) nodesArrNewObj[edge.source].numEdgesT = -1;
          nodesArrNewObj[edge.source].numEdgesT++;

          if (nodesArrNewObj[edge.target]?.numEdgesT == undefined) nodesArrNewObj[edge.target].numEdgesT = -1;
          nodesArrNewObj[edge.target].numEdgesT++;

          // let comboN = nodesObj[edge.source].combo
          // // console.log("comboN = " , comboN)
          // if (comboN != undefined){
          //   // console.log("comboDict[comboN] = " , comboDict)
          //   // console.log("comboDict[comboN] = " , comboN)
          //   // console.log("comboDict[comboN] = " , nodesObj[edge.source])
          //   console.log("nodesArrNewObj[edge.source].numEdgesT = " , nodesArrNewObj[edge.source].numEdgesT)
          //   console.log("nodesArrNewObj[edge.target].numEdgesT = " , nodesArrNewObj[edge.target].numEdgesT)
          //   if (nodesArrNewObj[edge.source]?.numEdgesT > comboDict[comboN].maxNumberEdges) comboDict[comboN].maxNumberEdges = nodesArrNewObj[edge.source].numEdgesT;
          //   if (nodesArrNewObj[edge.source]?.numEdgesT < comboDict[comboN].minNumberEdges) comboDict[comboN].minNumberEdges = nodesArrNewObj[edge.source].numEdgesT;
          // }
           
          // comboN = nodesObj[edge.target].combo
          // if (comboN != undefined){
          //   if (nodesArrNewObj[edge.target]?.numEdgesT < comboDict[comboN].minNumberEdges) comboDict[comboN].minNumberEdges = nodesArrNewObj[edge.target].numEdgesT;
          //   if (nodesArrNewObj[edge.target]?.numEdgesT > comboDict[comboN].maxNumberEdges) comboDict[comboN].maxNumberEdges = nodesArrNewObj[edge.target].numEdgesT;
          // }

          // if (nodesArrNewObj[edge.source]?.numEdgesT > maxNumberEdges) maxNumberEdges = nodesArrNewObj[edge.source].numEdgesT;
          // if (nodesArrNewObj[edge.target]?.numEdgesT > maxNumberEdges) maxNumberEdges = nodesArrNewObj[edge.target].numEdgesT;

          // if (nodesArrNewObj[edge.source]?.numEdgesT < minNumberEdges) minNumberEdges = nodesArrNewObj[edge.source].numEdgesT;
          // if (nodesArrNewObj[edge.target]?.numEdgesT < minNumberEdges) minNumberEdges = nodesArrNewObj[edge.target].numEdgesT;

          // if (edge.target == "640a74c52484854db2012c08"){
          //   console.log("edge.source = " , edge.source)
          // }

          // if (edge.source == "640a74c52484854db2012c08"){
          //   console.log("edge.target = " , edge.target)
          // }


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
    }
  }
  // ----------- The edges taht we will show to the Graph + settings --------

  // ------- find min max value each combo ----------
  for (let i = 0; i < edgesArr.length; i++) {
    let edge = edgesArr[i];
    let comboN = nodesObj[edge.source]?.combo
    if (comboN != undefined){
      if (nodesArrNewObj[edge.source]?.numEdgesT > comboDict[comboN].maxNumberEdges) comboDict[comboN].maxNumberEdges = nodesArrNewObj[edge.source].numEdgesT;
      if (nodesArrNewObj[edge.source]?.numEdgesT < comboDict[comboN].minNumberEdges) comboDict[comboN].minNumberEdges = nodesArrNewObj[edge.source].numEdgesT;
    }
      
    comboN = nodesObj[edge.target]?.combo
    if (comboN != undefined){
      if (nodesArrNewObj[edge.target]?.numEdgesT < comboDict[comboN].minNumberEdges) comboDict[comboN].minNumberEdges = nodesArrNewObj[edge.target].numEdgesT;
      if (nodesArrNewObj[edge.target]?.numEdgesT > comboDict[comboN].maxNumberEdges) comboDict[comboN].maxNumberEdges = nodesArrNewObj[edge.target].numEdgesT;
    }

  }
  // ------- find min max value each combo ----------

  // console.log("comboDict = " , comboDict)
  // asdf1255
  // ----------- Check if all Edges of Combo are connected --------
  if (comboDict){
    for (let i = 0; i < nodesArrNew.length; i++) {

      let node = nodesArrNew[i];

      // console.log("nodesArrNewObj[node._id]?.numEdgesT = " ,node._id, nodesArrNewObj[node._id]?.numEdgesT)

      if (nodesArrNewObj[node._id]?.numEdgesT == undefined || nodesArrNewObj[node._id]?.numEdgesT <=1){
        // console.log("nodesArrNewObj[node._id] = " , nodesArrNewObj[node._id])
        // console.log("node = " , node)
        // asdf
        if (node?.comboId == undefined) continue;

        // console.log("change = " )
        // asdfasdf
        edgesArrNew.push({
          source: node._id,
          target: node.comboId+"_center",
          style: {
            color: "#FFFFFF",
            distance: 30,
            strength: 0.5,
          },
        });
        // console.log("edgesArrNew = " , edgesArrNew[edgesArrNew.length-1])
        // asdf9
      } else {
        const comboN = nodesArrNewObj[node._id]?.combo
        if (nodesArrNewObj[node._id]?.numEdgesT >1 
          && nodesArrNewObj[node._id]?.type != "Combo"
          && comboDict[comboN] != undefined
          // && Object.keys(comboDict[nodesArrNewObj[node._id]?.combo]?.nodes).length > 1 
          ){
            // console.log("comboDict[nodesArrNewObj[node._id]?.combo]?.nodes = " , comboDict[nodesArrNewObj[node._id]?.combo]?.nodes)
            // console.log("comboDict[nodesArrNewObj[node._id]?.combo] = " , comboDict[nodesArrNewObj[node._id]?.combo])
            // console.log("I am in= " ,nodesArrNewObj[node._id])

          const minNumberEdges = comboDict[comboN]?.minNumberEdges;
          const maxNumberEdges = comboDict[comboN]?.maxNumberEdges;


          
          const extraSize = await remapValues(nodesArrNewObj[node._id]?.numEdgesT, minNumberEdges, maxNumberEdges, 0, 25);
          // // console.log("change = " , change)
          // console.log("I am in= extraSize = " , extraSize,node._id,nodesArrNewObj[node._id]?.numEdgesT,minNumberEdges,maxNumberEdges)
          // // nodesArrNew[i].style.size = nodesArrNew[i].style.size + extraSize;

          // console.log("nodesArrNew = " , nodesArrNew[i])

          // nodesArrNew[i].style.size = nodesArrNew[i].style.size + extraSize;

          // const newSize = nodesArrNew[i].style.size + 2
          nodesArrNew[i] = {
            ...nodesArrNew[i],
            // avatar: extraSize
            style: {
              ...nodesArrNew[i].style,
              size: parseInt(nodesArrNew[i].style.size) + parseInt(extraSize),
            }
          }


        }
      }
    }
  }
  // console.log("comboDict = " , comboDict)
  // asdf234
  // ----------- Check if all Edges of Combo are connected --------

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

async function addEdgeToNodeObj(
  nodesObj,
  edgeSource,
  edgeTarget,
) {


  if (nodesObj[edgeSource].edges == undefined) {
    nodesObj[edgeSource].edges = [edgeTarget];
  } else {
    if (nodesObj[edgeSource].edges.indexOf(edgeTarget) == -1) {
      nodesObj[edgeSource].edges.push(edgeTarget);
    }
  }

  if (nodesObj[edgeTarget].type == "Member" || nodesObj[edgeTarget].type == "dynamicSearch") {
    nodesObj[edgeSource].connectedToCore = true;
    nodesObj[edgeSource].core = nodesObj[edgeTarget].type;

    nodesObj[edgeTarget].connectedToCore = true;
    nodesObj[edgeTarget].core = nodesObj[edgeTarget].type;
  }





  return nodesObj
}

async function generateCombinations(arr,edgesArr,nodesObj) {
  
  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      edgesArr.push({
        source: arr[i],
        target: arr[j],
        distanceRation: 0.5,
      });


      nodesObj = await addEdgeToNodeObj(nodesObj, arr[i], arr[j])

      nodesObj = await addEdgeToNodeObj(nodesObj, arr[j], arr[i])
    }
  }
  // asfd11
  
  return {
    edgesArr,nodesObj
  }
}

async function combineCombo(comboDict,comboID,connectedNodeID,nodesObjNew){

  

  // console.log("change = 8",connectedNodeID )
  // console.log("change = 8",nodesObjNew[connectedNodeID] )
  if (nodesObjNew[connectedNodeID] == undefined) {
    return {
      comboDict: comboDict,
      nodesObjNew: nodesObjNew,
    }
  }
  
  if (nodesObjNew[connectedNodeID]?.type == "Member" || nodesObjNew[connectedNodeID]?.type == "dynamicSearch") {
    return {
      comboDict: comboDict,
      nodesObjNew: nodesObjNew,
    }
  }

  if (nodesObjNew[connectedNodeID]?.core != comboDict[comboID]?.core) {
    return {
      comboDict: comboDict,
      nodesObjNew: nodesObjNew,
    }
  }

  


  // if (nodesObjNew[connectedNodeID]?.combo == nodesObjNew[connectedNodeID]?.combo) {
  // // asdf1
  //   return {
  //     comboDict: comboDict,
  //     nodesObjNew: nodesObjNew,
  //   }
  // }

  // console.log(" ----------- START --------------" )

  // console.log("nodesObjNew[connectedNodeID] = " , nodesObjNew[connectedNodeID].combo)
  // console.log("nodesObjNew[connectedNodeID]?.combo = " , nodesObjNew[connectedNodeID]?.combo)

  // console.log("nodesObjNew[connectedNodeID] = " , nodesObjNew[connectedNodeID])
  // // console.log("comboDict[comboID] = " , comboDict[comboID])
  // console.log("comboDict[comboID] = " , comboDict)
  // // asdf44

  // console.log("nodesObjNew[connectedNodeID]?.core , comboDict[comboID]?.core = " , nodesObjNew[connectedNodeID]?.core , comboDict[comboID]?.core)


  // console.log("comboID = " , comboID)
  // console.log("nodesObjNew[connectedNodeID] = " , nodesObjNew[connectedNodeID])
  // console.log("comboDict = " , comboDict)
  // console.log("change = " , nodesObjNew[connectedNodeID]?.core , comboDict[comboID]?.core)

  // ---------- Find all nodes from combo and transfer them -----------
  const comboIDchanhge = nodesObjNew[connectedNodeID].combo
  let comboNodes = comboDict[comboIDchanhge].nodes;

  // console.log("comboIDchanhge = " , comboIDchanhge)
  // console.log("comboNodes = " , comboNodes)
  // asdf4

  flagMakeChange = false
  for (const [nodeID, node] of Object.entries(comboNodes)) {
    // console.log("nodesObjNew[nodeID].combo = " , nodesObjNew[nodeID].combo,comboID)
    if (parseInt(nodesObjNew[nodeID].combo) != parseInt(comboID)) {
      nodesObjNew[nodeID] = {
        ...nodesObjNew[nodeID],
        combo: comboID,
      }

      comboDict[comboID].nodes[nodeID] = true
      flagMakeChange = true
    } else {
    }
  }
  // // console.log("nodesObjNew[nodeID] = " , nodesObjNew[nodeID])
  // // console.log("comboNodes = " , comboNodes)

  // // console.log("connectedNodeID,comboID = " , connectedNodeID,comboID)

  // console.log("comboIDchanhge = " , comboIDchanhge)
  // console.log(" ----------- END --------------" )


  if (flagMakeChange == true) {
    delete comboDict[comboIDchanhge]
  }

  // ---------- Find all nodes from combo and transfer them -----------


  // console.log("comboID = " , comboID)
  // console.log("nodesObjNew[connectedNodeID] = " , nodesObjNew[connectedNodeID])
  // console.log("comboDict = " , comboDict)
  // console.log("change = " , nodesObjNew[connectedNodeID]?.core , comboDict[comboID]?.core)
  // asdf1
  

  return {
    comboDict: comboDict,
    nodesObjNew: nodesObjNew,
  }
}

async function remapValues(value, min, max, newMin, newMax) {
  const range = max - min;

  if (range === 0) {
    // return value;
    return 0;
  }
  const newRange = newMax - newMin;
  const normalizedValue = (value - min) / range;
  const newValue = (normalizedValue * newRange) + newMin;

  return Math.round(newValue);
}

async function replaceNodesNotConnectedCoreAndCreateCombo(
  nodesObj,
  edgesArr,
) {

  
  for (let i = 0; i < edgesArr?.length; i++) {
    let edge = edgesArr[i]

    let edgeSource = edge.source;
    let edgeTarget = edge.target;

    // ------------ Add edges for each node ---------
    nodesObj = await addEdgeToNodeObj(nodesObj, edgeSource, edgeTarget)
    nodesObj = await addEdgeToNodeObj(nodesObj, edgeTarget, edgeSource)
    // ------------ Add edges for each node ---------
  }

  
  // ------------ Delete all the nodes that not connected to Core ---------
  let deletedNodes = []
  let nodeAdd = []
  let edgesArrNew = [...edgesArr]
  for (const [nodeID, node] of Object.entries(nodesObj)) {
    if (node.connectedToCore == true){
      // nodeObjNew[nodeID] = node
      nodeAdd.push(nodeID)
    } else {
      deletedNodes.push(nodeID)

      // --------- Create edge on every combination of Nodes from the ones that we delete -------
      const nodesCheck = nodesObj[nodeID].edges


      res = await generateCombinations(nodesCheck,edgesArrNew,nodesObj) // SOS 🆘 -> Dangerus under tested, check if problem!
      edgesArrNew = res.edgesArr
      nodesObj = res.nodesObj
      // --------- Create edge on every combination of Nodes from the ones that we delete -------
    }
  }
  // ------------ Delete all the nodes that not connected to Core ---------
  
  // ----------- Create Combo ----------
  comboDict = {}
  comboNum = 0
  // ----------- Create Combo ----------

  // ----------- Add only the nodes that connected to Core ---------
  let nodesObjNew = {}
  for (let i = 0; i < nodeAdd.length; i++) {
    nodeID = nodeAdd[i]
    nodesObjNew[nodeID] = {
      ...nodesObj[nodeID],
    }

    if (nodesObj[nodeID].type != "Member" && nodesObj[nodeID].type != "dynamicSearch") {
      nodesObjNew[nodeID] = {
        ...nodesObjNew[nodeID],
        combo: comboNum,
      }

      comboDict[comboNum] = {
        nodes: {},
        core: nodesObjNew[nodeID].core,
        maxNumberEdges: -1,
        minNumberEdges: 10000
      }

      comboDict[comboNum].nodes[nodeID] = true
      comboNum++
    }
  }
  // console.log("nodesObjNew = " , nodesObjNew)
  // console.log("comboDict = " , comboDict)
  // asdf4
  // ----------- Add only the nodes that connected to Core ---------

  // ----------- Combine Combo ----------
  // comboDictNew = {}
  for (const [comboID, combo] of Object.entries(comboDict)) {
    nodesCombo = combo.nodes

    if (comboDict[comboID] == undefined) continue;

    for (const [nodeID, node] of Object.entries(nodesCombo)) {

      connectedNodes = nodesObjNew[nodeID].edges


      for (let i = 0; i < connectedNodes.length; i++) {
        connectedNodeID = connectedNodes[i]


        res = await combineCombo(comboDict,comboID,connectedNodeID,nodesObjNew)
        comboDict = res.comboDict
        nodesObjNew = res.nodesObjNew

        // console.log("comboDict = " , comboDict)

      }
    }
  }
  // ----------- Combine Combo ----------

  // console.log("comboDict = " , comboDict)
  // asdf5


   // ----------- Create Combo Array ------------
   let comboArr = []
   for (const [comboID, combo] of Object.entries(comboDict)) {
     if (Object.keys(combo.nodes).length > 1) {
       comboArr.push({
         id: "Combo" + comboID,
         label: "Combo" + comboID,
         comboId: "Combo" + comboID,
         // style: {
         //   fill: "#f5f5f5",
         //   stroke: "#000000",
         // }
       })
       comboDict[comboID].show = true
 
       nodesObjNew["Combo" + comboID + "_center"] = {
         _id: "Combo" + comboID + "_center",
         label: "Combo" + comboID,
         type: "Combo",
         comboId: "Combo" + comboID,
       }
     } else {
       comboDict[comboID].show = false
     }
   }
   // ----------- Create Combo Array ------------

  


  // ---------- Replace Edges based on Combo ---------------
  for (let i = 0; i < edgesArrNew?.length; i++) {
    let edge = edgesArrNew[i]
    let edgeSource = edge.source;
    let edgeTarget = edge.target;

    // if (edgeSource == "640a74c52484854db2012c08"){
      // console.log("I found you = " ,edgeTarget)
    //   asdf3
    // } 

    // if (edgeTarget == "640a74c52484854db2012c08"){
      // console.log("I found you = " ,edgeSource)
    //   asdf4
    // }

    if (nodesObjNew[edgeSource]?.combo && comboDict[nodesObjNew[edgeSource]?.combo]?.show == true) {
      
      if (nodesObjNew[edgeTarget]?.combo && comboDict[nodesObjNew[edgeTarget]?.combo]?.show == true) {
        if (nodesObjNew[edgeSource]?.combo == nodesObjNew[edgeTarget]?.combo) {
          // edgesArrNew[i] = {
          //   ...edgesArrNew[i],
          //   hiddenEdgeCombo: true,
          // }
          edgesArrNew[i] = {
            ...edgesArrNew[i],
            source: "Combo" + nodesObjNew[edgeSource]?.combo + "_center",
            hiddenEdgeCombo: true,
            style: {
              color: "#FFFFFF",
              distance: 10,
              strength: 0.5,
            },
          }

          edgesArrNew.push({
            ...edgesArrNew[i],
            target: "Combo" + nodesObjNew[edgeTarget]?.combo + "_center",
            hiddenEdgeCombo: true,
            style: {
              color: "#FFFFFF",
              distance: 10,
              strength: 0.5,
            },
          })


        } else {

          edgesArrNew[i] = {
            ...edgesArrNew[i],
            source: "Combo" + nodesObjNew[edgeSource]?.combo + "_center",
            target: "Combo" + nodesObjNew[edgeTarget]?.combo + "_center",
          }

        }
      } else {
        edgesArrNew[i] = {
          ...edgesArrNew[i],
          source: "Combo" + nodesObjNew[edgeSource]?.combo + "_center",
        }

      }
    } else {
      if (nodesObjNew[edgeTarget]?.combo && comboDict[nodesObjNew[edgeTarget]?.combo]?.show == true) {
        edgesArrNew[i] = {
          ...edgesArrNew[i],
          target: "Combo" + nodesObjNew[edgeTarget]?.combo + "_center",
        }
      } 
    }

  }
  // ---------- Replace Edges based on Combo ---------------

  // console.log("edgesArrNew = " , edgesArrNew)
  // sadf9
  
  // console.log("nodesObjNew = " , nodesObjNew)
  // // console.log("comboArr = " , comboArr)
  // asdf31

  return {
    edgesArrAfterReplace: edgesArrNew,
    nodesObjAfterReplace: nodesObjNew,
    comboArr: comboArr,
    comboDict: comboDict,
  };
}

// create function that will check for the above nodes and replace with expertise the edges
// async function replaceNodesNotConnectedCore(
//   nodesObj,
//   edgesArr,
// ) {


//   // console.log("nodesObj = " , nodesObj)
//   // console.log("edgesArr = " , edgesArr)
//   // sadf9

//   // edgesArr.forEach ( (edge) => {
//   for (let i = 0; i < edgesArr?.length; i++) {
//     let edge = edgesArr[i]

//     let edgeSource = edge.source;
//     let edgeTarget = edge.target;

//     // ------------ Add edges for each node ---------
//     nodesObj = await addEdgeToNodeObj(nodesObj, edgeSource, edgeTarget)
//     nodesObj = await addEdgeToNodeObj(nodesObj, edgeTarget, edgeSource)
//     // ------------ Add edges for each node ---------
//   }

//   // console.log("nodesOb = " , nodesObj["640a74d42484854db2012c20"])
//   // asdf16
//   // ------------ Delete all the nodes that not connected to Core ---------
//   let deletedNodes = []
//   let nodeAdd = []
//   let edgesArrNew = [...edgesArr]
//   for (const [nodeID, node] of Object.entries(nodesObj)) {
//     if (node.connectedToCore == true){
//       // nodeObjNew[nodeID] = node
//       nodeAdd.push(nodeID)
//     } else {
//       deletedNodes.push(nodeID)

//       // --------- Create edge on every combination of Nodes from the ones that we delete -------
//       const nodesCheck = nodesObj[nodeID].edges


//       res = await generateCombinations(nodesCheck,edgesArrNew,nodesObj) // SOS 🆘 -> Dangerus under tested, check if problem!
//       edgesArrNew = res.edgesArr
//       nodesObj = res.nodesObj
//       // --------- Create edge on every combination of Nodes from the ones that we delete -------
//     }
//   }
//   // ------------ Delete all the nodes that not connected to Core ---------
  

//   // ----------- Add only the nodes that connected to Core ---------
//   let nodesObjNew = {}
//   for (let i = 0; i < nodeAdd.length; i++) {
//     nodesObjNew[nodeAdd[i]] = nodesObj[nodeAdd[i]]
//   }

//   deleteEdges = {}
//   approvedEdges = {}
//   let findEdgeKeep = 0

//   for (const [nodeID, node] of Object.entries(nodesObjNew)) {
//     // ------------ check how many of the edge nodes exist ----------
//     // TODO: delete all the connections from the edgeArr expect one of them that is not core
//     const nodesCheck = node.edges

//     let keyDelete

//     if (node.type == "Member") continue
//     if (node.type == "dynamicSearch") continue


//     findEdgeKeep = 0
//     for (let j = 0; j < nodesCheck.length; j++) {
//       if (!nodesObjNew[nodesCheck[j]]) continue

//       if (nodesObjNew[nodesCheck[j]].type == "Member") continue

//       if (nodesObjNew[nodesCheck[j]].type == "dynamicSearch") continue


//       if (findEdgeKeep < 1){
//         findEdgeKeep += 1
//         keyApprove = nodeID + "-" + nodesCheck[j]
//         approvedEdges[keyApprove] = true

//         keyApprove = nodesCheck[j] + "-" + nodeID
//         approvedEdges[keyApprove] = true
//         if (nodeID == "640a738ec5d61b4bae0ee079"){ // DELETE
//           console.log("WINEEEER = " , nodesCheck[j])
//         }
//         if (keyApprove == "640a738ec5d61b4bae0ee079-640a7381c5d61b4bae0ee065" || keyApprove == "640a7381c5d61b4bae0ee065-640a738ec5d61b4bae0ee079"){
//           console.log("Yeeeeeeeeees= ",nodeID )
//         }
//       } else {
//           keyDelete = nodeID + "-" + nodesCheck[j]

//           if (approvedEdges[keyDelete] == undefined){
//             deleteEdges[keyDelete] = true

//             keyDelete = nodesCheck[j] + "-" + nodeID
//             deleteEdges[keyDelete] = true

//             // console.log("nodesObjNew[nodesCheck[j]].edges = " , nodesObjNew[nodesCheck[j]].edges)

//             // console.log("nodeID = " , nodeID)

//             nodesObjNew[nodesCheck[j]].edges = nodesObjNew[nodesCheck[j]].edges.filter(ndID => ndID != nodeID);
//             nodesObjNew[nodeID].edges = nodesObjNew[nodeID].edges.filter(ndID => ndID != nodesCheck[j]);

//             // console.log("nodesObjNew[nodesCheck[j]].edges = " , nodesObjNew[nodesCheck[j]].edges)

//             if (keyDelete == "640a738ec5d61b4bae0ee079-640a7381c5d61b4bae0ee065" || keyDelete == "640a7381c5d61b4bae0ee065-640a738ec5d61b4bae0ee079"){
//               console.log("keyApprove = " , keyApprove)
//               console.log("Noooooooooooooooooooooooooooo= ",nodeID ,keyDelete,keyApprove[keyDelete])
//               // asdf24
//             }

//             // asdf21

//           }
//       }
//     }
//     // ------------ check how many of the edge nodes exist ----------
//   }

//   console.log("nodesObjNew[ = " , nodesObjNew["640a738ec5d61b4bae0ee079"]) // DELETE

//   const keyTest1 = "640a738ec5d61b4bae0ee079-640a7381c5d61b4bae0ee065"
//   console.log("deleteEdges[]1 = " , deleteEdges[keyTest1])
//   const keyTest2 = "640a7381c5d61b4bae0ee065-640a738ec5d61b4bae0ee079"
//   console.log("deleteEdges[] 2= " , deleteEdges[keyTest2])

//   console.log("approvedEdges[keyTest1] = " , approvedEdges[keyTest1])


//   // console.log("deleteEdges = " , deleteEdges)

//   // --------- Delete edges from deleteEdges ---------
//   // let edgesArrNewTemp = [...edgesArrNew]
//   for (let i = 0; i < edgesArrNew.length; i++) {
//     keyDelete = edgesArrNew[i].source + "-" + edgesArrNew[i].target

//     if (keyDelete ==keyTest1 ){ // DELETE
//       console.log("Edge EXIIIIST 0= " , edgesArrNew[i])
//     }

//     if (keyDelete ==keyTest2 ){ // DELETE
//       console.log("Edge EXIIIIST 0= " , edgesArrNew[i])
//     }


//     if (deleteEdges[keyDelete] == undefined){
//     } else {
//       keyDelete = edgesArrNew[i].target + "-" + edgesArrNew[i].source
//       if (deleteEdges[keyDelete] == undefined){
//       } else {

//         if (keyDelete ==keyTest1 ){ // DELETE
//           console.log("Edge EXIIIIST 1= " , edgesArrNew[i])
//         }
    
//         if (keyDelete ==keyTest2 ){ // DELETE
//           console.log("Edge EXIIIIST 1= " , edgesArrNew[i])
//         }

//         edgesArrNew.splice(i, 1);
//         i--;
//       }
//     }
//   }



//   for (let i = 0; i < edgesArrNew.length; i++) { // DELETE
//     keyDelete = edgesArrNew[i].source + "-" + edgesArrNew[i].target
//     if (keyDelete ==keyTest1 ){ // DELETE
//       console.log("Edge EXIIIIST = " , edgesArrNew[i])
//     }

//     if (keyDelete ==keyTest2 ){ // DELETE
//       console.log("Edge EXIIIIST = " , edgesArrNew[i])
//     }
//   }

//   // --------- Delete edges from deleteEdges ---------

//   // asfd5


//   // ----------- Add only the nodes that connected to Core ---------

//   // console.log("edgesArrNew = " , edgesArrNew)
//   // sdf20


//   return {
//     edgesArrAfterReplace: edgesArrNew,
//     nodesObjAfterReplace: nodesObjNew,
//   };
// }
