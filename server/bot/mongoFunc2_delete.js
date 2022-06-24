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

async function findCreateUpdateCategory(field,category="Members",members,categories,airtable=false,updateCategoryFlag=true) {

    let res

    if (category=="Members"){
        if (!airtable)
            res = await Members.findOne({ discordID: field.discordID })
        else
            res = await Members.findOne({ airtableID: field.airtableID })
    } else if (category=="Skills"){
        if (!airtable)
            res = await Skills.findOne({ tagName: field.tagName })
        else
            res = await Skills.findOne({ airtableID: field.airtableID })
    } else if (category=="Projects"){
        if (!airtable)
            res = await Projects.findOne({ tagName: field.tagName })
        else
            res = await Projects.findOne({ airtableID: field.airtableID })
    }



    if (res){ // The mongo DB exist 

      //console.log("res 0 mfsd= " , field)
      //console.log("res 0 mfsd= " , category)
      //console.log("res 0 mfsd= " , res)


        field = {
            ...field,
            airtableID: res?.airtableID,discordName: res?.discordName,
            discordID: res?.discordID,tweets: res?.tweets,
            discordAvatar: res?.discordAvatar,
            tagName: res?.tagName,

        }
        if (res.skills){field = {...field,skills: res?.skills,}}
        if (res.Members){field = {...field,members: res?.Members,}}
        if (res.projects){field = {...field,projects: res?.projects,}}


      //console.log("field  - inside res= " , field)
      //console.log("updateCategoryFlag  - inside res= " , updateCategoryFlag)
        

        if (res.airtableID && updateCategoryFlag){

            // console.log("category = " , category,!(category==="Members"))
            if (!(category==="Members")){
                // console.log("change = ")
                field.members = []
                field.members = members.mentionUsers.map(member =>{
                    return member.airtableID
                })
              //console.log("field.members = " , field.members)
            }

            if (!(category==="Skills")){
                field.skills = []
                field.skills = categories.skills.map(skill =>{
                    return skill.airtableID
                })
            }

            if (!(category==="Projects")){
                field.projects = []
                field.projects = categories.projects.map(skill =>{
                    return skill.airtableID
                })
            }

            // console.log("members.mentionUsers  - Inside updateCategoryFlag= " , members.mentionUsers)
        //console.log("field  - Inside updateCategoryFlag= " , field)

            // airtableData = await airtableFunc.createCategory(field,category,members,categories,updateCategoryFlag)  
            airtableData = await airtableFunc.updateCategory(field,category)  

        //console.log("change 33333 = " ,airtableData)

            field = {
                ...field,
                airtableID: airtableData.airtableID,
            }
            if (airtableData.Members){field = {...field,members: airtableData?.Members,}}
            if (airtableData.Skills){field = {...field,skills: airtableData?.Skills,}}
            if (airtableData.Projects){field = {...field,projects: airtableData?.Projects,}}
    
        //console.log("field  - before update Mongo= " , field)
            
            field = updateCategory(field,category)

        } else if (!res.airtableID){
            airtableData = await airtableFunc.createCategory(field,category,members,categories,updateCategoryFlag)  


          //console.log("change 2222 = " )

            field = {
                ...field,
                airtableID: airtableData.airtableID,
            }
            

    
            field = updateCategory(field,category)

        }
        
    } else { // mongoDB dont exist for this entry and we need to create new one
        airtableData = await airtableFunc.createCategory(field,category,members,categories,updateCategoryFlag)  

      //console.log("airtableData = " , airtableData)

        field = {...field,airtableID: airtableData?.airtableID,}

        if (airtableData.Members){field = {...field,members: airtableData?.Members,}}
        if (airtableData.Skills){field = {...field,skills: airtableData?.Skills,}}
        if (airtableData.Projects){field = {...field,projects: airtableData?.Projects,}}

      //console.log("field = " , field)

        field = await addCategory(field,category)

      //console.log("field - after mongo = " , field)

    }

    

    

    return (field)
}


async function findMentionUsers(members,airtable=false,categories) {


    members.author =  await findCreateUpdateCategory(members.author,"Members",members,categories,airtable,false)


    let user
    for (let i=0;i<members.mentionUsers.length;i++) {

        user = members.mentionUsers[i]
        
        if (members.author.discordID === user.discordID){ // If this process already happen for the Author you just get the results 
            members.mentionUsers[i] = members.author
        } else{
            members.mentionUsers[i] =  await findCreateUpdateCategory(user,"Members",members,categories,airtable,false)
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
            airtableID: fields.airtableID,
            tagName: fields.tagName,

            registeredAt: new Date(),
        });
    }
    else if (category=="Projects"){
        newMember = await new Projects({
            airtableID: fields.airtableID,
            tagName: fields.tagName,

            registeredAt: new Date(),
        });
    }
    else if (category=="Members"){
        newMember = await new Members({
            airtableID: fields.airtableID,
            discordName: fields.discordName,
            discordID: fields.discordID,
            discussion: fields.discussion,
            phase: fields.phase,

            registeredAt: new Date(),
        });
    }

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


async function findCategories_all(categories,airtable=false,members) {


    for (let i=0;i<categories.skills.length;i++) {

        // categories.skills[i] = await findCategory(categories.skills[i],"Skills")
        categories.skills[i] = await findCreateUpdateCategory(categories.skills[i],"Skills",members,categories,airtable,true)

    }

    // for (let i=0;i<categories.projects.length;i++) {

    //     categories.projects[i] =  await findCategory(categories.projects[i],"Projects")

    // }

    return (categories)
        
}





module.exports = {findMentionUsers,updateCategory,addCategory,updateMember,addMember,
                    findCategories_all,findCreateUpdateCategory};