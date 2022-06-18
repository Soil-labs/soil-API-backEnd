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


    if (res){

        field = {
            ...field,
            airtableID: res.airtableID,discordName: res.discordName,
            discordID: res.discordID,tweets: res.tweets,
            skills: res.skills,projects: res.projects,
            discordAvatar: res.discordAvatar,
        }
    }

    return (field)
}


async function findMentionUsers(members,airtable=false) {


    members.author =  await findMember(members.author,airtable)



    let user
    for (let i=0;i<members.mentionUsers.length;i++) {

        user = members.mentionUsers[i]
        
        members.mentionUsers[i] =  await findMember(user,airtable)

    }




    return members

        
}





module.exports = {findMentionUsers};