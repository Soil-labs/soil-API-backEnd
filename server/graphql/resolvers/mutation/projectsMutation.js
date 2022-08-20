
const { Projects } = require("../../../models/projectsModel");
const { Team } = require("../../../models/teamModal");
const { Role } = require("../../../models/roleModel");
const { Members } = require("../../../models/membersModel");
const {ApolloError} = require("apollo-server-express");
const { TeamMember } = require("discord.js");
const { driver } = require("../../../../server/neo4j_config");

const {createNode_neo4j,createNode_neo4j_field,updateNode_neo4j_serverID,updateNode_neo4j_serverID_projectID,makeConnection_neo4j} = require("../../../neo4j/func_neo4j");


module.exports = {
  updateProject: async (parent, args, context, info) => {

    
    const {_id,title,description,champion,team,role,collaborationLinks,budget,dates,stepsJoinProject,serverID} = JSON.parse(JSON.stringify(args.fields))
 
 
    
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
    if (stepsJoinProject) fields =  {...fields,stepsJoinProject}

    console.log("fields = " , fields)

    try {

      let projectData

      if (_id){
        projectData = await Projects.findOne({ _id: fields._id })

        // console.log("projectData 1 = ", projectData);
      
        if (!projectData){

          if (serverID) fields.serverID = serverID;

          projectData = await new Projects(fields);

          
          projectData.save()

          console.log("change = -putsigona bagiensld" )

          await createNode_neo4j_field({
            fields:{
              node:"Project",
              _id: projectData._id,
              project_id: projectData._id,
              name: projectData.title,
              serverID: projectData.serverID,
            }
          })
            
          
        } else {

          let serverID_new = [...projectData.serverID]
          if (!projectData.serverID.includes(serverID)){
            serverID_new.push(serverID)
          }
          if (serverID) fields.serverID = serverID_new;


          projectData= await Projects.findOneAndUpdate(
              {_id: projectData._id},
              {
                  $set: fields
              },
              {new: true}
          )

          if (fields.serverID){
            await updateNode_neo4j_serverID({
              node:"Project",
              id:projectData._id,
              serverID:projectData.serverID,
            })
          }

        }
      } else {
        if (serverID) fields.serverID = serverID;

        projectData = await new Projects(fields);
        projectData.save()

        await createNode_neo4j_field({
          fields:{
            node:"Project",
            _id: projectData._id,
            project_id: projectData._id,
            name: projectData.title,
            serverID: projectData.serverID,
          }
        })
      }
      
      

      // console.log("projectData 2 = " , projectData)


      if (champion) {
        let memberDataChampion = await Members.findOne({ _id: champion })


        if (memberDataChampion) {

            let currentProjects = [...memberDataChampion.projects]

            currentProjects.push({
              projectID: projectData._id,
              champion: true,
            })

            memberDataUpdate = await Members.findOneAndUpdate(
                {_id: champion},
                {
                    $set: {projects: currentProjects}
                },
                {new: true}
            )


            // add champion relationship between project node and member
            makeConnection_neo4j({
              node:["Project","Member"],
              id:[projectData._id,memberDataChampion._id],
              connection:"CHAMPION",
            })
        }
  
      }

      // console.log("team ---- --- -- --  = " , team)

      
      if (team && fields.team && fields.team.length > 0) {
        console.log('team members!!!: ',fields.team); // prints out

        // const session4 = driver.session({database:"neo4j"});
        for (let i=0;i<fields.team.length;i++){
          
          // console.log("team ---- --- -- --  = " , i)

          

          makeConnection_neo4j({
            node:["Project","Member"],
            id:[projectData._id,fields.team[i].memberID],
            connection:"TEAM_MEMBER",
          })
          

          
          let memberData = await Members.findOne({ _id: fields.team[i].members })
          console.log('member data OBJECT 111: ',memberData); //null 

          if (memberData) {
            console.log('member data OBJECT 222: ',memberData); //doesn't print out

            let currentProjects = [...memberData.projects]
   
            currentProjects.push({
              projectID: projectData._id,
              champion: false,
              roleID: fields.team[i].roleID,
              phase: fields.team[i].phase,
            })
            console.log("Member's current projects = " , currentProjects)

            if (memberData){

              // console.log("currentProjects = " , currentProjects)
              memberDataUpdate = await Members.findOneAndUpdate(
                  {_id: fields.team[i].memberID},
                  {
                      $set: {projects: currentProjects}
                  },
                  {new: true}
              )
              // console.log("memberDataUpdate = " , memberDataUpdate)
              
            }
          }

        }
        
      }


      if (role && projectData.role && projectData.role.length > 0) {
        

        for (let i=0;i<projectData.role.length;i++){

          let RoleNow = projectData.role[i]
          
          console.log("change = 2232" )

          await createNode_neo4j_field({
            fields:{
              node:"Role",
              _id: RoleNow._id,
              project_id: projectData._id,
              name: RoleNow.title,
              serverID: projectData.serverID,
            }
          })

          makeConnection_neo4j({
            node:["Project","Role"],
            id:[projectData._id,RoleNow._id],
            connection:"ROLE",
          })

          for (let j=0;j<RoleNow.skills.length;j++){
            let SkillNow = RoleNow.skills[j]
            
            makeConnection_neo4j({
              node:["Role","Skill"],
              id:[RoleNow._id,SkillNow._id],
              connection:"ROLE_SKILL",
            })
          }
          
          

        }
        
      } else if (serverID){

        for (let i=0;i<projectData.role.length;i++){

          let RoleNow = projectData.role[i]
    
          updateNode_neo4j_serverID_projectID({
            node:"Role",
            project_id:projectData._id,
            serverID:projectData.serverID,
          })

          
          

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

  createNewRole: async (parent, args, context, info) => {
   

    
    const {_id,name,description,memberID,projectID,serverID,teamID} = JSON.parse(JSON.stringify(args.fields))

    // _id is only if you want to update a team
    if (!name) throw new ApolloError( "you need to specify a name");
    
    
    let fields = {
      name,
      registeredAt: new Date(),
    }

    if (_id) fields =  {...fields,_id}
    if (description) fields =  {...fields,description}
    if (memberID) fields =  {...fields,memberID}
    if (serverID) fields =  {...fields,serverID}
    if (teamID) fields =  {...fields,teamID}
    if (projectID) fields =  {...fields,projectID}


    console.log("change = 1" )

    let roleData
    try {
      if (fields._id) {
      console.log("change = 2" )

        roleData = await Role.findOne({ _id: fields._id })

        if (roleData){
          console.log("change = 3" )

          roleData = await Role.findOneAndUpdate(
            {_id: fields._id},fields,
            {new: true}
          )


          return (roleData)

        }
      } else {
        roleData = await new Role(fields).save()
        
      }
      


      return (roleData)
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },

};
