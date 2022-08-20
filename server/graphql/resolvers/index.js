const { Query } = require('./query');
const { Mutation } = require('./mutation');
const { Members,matchMembersToUserOutput,matchMembersToSkillOutput } = require('./objectResolvers/memberResolver');
const { Project,teamType,roleType,skillRoleType,
    tweetsProject,
    tweetsType,projectUserMatchType,Team,Role,
 } = require('./objectResolvers/projectsResolver');
const { Skills } = require('./objectResolvers/skillsResolver');
const { RoleTemplate } = require('./objectResolvers/roleTemplateResolver');
const { SkillCategory } = require('./objectResolvers/skillCategoryResolver');
const { ProjectUpdate,findAllProjectsTeamsAnouncmentsOutput,teamsType } = require('./objectResolvers/projectUpdateResolver');


module.exports = {
    Query,
    Mutation,
    Members,matchMembersToUserOutput,matchMembersToSkillOutput,
    Project,teamType,roleType,skillRoleType,
    tweetsProject,tweetsType,projectUserMatchType,Team,Role,
    Skills,
    RoleTemplate,
    SkillCategory,
    ProjectUpdate,findAllProjectsTeamsAnouncmentsOutput,teamsType,
}