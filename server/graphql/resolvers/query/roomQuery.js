const { Rooms } = require("../../../models/roomsModel");


module.exports = {
    findRoom: async (parent, args, context, info) => {
        const {_id} = args.fields;
        console.log("Query > findRoom > args.fields = " , args.fields)

        // if (!_id) throw new ApolloError( "You need to specify the id of the Room");
        // console.log("ID", _id)


        try {
            let roomData
            if (_id){
                roomData = await Rooms.findOne({_id: _id});
            } else {
                roomData = await Rooms.findOne({});
            }

            return roomData 
        } catch(err) {
            throw new ApolloError(
                err.message,
                err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
                { component: "tmemberQuery > findRoom"}
            );
        }
    }
}