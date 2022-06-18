
const mongoFunc = require("../bot/mongoFunc");
const NLP = require("../bot/NLP");
const botFunc = require("../bot/botFunc");


module.exports =  async (client,Discord,base,sentMessage) => {
    

 
      client.on('message', async (message) => {

            

            let results,members,categories
            const command = NLP.isMessageTriggerCommand(message.content,['!help_soil','!error','!tutorial'])
            if (command){

            //console.log("change = ",command )
              

                results = NLP.splitCommandAndMention(message.content,message.mentions.users.first(10),message.author)

                members = results.members
                categories = results.categories



                if ( message.channel.type.toUpperCase() != 'DM'){
                    botFunc.deleteLastMessage(message)
                }


                members = await mongoFunc.findMentionUsers(members)


                const link = process.env.REACT_APP_AIRTABLE_ERROR_FEATURE + 
                          "?prefill_AuthorID="+members.author.discordID+"&prefill_AuthorName=@"+replaceXwithY(members.author.discordName," ","+")+
                          // `&prefill_Skills=${skill_all_text}`+`&prefill_Projects=${project_all_text}`+
                          "&hide_ID=true"+"&hide_AuthorID=true"




                members = await botFunc.SentDM_responed_discussion(categories.tweet.content,command,members,client,Discord,base,sentMessage,false,link)

                

         }

    });
}

function replaceXwithY(message,x,y){
    return message.replace(x,y).replace(x,y).replace(x,y).replace(x,y).replace(x,y)
}