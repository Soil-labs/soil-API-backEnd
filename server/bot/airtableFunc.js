const airTable = require("./airTable");
const mongoFunc_sub = require("./mongoFunc_sub");



async function createTweet(categories,members) {


    // ------------- Create Tweet -------------
    let resultsTweet = await airTable.createTweetAsync(categories,members) 
    // ------------- Create Tweet -------------

    tweet = {
        ...tweet,
        airtableID: resultsTweet.id
    }

    mongoFunc_sub.addTweet(tweet,author)

    return (tweet)
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