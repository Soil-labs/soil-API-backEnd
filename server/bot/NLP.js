
const commands = [{
        command: "!skill",
        name: "skills",
        symbol: "*"
    }, {
        command: "!project",
        name: "projects",
        symbol: "^"
    } , {
        command: "!update_project",
        name: "projects",
        symbol: "$"
    }, {
        command: "!search",
        name: "projects",
        symbol: "$"
    }
]

function isMessageTriggerCommand (message,triggerText){

  // console.log("message,triggerText = ",message,triggerText)

    if (!message) return false
    let command = false

    for (let i=0;i<triggerText.length;i++){
        trigger = triggerText[i]
        if (message.toLowerCase().slice(0,trigger.length) === trigger.toLowerCase()){
            command = trigger
            return command
        }
    }
    return command
}

function isMessageDiscussionResponse (message,triggerText){

    // console.log("message,triggerText = ",message,triggerText)
  
      if (!message) return false
      let command = false
  
      for (let i=0;i<triggerText.length;i++){
          trigger = triggerText[i]
          if (message.toLowerCase() === trigger.toLowerCase()){
              command = trigger
              return command
          }
      }
      return command
  }


function deleteSpaceStart(message){

    while( message.indexOf(' ')==0 && message.length>0){
        message = message.slice(1,message.length);
        // console.log("message slice!! =",message,message.indexOf(' '))
    }
    return message
}

function findWordAfterCommand(message,command,getAllText = false){

    
    position = message.indexOf(command)
    if (position === -1) return (-1)


    let searchWord = message.substring(position + command.length, message.length);
    searchWord = deleteSpaceStart(searchWord)



    let endIndex
    if (getAllText === false){
        if (searchWord.indexOf(' ')===-1){
            endIndex = searchWord.length
        } else {
            endIndex = searchWord.indexOf(' ')
        }
    } else {
        endIndex = searchWord.length
    }

    res = {
        searchWord: searchWord.substring(0,endIndex),
        newMessage: searchWord.substring(searchWord.indexOf(' '),searchWord.length),
    }

    return res
    
}

function findWordAfterSymbol(message,command){

    if (message.indexOf(command)===-1 ) return -1
    const position = message.indexOf(command)
    let searchWord = message.substring(message.indexOf(command) + 1);


    if (searchWord.indexOf(' ')>0)
        searchWord = searchWord.substring(0,searchWord.indexOf(' '));
    else
        searchWord = searchWord.substring(0,searchWord.length);


    if (searchWord == message)
        return -1



    res = {
        searchWord,
        newMessage: message.substring(position + searchWord.length + 1,message.length),
    }

    return res
    
}

function splitCommandAndMention (message,mentions,author){

    

    let newMessage = message
    let displayMessage = message

    let members = {
        author: {
            discordID: author.id,
            discordName: author.username,
            airtableID: undefined, 
            tweets: [],
            skills: [],
            projects: [],
            discussion:{
                topic: "tutorial",
                phase: 0,
            },
            discriminator: author.discriminator,
        },
        mentionUsers: []
    }


    // -------------- Find members ------------
    mentions.forEach(mention=>{

        newMessage = newMessage.replace(`<@${mention.id}>`,'') // delete the mentions from the message
        displayMessage = displayMessage.replace(`<@${mention.id}>`,'@'+mention.username) // delete the mentions from the message
        

        members.mentionUsers.push({
            discordID: mention.id,
            discordName: mention.username,
            airtableID: undefined, 
            tweets: [],
            skills: [],
            projects: [],
            discussion:{
                topic: "tutorial",
                phase: 0,
            },
            discriminator: mention.discriminator,
        })
    })
    // -------------- Find members ------------


    let categories = {
        skills: [],
        projects: [],
        tweet: {
            content: displayMessage,
            airtableID: undefined, 
            members: [],
        },
    }



    // --------- Find Commands ---------------
  ////console.log("commands - NLP = " , commands)

    let searchWord,newMessageCommands
    commands.forEach(res => { 

        // console.log("res=",res)

        newMessageCommands = newMessage
        
        while (newMessageCommands.indexOf(res.command)!=-1){

          ////console.log("res.command - NLP = " , res.command)

            resSear_newMes = findWordAfterCommand(newMessageCommands,res.command)

            searchWord = resSear_newMes.searchWord
            newMessageCommands = resSear_newMes.newMessage



            categories[`${res.name}`].push({
                content: searchWord,
                airtableID: undefined, 
                members: [],
                tweets: [],
            })


            // console.log("res = ",res,"searchWord = ",searchWord,"newMessageCommands = ",newMessageCommands,"categories = ",categories)

        }

        newMessageCommands = newMessage
        
        while (newMessageCommands.indexOf(res.symbol)!=-1){


            resSear_newMes = findWordAfterSymbol(newMessageCommands,res.symbol)

            searchWord = resSear_newMes.searchWord
            newMessageCommands = resSear_newMes.newMessage

            categories[`${res.name}`].push({
                content: searchWord,
                airtableID: undefined, 
                members: [],
                tweets: [],
            })

        }
    })
    // --------- Find Commands ---------------





    return {
        members,
        categories
    }


}


module.exports = {isMessageTriggerCommand,splitCommandAndMention,
                findWordAfterCommand,isMessageDiscussionResponse};