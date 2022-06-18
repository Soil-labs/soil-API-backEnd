
const clientElastic = require("../elastic_config")



module.exports =  async (client, triggerText,Discord,base,airTable,tweetF,sentMessage,tutorialText) => {
    

     const yellowEmoji = '✅';
     const blueEmoji = '❌';

 
      client.on('message', async (message) => {


            if (message.content.toLowerCase().slice(0,triggerText.length) === triggerText.toLowerCase()){

                const authorID = message.author.id

                if ( message.channel.type.toUpperCase() != 'DM'){
                    tweetF.deleteLastMessage(message)
                }

                if (message.content.length == triggerText.length){ // we only have the word !skill, so we will sent them to airtable
                    await sentMessage.sentEmbed("#233423","TADAM! Here’s what projects have been growing across the DAO lately. 🌸🌺🌼",
                            process.env.REACT_APP_AIRTABLE_PROJECTS,authorID,client,Discord)
                    return 
                }


                const member = message.mentions.users.first()

                if (!member && message.channel.type.toUpperCase() === 'DM'){
                  const message = "🆘 I can’t find the person you’ve tagged. It’s probably because you’re typing in the DM’s. 🆘 \n\n\n 🌱 In order for me to see who you’re tagging - you need to write the command & tag them in any public channel. Don’t worry, we delete the message straight away so nobody will see what you’re writing, except for them! 🌱"
                    sentMessage.sent(message,authorID,client)
                    return
                }


                const authorDiscordName = "@" + message.author.username //+"#"+ message.author.discriminator 


                let tweet = message.content.slice(triggerText.length)
                if (tweet.indexOf("<@")!=-1 && member)
                    tweet = tweet.replace(`<@${member.id}>`,"@" + member.username)



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
                const tutorialLength = tutorialText.tutorial_project.length

                let phaseTutorial = {
                    flagUpdate: false,
                    PhaseLearning: tutorialPhase,
                }

                if (tutorialPhase<tutorialLength-1){
                    commandTutorial = tutorialText.tutorial_project[tutorialPhase].command

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

                if (resultsMembers.author)
                    resultsTweet = await airTable.createTweetAsync(tweet,base,resultsMembers.author.id) 
                else
                    resultsTweet = await airTable.createTweetAsync(tweet,base) 
                // ------------- Create Tweet -------------





                // ------------- Create or Update Member --------------
                if (member){
                    
                    let mentionUser 

                    if (resultsMembers.mentionUser && resultsMembers.mentionUser.id){

                        mentionUser = resultsMembers.mentionUser.data


                        let fieldsMember = {
                            'Discord Name': mentionUser['Discord Name'],
                            'ID': mentionUser.id,
                            // 'Tweets': mentionUser['Tweets'],
                        }

                        if (mentionUser['Tweets'] && resultsTweet.id )
                            mentionUser['Tweets'].push(resultsTweet.id)

                        
                        fieldsMember = {
                            ...fieldsMember,
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
                            "Tweets": [resultsTweet.id],
                            'Phase Learning': 0

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





                // ------------- Create or Update project -------------

                // -------- Find projects on text ---------
                const project = tweetF.findSkill_skillCommand(tweet)
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



                        // if(recordSkillMembers){
                        //     if (recordSkillMembers.indexOf(mentionedMemberID)==-1) // If this member exist already (in the future we can count here the number of tweets that talk aobut this )
                        //         recordSkillMembers.push(mentionedMemberID)
                        // } else {
                        //     recordSkillMembers = [mentionedMemberID]
                        // }

                        if (recordSkillMembers.indexOf(mentionedMemberID)==-1) // If this mentionUser exist already (in the future we can count here the number of tweets that talk aobut this )
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



                // --------------- Sent to the User --------------
                
                if (member){
                    await sentMessage.tutorial_mentionedUser(tutorialText.tutorial_project,resultsMembers,tweet,phaseTutorial,client,Discord)
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

    });
}