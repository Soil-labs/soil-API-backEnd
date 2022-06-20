const airTable = require("./airTable");
const mongoFunc = require("./mongoFunc_sub");



async function createTweet(categories,members) {


    // ------------- Create Tweet -------------
    let resultsTweet = await airTable.createTweetAsync(categories,members) 
    // ------------- Create Tweet -------------
    
    categories.tweet = {
        airtableID: resultsTweet.id,
        content: resultsTweet.fields.Content,
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

async function createCategory(skill,category="Skills") {

    fields = {
        "Name": skill.content,
    }


    res = await airTable.createCategoriesAsync(fields,category)


    return res._rawJson.id

}




module.exports = {createMember,createCategory,createTweet};