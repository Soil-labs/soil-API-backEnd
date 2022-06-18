
const clientElastic = require("../elastic_config")
const NLP = require("../bot/NLP");
const mongoFunc = require("../bot/mongoFunc");
const airtableFunc = require("../bot/airtableFunc");
const botFunc = require("../bot/botFunc");



module.exports =  async (client, triggerText,Discord,base,airTable,tweetF,sentMessage) => {
    


 
      client.on('message', async (message) => {


            if (message.content.toLowerCase().slice(0,triggerText.length) === triggerText.toLowerCase()){



                results = NLP.splitCommandAndMention(message.content,message.mentions.users.first(10),message.author)

                members = results.members
                categories = results.categories


              //console.log("members 0= " , members)
              //console.log("categories 0= " , categories)
                
                members = await mongoFunc.findMentionUsers(members)
                categories = await mongoFunc.findCategories_all(categories)

              //console.log("members 1= " , members)
              //console.log("categories 1= " , categories)
                
                const authorID = message.author.id
                
                if ( message.channel.type.toUpperCase() != 'DM'){
                    tweetF.deleteLastMessage(message)
                }


                if ( message.channel.type.toUpperCase() == 'DM' && members.mentionUsers.length==0 && message.content.indexOf('@')!=-1){
                  
                    await sentMessage.sentEmbed("#233423","",
                        "🆘 I can’t find the person you’ve tagged. It’s probably because you’re typing in the DM’s. 🆘 \n\n\n 🌱 In order for me to see who you’re tagging - you need to write the command & tag them in any public channel. Don\’t worry, we delete the message straight away so nobody will see what you’re writing, except for them! 🌱",members.author.discordID,client,Discord)
  
                    return 
                }

                if ( categories.projects[0] && !categories.projects[0].airtableID){
                  
                    await sentMessage.sentEmbed("#233423","",
                        "🆘  Sorry this project Dont exist, please choose another project, that exist 🌱",members.author.discordID,client,Discord)
  
                    return 
                }



                const link = process.env.REACT_APP_SOIL_APP + "user_nft_page/" +categories.projects[0].content
                                            // + "?prefill_Parent+Record+ID="+members.mentionUsers[0].airtableID+
                                            // "&prefill_discord+Name=@"+members.mentionUsers[0].discordName+"&prefill_ID="+members.mentionUsers[0].discordID+
                                            // "&prefill_AuthorID="+members.author.airtableID+"&prefill_AuthorName=@"+members.author.discordName+
                                            // `&prefill_Skills=${skill_all_text}`+`&prefill_Projects=${project_all_text}`
                                            // +"&hide_Parent+Record+ID=true"+"&hide_ID=true"+"&hide_AuthorID=true"

                    // const link = process.env.REACT_APP_AIRTABLE_ONBOARDING + "?prefill_ID="+message.author.id+"&prefill_Discord+Name=@"+message.author.username

                    await sentMessage.sentEmbed("#112111", "🥰 Check out the Digital Garden of your DAO 🥰 \n\n Click the link to start exploring 👇",
                                link,authorID,client,Discord)

                    
                    return 
            //   ////console.log("members - onboarding before = " , members)
                

            //     members = await airtableFunc.createOrUpdateMembers(members,categories,categories.tweet.airtableID,"",base,true)

            //   //console.log("members - onboarding after = " , members)

            //     members = await botFunc.SentDM_responed_discussion(categories.tweet.content,"!endorse",members,client,Discord,base,sentMessage)

                
            //     // console.log("categories - onboarding = " , categories)

            //     // if (members.mentionUsers[0]){

            //     if ( members.mentionUsers[0] && members.mentionUsers[0].airtableID){

            //         let skill_all_text = ""
            //         let project_all_text = ""
                    
            //     //////console.log("change = " )

            //         if (message.content.length == triggerText.length){
            //             members.author.skills.forEach((skill,idx)=>{
            //                 if (idx>0)
            //                     skill_all_text = skill_all_text + ","+skill
            //                 else
            //                     skill_all_text = skill

            //             })

            //             members.author.projects.forEach((project,idx)=>{
            //                 if (idx>0)
            //                     project_all_text = project_all_text + ","+project
            //                 else
            //                     project_all_text = project

            //             })   
            //         } 

            //         // if (message.content.length == triggerText.length){ // we only have the word !skill, so we will sent them to airtable
                    
            //         const link = process.env.REACT_APP_AIRTABLE_ONBOARDING + "?prefill_Parent+Record+ID="+members.mentionUsers[0].airtableID+
            //                                 "&prefill_discord+Name=@"+members.mentionUsers[0].discordName+"&prefill_ID="+members.mentionUsers[0].discordID+
            //                                 "&prefill_AuthorID="+members.author.airtableID+"&prefill_AuthorName=@"+members.author.discordName+
            //                                 `&prefill_Skills=${skill_all_text}`+`&prefill_Projects=${project_all_text}`
            //                                 +"&hide_Parent+Record+ID=true"+"&hide_ID=true"+"&hide_AuthorID=true"

            //         // const link = process.env.REACT_APP_AIRTABLE_ONBOARDING + "?prefill_ID="+message.author.id+"&prefill_Discord+Name=@"+message.author.username

            //         await sentMessage.sentEmbed("#112111", "🥰 Planting seeds for yourself & others is how WAGMI 🥰 \n\n Click the link to endorse 👇",
            //                     link,authorID,client,Discord)

                    
            //         return 
            //         // }

            //     } else if (members.author.airtableID){

            //       //console.log("boukadori = " )

            //         let skill_all_text = ""
            //         let project_all_text = ""
                    

            //         // if (message.content.length == triggerText.length){
            //             members.author.skills.forEach((skill,idx)=>{
            //                 if (idx>0)
            //                     skill_all_text = skill_all_text + ","+skill
            //                 else
            //                     skill_all_text = skill

            //             })

            //             members.author.projects.forEach((project,idx)=>{
            //                 if (idx>0)
            //                     project_all_text = project_all_text + ","+project
            //                 else
            //                     project_all_text = project

            //             })   
            //         // } 

            //         // if (message.content.length == triggerText.length){ // we only have the word !skill, so we will sent them to airtable
                    
            //             const link = process.env.REACT_APP_AIRTABLE_ONBOARDING + "?prefill_Parent+Record+ID="+members.author.airtableID+
            //                                     "&prefill_discord+Name=@"+message.author.username+"&prefill_ID="+members.author.discordID+
            //                                     "&prefill_AuthorID="+members.author.airtableID+"&prefill_AuthorName=@"+members.author.discordName+
            //                                     `&prefill_Skills=${skill_all_text}`+`&prefill_Projects=${project_all_text}`
            //                                     +"&hide_Parent+Record+ID=true"+"&hide_ID=true"+"&hide_AuthorID=true"

            //             // const link = process.env.REACT_APP_AIRTABLE_ONBOARDING + "?prefill_ID="+message.author.id+"&prefill_Discord+Name=@"+message.author.username

            //         await sentMessage.sentEmbed("#112111","🥰 Planting seeds for yourself & others is how WAGMI 🥰 \n\n Click the link to endorse 👇",
            //                         link,authorID,client,Discord)

                        
            //             return 
            //         // }

            //     } else {
            //         if (message.content.length == triggerText.length){ // we only have the word !skill, so we will sent them to airtable

            //             const link = process.env.REACT_APP_AIRTABLE_ONBOARDING + "?prefill_Parent+Record+ID="+"NEW"+
            //                                     "&prefill_discord+Name=@"+message.author.username+"&prefill_ID="+members.author.discordID
            //                                     "&prefill_AuthorID="+members.author.airtableID+"&prefill_AuthorName=@"+members.author.discordName+
            //                                     +"&hide_Parent+Record+ID=true"+"&hide_ID=true"+"&hide_AuthorID=true"

            //             // const link = process.env.REACT_APP_AIRTABLE_ONBOARDING + "?prefill_ID="+message.author.id+"&prefill_Discord+Name=@"+message.author.username

            //             await sentMessage.sentEmbed("#112111","🥰 Planting seeds for yourself & others is how WAGMI 🥰 \n\n Click the link to endorse 👇",
            //                         link,authorID,client,Discord)

                        
            //             return 
            //         }
    
            //     }

                // }
  

         }

    });
}