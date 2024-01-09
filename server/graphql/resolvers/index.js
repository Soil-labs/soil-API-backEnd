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
const { Node,
ConnectedCardMemory,
GraphNeighborType,
ShowMembersConnectedToNodesOutput,
PrimitiveCardInput,
NeighborNodeWithMem,
NodeOutputType,
CardMemoryOutputType,
ConnectMemoriesToKnowledgeGraph_V2Output,
ConnectedNodes } = require("./objectResolvers/nodeResolver");
const { KeywordValue,
CardMemoriesUsedType } = require("./objectResolvers/aiResolver");
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
  scoreCardsPositionType,
  scoreCardsCandidateType,
} = require("./objectResolvers/positionResolver");
const { Company } = require("./objectResolvers/companyResolver");
const { MemoryPinecone } = require("./objectResolvers/memoryPineconeResolver");
const { connectedCards,
PrimitivesType } = require("./objectResolvers/cardMemoryResolver");
const { SkillCategory } = require("./objectResolvers/skillCategoryResolver");
const {
  SkillSubCategory,
} = require("./objectResolvers/skillSubCategoryResolver");
const {
  QueryResponse,
} = require("./objectResolvers/queryResponseResolver");
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
  ConnectedCardMemory,
  GraphNeighborType,
  ShowMembersConnectedToNodesOutput,
  PrimitiveCardInput,
  NeighborNodeWithMem,
  NodeOutputType,
  CardMemoryOutputType,
  ConnectMemoriesToKnowledgeGraph_V2Output,
  ConnectedNodes,
  KeywordValue,
  CardMemoriesUsedType,
  Graph,
  Rooms,
  RoleTemplate,
  Company,
  MemoryPinecone,
  connectedCards,
  PrimitivesType,
  Position,
  CandidateType,
  talentListType,
  talentType,
  convRecruiterType,
  NodeDataType,
  QuestionType,
  scoreCardsPositionType,
  scoreCardsCandidateType,
  SkillCategory,
  SkillSubCategory,
  QueryResponse,
  ProjectUpdate,
  findAllProjectsTeamsAnouncmentsOutput,
  teamsType,
  ErrorLog,
};
