const client = require("../discordBot_config")
const NLP = require("../bot/NLP");
const sentMessage = require("../bot/sentMessage");
const botFunc = require("../bot/botFunc");
const mongoFunc = require("../bot/mongoFunc");



module.exports =  async (commands) => {
    

      let fields
    
 
      client.on('message', async (message) => {
            

            const command = NLP.isMessageTriggerCommand(message.content,commands)


            if (!command) return 
            

            results = NLP.splitCommandAndMention(message.content,message.mentions.users.first(10),message.author)

            let members = results.members
            let categories = results.categories


            if ( message.channel.type.toUpperCase().toUpperCase() != 'DM'){

                  botFunc.deleteLastMessage(message)
            }

              

            if ( message.channel.type.toUpperCase() == 'DM' && members.mentionUsers.length==0 && message.content.indexOf('@')!=-1){
                  fields = {
                        color:"#233423",
                        title:"",
                        description:"🆘 I can’t find the person you’ve tagged. It’s probably because you’re typing in the DM’s. 🆘 \n\n\n 🌱 In order for me to see who you’re tagging - you need to write the command & tag them in any public channel. Don’t worry, we delete the message straight away so nobody will see what you’re writing, except for them! 🌱",
                  }

                  await sentMessage.sentEmbed(fields,members.author.discordID)

                  return 
            }

            console.log("members = " , members)


            members = await mongoFunc.findMentionUsers(members,false)


            console.log("members 2 = " , members)


    });
}