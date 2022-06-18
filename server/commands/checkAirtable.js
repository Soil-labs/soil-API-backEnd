
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
            const command = NLP.isMessageTriggerCommand(message.content,['!checkAirtable'])
            if (command){

                
                airtableFunc.checkAirtableNewFormRows(base)

                // const res = await airTable.findAsync('Updates',base)


                // let members

                // let temp
                // res.forEach(record => {

                //     members = {
                //         author: {},
                //         mentionUsers: []
                //     }

                //     temp = {}
                //     temp = {
                //         discordID: record.fields['ID'],
                //         discordName: record.fields['discord Name'],
                //         airtableID: record.fields['Parent Record ID'], 
                //     }
                //     if (record.fields['Skills']){
                //         temp = {
                //             ...temp,
                //             skills: record.fields['Skills']
                //         }
                //     }
                //     if (record.fields['Projects']){
                //         temp = {
                //             ...temp,
                //             projects: record.fields['Projects']
                //         }
                //     }

                //     members.mentionUsers.push(temp)

                    

                //     airtableFunc.createOrUpdateMembers_Form(members,base)


                    
                // })

                // airtable.deleteAsync("Updates",'asfasf',base)

                



         }

    });
}