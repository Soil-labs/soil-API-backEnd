
const { Projects } = require("../../../models/projectsModel");
const { Team } = require("../../../models/teamModal");
const { Members } = require("../../../models/membersModel");
const {ProjectUpdate } = require("../../../models/projectUpdateModal");


const {ApolloError} = require("apollo-server-express");
const { TeamMember } = require("discord.js");


module.exports = {

  createProjectUpdate: async (parent, args, context, info) => {
   

    
    const {_id,title,content,memberID,projectID,serverID,
      authorID,notifyUserID,teamID,roleID,token,threadDiscordID,championID,epicID,
      priority,deadline,phase,deWorkLink,taskID} = JSON.parse(JSON.stringify(args.fields))

      console.log("Mutation > createProjectUpdate > args.fields = " , args.fields)
    // _id is only if you want to update a team
    
    
    let fields = {
      registeredAt: new Date(),
    }

    if (_id) fields =  {...fields,_id}
    if (content) fields =  {...fields,content}
    if (memberID) fields =  {...fields,memberID}
    if (serverID) fields =  {...fields,serverID}
    if (authorID) fields =  {...fields,authorID}
    if (teamID) fields =  {...fields,teamID}
    if (title) fields =  {...fields,title}
    if (projectID) fields =  {...fields,projectID}
    if (roleID) fields =  {...fields,roleID}
    if (token) fields =  {...fields,token}
    if (threadDiscordID) fields =  {...fields,threadDiscordID}
    if (championID) fields =  {...fields,championID}
    if (epicID) fields =  {...fields,epicID}
    if (notifyUserID) fields =  {...fields,notifyUserID}
    if (priority) fields =  {...fields,priority}
    if (deadline) fields =  {...fields,deadline}
    if (phase) fields =  {...fields,phase}
    if (deWorkLink) fields =  {...fields,deWorkLink}


    if (taskID){
      taskData = await ProjectUpdate.findOne({ _id: taskID })
      if (taskData) {
        fields = {...fields,taskID:taskData._id}
        fields =  {...fields,threadDiscordID:taskData.threadDiscordID}
      }

    }

    console.log("change = 1" )

    try {
      let projectUpdateData
      if (fields._id) {
        console.log("change = 2" )

        projectUpdateData = await ProjectUpdate.findOne({ _id: fields._id })

        if (projectUpdateData){
          console.log("change = 3" )

          projectUpdateData = await ProjectUpdate.findOneAndUpdate(
            {_id: fields._id},fields,
            {new: true}
        )


          // return (projectUpdateData)

        }
      } else {
        projectUpdateData = await new ProjectUpdate(fields).save()
      }


      // ------------ Member Task Save info -----------------
      if (projectUpdateData.memberID){
        for (let i=0; i<projectUpdateData.memberID.length; i++){
          let member = await Members.findOne({ _id: projectUpdateData.memberID[i] })
          if (member){
            if ( !member.gardenUpdate || !member.gardenUpdate.taskID || (!member.gardenUpdate.taskID.includes(projectUpdateData._id) && projectUpdateData.phase=="open")){
              let taskID
              if (!member.gardenUpdate || !member.gardenUpdate.taskID){
                taskID = []
              } else {
                taskID = [...member.gardenUpdate.taskID]
              }
              taskID.push(projectUpdateData._id)
              member.gardenUpdate.taskID = taskID
              await Members.findOneAndUpdate(
                {_id: member._id},
                {
                    $set: {gardenUpdate: member.gardenUpdate }
                },
                {new: true}
              )
            }
            if (member.gardenUpdate.taskID.includes(projectUpdateData._id) && projectUpdateData.phase=="archive"){
              let taskID = [...member.gardenUpdate.taskID]
              // console.log("change = tid" ,taskID)
              taskID = taskID.filter(item => item.equals(projectUpdateData._id) == false)
              member.gardenUpdate.taskID = taskID
              await Members.findOneAndUpdate(
                {_id: member._id},
                {
                    $set: {gardenUpdate: member.gardenUpdate }
                },
                {new: true}
              )
              // console.log("change = tad 2" ,member.gardenUpdate.taskID)

            }
          }
        }
      }
      // ------------ Member Task Save info -----------------


      // ------------ Champion Task Save info -----------------
      if (projectUpdateData.championID){
        let member = await Members.findOne({ _id: projectUpdateData.championID })
        console.log("champion = " , member)
        if (member){
          console.log("champion = 2" )
          if ( !member.gardenUpdate || !member.gardenUpdate.taskID || (!member.gardenUpdate.taskID.includes(projectUpdateData._id) && projectUpdateData.phase=="open")){

            let taskID
            if (!member.gardenUpdate || !member.gardenUpdate.taskID){
              taskID = []
            } else {
              taskID = [...member.gardenUpdate.taskID]
            }
            taskID.push(projectUpdateData._id)
            member.gardenUpdate.taskID = taskID
            console.log("member.gardenUpdate.taskID = " , member.gardenUpdate.taskID)
            await Members.findOneAndUpdate(
              {_id: member._id},
              {
                  $set: {gardenUpdate: member.gardenUpdate }
              },
              {new: true}
            )
          }
          if (member.gardenUpdate.taskID.includes(projectUpdateData._id) && projectUpdateData.phase=="archive"){
            let taskID = [...member.gardenUpdate.taskID]
            taskID = taskID.filter(item => item.equals(projectUpdateData._id) == false)
            member.gardenUpdate.taskID = taskID
            await Members.findOneAndUpdate(
              {_id: member._id},
              {
                  $set: {gardenUpdate: member.gardenUpdate }
              },
              {new: true}
            )

          }
        }
      }
      // ------------ Champion Task Save info -----------------
      


      return (projectUpdateData)
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },

};
