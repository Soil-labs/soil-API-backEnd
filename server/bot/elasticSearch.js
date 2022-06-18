const clientElastic = require("../elastic_config")
const sentMessage = require("../commandAPI/sentMessage");
// const airtableFunc = require("../bot/airtableFunc");
const mongoFunc = require("./mongoFunc");


async function add(content,members) {

    // console.log("content,members = ",content,members)


    talkingFor = []
    members.mentionUsers.forEach(member =>{
        talkingFor.push(`@${member.discordName}`)
    })
    
  // console.log("member name= ",talkingFor)
    
    // --------------- ElasticSearch -----------------
    const res = await clientElastic.index({
        index: process.env.REACT_APP_ELASTIC_SEARCH_INDEX,
        body: {
            content: content,
            createdBy: `<@${members.author.discordID}>`,
            createdByName: `@${members.author.discordName}`,
            talkingFor: talkingFor,
            registeredAt: new Date()
        }
    })
    // --------------- ElasticSearch ----------------

    return (res)
}


async function search(messageToSearch,author,client,Discord,airtableFunc) {


    const numbersEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];

    // console.log("content,members = ",content,members)

//console.log("messageToSearch = ",messageToSearch)

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
            
            // console.log("res._source. = ",res._source)
            if (res._source.talkingFor){
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
            }
        })



      // console.log("result klk= ",dict,result.hits.hits)

        let feildSave = {
            airtableID: author.airtableID,
            // phase: author.discussion.phase,
            // topic: author.discussion.topic,
            discussExtraData: footerTextUserResults,
        }
      ////console.log("feildSave - serach elastic = " , feildSave)
        changeDiscussionMember(feildSave)


        sentMessage.sentEmbed('#555555',`Users that match your search`,`!search ${messageToSearch}`,
                            author.discordID,client,Discord,footerTextUserResults,numbersEmoji.slice(0,talkingForTable.length))


                            
    })

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


async function search_showResults(messageToSearch,command,splitDescription,authorID,client,Discord) {


    const numbersEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];


    // ------------- All Users can React --------------------

    allUsersReact = []
    splitDescription.forEach(res => {
        if (res.indexOf('@')>-1){
            allUsersReact.push(res)
        }
    })

  // console.log("allUsersReact = ",allUsersReact)
    // ------------- All Users can React --------------------


  //////console.log("messageToSearch,command,splitDescription,authorID = " , messageToSearch,command,splitDescription,authorID)


    // ------------- Find the Emoji ------------------
    userIDreact = allUsersReact[parseInt(command)-1]
    // userIDreact = ""
    // numbersEmoji.forEach((emoji,idx) => {

    //     if (emoji === reaction.emoji.name){
    //         userIDreact = allUsersReact[idx]
    //     }
    // })
    // ------------- Find the Emoji ------------------

  //////console.log("userIDreact lklk = " , allUsersReact,userIDreact )


    // allUsersReact[command]

    // ------------------- Elastic Search ------------------------
    clientElastic.search({
        index: process.env.REACT_APP_ELASTIC_SEARCH_INDEX,
        body: {
        query: {
            bool: {
                must: [
                    // { match: { "fields.type": args.fields.searchQuery } },
                    // { match: { "tags.type": args.fields.searchQuery } },
                    { match: { "talkingFor": userIDreact } },
                    // { match: { "talkingFor": "@niko" } },
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

      //////console.log("allTweets = " , allTweets)

      // console.log("allTweets = ",allTweets)

        const messageEmbed = {
            color: '#999999',
            title: `Search Results  - ` + messageToSearch,
            description: '',
            react: [],
            // footer:'asdf222',
            fields: allTweets
        }

      //////console.log("messageEmbed = " , messageEmbed)


        sentMessage.sentEmbedNew(messageEmbed,authorID,client,Discord)

        
        // let embed = new Discord.MessageEmbed()
        //     .setColor(messageEmbed.color)
        //     .setTitle(messageEmbed.title)
        //     .addFields(allTweets)

        // user.send({embed: embed})
    }).catch(e=>{
      //////console.log("this is the error = ",e)
      })
    // ------------------- Elastic Search ------------------------

}



module.exports = {add,search,search_showResults};
