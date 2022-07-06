
const { Skills } = require("../../../models/skillsModel");
const {Projects} = require("../../../models/projectsModel");
const {RoleTemplate} = require("../../../models/roleTemplateModal");


const {
  ApolloError,
} = require("apollo-server-express");


module.exports = {
  findRoleTemplate: async (parent, args, context, info) => {
   
    const {_id} = args.fields;

    if (!_id) throw new ApolloError("No id provided");

    try {


      let roleTemplateData = await RoleTemplate.findOne({ _id: _id })

   


      return roleTemplateData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill"}
      );
    }
  },
  findRoleTemplates: async (parent, args, context, info) => {
   
    const {_id} = args.fields;

    try {

      let roleTemplateData

      if (_id) {
        roleTemplateData = await RoleTemplate.find({ _id: _id })
      } else {
        roleTemplateData = await RoleTemplate.find({})
      }

   


      return roleTemplateData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill"}
      );
    }
  },
  
  
};
