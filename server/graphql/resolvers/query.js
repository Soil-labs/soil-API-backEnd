
const { findTweets } = require("./query/tweetQuery");
const { findMember,findMembers } = require("./query/memberQuery");
const { findSkill,findSkills } = require("./query/skillsQuery");

const {findProject,findProjects} = require("./query/projectQuery");


const { errors } = require("./query/errorQuery");


module.exports = {
  Query: {

    // ------------- DEV-ONLY QUERY ----------------
    errors,


    // ------------- USER QUERY -----------------
    findTweets,
    findMember,findMembers,
    findSkill,findSkills,

    findProject,findProjects,

  },
};
