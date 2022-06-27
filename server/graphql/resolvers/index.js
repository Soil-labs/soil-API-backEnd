const { Query } = require('./query');
const { Mutation } = require('./mutation');
const { Members } = require('./objectResolvers/memberResolver');
const { Project,teamType,roleType,skillRoleType,
    tweetsProject,
    tweetsType,
 } = require('./objectResolvers/projectsResolver');
const { Skills } = require('./objectResolvers/skillsResolver');


module.exports = {
    Query,
    Mutation,
    Members,
    Project,teamType,roleType,skillRoleType,
    tweetsProject,tweetsType,
    Skills,
}