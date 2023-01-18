const { Skills } = require("../../../models/skillsModel");
const { SkillCategory } = require("../../../models/skillCategoryModel");
const { SkillSubCategory } = require("../../../models/skillSubCategoryModel");
const { ServerTemplate } = require("../../../models/serverModel");

const {
  createNode_neo4j,
  createNode_neo4j_field,
  updateNode_neo4j_serverID_f,
  makeConnection_neo4j,
} = require("../../../neo4j/func_neo4j");

const { ApolloError } = require("apollo-server-express");

module.exports = {
  updateServer: async (parent, args, context, info) => {
    const {
      _id,
      name,
      adminID,
      adminRoles,
      adminCommands,
      channelChatID,
      forumChatID,
      serverAvatar,
      serverType,
    } = args.fields;
    console.log("Mutation > updateServer > args.fields = ", args.fields);

    if (!_id) throw new ApolloError("_id -> serverID is required");

    // if (!title) throw new ApolloError( "title is required");

    let fields = {};

    if (_id) fields._id = _id;
    if (name) fields.name = name;
    if (adminID) fields.adminID = adminID;
    if (adminRoles) fields.adminRoles = adminRoles;
    if (adminCommands) fields.adminCommands = adminCommands;
    if (serverAvatar) fields.serverAvatar = serverAvatar;
    if (serverType) fields.serverType = serverType;

    let isNewServer = false;

    try {
      let serverData;
      if (_id) {
        serverData = await ServerTemplate.findOne({ _id: _id });
        if (!serverData) {
          fields = {
            ...fields,
            channel: {
              chatID: channelChatID,
              forumID: forumChatID,
            },
          };

          serverData = await new ServerTemplate(fields);
          serverData.save();

          isNewServer = true;
        } else {
          fields = {
            ...fields,
            channel: {
              ...serverData.channel,
              chatID: channelChatID,
              forumID: forumChatID,
            },
          };

          serverData = await ServerTemplate.findOneAndUpdate(
            { _id: serverData._id },
            {
              $set: fields,
            },
            { new: true }
          );
        }
      } else {
        serverData = await new ServerTemplate(fields);
        serverData.save();

        isNewServer = true;
      }

      let serverData_all = await ServerTemplate.find({});

      let serverID = [];
      serverData_all.map((server) => {
        serverID.push(server._id);
      });

      let serverNew = [...serverID];

      serverNew.push(serverData._id);

      if (isNewServer) {
        // updateNode_neo4j_serverID_f({
        //   node:"Skill",
        //   id_name: "serverID_code",
        //   id_value: "828",
        //   update_name:"serverID",
        //   update_value:[...serverID],
        // })

        let skillsData = await Skills.find({});

        let serverNew = [];
        serverNew = [...serverID];
        serverNew.push(serverData._id);

        for (let i = 0; i < skillsData.length; i++) {
          updateNode_neo4j_serverID_f({
            node: "Skill",
            id_name: "_id",
            id_value: skillsData[i]._id,
            update_name: "serverID",
            update_value: serverNew,
          });
        }

        let SkillCategoryData = await SkillCategory.find({});

        for (let i = 0; i < SkillCategoryData.length; i++) {
          updateNode_neo4j_serverID_f({
            node: "Skill_Category",
            id_name: "_id",
            id_value: SkillCategoryData[i]._id,
            update_name: "serverID",
            update_value: serverNew,
          });
        }

        let SkillSubCategoryData = await SkillSubCategory.find({});

        for (let i = 0; i < SkillSubCategoryData.length; i++) {
          updateNode_neo4j_serverID_f({
            node: "Skill_Sub_Category",
            id_name: "_id",
            id_value: SkillSubCategoryData[i]._id,
            update_name: "serverID",
            update_value: serverNew,
          });
        }
      }

      return serverData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > addNewMember" }
      );
    }
  },
};
