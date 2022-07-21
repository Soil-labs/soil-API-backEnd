

const { findMember,findMembers,matchMembersToUser,matchMembersToSkills } = require("./query/memberQuery");
const { findSkill,findSkills,waitingToAproveSkills,adminFindAllSkillsEveryState } = require("./query/skillsQuery");

const {findProject,findProjects,findProjects_RequireSkill,findProjects_RecommendedToUser} = require("./query/projectQuery");

const {findRoleTemplate,findRoleTemplates} = require("./query/roleTemplateQuery");
const {findSkillCategory,findSkillCategories} = require("./query/skillCategoryQuery");


const { errors } = require("./query/errorQuery");


module.exports = {
  Query: {

    // ------------- DEV-ONLY QUERY ----------------
    errors,


    // ------------- PROJECT QUERY -----------------
    findProject,findProjects,findProjects_RequireSkill,findProjects_RecommendedToUser,

    // ------------- MEMBER QUERY -----------------
    findMember,findMembers,matchMembersToUser,matchMembersToSkills,

    // ------------- SKILL QUERY -----------------
    findSkill,findSkills,waitingToAproveSkills,adminFindAllSkillsEveryState,

    // ------------- ROLE TEMPLATE QUERY -----------------
    findRoleTemplate,findRoleTemplates,

    // ------------- SKILL CATEGORY QUERY -----------------
    findSkillCategory,findSkillCategories,

  },
};
