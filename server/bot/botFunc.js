const { discussion } = require("../Discussions/discussion");
// const { discussion } = require("../Discussions/discussion_all_reaction");
// const { discussion } = require("../Discussions/discussion_all_N");
const airtableFunc = require("./airtableFunc");
const elasticSearch = require("../bot/elasticSearch");
const mongoFunc = require("./mongoFunc");

// const { sentMessage } = require("../commandAPI/sentMessage");



function deleteLastMessage(message) {


    if ( message.channel.type.toUpperCase() !== 'DM'){ // if I am not inside the DMs
        
        message.channel.messages.fetch({limit: 1}).then(messages => {
            message.channel.bulkDelete(messages)
        })
    }
}


function SentDM_responed(tweet,command,members,client,Discord,base,sentMessage){
//console.log("discussion_all.descussion = ",members)

    let member
    let authorExist = false
    for (var i = 0; i <=members.mentionUsers.length; i++){
        if (i === members.mentionUsers.length){
            if (authorExist===false)
                member = members.author 
            else
                break
        } else 
            member = members.mentionUsers[i]


          // console.log("IDX - member = ",i,member)

        if (member.discordName === members.author.discordName )
            authorExist = true
            
        const phase = member.phase


      //console.log("member.discussion = ",member.discussion)
        if (member.discussion === "general"){
            if (discussion.general[command]){

                let discussionNow = {...discussion.general[command].output}

                discussionNow = {
                    ...discussionNow,
                    title: discussionNow.title.replace('@','@'+members.author.discordName),
                    description: discussionNow.description.replace('@',tweet),
                }

              //console.log("discussionNow = " , discussionNow)

                sentMessage.sentEmbedNew(discussionNow,member.discordID,client,Discord)
            }
        } else if (member.discussion === "tutorial"){

            if (discussion.tutorial[phase]){

                if (discussion.tutorial[phase].output){

                    let discussionNow = {...discussion.tutorial[phase].output}

                    discussionNow = {
                        ...discussionNow,
                        title: discussionNow.title.replace('@','@'+member.discordName),
                        description: discussionNow.description.replace('#',tweet).replace('@','@'+members.author.discordName),
                    }

                    sentMessage.sentEmbedNew(discussionNow,member.discordID,client,Discord)


                    // airtableFunc.changeDiscussionMember(member,"tutorial",discussion.tutorial[phase].nextPhase.phase,base)
                    // member.phase = discussion.tutorial[phase].nextPhase.phase

                } else {

                  // console.log("command = ",member,phase,command)
                    const discussionN = discussion.tutorial[phase][command]

                  // console.log("discussion.tutorial[phase][command] = ",discussionN)
                    // console.log("discussion.tutorial[phase][command].output = ",discussion.tutorial[phase][command].output)
                    if (discussion.tutorial[phase][command] && discussion.tutorial[phase][command].output){

                        // const discussionN = discussion.tutorial[phase][command]
                        let discussionNow = {...discussionN.output}
    
                        discussionNow = {
                            ...discussionNow,
                            title: discussionNow.title.replace('@','@'+member.discordName),
                            description: discussionNow.description.replace('#',tweet).replace('@','@'+members.author.discordName),
                        }
    
                        sentMessage.sentEmbedNew(discussionNow,member.discordID,client,Discord)
    
    
                        let discussion = "tutorial"
                        if (discussionN.nextPhase.discussion)
                            discussion = discussionN.nextPhase.discussion

                        // airtableFunc.changeDiscussionMember(member,discussion,discussionN.nextPhase.phase,base)
                        // member.phase = discussionN.nextPhase.phase
    
                    }

                }

                
            }
        }



    }
}



async function changeDiscussionMember(feildSave) {

    if (feildSave.airtableID){

        let fieldsMongo = {
            airtableID:feildSave.airtableID,
            registeredAt: new Date()
        }

        if (feildSave.topic){
            fieldsMongo = {
                ...fieldsMongo,
                discussion:{
                    ...fieldsMongo.discussion,
                    topic: feildSave.topic,

                },
                
            }
        }
        if (typeof feildSave.phase === 'number'){
            fieldsMongo = {
                ...fieldsMongo,
                discussion:{
                    ...fieldsMongo.discussion,
                    phase: feildSave.phase,
                },
                
            }
        }

        if (feildSave.authorName){
            fieldsMongo = {
                ...fieldsMongo,
                discussion:{
                    ...fieldsMongo.discussion,
                    authorName: feildSave.authorName,
                    command: feildSave.command,
                    tweet: feildSave.tweet,
                }
            }
        }

        if (feildSave.discussExtraData){
            fieldsMongo = {
                ...fieldsMongo,
                discussExtraData: feildSave.discussExtraData,
                
            }
        }


        
        newCategory = await mongoFunc.updateCategories(fieldsMongo,'Members')


    } 

}


async function SentDM_responed_discussion(tweet,command,members,client,Discord,base,sentMessage,topic=false,link=false){



    let topicN = topic

    let member
    let authorExist = false
    for (var i = 0; i <=members.mentionUsers.length; i++){

        // ----------------- Find Member ---------------
        // Find the Member that will sent the Discussion message
        if (i === members.mentionUsers.length){
            if (authorExist===false)
                member = members.author 
            else
                break
        } else 
            member = members.mentionUsers[i]

        if (member.discordName === members.author.discordName )
            authorExist = true

      //console.log("member = ",i,member)
        // ----------------- Find Member ---------------


        // ----------------- Initial Variables -----------------
        let authorName= members.author.discordName
        let myName= member.discordName


        let discussionVariables = {
            phase: member.discussion.phase,
            topic: member.discussion.topic,

            myName,
            
            sentMessageID: member.discordID,
            
        }


        if (topicN){
            discussionVariables = {
                ...discussionVariables,
                topic: topicN,
                phase: 0,
            }
        }

        if (link){
            discussionVariables = {
                ...discussionVariables,
                link,
            }
        }

        // if (member.discussion.authorName){
        //     discussionVariables = {
        //         ...discussionVariables,
        //         authorName: member.discussion.authorName,
        //         command,

        //         tweet: member.discussion.tweet,

        //         skillProject_only: replace_deleteCommands(tweet,authorName,myName)
        //     }
        // } else {
          //console.log("tweet - botFun = " , tweet)
        discussionVariables = {
            ...discussionVariables,
            authorName,
            command,

            tweet,

            skillProject_only: replace_deleteCommands(tweet,authorName,myName)
        }
        // }

      //////console.log("discussionVariables = ",discussionVariables)

        // console.log("discussionVariables.skillProject_only = ",discussionVariables.skillProject_only)

        // console.log("discussionVariables = " , discussionVariables)
        
        let discussion = discussionPhaseNew(discussionVariables)

      //console.log("discussion = ",discussion)


       
        // ----------------- Initial Variables -----------------


        if (discussion){


            // console.log("embers.mentionUsers.length  = " , i===members.mentionUsers.length , discussion.runFunctions , !discussion.runFunctions.authorAcceptMessageSent,!(i===0))
            // console.log("embers.mentionUsers.length 2  = " , i===members.mentionUsers.length && (discussion.runFunctions && !discussion.runFunctions.authorAcceptMessageSent), i===members.mentionUsers.length && !(i===0))

            // if (i===members.mentionUsers.length && ((discussion.runFunctions && !discussion.runFunctions.authorAcceptMessageSent) || !(i===0) )){
            //     return members
            // }

            const isAuthor = i===members.mentionUsers.length

            const onlyAuthor = i===0


            // console.log("bollean calc = " ,i, isAuthor ,onlyAuthor,authorAcceptMessage)
            // console.log("bollean calc  2 = " , isAuthor && onlyAuthor ,isAuthor && authorAcceptMessage)
            // console.log("bollean calc  3 = " , (isAuthor && onlyAuthor) || (isAuthor && authorAcceptMessage) )
            // console.log("bollean calc  4 = " , ( (isAuthor && onlyAuthor) || !(isAuthor && authorAcceptMessage)  ) )

            //  if (  ( (isAuthor && onlyAuthor) || !(isAuthor && authorAcceptMessage)  ) ){
            //     return members
            // }


          //console.log("bollean calc = " ,i, isAuthor ,onlyAuthor,)
          //console.log("bollean calc  2 = " , isAuthor && !onlyAuthor )
            // console.log("bollean calc  3 = " , (isAuthor && onlyAuthor) || (isAuthor && authorAcceptMessage) )
            // console.log("bollean calc  4 = " , ( (isAuthor && onlyAuthor) || !(isAuthor && authorAcceptMessage)  ) )

             if (  (isAuthor && !onlyAuthor) ){
                return members
            }



            if (discussion.runFunctions && discussion.runFunctions.saveInitialData){
                    
                discussionVariables = {
                    ...discussionVariables,
                    tweet,
                }
    
            }

            if (discussion.output && !discussion.runFunctions.dontShowOutput_mainArea){

              //console.log("discussionVariables = " , discussionVariables)
            
                discussionSentMessage = discussion_prepareMessage(discussion,discussionVariables)

                // console.log("katsinga = " )

                if (discussion.runFunctions.showAvatar){
                    
                    let user = await client.users.fetch(members.author.discordID)

                    const avatarUrl = user.displayAvatarURL()
                    const authorName = '@' + members.author.discordName

                  //console.log("avatarUrl 1= " , )
                //console.log("avatarUrl 2= " , avatarUrl,authorName)
                  //console.log("avatarUrl 3= " , )

                    discussionSentMessage = {
                        ...discussionSentMessage,
                        avatarUrl: avatarUrl,
                        authorName: authorName,
                    }
                    
                  //console.log("change = 1" )

                    sentMessage.sentEmbedNew(discussionSentMessage,discussionVariables.sentMessageID,client,Discord,showAvatar=true)
                }else {
                    sentMessage.sentEmbedNew(discussionSentMessage,discussionVariables.sentMessageID,client,Discord)
                }
            }


          //console.log("change = 2" )


            // ----------------- Action --------------------------------
            let topic
            if (discussion.nextPhase.topic){
                topic = discussion.nextPhase.topic
              ////console.log("topic  discuss 1= " , topic )
            }
            else{ 
                topic = discussionVariables.topic
              ////console.log("topic  discuss 2= " , topic )
            }


            let phase
            if (typeof discussion.nextPhase.phase === 'number'){
                phase = discussion.nextPhase.phase
              ////console.log("phase  discuss 1= " , phase )
            }
            else{ 
                phase = discussionVariables.phase
              ////console.log("phase  discuss 2= " , phase )
            }



            let feildSave = {
                airtableID: member.airtableID,
                topic,
                phase,
            }


            if (discussion.runFunctions.saveInitialData){

                
                feildSave = {
                    ...feildSave,
                    authorName: discussionVariables.authorName,
                    command: discussionVariables.command,
                    tweet: discussionVariables.tweet,
                }
              ////console.log("feildSave - saveInitialData = " , feildSave)

            } else {
                feildSave = {
                    ...feildSave,
                    authorName: member.discussion.authorName,
                    command: member.discussion.command,
                    tweet: member.discussion.tweet,
                }
            }

          //console.log("change = 3" )
            

            changeDiscussionMember(feildSave)

            
            if (discussion.runFunctions && discussion.runFunctions["airtableFilteredSearch"]){


                skills_all = replace_deleteCommands(members.author.discussion.tweet,member.discussion.authorName).replace(" ","").replace(" ","").replace(" ","")

              ////console.log("members.author.discussion.tweet -botF = " , members.author.discussion.tweet )
                // console.log("skills_all -botF = " , skills_all )

                // console.log("categories.skills = " , categories.skills)
                // categories.skills.forEach((skil,idx)=>{
                //     if (idx>0)
                //         skills_all = skills_all + ","+skil.content
                //     else
                //         skills_all = skil.content

                //     // if (skills_all.includes(skil)===false)
                //     //     skills_all.push(skil)

                // })
          //console.log("change = 4" )


                const link = process.env.REACT_APP_AIRTABLE_MEMBERS + "?filter_Skills="+skills_all


                await sentMessage.sentEmbed(discussion.output.color,discussion.output.title,
                    link,members.author.discordID,client,Discord)
            }

          //console.log("change = 5" )


            if (discussion.runFunctions && discussion.runFunctions["elasticSearch_tweet"]){
            // console.log("2 is working",replace_deleteCommands(discussionVariables.tweet))

                

              //console.log("discussionVariables.tweet = " , discussionVariables.tweet)


                await elasticSearch.search(replace_deleteCommands(discussionVariables.tweet),members.author,client,Discord,airtableFunc)

                
            }
          //console.log("change = 5" )

            if (discussion.runFunctions && discussion.runFunctions["elasticSearch_showResults"]){

            // console.log("TOGAAA = ",message )
                // console.log("members = ",members)
                // console.log("categories = ",categories)
                // console.log("reaction.emoji.name = ",reaction.emoji.name)

                //   const discuss = botFunc.discussionPhase('search',reaction.emoji.name)
                
                // console.log("messageContent = ",messageContent)
                // console.log("reaction.message.embeds[0].footer = ",reaction.message.embeds[0].footer)

                // await elasticSearch.search_showResults(replace_deleteCommands(members.author.discussion.tweet),
                // command,message.embeds[0].footer.text.split(" "),members.author.discordID,client,Discord)


                // console.log("replace_deleteCommands(members.author.discussion.tweet) = " , replace_deleteCommands(members.author.discussion.tweet))
                // console.log("command = " , command)
                // console.log("member.discussExtraData.split = " , member.discussExtraData.split(" "))
              //////console.log("member elasticSearch_showResults = " , member)

                if (member.discussExtraData){
                    await elasticSearch.search_showResults(replace_deleteCommands(members.author.discussion.tweet,member.discussion.authorName),
                        command,member.discussExtraData.split(" "),members.author.discordID,client,Discord)
                }




                

            }
          //console.log("change = 7" )


        }

        // ----------------- Action --------------------------------

    }

    return members

}

function discussion_prepareMessage(discussion,discussionVariables){


//console.log("discussion - discussion_prepareMessage= " , discussion)
//console.log("discussionVariables - discussion_prepareMessage= " , discussionVariables)

    let discussionNow = {...discussion.output}

    discussionNow = {
        ...discussionNow,
        title: replace_NameAndCommand(discussionNow.title,discussionVariables),
        description: replace_NameAndCommand(discussionNow.description,discussionVariables),
    }

    return discussionNow

}

function replace_NameAndCommand(text,discussionVariables){
    

    text = text.replace('@AUTHOR',"@"+discussionVariables.authorName)
    text = text.replace('@ME',"@"+discussionVariables.myName)
    text = text.replace('@SKILL',discussionVariables.skillProject_only)
    text = text.replace('@PROJECT',discussionVariables.skillProject_only)
    text = text.replace('@PROJECT',discussionVariables.skillProject_only)
    text = text.replace('@TWEET',discussionVariables.tweet)
    if (discussionVariables.link)
        text = text.replace('@LINK',discussionVariables.link)
    // text = text.replace('@TWEET',discussionVariables.command)

    return text

}

function replace_deleteCommands(text,authorName=false,myName=false){
    
    const commands = ['!skill','!project','!map','!index','!search']

    for (let i=0;i<commands.length;i++){
        text = text.replace(commands[i],"")
    }

    if (authorName)
        text = text.replace("@"+authorName,"")
    if (myName)
        text = text.replace("@"+myName,"")

    // console.log(",authorName,myName = ",authorName,myName)



    return text

}



function discussionPhase(topic,command,phase="0"){
    

    // console.log("topic = ",topic)
    // console.log("command = ",command)
  
      if (topic === "general" || topic === "search")
          return discussion[topic][command]
      else if (topic === "tutorial"){
        // console.log("topic,phase,command = ",topic,phase,command)
        // console.log("discussion[topic] = ",discussion[topic])
        // console.log("discussion[topic] = ",discussion[topic][phase])
        // console.log("discussion[topic] = ",discussion[topic][phase][command])
          return discussion[topic][phase][command]
      }
}


function discussionPhaseNew(discussionPhaseNew){


    // console.log("discussionPhaseNew = " , discussionPhaseNew)
    // // console.log("discussion[discussionPhaseNew.topic] = " , discussion[discussionPhaseNew.topic])
    // // console.log("discussion[discussionPhaseNew.topic] = " , discussion[discussionPhaseNew.topic][discussionPhaseNew.phase])
    // // console.log("discussionPhaseNew.phase = " , discussionPhaseNew.phase)
    // // console.log("discussionPhaseNew.command = " , discussionPhaseNew.command)
    // // console.log("discussion[discussionPhaseNew.topic] = " , discussion[discussionPhaseNew.topic][discussionPhaseNew.phase][`${discussionPhaseNew.command}`])
    // // console.log("discussion[discussionPhaseNew.topic] = " , discussion[discussionPhaseNew.topic][discussionPhaseNew.phase]['2'])
    // // console.log("discussion[discussionPhaseNew.topic] = " , discussion[discussionPhaseNew.topic][discussionPhaseNew.phase][1])
    // // console.log("discussion[discussionPhaseNew.topic] = " , discussion[discussionPhaseNew.topic][discussionPhaseNew.phase][2])
    // // console.log("discussion[discussionPhaseNew.topic] = " , discussion[discussionPhaseNew.topic][discussionPhaseNew.phase]["1"])
    // console.log("discussion[discussionPhaseNew.topic] 22= " , discussion[discussionPhaseNew.topic])
    // console.log("discussion[discussionPhaseNew.topic] 22= " , discussion[discussionPhaseNew.topic]['1'])
    // console.log("discussion[discussionPhaseNew.topic] 22= " , discussion[discussionPhaseNew.topic]['1']['1'])
    // console.log("discussion[discussionPhaseNew.topic] 22= " , discussion[discussionPhaseNew.topic]['1']['2'])
    // console.log("discussion[discussionPhaseNew.topic] 22= " , 't'+discussionPhaseNew.command)
    // // console.log("discussion[discussionPhaseNew.topic] 22= " , discussion[discussionPhaseNew.topic]['1']['t'+discussionPhaseNew.command])
    // // console.log("discussion[discussionPhaseNew.topic] 22= " , discussion[discussionPhaseNew.topic]['1']['t'+discussionPhaseNew.command])
    // // console.log("discussion[discussionPhaseNew.topic] = " , discussion[discussionPhaseNew.topic][1][2])
    // // console.log("discussion[discussionPhaseNew.topic] = " , discussion[discussionPhaseNew.topic][1][2])

    // for(var k in discussion[discussionPhaseNew.topic]['1']){
    //   // console.log("k = " , k,k==='t',k=='k')

    //   // console.log("discussion[discussionPhaseNew.topic]['1'][k] = " , discussion[discussionPhaseNew.topic]['1'][k])
    // }
    
    // if (discussion[discussionPhaseNew.topic][discussionPhaseNew.phase]){
        if (discussion[discussionPhaseNew.topic][discussionPhaseNew.phase]["empty"])
            return discussion[discussionPhaseNew.topic][discussionPhaseNew.phase]["empty"]
        else
            return discussion[discussionPhaseNew.topic][discussionPhaseNew.phase][discussionPhaseNew.command]
    // }

}


function SentDM_responedAuthorSearch(tweet,command,members,client,Discord,sentMessage){
    
    let member
    
    member = members.author
    
    discuss = discussionPhase("search",command)

  // console.log("discussion_all.descussion = ",members,discuss)

    if (discuss){

        let discussionOutput = {...discuss.output}

        discussionOutput = {
            ...discussionOutput,
            title: discussionOutput.title,
            description: discussionOutput.description.replace('@',tweet),
        }

        sentMessage.sentEmbedNew(discussionOutput,member.discordID,client,Discord)
    }


}


module.exports = {deleteLastMessage,SentDM_responed,
                    SentDM_responedAuthorSearch,discussionPhase,discussionPhaseNew,SentDM_responed_discussion};