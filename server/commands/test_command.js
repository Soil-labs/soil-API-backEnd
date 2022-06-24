const client = require("../discordBot_config")
const NLP = require("../bot/NLP");
const sentMessage = require("../bot/sentMessage");
const botFunc = require("../bot/botFunc");
const mongoFunc = require("../bot/mongoFunc");
const airtableFunc = require("../bot/airtableFunc");



module.exports =  async (commands) => {
    

      let fields
    
 
      client.on('message', async (message) => {

            

            const command = NLP.isMessageTriggerCommand(message.content,commands)

          //console.log("command = ",message.content )
          //console.log("command = ",command )

            if (!command) return 
            


            results = NLP.splitCommandAndMention(message.content,message.mentions.users.first(10),message.author)

            let members = results.members
            let categories = results.categories

          //console.log("members = ",members )


            if ( message.channel.type.toUpperCase().toUpperCase() != 'DM'){

                  botFunc.deleteLastMessage(message)
            }

              

            if ( message.channel.type.toUpperCase() == 'DM' && members.mentionUsers.length==0 && message.tagName.indexOf('@')!=-1){
                  fields = {
                        color:"#233423",
                        title:"",
                        description:"🆘 I can’t find the person you’ve tagged. It’s probably because you’re typing in the DM’s. 🆘 \n\n\n 🌱 In order for me to see who you’re tagging - you need to write the command & tag them in any public channel. Don’t worry, we delete the message straight away so nobody will see what you’re writing, except for them! 🌱",
                  }

                  await sentMessage.sentEmbed(fields,members.author.discordID)

                  return 
            }




            members = await mongoFunc.findMentionUsers(members)

            console.log("members = " , members)


            categories = await mongoFunc.findCategories_all(categories)

            console.log("categories = " , categories)

            mongoFunc.updateMembers_Skills(members,categories)





          //console.log("categories - After - 2-2 = " , categories)

            // // console.log("mongoFunc - test_command = " , mongoFunc)

            // categories.tweet = await airtableFunc.createTweet(categories,members)

            // // console.log("mongoFunc - test_command - After = " , mongoFunc)



    });
}