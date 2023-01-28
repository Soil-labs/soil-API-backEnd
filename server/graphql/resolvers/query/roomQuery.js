const { Rooms } = require("../../../models/roomsModel");
const { Members } = require("../../../models/membersModel");

const { ApolloError } = require("apollo-server-express");

const { combineResolvers } = require("graphql-resolvers");
const { IsAuthenticated } = require("../../../utils/authorization");

module.exports = {
  findRoom: async (parent, args, context, info) => {
    const { _id, serverID } = args.fields;
    console.log("Query > findRoom > args.fields = ", args.fields);

    // if (!_id) throw new ApolloError( "You need to specify the id of the Room");
    // console.log("ID", _id)

    try {
      let roomData;
      if (_id) {
        roomData = await Rooms.findOne({ _id: _id });
      } else {
        roomData = await Rooms.findOne({});
      }
      if (roomData.hostID.length > 0) {
        roomData.hosts = await Members.find({ _id: roomData.hostID });
      }

      return roomData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findRoom" }
      );
    }
  },
  findRooms: combineResolvers(
    IsAuthenticated,
    async (parent, args, context, info) => {
      const { _id, serverID } = args.fields;
      console.log("Query > findRooms > args.fields = ", args.fields);

      try {
        let roomsData;
        if (_id) {
          roomsData = await Rooms.findOne({ _id: _id }).sort({
            registeredAt: -1,
          });
        } else {
          if (serverID) {
            roomsData = await Rooms.find({ serverID: serverID }).sort({
              registeredAt: -1,
            });
          } else {
            roomsData = await Rooms.find({}).sort({
              registeredAt: -1,
            });
          }
        }

        return {
          roomsData,
          pageInfo: {
            totalResults: roomsData.length,
          },
        };
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "tmemberQuery > findRooms" }
        );
      }
    }
  ),
};
