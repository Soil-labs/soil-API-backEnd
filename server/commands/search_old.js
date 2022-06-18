const clientElastic = require("../elastic_config")
const NLP = require("../bot/NLP");


module.exports =  (client, triggerText, replyText,Discord) => {

    const numbersEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];

    let channel,messageToUser;

     client.on('message',message => {
        lengthTriggerText = triggerText.length



        if (NLP.isMessageTriggerCommand(message.content,['!search'])){

            


            const res = NLP.findWordAfterCommand(message.content, '!search',getAllText = true)

            // console.log("res = ",res)

            const messageToSearch = res.searchWord


            // ------------------- Elastic Search ------------------------
            clientElastic.search({
                index: process.env.REACT_APP_ELASTIC_SEARCH_INDEX,
                body: {
                query: {
                    bool: {
                    should: [
                        // { match: { "fields.type": args.fields.searchQuery } },
                        // { match: { "tags.type": args.fields.searchQuery } },
                        // { match: { "email": "m.sara@gmail.com" } },
                        { match: { "content": messageToSearch } },
                    ]
                    }
                }
                }
            }).then(result => {


                talkingForTable = []
                var dict = {};
                // footerTextUserResults = 'accept the user for further info \n\n'
                footerTextUserResults = '\n\n'
                result.hits.hits.forEach((res,idx) => {
                    
                    for (let i=0;i<res._source.talkingFor.length;i++){
                        userName = res._source.talkingFor[i]
                        if (userName in dict){
                            dict[userName] = dict[userName] + 1
                        } else {
                            dict[userName] = 1
                            talkingForTable.push(userName)
                            footerTextUserResults = footerTextUserResults + numbersEmoji[idx] +"  "+ userName + " (" + (res._score).toFixed(2) +") " + '\n\n'
                        }
                    }
                })


              // console.log("result klk= ",dict,result.hits.hits)



                let embed = new Discord.MessageEmbed()
                    .setColor('#555555')
                    .setTitle(`Users that match your search`)
                    // .setDescription(message.content.slice(triggerText.length))
                    .setDescription(footerTextUserResults)
                    .setFooter(`!search ${messageToSearch}`);


                    // message.author.send(replyText);
                    message.author.send({embed: embed})
                    .then((messageEm) => {

                        talkingForTable.forEach((res,idx) => {
                            messageEm.react(numbersEmoji[idx])

                        })

                        // messageEm.react(blueEmoji)

                    })
            })

            // ------------- Delete the Last Message -----------------
            if ( message.channel.type.toUpperCase() !== 'DM'){ // if I am not inside the DMs
                message.channel.messages.fetch({limit: 1}).then(messages => {
                    message.channel.bulkDelete(messages)
                })
            }
            // ------------- Delete the Last Message -----------------

            




        }
    })

    client.on('messageReactionAdd', async (reaction,user) => {
        // if (reaction.message.partial) await reaction.message.fetch(); // Because we are working with the partials to await for responces
        // if (reaction.partial) await reaction.fetch();// Because we are working with the partials to await for responces
        if (user.bot) return; // we need to stop the bot from entering this event
        // if (!reaction.message.guild) return; // the reaction is indeed in our server





        

        // ------------- All Users can React --------------------
        const splitDescription = reaction.message.embeds[0].description.split(" ")
        

        allUsersReact = []
        splitDescription.forEach(res => {
            if (res.indexOf('@')>-1){
                allUsersReact.push(res)
            }
        })
        // ------------- All Users can React --------------------



        // ------------- Find the Emoji ------------------
        userIDreact = ""
        numbersEmoji.forEach((emoji,idx) => {

            if (emoji === reaction.emoji.name){
                userIDreact = allUsersReact[idx]
            }
        })

        // ------------- Find the Emoji ------------------
    

        const member = reaction.message.channel.recipient
        const messageToSave = reaction.message.embeds[0].description
        const userWroteMessage = reaction.message.embeds[0].title.split('@').pop().slice(0,18)
        const userTalkingAbout = reaction.message.embeds[0].description.split('@').pop().slice(0,18)
        let messageToSearch = ""
        if (reaction.message.embeds[0].footer)
            messageToSearch = reaction.message.embeds[0].footer.text.slice(triggerText.length)


        // messageToSearch = messageToSearch + " "+userIDreact
        // messageToSearch = messageToSearch




        // ------------------- Elastic Search ------------------------
        if (reaction.message.embeds[0].color == 5592405){
            clientElastic.search({
                index: process.env.REACT_APP_ELASTIC_SEARCH_INDEX,
                body: {
                query: {
                    bool: {
                    must: [
                        // { match: { "fields.type": args.fields.searchQuery } },
                        // { match: { "tags.type": args.fields.searchQuery } },
                        { match: { "talkingFor": userIDreact } },
                        { match: { "content": messageToSearch } },
                    ]
                    }
                }
                }
            }).then(result => {

                allTweets = []
                result.hits.hits.forEach((res,idx) => {
                    allTweets.push({name: `${idx + 1}. Tweet - Created By: ${ res._source.createdByName} `,value: res._source.content})
                    // allTweets.push({name: `${idx + 1}. Tweet (${(res._score).toFixed(2)})`,value: res._source.content})
                })

                
                let embed = new Discord.MessageEmbed()
                    .setColor('#999999')
                    .setTitle(`Search Results  - ` + messageToSearch)
                    .addFields(allTweets)

                    user.send({embed: embed})
            })
        }
        // ------------------- Elastic Search ------------------------
        

        // if (reaction.message.embeds[0].color == 5592405){ // In every message we have a different color in order to separate them 
        //     client.users.fetch(member.id).then(user => {

        //         if (reaction.emoji.name === yellowEmoji) {

        //                 // --------------- ElasticSearch -----------------
        //                 clientElastic.index({
        //                     index: process.env.REACT_APP_ELASTIC_SEARCH_INDEX,
        //                     body: {
        //                         content: messageToSave,
        //                         createdBy: `<@${userWroteMessage}>`,
        //                         talkingFor: `<@${userTalkingAbout}>`,
        //                         registeredAt: new Date()
        //                     }
        //                 })
        //                 // --------------- ElasticSearch -----------------
        //                 user.send(`If you want to map, you can just write \n\n !map <@${userWroteMessage}> ......... `)
                        
        //             }
        //             if (reaction.emoji.name === blueEmoji) {
        //                 // user.send("no we will not post it ")
        //             }

        //     })
        // }

    })
}