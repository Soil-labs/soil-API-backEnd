

const { findMember,findMembers,matchMembersToUser,matchMembersToSkills } = require("./query/memberQuery");
const { findSkill,findSkills,waitingToAproveSkills,adminFindAllSkillsEveryState,skills_autocomplete } = require("./query/skillsQuery");

const {findProject,findProjects,findProjects_RequireSkill,findProjects_RecommendedToUser,match_projectToUser,findTeams,findRoles} = require("./query/projectQuery");
const {findProjectUpdates,findAllProjectsTeamsAnouncments,findGarden} = require("./query/projectUpdateQuery");


const {findRoleTemplate,findRoleTemplates} = require("./query/roleTemplateQuery");
const {findServers} = require("./query/serverQuery");
const {findRoom} = require("./query/roomQuery");
const {findSkillCategory,findSkillCategories} = require("./query/skillCategoryQuery");
const {findSkillSubCategory,findSkillSubCategories} = require("./query/skillSubCategoryQuery");


const { errors } = require("./query/errorQuery");


module.exports = {
  Query: {

    // ------------- DEV-ONLY QUERY ----------------
    errors,


    // ------------- PROJECT QUERY -----------------
    findProject,findProjects,findProjects_RequireSkill,findProjects_RecommendedToUser,match_projectToUser,findTeams,findRoles,

    // ------------- MEMBER QUERY -----------------
    findMember,findMembers,matchMembersToUser,matchMembersToSkills,

    // ------------- SKILL QUERY -----------------
    findSkill,findSkills,waitingToAproveSkills,adminFindAllSkillsEveryState,

    skills_autocomplete,

    // ------------- ROLE TEMPLATE QUERY -----------------
    findRoleTemplate,findRoleTemplates,

    // ------------- SERVER TEMPLATE QUERY -----------------
    findServers,

    // ------------- ROOM TEMPLATE QUERY -----------------
    findRoom,


    // ------------- SKILL CATEGORY QUERY -----------------
    findSkillCategory,findSkillCategories,

    // ------------- SKILL SUB CATEGORY QUERY -----------------
    findSkillSubCategory,findSkillSubCategories,


    // ------------- PROJECT UPDATE QUERY -----------------
    findProjectUpdates,findAllProjectsTeamsAnouncments,findGarden,

  },
};
