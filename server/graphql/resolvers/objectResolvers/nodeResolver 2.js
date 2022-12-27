
const { Members } = require('../../../models/membersModel');
const { Node } = require("../../../models/nodeModal");

const { ApolloError } = require('apollo-server-express');

module.exports = {
   Node: {
      subNodes: async (parent, args, context, info) => {
         // console.log("parent = " , parent)

         try {
            const subNodes = parent.subNodes;


            nodeData = await Node.find({_id: subNodes})

          //console.log("nodeData = " , nodeData)


            return nodeData;

         } catch (err) {
            throw new ApolloError(
               err.message,
               err.extensions?.code || 'DATABASE_SEARCH_ERROR',
               {
                  component: 'userResolver > members',
                  user: context.req.user?._id,
               }
            );
         }
      },
      aboveNodes: async (parent, args, context, info) => {
         // console.log("parent = " , parent)

         try {
            const aboveNodes = parent.aboveNodes;


            nodeData = await Node.find({_id: aboveNodes})

          //console.log("nodeData = " , nodeData)


            return nodeData;

         } catch (err) {
            throw new ApolloError(
               err.message,
               err.extensions?.code || 'DATABASE_SEARCH_ERROR',
               {
                  component: 'userResolver > members',
                  user: context.req.user?._id,
               }
            );
         }
      },
      relatedNodes: async (parent, args, context, info) => {
         // console.log("parent = " , parent)

         try {
            const relatedNodes = parent.relatedNodes;


            nodeData = await Node.find({_id: relatedNodes})

          //console.log("nodeData = " , nodeData)


            return nodeData;

         } catch (err) {
            throw new ApolloError(
               err.message,
               err.extensions?.code || 'DATABASE_SEARCH_ERROR',
               {
                  component: 'userResolver > members',
                  user: context.req.user?._id,
               }
            );
         }
      },
   },
};
