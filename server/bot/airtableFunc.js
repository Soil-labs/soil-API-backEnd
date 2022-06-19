const airTable = require("./airTable");





async function createMember(member) {



    fields = {
        "Discord Name": member.discordName,
        "ID": member.discordID,
    }


    newSkillID = await airTable.createCategoriesAsync(fields,'Members')


    return newSkillID._rawJson.id

}




module.exports = {createMember};