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
const { SkillSubCategory } = require('./objectResolvers/skillSubCategoryResolver');
const { ProjectUpdate,findAllProjectsTeamsAnouncmentsOutput,teamsType } = require('./objectResolvers/projectUpdateResolver');
const { PubSub } = require('graphql-subscriptions');
const pubsub = new PubSub()


module.exports = {
    Query,
    Mutation,
    Members,matchMembersToUserOutput,matchMembersToSkillOutput,
    Project,teamType,roleType,skillRoleType,
    tweetsProject,tweetsType,projectUserMatchType,Team,Role,
    Skills,
    RoleTemplate,
    SkillCategory,
    SkillSubCategory,
    ProjectUpdate,findAllProjectsTeamsAnouncmentsOutput,teamsType,
    Mutation: {
        updateMemberForSubs: () => {
            pubsub.publish('MEMBER_UPDATED', {
                memberUpdated: "Helllo"
            })
            return "Hello"
        }
    },
    Subscription: {
        memberUpdated: {
            subscribe: () => pubsub.asyncIterator('MEMBER_UPDATED')
        }
    }
}