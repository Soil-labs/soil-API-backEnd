const airTable = require("./airTable");





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




module.exports = {createMember,createCategory};