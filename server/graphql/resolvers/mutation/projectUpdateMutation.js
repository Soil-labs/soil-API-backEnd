
const { Projects } = require("../../../models/projectsModel");
const { Team } = require("../../../models/teamModal");
const { Members } = require("../../../models/membersModel");
const {ProjectUpdate } = require("../../../models/projectUpdateModal");


const {ApolloError} = require("apollo-server-express");
const { TeamMember } = require("discord.js");


module.exports = {

  createProjectUpdate: async (parent, args, context, info) => {
   

    
    const {_id,title,content,memberID,projectID,serverID,authorID,projectTeamID} = JSON.parse(JSON.stringify(args.fields))

    // _id is only if you want to update a team
    
    
    let fields = {
      registeredAt: new Date(),
    }

    if (_id) fields =  {...fields,_id}
    if (content) fields =  {...fields,content}
    if (memberID) fields =  {...fields,memberID}
    if (serverID) fields =  {...fields,serverID}
    if (authorID) fields =  {...fields,authorID}
    if (projectTeamID) fields =  {...fields,projectTeamID}
    if (title) fields =  {...fields,title}
    if (projectID) fields =  {...fields,projectID}


    console.log("change = 1" )

    try {
      if (fields._id) {
        console.log("change = 2" )

        let projectUpdateData = await ProjectUpdate.findOne({ _id: fields._id })

        if (projectUpdateData){
          console.log("change = 3" )

          projectUpdateData = await ProjectUpdate.findOneAndUpdate(
            {_id: fields._id},fields,
            {new: true}
        )


          return (projectUpdateData)

        }
      }
      console.log("change = 4" )


      let projectUpdateData = await new ProjectUpdate(fields).save()
      


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
