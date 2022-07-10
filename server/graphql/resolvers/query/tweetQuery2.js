const { Projects } = require("../../../models/projectsModel");
const { Members } = require("../../../models/membersModel");



const {
  ApolloError,
} = require("apollo-server-express");


module.exports = {
  findTweets: async (parent, args, context, info) => {
   

    const { project,member} = args.fields;
    

    try {



      let projectData,memberData,tweetsIDs_project=[],tweetsIDs_member=[],tweetsIDs_all = []

      let memberProject, championProject,memberProjectClean,championProjectClean
      if (project && project!=null){
        projectData = await Projects.findOne({ tagName: project })

        

      if (projectData==null) return [{}]
        
        if (projectData)
          tweetsIDs_project = projectData.tweets



        memberProject = await Members.find({ airtableID: projectData.members })



        memberProjectClean = memberProject.map(memberN=>{
          return {
            discordName: memberN.discordName,
            avatarURL: memberN.discordAvatar,
          }
        })





        championProject = await Members.find({ airtableID: projectData.champion })

        championProjectClean = championProject.map(memberN=>{
          return {
            discordName: memberN.discordName,
            avatarURL: memberN.discordAvatar,
          }
        })
        


      } 
      else if (member){
        championProject = await Members.find({ discordName: member })
        
        championProjectClean = championProject.map(memberN=>{
          return {
            discordName: memberN.discordName,
            avatarURL: memberN.discordAvatar,
          }
        })
      }

      if (member){
        memberData = await Members.findOne({ discordName: member })
      

        if (memberData)
          tweetsIDs_member = memberData.tweets
      }



      if (tweetsIDs_project.length>0 && tweetsIDs_member.length>0 ){


        tweetsIDs_all = tweetsIDs_project.filter(value => tweetsIDs_member.includes(value));

      } else if (tweetsIDs_project.length>0 ){
        tweetsIDs_all = tweetsIDs_project
      } else if (tweetsIDs_member.length>0 ){
        tweetsIDs_all = tweetsIDs_member
      } else {
        // return [{}];
        tweetsIDs_all = []

      }



      

      const tweetsData = await Tweet.find({ airtableID: tweetsIDs_all })
      

      let outputData = []
      let tweet,memberNt
      
      

      membersDiscordNames = []
      for (let i=0;i<tweetsData.length;i++){
        tweet = tweetsData[i]
        
        

        if (tweet.tagName.slice(0,6)==="!index" || tweet.tagName.slice(0,4) === "!map"){
          if (!membersDiscordNames.includes(tweet.author.replace("@",""))){
            membersDiscordNames.push(tweet.author.replace("@",""))
          }

          outputData.push({
            tagName: tweet.tagName,
            registeredAt: tweet.registeredAt,
            authorName: tweet.author.replace("@",""),
          })
          
        }
      }


      // -------------- Find members and translate them to index --------------
      memberNt = await Members.find({ discordName: membersDiscordNames })

      indexMembers = {}
      memberNt.forEach((memberT,idx)=>{
        indexMembers[memberT.discordName] = idx
      })
      // -------------- Find members and translate them to index --------------


      // outputData.forEach((out,idx)=>{
        for (let i=0;i<outputData.length;i++){

          out = outputData[i]
          
          outputData[i] = {
            ...outputData[i],
            authorAvatarURL: memberNt[indexMembers[out.authorName]].discordAvatar,

          }
          
      }

      
      let output = {
        tweet: outputData,
      }

      if (projectData){
        output = {
          ...output,
          title: projectData.title,
          description: projectData.description,
          numTweets: tweetsData.length,
          numMembers: projectData.members.length,
          membersD: memberProjectClean,

        }
      }

      if (championProjectClean){
        output = {
          ...output,
          champion: championProjectClean,

        }
      }
      
      return output
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tweetQuery > tweet"}
      );
    }
  },
  
};
