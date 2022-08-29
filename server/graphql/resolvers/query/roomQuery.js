const { Rooms } = require("../../../models/roomsModel");


module.exports = {
    findRoom: async (parent, args, context, info) => {
        const {_id} = args.fields;

        // if (!_id) throw new ApolloError( "You need to specify the id of the Room");
        // console.log("ID", _id)


        console.log("change = " )
        try {
            let roomData
            if (_id){
                roomData = await Rooms.findOne({_id: _id});
            } else {
                roomData = await Rooms.findOne({});
            }

            console.log("roomData = " , roomData)

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