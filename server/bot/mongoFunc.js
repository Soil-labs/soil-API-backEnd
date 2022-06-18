const { Members } = require("../models/membersModel");
const { Skills } = require("../models/skillsModel");
const { Projects } = require("../models/projectsModel");
const { Tweet } = require("../models/tweetsModel");


async function addMember(fields) {


    let newMember = await new Members({
        airtableID: fields.airtableID,

        discordName: fields.discordName,
        discordID: fields.discordID,
        discussion: fields.discussion,
        phase: fields.phase,

        // tutorial: fields.tutorial,

        // tweets: fields.tweets,
        // skills: fields.skills,
        // projects: fields.projects,

        registeredAt: new Date(),
        });

        newMember.save();

        return (newMember)
        
}


async function addTweet(fields) {


    let newTweet = await new Tweet({
        airtableID: fields.airtableID,
        content: fields.content,
        

        // skills: fields.skills,
        // projects: fields.projects,

        author: fields.author,

        registeredAt: new Date(),
        });

        newTweet.save();

        return (newTweet)
        
}

async function addCategories(fields,category) {

    let newSkills


    if (category==='Members'){
        newSkills= await new Members(fields);

        newSkills.save();

        return (newSkills)
    }

    const feildInput = {
        airtableID: fields.airtableID,
        content: fields.content,
        

        tweets: fields.tweets,
        members: fields.members,

        registeredAt: new Date(),
    }

    if (category==='Skills'){
        newSkills= await new Skills(feildInput);
    } else if (category==='Projects'){
        newSkills= await new Projects(feildInput);
    } 



    

    newSkills.save();

    return (newSkills)
        
}

async function updateCategories(fields,category) {

    let newSkills


    if (category==='Members'){
        newSkills= await Members.findOneAndUpdate(
            {airtableID: fields.airtableID},
            {
                $set: fields
            },
            {new: true}
        )
        // newSkills.save();

        // console.log("newSkills 22 = ",newSkills)

        return (newSkills)
    }


    // const feildInput = {
    //     airtableID: fields.airtableID,
    //     content: fields.content,
        

    //     tweets: fields.tweets,
    //     members: fields.members,

    //     registeredAt: new Date(),
    // }

    fields = {
        ...fields,
        registeredAt: new Date(),

    }


    if (category==='Skills'){
        newSkills= await Skills.findOneAndUpdate(
            {airtableID: fields.airtableID},
            {
                $set: fields
            },
            {new: true}
        )
    } else if (category==='Projects'){
      //console.log("tzatsiki = " ,)
        newSkills= await Projects.findOneAndUpdate(
            {airtableID: fields.airtableID},
            {
                $set: fields
            },
            {new: true}
        )
    }

    newSkills.save();

    return (newSkills)
        
}

async function findMember(discordID) {

    const res = await Members.findOne({ discordID: discordID })

    return (res)
}

async function findMember_AirtableID(airtableID) {

    const res = await Members.findOne({ airtableID: airtableID })
    
    // console.log("res = " , res)

    return (res)
}

async function findSkills(content) {

    const res = await Skills.findOne({ content: content })

    return (res)
}

async function findProjects(content) {

    const res = await Projects.findOne({ content: content })

    return (res)
}

async function findProjects_matchSkills(skills) {

    // const res = await Projects.find({ skills: skills[0] })
    const res = await Projects.find({
        skills: {
           $in: skills,
        },
     })

    // console.log("skills = " , skills,res)

    return (res)
}

async function findMember_all(mentionUsers,airtable=false) {


    let user
    for (let i=0;i<mentionUsers.length;i++) {

        user = mentionUsers[i]
        if (airtable){
            memberMongo =  await findMember_AirtableID(user.airtableID)
        }else {
            memberMongo =  await findMember(user.discordID)
        }


        if (memberMongo){
            mentionUsers[i] = {
                ...mentionUsers[i],
                airtableID: memberMongo.airtableID,
                discordName: memberMongo.discordName,
                discordID: memberMongo.discordID,
                tweets: memberMongo.tweets,
                skills: memberMongo.skills,
                projects: memberMongo.projects,
                phase: memberMongo.phase,
                discussion: memberMongo.discussion,
                discussExtraData: memberMongo.discussExtraData,
              discordAvatar: memberMongo.discordAvatar,

            }
        } 

    }

    return (mentionUsers)
        
}


async function findCategories_all(categories) {


    // console.log("categories = ",categories)

    for (let i=0;i<categories.skills.length;i++) {

        skillMongo =  await findSkills(categories.skills[i].content)

        if (skillMongo){
            categories.skills[i] = {
                ...categories.skills[i],
                airtableID: skillMongo.airtableID,
                tweets: skillMongo.tweets,
                members: skillMongo.members,
            }
        } 

    }


    for (let i=0;i<categories.projects.length;i++) {

        skillMongo =  await findProjects(categories.projects[i].content)

      //console.log("skillMongo = " , skillMongo)

        if (skillMongo){
            categories.projects[i] = {
                ...categories.projects[i],
                airtableID: skillMongo.airtableID,
                tweets: skillMongo.tweets,
                members: skillMongo.members,
                skills: skillMongo.skills,
                champion: skillMongo.champion,
                title: skillMongo.title,
                description: skillMongo.description,
            }
        } 

    }

    return (categories)
        
}





async function addSkill(fields) {


    let newMember = await new Members({
        airtableID: fields.airtableID,

        discordName: fields.discordName,
        discordID: fields.discordID,

        // tutorial: fields.tutorial,

        // tweets: fields.tweets,
        // skills: fields.skills,
        // projects: fields.projects,

        registeredAt: new Date(),
        });

        newMember.save();

        return (newMember)
        
}

async function findMentionUsers(members,airtable=false) {



    let memberMongo
    
    // memberMongo = await findMember(members.author.discordID)

    if (airtable){
        memberMongo =  await findMember_AirtableID(members.author.airtableID)
    }else {
        memberMongo =  await findMember(members.author.discordID)
    }

  //console.log("memberMongo - mongoFunc = " , memberMongo)


    if (memberMongo){

        members.author = {
            ...members.author,
            airtableID: memberMongo.airtableID,
            discordName: memberMongo.discordName,
            discordID: memberMongo.discordID,
            tweets: memberMongo.tweets,
            skills: memberMongo.skills,
            projects: memberMongo.projects,
            phase: memberMongo.phase,
            discussion: memberMongo.discussion,
            discussExtraData: memberMongo.discussExtraData,
            discordAvatar: memberMongo.discordAvatar,
        }
    }

    members.mentionUsers = await findMember_all(members.mentionUsers,airtable)



    return members

        
}





module.exports = {addMember,findMember,
                    addSkill,findMentionUsers,findCategories_all,
                    addTweet,addCategories,updateCategories,findProjects_matchSkills};