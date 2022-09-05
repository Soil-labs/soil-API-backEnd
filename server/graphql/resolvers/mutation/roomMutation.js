const { Rooms } = require("../../../models/roomsModel");
const { Members } = require("../../../models/membersModel");
const { Skills } = require("../../../models/skillsModel");
const {ApolloError} = require("apollo-server-express");

const { PubSub } = require('graphql-subscriptions');
const pubsub = new PubSub()




module.exports = {
    createRoom: async (parent, args, context, info) => {
   
        const {_id,name} = args.fields;
        console.log("Mutation > createRoom > args.fields = " , args.fields)

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
        const {roomID,memberID} = args.fields;
        console.log("Mutation > enterRoom > args.fields = " , args.fields)

        if (!roomID) throw new ApolloError( "_id is required, the IDs come from Discord");
        if (!memberID) throw new ApolloError( "You need to specify the memberId to enter the Room");

        let fields = {
            roomID,
            memberID
        };

        try {

            let roomData

            roomData = await Rooms.findOne({ _id: fields.roomID })
            if(!roomData) throw new ApolloError( "RoomId does Not exists");

            const isMemberInTheRoom = roomData.members.indexOf(memberID) === -1 ? false : true;
            console.log(roomData)
            if(!isMemberInTheRoom) {
                const updatedMember = [...roomData.members, memberID]
                roomData= await Rooms.findOneAndUpdate(
                    {_id: fields.roomID},
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
    exitRoom: async (parent, args, context, info) => {
        const {roomID,memberID} = args.fields;
        console.log("Mutation > exitRoom > args.fields = " , args.fields)

        if (!roomID) throw new ApolloError( "_id is required, the IDs come from Discord");
        if (!memberID) throw new ApolloError( "You need to specify the memberId to Exit the Room");

        let fields = {
            roomID,
            memberID
        };

        try {

            let roomData

            roomData = await Rooms.findOne({ _id: fields.roomID })
            if(!roomData) throw new ApolloError( "RoomId does Not exists");

            const isMemberInTheRoom = roomData.members.indexOf(memberID) === -1 ? false : true;
            if(!isMemberInTheRoom) throw new ApolloError("Member is not in the Room.")
            console.log(roomData)
            if(isMemberInTheRoom) {
                const tempMembers = roomData.members
                delete tempMembers[roomData.members.indexOf(memberID)]
                const updatedMember = tempMembers.filter((memberID) => memberID)
                roomData= await Rooms.findOneAndUpdate(
                    {_id: fields.roomID},
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
                { component: "tmemberQuery > exitRoom"}
            );
        }
    },


    addSkillsToMemberInRoom: async (parent, args, context, info) => {

        const {skills, memberID, roomID} = args.fields;
        console.log("Mutation > addSkillsToMemberInRoom > args.fields = " , args.fields)

          if (!memberID) throw new ApolloError( "memberID is required");
          if (!roomID) throw new ApolloError( "roomID is required");

          let fields = {
            _id: memberID,
            registeredAt: new Date(),
          };
          
          if (skills) fields =  {...fields,skills}
          
          
      
        try {
      
            let membersData = await Members.findOne({ _id: fields._id })
            let roomData = await Rooms.findOne({_id: roomID})

            if(!roomData.members.include(memberID)) throw new ApolloError( "Member Not in the room");
      
            if(membersData) {
                membersData = await Members.findOneAndUpdate({ _id: fields._id }, fields, { new: true })
                pubsub.publish("SKILL_UPDATED_IN_ROOM" + roomID, {
                    newSkillInRoom: membersData
                })
            }
            
            return membersData
        } catch (err) {
            throw new ApolloError(
              err.message,
              err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
              { component: "roomMutaion > addSkillsToMemberInRoom"}
            );
        }
    },
    roomUpdated: {
        subscribe: (parent, args, context, info) => {
            const {_id} = args.fields;
            console.log("Mutation > roomUpdated > args.fields = " , args.fields)

            if (!_id) throw new ApolloError( "_id is required, the IDs come from Discord");
            return pubsub.asyncIterator(_id)
        }
    },

    newSkillInRoom: {
        subscribe: (parent, args, context, info) => {
            const {_id} = args.fields;
            console.log("Mutation > newSkillInRoom > args.fields = " , args.fields)
            if (!_id) throw new ApolloError( "_id is required, the IDs come from Discord");
            return pubsub.asyncIterator("SKILL_UPDATED_IN_ROOM" + _id)

        }
    }
}