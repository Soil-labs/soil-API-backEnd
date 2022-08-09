// const { Members } = require("../../../models/membersModel");
// const { Skills } = require("../../../models/skillsModel");
// const { RoleTemplate } = require("../../../models/roleTemplateModal");
const { ServerTemplate } = require("../../../models/serverModel");

const {ApolloError} = require("apollo-server-express");

module.exports = {
  updateServer: async (parent, args, context, info) => {
   

    const {_id,name, adminID , adminRoles , adminCommands } = args.fields;

    if (!_id) throw new ApolloError("_id -> serverID is required");

    // if (!title) throw new ApolloError( "title is required");

    let fields = {
    };

    
    if (_id) fields._id = _id;
    if (name) fields.name = name;
    if (adminID) fields.adminID = adminID;
    if (adminRoles) fields.adminRoles = adminRoles;
    if (adminCommands) fields.adminCommands = adminCommands;



    try {

        if (_id) {
            let serverData = await ServerTemplate.findOne({ _id: _id })
            if (!serverData) {
                serverData = await new ServerTemplate(fields);
                serverData.save()
            } else {
                serverData= await ServerTemplate.findOneAndUpdate(
                    {_id: serverData._id},
                    {
                        $set: fields
                    },
                    {new: true}
                )
            }
            return serverData;
        } else {
            let serverData = await new ServerTemplate(fields);
            serverData.save()
            return serverData;
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
