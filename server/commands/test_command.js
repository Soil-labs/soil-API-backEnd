const client = require("../discordBot_config")
const NLP = require("../bot/NLP");


module.exports =  async (commands) => {
    

    
 
      client.on('message', async (message) => {
            

            const command = NLP.isMessageTriggerCommand(message.content,commands)


            if (!command) return 
            

            



    });
}