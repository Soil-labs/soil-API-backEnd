
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

                const authorID = members.author.discordID

                
                members = await mongoFunc.findMentionUsers(members)
                
                categories = await mongoFunc.findCategories_all(categories)



                // console.log("members - 2= " , members)
                // console.log("categories - 3= " , categories)

                
                if ( message.channel.type.toUpperCase() != 'DM'){
                    tweetF.deleteLastMessage(message)
                }


                if ( message.channel.type.toUpperCase() == 'DM' && members.mentionUsers.length==0 && message.content.indexOf('@')!=-1){
                  
                    await sentMessage.sentEmbed("#233423","",
                        "🆘 I can’t find the person you’ve tagged. It’s probably because you’re typing in the DM’s. 🆘 \n\n\n 🌱 In order for me to see who you’re tagging - you need to write the command & tag them in any public channel. Don\’t worry, we delete the message straight away so nobody will see what you’re writing, except for them! 🌱",members.author.discordID,client,Discord)
  
                    return 
                }


                categories = await airtableFunc.createOrUpdateCategories(categories,categories.tweet.airtableID,base,'Projects')

                
              //console.log("categories - 3= " , categories)

                

                let skill_all_text = ""
                let project_all_text = ""
                

                if (message.content.length == triggerText.length){
                    members.author.skills.forEach((skill,idx)=>{
                        if (idx>0)
                            skill_all_text = skill_all_text + ","+skill
                        else
                            skill_all_text = skill

                    })

                    members.author.projects.forEach((project,idx)=>{
                        if (idx>0)
                            project_all_text = project_all_text + ","+project
                        else
                            project_all_text = project

                    })   
                } 

                
                let link = process.env.REACT_APP_AIRTABLE_UPDATE_PROJECT 
                                        +"?prefill_Parent+Record+ID="+categories.projects[0].airtableID
                                        +"&prefill_Project+Name="+categories.projects[0].content
                                        +"&hide_Parent+Record+ID=true"


                if (categories.projects[0].title)
                    link = link +"&prefill_Title="+ categories.projects[0].title.replaceAll(" ","+")
                if (categories.projects[0].description)
                    link = link +"&prefill_Description="+ categories.projects[0].description.replaceAll(" ","+")
                if (categories.projects[0].skills)
                    link = link +"&prefill_Skills="+ categories.projects[0].skills
                if (categories.projects[0].champion)
                    link = link +"&prefill_Champion="+ categories.projects[0].champion
                if (categories.projects[0].members)
                    link = link +"&prefill_Members="+ categories.projects[0].members
                

                    // +"&prefill_Title="+categories.projects[0].title.replaceAll(" ","+")
                    // +"&prefill_Description="+categories.projects[0].description.replaceAll(" ","+")
                    // +"&prefill_Skills="+categories.projects[0].skills
                    // +"&prefill_Champion="+categories.projects[0].champion
                    // +"&prefill_Members="+categories.projects[0].members
                

                await sentMessage.sentEmbed("#112111", "🖥 Time to Update a Project, cant wait to see what you will come up with 🖥 \n\n Click the link to Update 👇",
                            link,authorID,client,Discord)

                
                return 

                

  

         }

    });
}