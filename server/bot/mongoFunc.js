const { Members } = require("../models/membersModel");
const { Skills } = require("../models/skillsModel");
const { Projects } = require("../models/projectsModel");
const { Tweet } = require("../models/tweetsModel");


const airtableFunc = require("./airtableFunc");


async function findMember(member,airtable=false) {

    let res,airtableID_new
    if (!airtable)
        res = await Members.findOne({ discordID: member.discordID })
    else
        res = await Members.findOne({ airtableID: member.airtableID })


    if (res){

        member = {
            ...member,
            airtableID: res.airtableID,discordName: res.discordName,
            discordID: res.discordID,tweets: res.tweets,
            skills: res.skills,projects: res.projects,
            discordAvatar: res.discordAvatar,
        }

        if (!res.airtableID){
            airtableID_new = await airtableFunc.createMember(member)  

            member = {
                ...member,
                airtableID: airtableID_new,
            }
    
            member = updateMember(member)
        }
        
    } else {
        airtableID_new = await airtableFunc.createMember(member)

        member = {
            ...member,
            airtableID: airtableID_new,
        }

        console.log("member - mongoFunc = " , member)

        member = addMember(member)
    }

    

    

    return (member)
}


async function findMentionUsers(members,airtable=false) {


    members.author =  await findMember(members.author,airtable)


    let user
    for (let i=0;i<members.mentionUsers.length;i++) {

        user = members.mentionUsers[i]
        
        if (members.author.discordID === user.discordID){ // If this process already happen for the Author you just get the results 
            members.mentionUsers[i] = members.author
        } else{
            members.mentionUsers[i] =  await findMember(user,airtable)
        }

    }



    return members

        
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

async function addMember(member) {


    let newMember = await new Members({
        airtableID: member.airtableID,

        discordName: member.discordName,
        discordID: member.discordID,
        discussion: member.discussion,
        phase: member.phase,

        registeredAt: new Date(),
    });

    newMember.save();

    return (newMember)
        
}

async function findSkills(field) {

    const res = await Skills.findOne({ content: field.content })

    if (res){
        field = {
            ...field,
            airtableID: res.airtableID,
            tweets: res.tweets,
            members: res.members,
        }
    } 

    return (res)
}

async function findProjects(field) {

    const res = await Projects.findOne({ content: field.content })


    if (res){
        field = {
            ...field,
            airtableID: res.airtableID,
            tweets: res.tweets,
            members: res.members,
            skills: res.skills,
            champion: res.champion,
            title: res.title,
            description: res.description,
        }
    } 

    return (res)
}


async function findCategories_all(categories) {


    for (let i=0;i<categories.skills.length;i++) {

        categories.skills[i] =  await findSkills(categories.skills[i])

    }

    for (let i=0;i<categories.projects.length;i++) {

        categories.projects[i] =  await findProjects(categories.projects[i])


    }

    return (categories)
        
}




module.exports = {findMentionUsers,updateMember,addMember,findCategories_all};