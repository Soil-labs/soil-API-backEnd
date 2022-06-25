const { Members } = require("../models/membersModel");
const { Skills } = require("../models/skillsModel");
const { Projects } = require("../models/projectsModel");
const { Tweet } = require("../models/tweetsModel");


const airtableFunc = require("./airtableFunc");

const client = require("../discordBot_config");
const e = require("express");


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

        if (res.airtableID){

            // TODO:

        } else if (!res.airtableID){
            airtableID_new = await airtableFunc.createMember(member)  

            member = {
                ...member,
                airtableID: airtableID_new,
            }
    
            member = updateCategory(member,"Members")
        }
        
    } else {
        airtableID_new = await airtableFunc.createMember(member)

        member = {
            ...member,
            airtableID: airtableID_new,
        }

        // console.log("member - mongoFunc = " , member)

        member = addMember(member)
    }

    

    

    return (member)
}

async function findCreateUpdateCategory(field,category="Members") {

    let res

    if (category=="Members"){
        res = await Members.findOne({ discordName: field.discordName })

        // console.log("res = " , res)
        if (!res){
            let user = await client.users.fetch(field.discordID)

            const discordAvatar = user.displayAvatarURL()

            // console.log("discordAvatar = " , discordAvatar)

            field = {
                ...field,
                discordAvatar,
            }
        }

    } else if (category=="Skills"){
        res = await Skills.findOne({ tagName: field.tagName })
    } else if (category=="Projects"){
        res = await Projects.findOne({ tagName: field.tagName })
    }

    // console.log("res = " , field.discordName,res)


    if (!res) { // mongoDB dont exist for this entry and we need to create new one

        // console.log("field - !res = " , field)
        res = await addCategory(field,category)

    } 

    


    // field = {
    //     ...field,
    //     _id: res._id
    // }

    

    

    return (res)
}



async function findMentionUsers(members) {


    members.author =  await findCreateUpdateCategory(members.author,"Members")


    let user
    for (let i=0;i<members.mentionUsers.length;i++) {

        user = members.mentionUsers[i]
        
        if (members.author.discordID === user.discordID){ // If this process already happen for the Author you just get the results 
            members.mentionUsers[i] = members.author
        } else{
          //console.log("change = -000---- " )
            members.mentionUsers[i] =  await findCreateUpdateCategory(user,"Members")
        }

    }



    return members

        
}

async function updateCategory(field,category="Skills") {

    let res
    if (category=="Skills"){
        res = await Skills.findOneAndUpdate(
            {tagName: field.tagName},
            {$set: field},
            {new: true}
        )
    }
    else if (category=="Projects"){
        res = await Projects.findOneAndUpdate(
            {tagName: field.tagName},
            {$set: field},
            {new: true}
        )
    } else if (category=="Members"){
        res = await Members.findOneAndUpdate(
            {discordID: field.discordID},
            {$set: field},
            {new: true}
        )
    }

  //console.log("field - updateCategory = " , field)
  //console.log("res - updateCategory = " , res)
  //console.log("category - updateCategory = " , category)

    if (res.airtableID){field = {...field,airtableID: res?.airtableID,}}
    if (res.tweets){field = {...field,tweets: res?.tweets,}}
    if (res.members){field = {...field,members: res?.members,}}
    if (res.discordName){field = {...field,discordName: res?.discordName,}}
    if (res.discordID){field = {...field,discordID: res?.discordID,}}
    if (res.skills){field = {...field,skills: res?.skills,}}
    if (res.discordAvatar){field = {...field,discordAvatar: res?.discordAvatar,}}


    return (field)     
}

async function addCategory(fields,category="Skills") {


    let newMember

    if (category=="Skills"){
        newMember = await new Skills({
            tagName: fields.tagName,
            registeredAt: new Date(),
        });
    }
    else if (category=="Projects"){
        newMember = await new Projects({
            tagName: fields.tagName,
            registeredAt: new Date(),
        });
    }
    else if (category=="Members"){
        newMember = await new Members({
            discordName: fields.discordName,
            discordID: fields.discordID,
            discussion: fields.discussion,
            discordAvatar: fields.discordAvatar,

            registeredAt: new Date(),
        });
    }

// //console.log("newMember = " , newMember)

    // console.log("newMember -------= " , newMember,category)

    newMember.save();

    return (newMember)
        
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
        discordName: res.discordName,
        discordID: res.discordID,tweets: res.tweets,
        skills: res.skills,projects: res.projects,
        discordAvatar: res.discordAvatar,
    }

    return (member)     
}

async function addMember(member) {


    let newMember = await new Members({

        discordName: member.discordName,
        discordID: member.discordID,
        discussion: member.discussion,
        phase: member.phase,

        registeredAt: new Date(),
    });

    newMember.save();

    return (newMember)
        
}

async function findCategory(field,category="Skills") {

    let res
    if (category=="Skills")
        res = await Skills.findOne({ tagName: field.tagName })
    else if (category=="Projects")
        res = await Projects.findOne({ tagName: field.tagName })

    if (res){
        field = {
            ...field,
            airtableID: res.airtableID,
            tweets: res.tweets,
            members: res.members,
        }
        if (!res.airtableID){
            airtableID_new = await airtableFunc.createCategory(field,category) 

            field = {
                ...field,
                airtableID: airtableID_new,
            }

            field = updateCategory(field,category)
        }
    } 
    else {
        airtableID_new = await airtableFunc.createCategory(field,category) 
        
        field = {
            ...field,
            airtableID: airtableID_new,
        }

        field = addCategory(field,category)
    }

    

    return (field)
}

async function findProjects(field) {

    const res = await Projects.findOne({ tagName: field.tagName })


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
        categories.skills[i] = await findCreateUpdateCategory(categories.skills[i],"Skills")

    }

    for (let i=0;i<categories.projects.length;i++) {

        categories.projects[i] =  await findCreateUpdateCategory(categories.projects[i],"Projects")

    }

    return (categories)
        
}

async function updateMembers_Skills(members,categories) {


    let member
    for (let i=0;i<categories.skills.length;i++) {

        for (let j=0;j<members.mentionUsers.length;j++) {

            member = members.mentionUsers[j]
            
           
            update_member_skill(categories.skills[i],member,members.author)

        }

    }

        
}

async function update_member_skill(skill,member,author) {


    // let skillsMember = member.skills

    let newSkils


    let skillExist = true
    let makeAnUpdate = false

    // console.log("member.skills = " , member.skills)
    const updatedSkills = member.skills.map(skillMem=>{
        if (skillMem.id.equals(skill._id)===true){
            skillExist = false

            if (!skillMem.authors.includes(author._id)){
                makeAnUpdate = true

                skillMem.authors.push(author._id)

                return skillMem
            } else {
                return skillMem
            }
        } else {
            return skillMem
        }
    })

    // console.log("updatedSkills = " , makeAnUpdate,updatedSkills)

  //console.log("skill = " , skill)

    let updateMembers = skill.members
    if (skillExist === true){
        makeAnUpdate = true
        updatedSkills.push({
            id: skill._id, 
            authors: [author._id]
        })
        updateMembers.push(member._id)
    }

    // console.log("updatedSkills = " , makeAnUpdate,updatedSkills)


    if (makeAnUpdate){
        newSkills= await Members.findOneAndUpdate(
            {_id: member._id},
            {
                $set: {
                    skills: updatedSkills
                }
            },
            {new: true}
        )
        newSkills= await Skills.findOneAndUpdate(
            {_id: skill._id},
            {
                $set: {
                    members: updateMembers
                }
            },
            {new: true}
        )
        // console.log("newSkills 22= " , newSkills)
        // console.log("newSkills 22= " , newSkills.skills[0].authors)
    }

    


    // newSkills= await Members.findOneAndUpdate(
    //     {airtableID: fields.airtableID},
    //     {
    //         $set: fields
    //     },
    //     {new: true}
    // )


    // return (categories)
        
}





module.exports = {findMentionUsers,updateCategory,addCategory,updateMember,addMember,
                    findCategories_all,findCreateUpdateCategory,updateMembers_Skills};