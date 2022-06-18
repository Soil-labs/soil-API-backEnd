const { Client, CategoryChannel, MessageEmbed } = require("discord.js")


function sent(message,id,client) {


    client.users.fetch(id).then(user => {
                 
        user.send(message)
            .then(res => {
              // console.log("res = ",res)
                return 
            })
            .catch(e=>{
              // console.log("this is the error = ",e)
            })

    })
}

function sentEmbed_ID(messageEmbed,id,client,Discord) {


    client.users.fetch(id).then(user => {
                 
        user.send(message)
            .then(res => {
              // console.log("res = ",res)
                return 
            })
            .catch(e=>{
              // console.log("this is the error = ",e)
            })

    })
}

async function sentEmbedNew(messageEmbed,id,client,Discord,showAvatar=false) {

  
  // console.log("messageEmbed=",messageEmbed)


    let user = await client.users.fetch(id)
          
    let embed

  // console.log("messageEmbed.fields = ",messageEmbed.fields)
    if (messageEmbed.fields){
      // console.log("loko")
        embed = new MessageEmbed()
            .setColor(messageEmbed.color)
            .setTitle(messageEmbed.title)
            .addFields(messageEmbed.fields)

      //console.log("embed 223111= " , embed)
    } else {
      // console.log("poko")

        if (showAvatar){
        //console.log("gazinkga = " ,messageEmbed)
          embed = new Discord.MessageEmbed()
              .setColor(messageEmbed.color)
              .setTitle(messageEmbed.title)
              .setDescription(messageEmbed.description)
              .setFooter(messageEmbed.footer)
              // .setAuthor("sdf","https://i.imgur.com/AfFp7pu.png")
              // .setImage('https://i.imgur.com/AfFp7pu.png')
              .setAuthor(messageEmbed.authorName,messageEmbed.avatarUrl)
              // .setAuthor({ name: 'Some name', iconURL: messageEmbed.avatarURL, url: 'https://discord.js.org' })
              // .setImage(messageEmbed.avatarURL)

            //console.log("embed 223 = " , messageEmbed.authorName.split(' ')[0],messageEmbed.avatarUrl)
            //console.log("embed 223 = " , embed)
        } else {
          embed = new Discord.MessageEmbed()
              .setColor(messageEmbed.color)
              .setTitle(messageEmbed.title)
              .setDescription(messageEmbed.description)
              .setFooter(messageEmbed.footer)
        }
    }

  //console.log("gitf 1 = " , embed)
                
    let messageEm = await user.send({embed: embed})

  //console.log("232 gift boom  = " )
    messageEmbed.react.forEach(reactN=>{
        messageEm.react(reactN)

    })


}


async function sentEmbed(color,title,description,id,client,Discord,footer="",react=[]) {

  
    let user = await client.users.fetch(id)

                    
    let embed = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .setFooter(footer)
        // .setFooter('Do you Accept it \n\n'
        //         + `${yellowEmoji} Yes\n\n`
        //         + `${blueEmoji} No`);

                
    let messageEm = await user.send({embed: embed})

    react.forEach(reactN=>{
        messageEm.react(reactN)

    })
    // messageEm.react(yellowEmoji)
    // messageEm.react(blueEmoji)


}

async function tutorial_mentionedUser(tutorial,resultsMembers,tweet,phaseTutorial,client,Discord) {


    
    // console.log("resultsMembers.mentionUser.id, = ",resultsMembers.mentionUser.id,resultsMembers.author.id)

    const mentionedUser = resultsMembers.mentionUser

    let phaseLearning

    if (resultsMembers.mentionUser.id === resultsMembers.author.id){
      // console.log(" text author ")

        if (phaseTutorial.flagUpdate == true){
            phaseLearning = phaseTutorial.PhaseLearning
        } else {
            phaseLearning = mentionedUser.data['Phase Learning']
        }

        sentMessagesForTutorial(tutorial[phaseLearning],resultsMembers,tweet,mentionedUser,client,Discord)

    } 
    else if (resultsMembers.mentionUser.id != resultsMembers.author.id){
      // console.log(" text Mention ")
        phaseLearning = mentionedUser.data['Phase Learning']
        sentMessagesForTutorial(tutorial[phaseLearning],resultsMembers,tweet,mentionedUser,client,Discord)



        if (phaseTutorial.flagUpdate == true){
          // console.log(" text author ")

            phaseLearning = phaseTutorial.PhaseLearning
            sentMessagesForTutorial(tutorial[phaseLearning],resultsMembers,tweet,resultsMembers.author,client,Discord)
        }
    }



    // if (phaseTutorial.flagUpdate == true){
    //     phaseLearning = phaseTutorial.PhaseLearning
    // } else {
    //     phaseLearning = mentionedUser.data['Phase Learning']
    // }

    // const tutorialPhase = tutorial[phaseLearning]


    // // if author and mentionUser are not the same then we need to sent the messages on both of them 



    // tutorialPhase.messages.forEach(messageN => {

    //     sentEmbed_fromTutorialPhase(tweet,messageN,
    //         resultsMembers.author.data['Discord Name'],
    //         resultsMembers.mentionUser.data['Discord Name'],
    //         mentionedUser.data.ID,client,Discord
    //         )

    // })

    // sentMessagesForTutorial(tutorial[phaseLearning],resultsMembers,tweet,mentionedUser,client,Discord)
                   
}

function sentMessagesForTutorial(tutorialPhase,resultsMembers,tweet,user,client,Discord) {


    tutorialPhase.messages.forEach(messageN => {

        sentEmbed_fromTutorialPhase(tweet,messageN,
            resultsMembers.author.data['Discord Name'],
            resultsMembers.mentionUser.data['Discord Name'],
            user.data.ID,client,Discord
            )

    })
    

                
}


async function tutorial_mentionedUser_old(resultsMembers,tweet,phaseTutorial,client,Discord) {


    

    const mentionedUser = resultsMembers.mentionUser


    let phaseLearning


    if (phaseTutorial.flagUpdate == true){
        phaseLearning = phaseTutorial.PhaseLearning
    } else {
        phaseLearning = mentionedUser.data['Phase Learning']
    }

    const tutorialPhase = tutorial[phaseLearning]


    // if author and mentionUser are not the same then we need to sent the messages on both of them 



    tutorialPhase.messages.forEach(messageN => {

        sentEmbed_fromTutorialPhase(tweet,messageN,
            resultsMembers.author.data['Discord Name'],
            resultsMembers.mentionUser.data['Discord Name'],
            mentionedUser.data.ID,client,Discord
            )

    })
    

                
}

async function sentEmbed_fromTutorialPhase(tweet,message,authorName,mentionUserName,mentionUserID,client,Discord) {


    title = message.title
    title = title.replace('@',authorName)


    description = message.description
    description = description.replace('@',tweet)

    footer = message.footer
    footer = footer.replace('@',mentionUserName)


    let messageEm = await sentEmbed(message.color,
                title,
                description,
                mentionUserID,client,Discord,
                footer,message.react
                )

        
            

                
}



module.exports = {sent,sentEmbed,tutorial_mentionedUser,sentEmbed_ID,sentEmbedNew};