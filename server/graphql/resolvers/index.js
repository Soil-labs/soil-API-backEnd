const { Query } = require('./query');
const { Mutation } = require('./mutation');
const { Members,matchMembersToUserOutput,matchMembersToSkillOutput } = require('./objectResolvers/memberResolver');
const { Project,teamType,roleType,skillRoleType,
    tweetsProject,
    tweetsType,Team,
 } = require('./objectResolvers/projectsResolver');
const { Skills } = require('./objectResolvers/skillsResolver');
const { RoleTemplate } = require('./objectResolvers/roleTemplateResolver');
const { SkillCategory } = require('./objectResolvers/skillCategoryResolver');
const { ProjectUpdate } = require('./objectResolvers/projectUpdateResolver');


module.exports = {
    Query,
    Mutation,
    Members,matchMembersToUserOutput,matchMembersToSkillOutput,
    Project,teamType,roleType,skillRoleType,
    tweetsProject,tweetsType,Team,
    Skills,
    RoleTemplate,
    SkillCategory,
    ProjectUpdate,
}