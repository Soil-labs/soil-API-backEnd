const { Query } = require('./query');
const { Mutation, Subscription } = require('./mutation');

const { Members,matchMembersToUserOutput,matchMembersToProjectOutput,skillType_member,matchMembersToSkillOutput } = require('./objectResolvers/memberResolver');

const { Project,teamType,roleType,skillRoleType,
    tweetsProject,
    tweetsType,projectUserMatchType,Team,Role,Epic,
 } = require('./objectResolvers/projectsResolver');
const { Skills } = require('./objectResolvers/skillsResolver');
const { Rooms } = require('./objectResolvers/roomResolver');
const { RoleTemplate } = require('./objectResolvers/roleTemplateResolver');
const { SkillCategory } = require('./objectResolvers/skillCategoryResolver');
const { SkillSubCategory } = require('./objectResolvers/skillSubCategoryResolver');
const { ProjectUpdate,findAllProjectsTeamsAnouncmentsOutput,teamsType } = require('./objectResolvers/projectUpdateResolver');

// const { PubSub } = require('graphql-subscriptions');
// const pubsub = new PubSub()


module.exports = {
    Query,
    Mutation,
    Subscription,
    Members,matchMembersToUserOutput,matchMembersToProjectOutput,skillType_member,matchMembersToSkillOutput,
    Project,teamType,roleType,skillRoleType,
    tweetsProject,tweetsType,projectUserMatchType,Team,Role,Epic,
    Skills,
    Rooms,
    RoleTemplate,
    SkillCategory,
    SkillSubCategory,
    ProjectUpdate,findAllProjectsTeamsAnouncmentsOutput,teamsType,
}