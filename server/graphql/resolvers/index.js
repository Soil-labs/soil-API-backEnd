const { Query } = require("./query");
const { Mutation, Subscription } = require("./mutation");

const {
  Members,
  matchMembersToUserOutput,
  matchMembersToProjectOutput,
  nodesType,
  matchMembersToProjectRoleOutput,
  matchPrepareSkillToMembersOutput,
  skillType_member,
  matchMembersToSkillOutput,
  nodesPercentageType,
  SkillsPercentage,
  matchSkillsToProjectsOutput,
  matchProjectRoles,
  endorsements,
} = require("./objectResolvers/memberResolver");
const { GrantTemplate } = require("./objectResolvers/grantResolver");

const {
  Project,
  teamType,
  roleType,
  skillRoleType,
  tweetsProject,
  tweetsType,
  projectUserMatchType,
  Team,
  Role,
  Epic,
} = require("./objectResolvers/projectsResolver");
const { Skills } = require("./objectResolvers/skillsResolver");
const { Node } = require("./objectResolvers/nodeResolver");
const { Rooms } = require("./objectResolvers/roomResolver");
const { RoleTemplate } = require("./objectResolvers/roleTemplateResolver");
const { SkillCategory } = require("./objectResolvers/skillCategoryResolver");
const {
  SkillSubCategory,
} = require("./objectResolvers/skillSubCategoryResolver");
const {
  ProjectUpdate,
  findAllProjectsTeamsAnouncmentsOutput,
  teamsType,
} = require("./objectResolvers/projectUpdateResolver");

const { ErrorLog } = require("./objectResolvers/errorResolver");

// const { PubSub } = require('graphql-subscriptions');
// const pubsub = new PubSub()

module.exports = {
  Query,
  Mutation,
  Subscription,
  GrantTemplate,
  Members,
  matchMembersToUserOutput,
  matchMembersToProjectOutput,
  nodesType,
  matchMembersToProjectRoleOutput,
  matchPrepareSkillToMembersOutput,
  skillType_member,
  matchMembersToSkillOutput,
  nodesPercentageType,
  SkillsPercentage,
  matchSkillsToProjectsOutput,
  matchProjectRoles,
  Project,
  teamType,
  roleType,
  skillRoleType,
  endorsements,
  tweetsProject,
  tweetsType,
  projectUserMatchType,
  Team,
  Role,
  Epic,
  Skills,
  Node,
  Rooms,
  RoleTemplate,
  SkillCategory,
  SkillSubCategory,
  ProjectUpdate,
  findAllProjectsTeamsAnouncmentsOutput,
  teamsType,
  ErrorLog,
};
