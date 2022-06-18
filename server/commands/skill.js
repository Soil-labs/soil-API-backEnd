
const { TrunkContext } = require("twilio/lib/rest/trunking/v1/trunk");
const clientElastic = require("../elastic_config")
const mongoFunc = require("../bot/mongoFunc");
const NLP = require("../bot/NLP");
const botFunc = require("../bot/botFunc");
const airtableFunc = require("../bot/airtableFunc");
const elasticSearch = require("../bot/elasticSearch");

 

module.exports =  async (client, triggerText,Discord,base,airTable,tweetF,sentMessage,commandF,tutorialText) => {
    

     

 
      client.on('message', async (message) => {

            

            let results,members,categories
            const command = NLP.isMessageTriggerCommand(message.content,['!skill','!project','!map','!index'])


            // if (command){
            //     results = NLP.splitCommandAndMention(message.content,message.mentions.users.first(10),message.author)

            //     members = results.members
            //     categories = results.categories

            //   //console.log("members = " , members)

            //     let user = await client.users.fetch(members.author.discordID)

            //   //console.log("user = " , user)

            //     let avatarUrl = user.displayAvatarURL()

            //   //console.log("avatarUrl = " , avatarUrl)

            // }

            // console.log("command = " , command)
            if (command ){

            //console.log("change = ",command )
              

                results = NLP.splitCommandAndMention(message.content,message.mentions.users.first(10),message.author)

                members = results.members
                categories = results.categories


              //console.log("categories - skill.js = " , categories)

              //console.log("message.channel.type.toUpperCase() = " , message.channel.type.toUpperCase())
                if ( message.channel.type.toUpperCase().toUpperCase() != 'DM'){
                    botFunc.deleteLastMessage(message)
                }

                

                if ( message.channel.type.toUpperCase() == 'DM' && members.mentionUsers.length==0 && message.content.indexOf('@')!=-1){
                    
                    await sentMessage.sentEmbed("#233423","",
                      "🆘 I can’t find the person you’ve tagged. It’s probably because you’re typing in the DM’s. 🆘 \n\n\n 🌱 In order for me to see who you’re tagging - you need to write the command & tag them in any public channel. Don’t worry, we delete the message straight away so nobody will see what you’re writing, except for them! 🌱",members.author.discordID,client,Discord)

                    return 
                }

                



                // if (members.mentionUsers.length>0 && message.channel.type.toUpperCase() === 'DM'){
                //     const message = "I am sorry you can only write about you inside the bot, Please go to any channel of our Discord and write the message there"
                //     sentMessage.sent(message,members.author.id,client)
                //     return
                // }


                
              
                // console.log("members - findMentionUsers before = ",members)

                members = await mongoFunc.findMentionUsers(members)

              ////console.log("members - findMentionUsers after = ",members)


              
                if (message.content.length == command.length){ // we only have the word !skill, so we will sent them to airtable
                    let link,messageNow
                    if (command=="!skill"){
                      link = process.env.REACT_APP_AIRTABLE_SKILLS
                      messageNow = "Woaahh! The skills across this DAO are GROWING! 🌸🌺🌼 "
                    }else if (command=="!project"){ 
                      link = process.env.REACT_APP_AIRTABLE_PROJECTS
                      messageNow = "TADAM! Here’s what projects have been growing across the DAO lately. 🌸🌺🌼"
                    }else{
                      link = process.env.REACT_APP_AIRTABLE_TWEETS
                      messageNow = "Everything said by everyone ever. Or just about. "
                    }
                      



                  await sentMessage.sentEmbed("#233423", messageNow,
                    link,members.author.discordID,client,Discord)

                    return 
                }


                if (command=="!skill"){
                    if (categories.skills && categories.skills[0].content=='') {
                      await sentMessage.sentEmbed("#233423","",
                            "You need to add one Skill",members.author.discordID,client,Discord)

                      return 
                    }
                } else if (command=="!project"){
                  if (categories.projects && categories.projects[0].content=='') {
                    await sentMessage.sentEmbed("#233423","",
                          "You need to add one Project",members.author.discordID,client,Discord)

                    return 
                  }
                } 

              //console.log("categories = " , categories)


                members = await botFunc.SentDM_responed_discussion(categories.tweet.content,command,members,client,Discord,base,sentMessage)

                 

                categories = await mongoFunc.findCategories_all(categories)

              //console.log("categories 3 = ",categories)


                categories.tweet = await airtableFunc.createTweet(categories.tweet,members.author,base)


              ////console.log("categories - findCategories_all = ",categories)


                categories = await airtableFunc.createOrUpdateCategories(categories,categories.tweet.airtableID,base,'Skills',members)



              //console.log("categories 3.53 = ",categories)


                categories = await airtableFunc.createOrUpdateCategories(categories,categories.tweet.airtableID,base,'Projects',members)


                // console.log("categories 4 = ",categories)




              //console.log("members 102= " , members)

                // if (!['!map','!index','!project'].includes(command)){
                //   // console.log("yea include 2= " )
                // }
                members = await airtableFunc.createOrUpdateMembers(members,categories,categories.tweet.airtableID,command,base,false,client)


                // console.log("categories 5 = ",members)




                const elasticRes = await  elasticSearch.add(categories.tweet.content,members)

                // console.log("elasticRes = ",elasticRes)


         }

    });
}