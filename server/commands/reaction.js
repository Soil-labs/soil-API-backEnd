const clientElastic = require("../elastic_config")
const NLP = require("../bot/NLP");
const mongoFunc = require("../bot/mongoFunc");
const botFunc = require("../bot/botFunc");
const airtableFunc = require("../bot/airtableFunc");
const sentMessage = require("../commandAPI/sentMessage");
const elasticSearch = require("../bot/elasticSearch");



module.exports =  async (client, Discord,base,) => {

    const numbersEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];

    let channel,messageToUser;

     

    client.on('messageReactionAdd', async (reaction,user) => {
        // if (reaction.message.partial) await reaction.message.fetch(); // Because we are working with the partials to await for responces
        // if (reaction.partial) await reaction.fetch();// Because we are working with the partials to await for responces
        if (user.bot) return; // we need to stop the bot from entering this event
        // if (!reaction.message.guild) return; // the reaction is indeed in our server



        // console.log("reaction.message = ",reaction.message)
      // console.log("reaction.message = ",user)

        let members = {
            author: {
                discordID: user.id,
                discordName: user.username,
                discriminator: user.discriminator,
            },
            mentionUsers: []
        }

        members = await mongoFunc.findMentionUsers(members)

      //////console.log("members - messageReactionAdd = " , members)
      //////console.log("reaction - messageReactionAdd = " , reaction.emoji.name)

        
    ////console.log("change  tootkis= " ,)
        
        

        if (members.author.discussion && members.author.discussion.topic === "tutorial"){

            // const discuss = botFunc.discussionPhase(members.author.discussion,reaction.emoji.name,members.author.phase)
            members = await botFunc.SentDM_responed_discussion('',reaction.emoji.name,
                            members,client,Discord,base,sentMessage)



            // console.log("discuss - messageReactionAdd = " , discuss)


        
            // let discussionOutput = {...discuss.output}

            // discussionOutput = {
            //     ...discussionOutput,
            //     // description: discussionOutput.description.replace('@',tweet),
            // }

            // sentMessage.sentEmbedNew(discussionOutput,members.author.discordID,client,Discord)


            // airtableFunc.changeDiscussionMember(members.author,"tutorial",discuss.nextPhase.phase,base)
            // members.author.phase = discuss.nextPhase.phase

            
        } else if (members.author.discussion && members.author.discussion.topic === "search"){


            // console.log("reaction - reac= " , reaction.message.embeds[0])


            members = await botFunc.SentDM_responed_discussion(reaction.message.embeds[0].description,reaction.emoji.name,
                            members,client,Discord,base,sentMessage)
        
            

        }


    })
}