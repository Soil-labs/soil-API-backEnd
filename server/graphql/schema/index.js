const { gql } = require('apollo-server-express');
const query = require('./query.graphql');
const mutation = require('./mutation.graphql');
const userType = require('./user.graphql');
const memberType = require('./member.graphql');
const projectType = require('./project.graphql');
const projectUpdateType = require('./projectUpdate.graphql');
const skillsType = require('./skills.graphql');
const SkillCategoryType = require('./skillCategory.graphql');
const SkillSubCategoryType = require('./skillSubCategory.graphql');
const roleTemplateType = require('./roleTemplate.graphql');
const serverTemplateType = require('./serverTemplate.graphql');
const errorType = require('./errors.graphql');

const typeDefs = gql`
  ${query}
  ${mutation}
  ${userType}
  ${skillsType}
  ${memberType}
  ${projectType}
  ${projectUpdateType}
  ${roleTemplateType}
  ${serverTemplateType}
  ${SkillCategoryType}
  ${SkillSubCategoryType}
  ${errorType}
  type Mutation {
    updateMemberForSubs: String
  }

  type Subscription {
    memberUpdated: String
  }

`;

module.exports = typeDefs;
