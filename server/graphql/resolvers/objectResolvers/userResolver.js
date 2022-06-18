const { User } = require('../../../models/user');
const { ApolloError } = require('apollo-server-express');

module.exports = {
   User: {
      // connections: async (parent, args, context, info) => {
      //    try {
      //       const connections = parent.connections;

      //       const filteredConnections = connections.map(conn => {
      //          // add role checking here
      //          return conn.connectionID;
      //       });

      //       const allUsers = await User.find({
      //          _id: {
      //             $in: filteredConnections,
      //          },
      //       });

      //       return allUsers;

      //    } catch (err) {
      //       throw new ApolloError(
      //          err.message,
      //          err.extensions?.code || 'DATABASE_SEARCH_ERROR',
      //          {
      //             component: 'userResolver > connections',
      //             user: context.req.user?._id,
      //          }
      //       );
      //    }
      // },
      
   },
};
