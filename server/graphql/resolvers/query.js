
const { findTweets } = require("./query/tweetQuery");
const { findMember } = require("./query/memberQuery");
const { findSkill,findSkills } = require("./query/skillsQuery");


const { errors } = require("./query/errorQuery");


module.exports = {
  Query: {

    // ------------- DEV-ONLY QUERY ----------------
    errors,


    // ------------- USER QUERY -----------------
    findTweets,
    findMember,
    findSkill,findSkills,

  },
};
