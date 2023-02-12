const { gql } = require("apollo-server-express");
const query = require("./query.graphql");
const mutation = require("./mutation.graphql");
const userType = require("./user.graphql");
const memberType = require("./member.graphql");
const projectType = require("./project.graphql");
const projectUpdateType = require("./projectUpdate.graphql");
const skillsType = require("./skills.graphql");
const nodeType = require("./node.graphql");
const SkillCategoryType = require("./skillCategory.graphql");
const SkillSubCategoryType = require("./skillSubCategory.graphql");
const roleTemplateType = require("./roleTemplate.graphql");
const serverTemplateType = require("./serverTemplate.graphql");
const grantTemplateType = require("./grantTemplate.graphql");
const graphVisualType = require("./graphVisual.graphql");
const errorType = require("./errors.graphql");
const roomType = require("./rooms.graphql");
const subscription = require("./subscription.graphql");
const chatType = require("./chat.graphql");
const aiType = require("./ai.graphql");
const edenMetricsType = require("./edenMetrics.graphql")

const typeDefs = gql`
  ${query}
  ${mutation}
  ${userType}
  ${skillsType}
  ${nodeType}
  ${memberType}
  ${projectType}
  ${projectUpdateType}
  ${roleTemplateType}
  ${serverTemplateType}
  ${grantTemplateType}
  ${graphVisualType}
  ${SkillCategoryType}
  ${SkillSubCategoryType}
  ${errorType}
  ${roomType}
  ${chatType}
  ${aiType}
  ${edenMetricsType}
  ${subscription}
`;

module.exports = typeDefs;
