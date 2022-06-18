const clientElastic = require("../elastic_config")
const NLP = require("../bot/NLP");
const mongoFunc = require("../bot/mongoFunc");
const botFunc = require("../bot/botFunc");
const airtableFunc = require("../bot/airtableFunc");
const sentMessage = require("../commandAPI/sentMessage");
const elasticSearch = require("../bot/elasticSearch");



module.exports =  async (client, triggerText, replyText,Discord,base,) => {

    const numbersEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];

    let channel,messageToUser;

     client.on('message', async (message) => {
        lengthTriggerText = triggerText.length


        const command = NLP.isMessageTriggerCommand(message.content,['!search'])

        
        if (command){

            


            results = NLP.splitCommandAndMention(message.content,message.mentions.users.first(10),message.author)

            members = results.members
            categories = results.categories


          // console.log("members = ",members)
        ////console.log("categories - search= ",categories)

            if ( message.channel.type.toUpperCase() != 'DM'){
                botFunc.deleteLastMessage(message)
            }

            if (members.mentionUsers.length>0 && message.channel.type.toUpperCase() === 'DM'){
                const message = "I am sorry you can only write about you inside the bot, Please go to any channel of our Discord and write the message there"
                sentMessage.sent(message,members.author.id,client)
                return
            }

            // members = await mongoFunc.findMentionUsers(members)

            
            // console.log("members 1= " , members)
            // // console.log("members = ",members)

            // let feildSave = {
            //     airtableID: members.author.airtableID,
            //     topic: members.author.discussion.phase,
            //     phase: members.author.discussion.topic
            // }
    
    
            // if (discussion.runFunctions.saveInitialData){
    
            //     feildSave = {
            //         ...feildSave,
            //         authorName: author.discordName,
            //         command: command,
            //         tweet: message.content,
            //     }
    
            // } 
            // // else {
            // //     feildSave = {
            // //         ...feildSave,
            // //         authorName: member.discussion.authorName,
            // //         command: member.discussion.command,
            // //         tweet: member.discussion.tweet,
            // //     }
            // // }

            // await airtableFunc.changeDiscussionMember(feildSave)
            

            members = await mongoFunc.findMentionUsers(members)


          //////console.log("members - search= " , members)

        //console.log("categories.tweet.content = " , categories.tweet.content)

            // botFunc.SentDM_responedAuthorSearch(categories.tweet.content,command,members,client,Discord,sentMessage)

            members = await botFunc.SentDM_responed_discussion(categories.tweet.content,command,members,client,Discord,base,sentMessage,"search")






        }
    })

    // client.on('messageReactionAdd', async (reaction,user) => {
    //     // if (reaction.message.partial) await reaction.message.fetch(); // Because we are working with the partials to await for responces
    //     // if (reaction.partial) await reaction.fetch();// Because we are working with the partials to await for responces
    //     if (user.bot) return; // we need to stop the bot from entering this event
    //     // if (!reaction.message.guild) return; // the reaction is indeed in our server



    //     const messageContent = reaction.message.embeds[0].description

    //   // console.log("user = ",user,messageContent)

    //     const command = NLP.isMessageTriggerCommand(messageContent,['!search'])

    //     if (command){

    //         results = NLP.splitCommandAndMention(messageContent,[],user)

    //         members = results.members
    //         categories = results.categories

            
    //         members = await mongoFunc.findMentionUsers(members)

    //         let messageSearchNoCommand = messageContent.replace(command,'').replace('!skill','').replace('!project','')


    //         if (members.author.discussion === "search"){
            
    //           // console.log("members = ",members)
    //           // console.log("categories = ",categories)
    //           // console.log("reaction.emoji.name = ",reaction.emoji.name)

    //             const discuss = botFunc.discussionPhase('search',reaction.emoji.name)
                
    //           // console.log("discuss = ",discuss)



    //             if (discuss.runFunctions && discuss.runFunctions["airtableFilteredSearch"]){


    //                 skills_all = ""
    //                 categories.skills.forEach((skil,idx)=>{
    //                     if (idx>0)
    //                         skills_all = skills_all + ","+skil.content
    //                     else
    //                         skills_all = skil.content

    //                     // if (skills_all.includes(skil)===false)
    //                     //     skills_all.push(skil)

    //                 })

    //                 const link = process.env.REACT_APP_AIRTABLE_MEMBERS + "?filter_Skills="+skills_all

    //               // console.log("link = ",link)

    //                 await sentMessage.sentEmbed(discuss.output.color,discuss.output.title,
    //                     link,members.author.discordID,client,Discord)
    //             }

    //             if (discuss.runFunctions && discuss.runFunctions["elasticSearch_tweet"]){
    //               // console.log("2 is working")

    //                 await airtableFunc.changeDiscussionMember(members.author,"search_elastic",0,base)


    //                 await elasticSearch.search(messageSearchNoCommand,members.author,client,Discord)

                    
    //             }
    //         } else if (members.author.discussion === "search_elastic"){

    //           // console.log("members = ",members)
    //           // console.log("categories = ",categories)
    //           // console.log("reaction.emoji.name = ",reaction.emoji.name)

    //             const discuss = botFunc.discussionPhase('search',reaction.emoji.name)
                
    //           // console.log("messageContent = ",messageContent)
    //           // console.log("reaction.message.embeds[0].footer = ",reaction.message.embeds[0].footer)

    //             await elasticSearch.search_showResults(messageSearchNoCommand,reaction,reaction.message.embeds[0].footer.text.split(" "),members.author.discordID,client,Discord)



                

    //         }

    //     }


    // })
}