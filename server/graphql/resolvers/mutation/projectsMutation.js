
const { Projects } = require("../../../models/projectsModel");
const { Team } = require("../../../models/teamModal");
const { Members } = require("../../../models/membersModel");


const {ApolloError} = require("apollo-server-express");
const { TeamMember } = require("discord.js");


module.exports = {
  updateProject: async (parent, args, context, info) => {
   

    
    const {_id,title,description,champion,team,role,collaborationLinks,budget,dates} = JSON.parse(JSON.stringify(args.fields))

    // if (!_id) throw new ApolloError("Project id is required");
    
    let fields = {
      _id,
      registeredAt: new Date(),
    }

    if (title) fields =  {...fields,title}
    if (description) fields =  {...fields,description}
    if (champion) fields =  {...fields,champion}
    if (team) fields =  {...fields,team}
    if (role) fields =  {...fields,role}
    if (collaborationLinks) fields =  {...fields,collaborationLinks}
    if (budget) fields =  {...fields,budget}
    if (dates) fields =  {...fields,dates}

  //console.log("fields = " , fields)

    try {

      let projectData

      if (_id){
        projectData = await Projects.findOne({ _id: fields._id })

      //console.log("projectData 1 = " , projectData)
      
        if (!projectData){
          projectData = await new Projects(fields);
          
          projectData.save()
        } else {

          projectData= await Projects.findOneAndUpdate(
              {_id: projectData._id},
              {
                  $set: fields
              },
              {new: true}
          )

        }
      } else {
        projectData = await new Projects(fields);
        projectData.save()
      }

      

    //console.log("projectData 2 = " , projectData)


      if (champion) {

        // console.log("champion 232 = " , champion)
        let memberDataChampion = await Members.findOne({ _id: champion })

      //console.log("memberDataChampion.discrordName = " , memberDataChampion.discrordName)

        // console.log("memberDataChampion 232 = " , memberDataChampion)

        if (memberDataChampion) {

          let currentProjects = [...memberDataChampion.projects]

          currentProjects.push({
            projectID: projectData._id,
            champion: true,
          })

          if (memberDataChampion){

          //console.log("currentProjects = " , currentProjects)
            memberDataUpdate = await Members.findOneAndUpdate(
                {_id: champion},
                {
                    $set: {projects: currentProjects}
                },
                {new: true}
            )
          //console.log("memberDataUpdate = " , memberDataUpdate)
          }
        }

      }


      if (fields.team && fields.team.length > 0) {

        for (let i=0;i<fields.team.length;i++){

          let memberData = await Members.findOne({ _id: fields.team[i].memberID })


          if (memberData) {

            let currentProjects = [...memberData.projects]


            currentProjects.push({
              projectID: projectData._id,
              champion: false,
              roleID: fields.team[i].roleID,
              phase: fields.team[i].phase,
            })

              memberDataUpdate = await Members.findOneAndUpdate(
                  {_id: fields.team[i].memberID},
                  {
                      $set: {projects: currentProjects}
                  },
                  {new: true}
              )
          }

        }

      }



      return (projectData)
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },

  newTweetProject: async (parent, args, context, info) => {
   

    let {projectID,title,content,author,approved} = JSON.parse(JSON.stringify(args.fields))

    
    if (!projectID) throw new ApolloError( "you need to specify a project ID");
    // if (!title) throw new ApolloError( "you need to specify title");
    // if (!content) throw new ApolloError( "you need to specify content");
    if (!author) throw new ApolloError( "you need to specify author ID");


    var ObjectId = require('mongoose').Types.ObjectId;

    if (ObjectId.isValid(projectID)==false) throw new ApolloError( "The project doesn't have a valid mongo ID");



    if (!approved) approved = false;

    
    let fields = {
      title,
      content,
      author,
      approved,
      registeredAt: new Date(),
    }


    try {


      let projectData = await Projects.findOne({ _id: projectID })


      let memberData = await Members.findOne({ _id: fields.author })

      if (!projectData) throw new ApolloError( "This project dont exist you need to choose antoher project");
      if (!memberData) throw new ApolloError( "The author dont exist on the database you need to choose antoher author ID");

      
      projectData.tweets.push(fields)

      projectDataUpdate = await Projects.findOneAndUpdate(
        {_id: projectData._id},
        {
            $set: {tweets: projectData.tweets }
        },
        {new: true}
      )


      let newTweetID = projectDataUpdate.tweets[projectDataUpdate.tweets.length-1]._id


      return { 
        newTweetID,
        numTweets: projectDataUpdate.tweets.length,
        tweets: projectDataUpdate.tweets
      }
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },

  approveTweet: async (parent, args, context, info) => {
   

    const {projectID,tweetID,approved} = JSON.parse(JSON.stringify(args.fields))

    
    if (!projectID) throw new ApolloError( "you need to specify a project ID");
    if (!tweetID) throw new ApolloError( "you need to specify a tweet ID");
    if (approved==null) throw new ApolloError( "you need to specify if the tweet is approved or not");

    


    try {


      let projectData = await Projects.findOne({ _id: projectID })

      if (!projectData) throw new ApolloError( "This project dont exist you need to choose antoher project");

      projectData.tweets.forEach(tweet => {
      //console.log("tweet = " , tweet)
        if (tweet._id == tweetID){
          tweet.approved = approved
        }
      })


        projectDataUpdate = await Projects.findOneAndUpdate(
          {_id: projectID},
          {
              $set: {tweets: projectData.tweets }
          },
          {new: true}
      )


      return projectDataUpdate

    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },


  changeTeamMember_Phase_Project: async (parent, args, context, info) => {
   

    const {projectID,memberID,phase} = JSON.parse(JSON.stringify(args.fields))

    
    if (!projectID) throw new ApolloError( "you need to specify a project ID");
    if (!memberID) throw new ApolloError( "you need to specify a tweet ID");
    if (phase==null) throw new ApolloError( "you need to specify if the tweet is approved or not");

    console.log("projectID,memberID,phase = " , projectID,memberID,phase)

    try {


      let projectData = await Projects.findOne({ _id: projectID })

      if (!projectData) throw new ApolloError( "This project dont exist you need to choose antoher project");

      let foundMember_flag = false
      projectData.team.forEach(member => {
      // console.log("member = " , member)
        if (member.memberID == memberID){
          member.phase = phase
          console.log("tuba = " )
          foundMember_flag = true
        }
      })

      if (foundMember_flag == false){
          projectData.team.push({
            memberID: memberID,
            phase: phase,
          })

          let memberData = await Members.findOne({ _id: memberID })

          if (memberData) {

            let currentProjects = [...memberData.projects]
          
            currentProjects.push({
              projectID: projectData._id,
              champion: false,
              phase: phase,
            })

            memberDataUpdate = await Members.findOneAndUpdate(
              {_id: memberID},
              {
                  $set: {projects: currentProjects}
              },
              {new: true}
            )
          }

      }


        projectDataUpdate = await Projects.findOneAndUpdate(
          {_id: projectID},
          {
              $set: {team: projectData.team }
          },
          {new: true}
      )


      return projectDataUpdate

      
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },


  createNewTeam: async (parent, args, context, info) => {
   

    
    const {_id,name,description,memberID,projectID,serverID,championID} = JSON.parse(JSON.stringify(args.fields))

    // _id is only if you want to update a team
    if (!name) throw new ApolloError( "you need to specify a name");
    if (!projectID) throw new ApolloError( "you need to specify a project ID");
    
    
    let fields = {
      projectID,
      name,
      registeredAt: new Date(),
    }

    if (_id) fields =  {...fields,_id}
    if (description) fields =  {...fields,description}
    if (memberID) fields =  {...fields,memberID}
    if (serverID) fields =  {...fields,serverID}
    if (championID) fields =  {...fields,championID}

    console.log("change = 1" )

    try {
      if (fields._id) {
      console.log("change = 2" )

        let membersData = await Team.findOne({ _id: fields._id })

        if (membersData){
          console.log("change = 3" )

          membersData = await Team.findOneAndUpdate(
            {_id: fields._id},fields,
            {new: true}
          )


          return (membersData)

        }
      }


      let membersData = await new Team(fields).save()
      


      return (membersData)
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },

};
