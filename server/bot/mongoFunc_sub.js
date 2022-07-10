const { Members } = require("../models/membersModel");
const { Skills } = require("../models/skillsModel");
const { Projects } = require("../models/projectsModel");
// const { Tweet } = require("../models/tweetsModel");


async function addTweet(fields,author) {


    // let newTweet = await new Tweet({
    //     airtableID: fields.airtableID,
    //     tagName: fields.tagName,
    //     members: fields.members,
    //     skills: fields.skills,



    //     author: author.discordID,

    //     registeredAt: new Date(),
    //     });

    //     newTweet.save();

    //     return (newTweet)
        
}

async function updateCategory(field,category="Skills") {

    let res
    if (category=="Skills"){
        res = await Skills.findOneAndUpdate(
            {tagName: field.tagName},
            {
                $set: field
            },
            {new: true}
        )
    }
    else if (category=="Projects"){
        res = await Projects.findOneAndUpdate(
            {tagName: field.tagName},
            {
                $set: field
            },
            {new: true}
        )
    }

    field = {
        ...field,
        airtableID: res?.airtableID,
        tweets: res?.tweets,
        members: res?.members,
    }

    return (field)     
}  

async function updateMember(member) {
    let res = await Members.findOneAndUpdate(
        {discordID: member.discordID},
        {
            $set: member
        },
        {new: true}
    )


    member = {
        ...member,
        airtableID: res.airtableID,discordName: res.discordName,
        discordID: res.discordID,tweets: res.tweets,
        skills: res.skills,projects: res.projects,
        discordAvatar: res.discordAvatar,
    }

    return (member)     
}




module.exports = {addTweet,updateCategory,updateMember};