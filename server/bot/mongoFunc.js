const { Members } = require("../models/membersModel");
const { Skills } = require("../models/skillsModel");
const { Projects } = require("../models/projectsModel");
const { Tweet } = require("../models/tweetsModel");


async function findMember(field,airtable=false) {

    let res
    if (!airtable)
        res = await Members.findOne({ discordID: field.discordID })
    else
        res = await Members.findOne({ airtableID: field.airtableID })


    return (res)
}



async function findMentionUsers(members,airtable=false) {


    
    let memberMongo =  await findMember(members.author,airtable)


    if (memberMongo){

        members.author = {
            ...members.author,
            airtableID: memberMongo.airtableID,discordName: memberMongo.discordName,
            discordID: memberMongo.discordID,tweets: memberMongo.tweets,
            skills: memberMongo.skills,projects: memberMongo.projects,
            discordAvatar: memberMongo.discordAvatar,
        }
    }


    let user
    for (let i=0;i<members.mentionUsers.length;i++) {

        user = members.mentionUsers[i]

        let memberMongo =  await findMember(user,airtable)


        if (memberMongo){
            members.mentionUsers[i] = {
                ...members.mentionUsers[i],
                airtableID: memberMongo.airtableID,discordName: memberMongo.discordName,
                discordID: memberMongo.discordID,tweets: memberMongo.tweets,
                skills: memberMongo.skills,projects: memberMongo.projects,
                discordAvatar: memberMongo.discordAvatar,

            }
        } 

    }




    return members

        
}





module.exports = {findMentionUsers};