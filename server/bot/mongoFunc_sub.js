const { Members } = require("../models/membersModel");
const { Skills } = require("../models/skillsModel");
const { Projects } = require("../models/projectsModel");
const { Tweet } = require("../models/tweetsModel");


async function addTweet(fields,author) {


    let newTweet = await new Tweet({
        airtableID: fields.airtableID,
        content: fields.content,

        author: author.discordID,

        registeredAt: new Date(),
        });

        newTweet.save();

        return (newTweet)
        
}




module.exports = {addTweet};