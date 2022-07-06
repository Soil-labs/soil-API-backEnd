
const { Projects } = require("../../../models/projectsModel");
const { Members } = require("../../../models/membersModel");


const {ApolloError} = require("apollo-server-express");


module.exports = {
  updateProject: async (parent, args, context, info) => {
   

    // const {tagName,title,description,champion,team} = args.fields;
    const {tagName,title,description,champion,team,role,collaborationLinks,budget,dates} = JSON.parse(JSON.stringify(args.fields))

    if (!tagName) return {}
    
    let fields = {
      tagName,
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

    console.log("fields = " , fields)

    try {

      let projectData = await Projects.findOne({ tagName: fields.tagName })
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

      if (champion) {

        console.log("champion 232 = " , champion)
        let memberDataChampion = await Members.findOne({ _id: champion })

        console.log("memberDataChampion 232 = " , memberDataChampion)


        if (memberDataChampion){
          memberDataUpdate = await Members.findOneAndUpdate(
              {_id: champion},
              {
                  $set: {projects: memberDataChampion.projects.concat(projectData._id)}
              },
              {new: true}
          )
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
   

    // const {tagName,title,description,champion,team} = args.fields;
    const {projectID,content,author} = JSON.parse(JSON.stringify(args.fields))

    
    if (!projectID) throw new ApolloError( "you need to specify a project ID");
    if (!content) throw new ApolloError( "you need to specify content");
    if (!author) throw new ApolloError( "you need to specify author ID");


    var ObjectId = require('mongoose').Types.ObjectId;

    if (ObjectId.isValid(projectID)==false) throw new ApolloError( "The project doesn't have a valid mongo ID");

    
    let fields = {
      projectID,
      content,
      author,
    }




    try {


      let projectData = await Projects.findOne({ _id: fields.projectID })


      let memberData = await Members.findOne({ _id: fields.author })

      if (!projectData) throw new ApolloError( "This project dont exist you need to choose antoher project");
      if (!memberData) throw new ApolloError( "The author dont exist on the database you need to choose antoher author ID");

      
      
      projectData.tweets.push({
        content: fields.content,
        author: fields.author,
        registeredAt: new Date(),
      })

      

    projectDataUpdate = await Projects.findOneAndUpdate(
      {_id: projectData._id},
      {
          $set: {tweets: projectData.tweets }
      },
      {new: true}
  )




      return { 
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

};
