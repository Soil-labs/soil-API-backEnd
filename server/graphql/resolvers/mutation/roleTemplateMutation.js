const { Members } = require("../../../models/membersModel");
const { Skills } = require("../../../models/skillsModel");
const { RoleTemplate } = require("../../../models/roleTemplateModal");

const {ApolloError} = require("apollo-server-express");

module.exports = {
  newRoleTemplate: async (parent, args, context, info) => {
   

  const {title,description,skills} = args.fields;


    if (!title) throw new ApolloError( "title is required");

    let fields = {
      title,
    };

    
    if (description) fields.description = description;
    if (skills) fields.skills = skills;


    try {

        roleData = await new RoleTemplate(fields);
        
        roleData.save()

      return roleData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > addNewMember"}
      );
    }
  },

};
