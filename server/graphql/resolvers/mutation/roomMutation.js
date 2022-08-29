const { Rooms } = require("../../../models/roomsModel");
const {ApolloError} = require("apollo-server-express");

const { PubSub } = require('graphql-subscriptions');
const pubsub = new PubSub()




module.exports = {
    createRoom: async (parent, args, context, info) => {
   
        const {_id,name} = args.fields;

        // if (!_id) throw new ApolloError( "_id is required, the IDs come from Discord");
        // if (!name) throw new ApolloError( "You need to specify the name of the Room");

        let fields = {
            registeredAt: new Date(),
        };

        if (_id) fields = {...fields,_id}
        if (name) fields = {...fields,name}
        

        try {

            let roomData

            roomData = await Rooms.findOne({ _id: fields._id })


            if (!roomData){
                roomData = await new Rooms(fields);
                
                roomData.save()
                
            } else {
                roomData= await Rooms.findOneAndUpdate(
                {name: fields.name},
                {
                    $set: fields
                },
                {new: true}
                )
            }
            
            

            return roomData
            } catch (err) {
            throw new ApolloError(
                err.message,
                err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
                { component: "tmemberQuery > createRoom"}
            );
        }
    },

    enterRoom: async (parent, args, context, info) => {
        const {roomId,memberId} = args.fields;

        if (!roomId) throw new ApolloError( "_id is required, the IDs come from Discord");
        if (!memberId) throw new ApolloError( "You need to specify the memberId to enter the Room");

        let fields = {
            roomId,
            memberId
        };

        try {

            let roomData

            roomData = await Rooms.findOne({ _id: fields.roomId })
            if(!roomData) throw new ApolloError( "RoomId does Not exists");

            const isMemberInTheRoom = roomData.members.indexOf(memberId) === -1 ? false : true;
            console.log(roomData)
            if(!isMemberInTheRoom) {
                const updatedMember = [...roomData.members, memberId]
                roomData= await Rooms.findOneAndUpdate(
                    {_id: fields.roomId},
                    {
                        members: updatedMember
                    },
                    {new: true}
                )
            }
            pubsub.publish(roomData._id, {
                roomUpdated: roomData
            })
            return roomData
        } catch (err) {
            throw new ApolloError(
                err.message,
                err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
                { component: "tmemberQuery > enterRoom"}
            );
        }
    },
    roomUpdated: {
        subscribe: (parent, args, context, info) => {
            const {_id} = args.fields;
            if (!_id) throw new ApolloError( "_id is required, the IDs come from Discord");
            return pubsub.asyncIterator(_id)
        }
    }
}