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
  endorseSummaryType,
  matchMembersToSkillOutput,
  nodesPercentageType,
  mostRelevantMemberNodeType,
  SkillsPercentage,
  matchSkillsToProjectsOutput,
  matchProjectRoles,
  // endorsements,
} = require("./objectResolvers/memberResolver");
const { GrantTemplate } = require("./objectResolvers/grantResolver");

const {
  Endorsement,
  endorseNode,
  EndorsementLink,
} = require("./objectResolvers/endorsementResolver");
const { Review, reviewNode } = require("./objectResolvers/reviewResolver");

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
const { KeywordValue } = require("./objectResolvers/aiResolver");
const { Graph } = require("./objectResolvers/graphVisualResolver");
const { Rooms } = require("./objectResolvers/roomResolver");
const { RoleTemplate } = require("./objectResolvers/roleTemplateResolver");
const {
  Position,
  CandidateType,
  talentListType,
  talentType,
  convRecruiterType,
  NodeDataType,
  QuestionType,
} = require("./objectResolvers/positionResolver");
const { Company } = require("./objectResolvers/companyResolver");
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
  endorseSummaryType,
  Endorsement,
  endorseNode,
  EndorsementLink,
  Review,
  reviewNode,
  matchMembersToSkillOutput,
  nodesPercentageType,
  mostRelevantMemberNodeType,
  SkillsPercentage,
  matchSkillsToProjectsOutput,
  matchProjectRoles,
  Project,
  teamType,
  roleType,
  skillRoleType,
  // endorsements,
  tweetsProject,
  tweetsType,
  projectUserMatchType,
  Team,
  Role,
  Epic,
  Skills,
  Node,
  KeywordValue,
  Graph,
  Rooms,
  RoleTemplate,
  Company,
  Position,
  CandidateType,
  talentListType,
  talentType,
  convRecruiterType,
  NodeDataType,
  QuestionType,
  SkillCategory,
  SkillSubCategory,
  ProjectUpdate,
  findAllProjectsTeamsAnouncmentsOutput,
  teamsType,
  ErrorLog,
};
