
const clientElastic = require("../elastic_config")



module.exports =  async (client, triggerText,Discord,base,airTable,tweetF,sentMessage) => {
    

     const yellowEmoji = '✅';
     const blueEmoji = '❌';

 
      client.on('message', async (message) => {


            if (message.content.toLowerCase().slice(0,triggerText.length) === triggerText.toLowerCase()){

                const authorID = message.author.id

                if ( message.channel.type.toUpperCase() != 'DM'){
                    tweetF.deleteLastMessage(message)
                }

                if (message.content.length == triggerText.length){ // we only have the word !skill, so we will sent them to airtable


                    await sentMessage.sentEmbed("#112111","Here’s an overview of everything that’s growing across the DAO. 🌺🎋🌱",
                            process.env.REACT_APP_AIRTABLE_FULL_ACCESS ,authorID,client,Discord)
                    return 
                }
  

         }

    });
}