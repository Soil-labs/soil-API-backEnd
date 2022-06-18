
const clientElastic = require("../elastic_config")



module.exports =  async (client, triggerText, replyText,Discord,base,airTable,tweetF,sentMessage,tutorialText) => {
    

     const yellowEmoji = '✅';
     const blueEmoji = '❌';

 
      client.on('message', async (message) => {
          
          if (message.channel.type.toUpperCase() === 'DM' && message.content.toLowerCase().slice(0,triggerText.length) === triggerText.toLowerCase()){
              

             client.users.fetch(message.author.id).then(user => {
                 
                 user.send("I am sorry you cant !map inside the bot, you need to do it in any channel of D_D")
                     .then(res => {
                         return 
 
                     })
                     .catch(e=>{
                       // console.log("this is the error = ",e)
                     })
 
             })
         } else {

            if (message.content.toLowerCase().slice(0,triggerText.length) === triggerText.toLowerCase()){

                const member = message.mentions.users.first()

                const authorID = message.author.id



                const authorDiscordName = "@" + message.author.username //+"#"+ message.author.discriminator 


                let tweet = message.content.slice(triggerText.length)
                if (tweet.indexOf("<@")!=-1 && member)
                    tweet = tweet.replace(`<@${member.id}>`,"@" + member.username)




                tweetF.deleteLastMessage(message)


                // ---------------- Find Members --------------
                let discordName,discordID,resultsMembers
                if (member){

                    discordName = "@" + member.username //+"#"+ member.discriminator 
                    discordID = member.id

                    resultsMembers = await airTable.findMembers_multiple(discordID,authorID,base)

                    if (!resultsMembers){
                        resultsMembers = {
                            mentionUser:{
                                id: undefined,
                                data: {}
                            },
                            author:{
                                id: undefined,
                                data: {}
                            }
                        }
                    }
                }
                // ---------------- Find Members --------------


                 // ---------------- Check Tutorial --------------
                 const tutorialPhase = resultsMembers.author.data['Phase Learning']
                 const tutorialLength = tutorialText.tutorial_map.length
 
                 let phaseTutorial = {
                     flagUpdate: false,
                     PhaseLearning: tutorialPhase,
                 }
 
                 if (tutorialPhase<tutorialLength-1){
                     commandTutorial = tutorialText.tutorial_map[tutorialPhase].command
 
                   // console.log("commandTutorial = ",commandTutorial)
                     if (commandTutorial == triggerText){
 
                         phaseTutorial.flagUpdate = true
                         phaseTutorial.PhaseLearning = tutorialPhase + 1
 
                     }
 
                 }
             
               // console.log("phaseTutorial = ",phaseTutorial)
                 // ---------------- Check Tutorial --------------
                
                

                // ------------- Create Tweet -------------
                let resultsTweet
                if (resultsMembers && resultsMembers.author)
                    resultsTweet = await airTable.createTweetAsync(tweet,base,resultsMembers.author.id) 
                else
                    resultsTweet = await airTable.createTweetAsync(tweet,base) 
                // ------------- Create Tweet -------------





                // ------------- Create or Update Member ------------
                let mentionedMemberID,fieldsMember
                if (member){
                    // discordName = "@" + member.username //+"#"+ member.discriminator 
                    // discordID = member.id


                    let mentionUser = resultsMembers.mentionUser.data

                  // console.log("resultsMembers = ",resultsMembers)

                    if (resultsMembers.mentionUser.id){
                        mentionUser['Tweets'].push(resultsTweet.id)

                        fieldsMember = {
                            'Discord Name': mentionUser['Discord Name'],
                            'ID': mentionUser['ID'],
                            'Tweets': mentionUser['Tweets'],
                        }

                        if (phaseTutorial.flagUpdate == true){
                            fieldsMember = {
                                ...fieldsMember,
                                'Phase Learning':phaseTutorial.PhaseLearning,
                            }
                        }

                        
                        mentionedMemberID = await airTable.updateMemberAsync(resultsMembers.mentionUser.id,fieldsMember,base)

                    } 
                    else {
                        let fields = {
                            "Discord Name": discordName,
                            "ID": discordID,
                            "Tweets": [resultsTweet.id]
                        }
                        mentionedMemberID = await airTable.createMemberAsync(fields,base)
                    }
                }

                if (phaseTutorial.flagUpdate == true && resultsMembers.mentionUser.id != resultsMembers.author.id){

                    let fieldsMember = {
                        'Phase Learning':phaseTutorial.PhaseLearning,
                    }

                    mentionedMemberID = await airTable.updateMemberAsync(resultsMembers.author.id,fieldsMember,base)

                }  
                // ------------- Create or Update Member --------------


                
                // ------------- Create or Update Skill -------------

                // -------- Find skills on text ---------
                const skill = tweetF.findSkillsOnTweet(tweet)
                const skillDatabase = await airTable.findSkillsAsync(skill,base)
                // -------- Find skills on text ---------


                let newSkillID

                if (skill!=-1){
                    if (skillDatabase.id){

                        
                        let recordSkill = skillDatabase.fields

                        // // ------------- Create or Update Skill --------------
                        let recordSkillTweets = recordSkill['Tweets']
                        let recordSkillMembers =recordSkill['Members']

                        
                        recordSkillTweets.push(resultsTweet.id)

                        if (mentionedMemberID && recordSkillMembers.indexOf(mentionedMemberID)==-1) // If this member exist already (in the future we can count here the number of tweets that talk aobut this )
                            recordSkillMembers.push(mentionedMemberID)


                        const fieldsSkill = {
                            'Name': skill,
                            "Members": recordSkillMembers, // Dont make sense to have member here becaues the member already exist
                            "Tweets": recordSkillTweets
                        }

                        newSkillID = await airTable.updateSkillAsync(skillDatabase.id,fieldsSkill,base)

                            
                        } 
                        else {
                            let fields = {
                                "Name": skill,
                                "Tweets": [resultsTweet.id]
                            }
                            if (mentionedMemberID){
                                fields = 
                                {
                                    ...fields,
                                    "Members": [mentionedMemberID],
                                }
                            }
                            newSkillID = await airTable.createSkillAsync(fields,base)
                        }
                }
                // ------------- Create or Update Skill -------------





                // ------------- Create or Update project -------------

                // -------- Find projects on text ---------
                const project = tweetF.findProjectsOnTweet(tweet)
                const projectDatabase = await airTable.findProjectsAsync(project,base)
                // -------- Find projects on text ---------

                let newProjectID

                if (project!=-1){
                    if (projectDatabase.id){

                        
                        let recordSkill = projectDatabase.fields

                        // // ------------- Create or Update Skill --------------
                        let recordSkillTweets = recordSkill['Tweets']
                        let recordSkillMembers =recordSkill['Members']

                        
                        recordSkillTweets.push(resultsTweet.id)

                        if (mentionedMemberID && recordSkillMembers.indexOf(mentionedMemberID)==-1) // If this member exist already (in the future we can count here the number of tweets that talk aobut this )
                            recordSkillMembers.push(mentionedMemberID)


                        const fieldsSkill = {
                            'Name': project,
                            "Members": recordSkillMembers, // Dont make sense to have member here becaues the member already exist
                            "Tweets": recordSkillTweets
                        }


                        newProjectID = await airTable.updateProjectsAsync(projectDatabase.id,fieldsSkill,base)

                            
                    } 
                    else {
                        let fields = {
                            "Name": project,
                            "Tweets": [resultsTweet.id]
                        }
                        if (mentionedMemberID){
                            fields = 
                            {
                                ...fields,
                                "Members": [mentionedMemberID],
                            }
                        }
                        newProjectID = await airTable.createProjectAsync(fields,base)
                    }
                }

                 // ------------- Create or Update project -------------




                 // --------------- ElasticSearch -----------------
                 clientElastic.index({
                    index: process.env.REACT_APP_ELASTIC_SEARCH_INDEX,
                    body: {
                        content: tweet,
                        createdBy: `<@${message.author.id}>`,
                        talkingFor: `<@${discordID}>`,
                        registeredAt: new Date()
                    }
                })
                // --------------- ElasticSearch -----------------



                if (member){
                    await sentMessage.tutorial_mentionedUser(tutorialText.tutorial_map,resultsMembers,tweet,phaseTutorial,client,Discord)
                    // let user = await client.users.fetch(mentionUser.id)
                    
                    // let embed = new Discord.MessageEmbed()
                    //     .setColor('#FFFFFF')
                    //     .setTitle(`You just had a new Skill entry from ${authorDiscordName}`)
                    //     .setDescription("!skill "+tweet)
                    //     .setFooter('Do you Accept it \n\n'
                    //             + `${yellowEmoji} Yes\n\n`
                    //             + `${blueEmoji} No`);

                                
                    // let messageEm = await user.send({embed: embed})

                    // messageEm.react(yellowEmoji)
                    // messageEm.react(blueEmoji)
                }
                // --------------- Sent to the User --------------
                
                



            }

         }

    });
}