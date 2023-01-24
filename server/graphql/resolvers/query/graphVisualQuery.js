const { Members } = require("../../../models/membersModel");
const { Projects } = require("../../../models/projectsModel")
const { ApolloError } = require("apollo-server-express");
const mongoose = require("mongoose");

const { generalFunc_neo4j } = require("../../../neo4j/func_neo4j");

const DEFAULT_PAGE_LIMIT = 20;

module.exports = {
  findMemberGraph: async (parent, args, context, info) => {
    const { memberID } = args.fields;
    console.log("Query > findMemberGraph > args.fields = ", args.fields);

    if (!memberID) throw new ApolloError("The memberID is required");

    try {
      let memberData = await Members.findOne({ _id: memberID }).select(
        "_id discordName nodes"
      );

      if (!memberData) throw new ApolloError("Member not found");

      console.log("memberData = ", memberData);

      res = await generalFunc_neo4j({
        request: `//find node -> and node around of Type
        MATCH res = ((n)-[]-(m))
        WHERE n._id = "${memberID}" AND (m:sub_expertise or m:sub_typeProject)
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

      // console.log("nodesObj = ", nodesObj);
      // console.log("edgesArr = ", edgesArr);

      return {
        nodes: nodesArr,
        edges: edgesArr,
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
  findProjectGraph:  async (parent, args, context, info) => {
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

};
