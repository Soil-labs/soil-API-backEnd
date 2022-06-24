const airTable = require("./airTable");
const mongoFunc = require("./mongoFunc_sub");



async function createTweet(categories,members) {


    // ------------- Create Tweet -------------
    let resultsTweet = await airTable.createTweetAsync(categories,members) 
    // ------------- Create Tweet -------------
    
    categories.tweet = {
        airtableID: resultsTweet.id,
        tagName: resultsTweet.fields.Content,
        members: resultsTweet.fields.Members,
        skills: resultsTweet.fields.Skills,
        projects: resultsTweet.fields?.Projects,
    }
    mongoFunc.addTweet(categories.tweet,members.author)



    // If the members skills or porjects are updted then we need to make this update also on the other database places 



    return (categories.tweet)
}


async function createMember(member) {

    fields = {
        "Discord Name": member.discordName,
        "ID": member.discordID,
    }


    res = await airTable.createCategoriesAsync(fields,'Members')


    return res._rawJson.id

}

async function updateCategory(field,category="Skills") {


    fields = {
        "Name": field?.tagName,
        "Discord Name": field?.discordName,
        "ID": field?.discordID,
        "Members": field?.members,
        "Skills": field?.skills,
        "Projects": field?.projects
    }


    res = await airTable.updateCategoriesAsync(field.airtableID,fields,category)


    return { 
        airtableID: res._rawJson.id,
        ...res._rawJson.fields,

    }

}

async function createCategory(field,category="Skills",members,categories,updateCategoryFlag) {


    // if (updateCategoryFlag===true){

    //     // TODO: Write the function to also read what exist inside the field already and add it there not create it from scratch 
    //     field.membersAirID = []
    //     field.membersAirID = members.mentionUsers.map(member =>{
    //         return member.airtableID
    //     })

    //     field.skillsAirID = []
    //     field.skillsAirID = categories.skills.map(skill =>{
    //         return skill.airtableID
    //     })

    //     field.projectsAirID = []
    //     field.projectsAirID = categories.projects.map(skill =>{
    //         return skill.airtableID
    //     })
    // }


    fields = {
        "Name": field?.tagName,
        "Discord Name": field?.discordName,
        "ID": field?.discordID,
        // "Members": field?.membersAirID,
        // "Skills": field?.skillsAirID,
        // "Projects": field?.projectsAirID 
    }


    res = await airTable.createCategoriesAsync(fields,category)


    return { 
        airtableID: res._rawJson.id,
        ...res._rawJson.fields,

    }

}




module.exports = {createMember,createCategory,createTweet,updateCategory};