
const { TrunkContext } = require("twilio/lib/rest/trunking/v1/trunk");
const clientElastic = require("../elastic_config")
const mongoFunc = require("../bot/mongoFunc");
const NLP = require("../bot/NLP");
const botFunc = require("../bot/botFunc");
const airtableFunc = require("../bot/airtableFunc");
const elasticSearch = require("../bot/elasticSearch");



module.exports =  async (client, triggerText,Discord,base,airTable,tweetF,sentMessage,commandF,tutorialText) => {
    

    
      client.on('message', async (message) => {

            
            if (message.channel.type.toUpperCase() === 'DM'){

              
              
              let results,members,categories
              const command = NLP.isMessageDiscussionResponse(message.content,['1','2','3','4','Y','N'])
              if (command){
                
                // console.log("message.content = " , message.content)
                  
                  // botFunc.deleteLastMessage(message)


                  results = NLP.splitCommandAndMention(message.content,message.mentions.users.first(10),message.author)

                  members = results.members
                  categories = results.categories

                // console.log("members = " , members)
                  // console.log("categories = " , categories)

                  members = await mongoFunc.findMentionUsers(members)    

                // console.log("members = " , members)

                  members = await botFunc.SentDM_responed_discussion(categories.tweet.content,command,members,client,Discord,base,sentMessage)



                  

              


          }
        }

    });
}