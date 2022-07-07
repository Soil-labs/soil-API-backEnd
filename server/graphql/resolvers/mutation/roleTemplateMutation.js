const { Members } = require("../../../models/membersModel");
const { Skills } = require("../../../models/skillsModel");
const { RoleTemplate } = require("../../../models/roleTemplateModal");

const {ApolloError} = require("apollo-server-express");

module.exports = {
  updateRoleTemplate: async (parent, args, context, info) => {
   

  const {_id,title,description,skills} = args.fields;


    // if (!title) throw new ApolloError( "title is required");

    let fields = {
    };

    
    if (_id) fields._id = _id;
    if (title) fields.title = title;
    if (description) fields.description = description;
    if (skills) fields.skills = skills;


    try {

        if (_id) {
            let roleTemplateData = await RoleTemplate.findOne({ _id: _id })
            if (!roleTemplateData) {
                roleTemplateData = await new RoleTemplate(fields);
                roleTemplateData.save()
            } else {
                roleTemplateData= await RoleTemplate.findOneAndUpdate(
                    {_id: roleTemplateData._id},
                    {
                        $set: fields
                    },
                    {new: true}
                )
            }
            return roleTemplateData;
        } else {
            let roleTemplateData = await new RoleTemplate(fields);
            roleTemplateData.save()
            return roleTemplateData;
        }

    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > addNewMember"}
      );
    }
  },

};
