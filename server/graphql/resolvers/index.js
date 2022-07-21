const { Query } = require('./query');
const { Mutation } = require('./mutation');
const { Members,matchMembersToUserOutput } = require('./objectResolvers/memberResolver');
const { Project,teamType,roleType,skillRoleType,
    tweetsProject,
    tweetsType,
 } = require('./objectResolvers/projectsResolver');
const { Skills } = require('./objectResolvers/skillsResolver');
const { RoleTemplate } = require('./objectResolvers/roleTemplateResolver');
const { SkillCategory } = require('./objectResolvers/skillCategoryResolver');


module.exports = {
    Query,
    Mutation,
    Members,matchMembersToUserOutput,
    Project,teamType,roleType,skillRoleType,
    tweetsProject,tweetsType,
    Skills,
    RoleTemplate,
    SkillCategory,
}