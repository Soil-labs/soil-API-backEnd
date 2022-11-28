const { GrantTemplate } = require("../../../models/grantModel");

const {
  createNode_neo4j,
  createNode_neo4j_field,
  updateNode_neo4j_serverID_f,
  makeConnection_neo4j,
} = require("../../../neo4j/func_neo4j");

const { ApolloError } = require("apollo-server-express");

module.exports = {
  updateGrant: async (parent, args, context, info) => {
    const {
      _id,
      name,
      smallDescription,
      tags,
      requirments,
      applicationProcess,
      difficulty,
      discributed,
      resources,
      amount,
      avatar,
    } = args.fields;
    console.log("Mutation > updateGrant > args.fields = ", args.fields);

    let fields = {};

    if (_id) fields._id = _id;
    if (name) fields.name = name;
    if (smallDescription) fields.smallDescription = smallDescription;
    if (tags) fields.tags = tags;
    if (applicationProcess) fields.applicationProcess = applicationProcess;
    if (requirments) fields.requirments = requirments;
    if (difficulty) fields.difficulty = difficulty;
    if (discributed) fields.discributed = discributed;
    if (resources) fields.resources = resources;
    if (amount) fields.amount = amount;
    if (avatar) fields.avatar = avatar;

    try {
      let grantData;
      if (_id) {
        grantData = await GrantTemplate.findOne({ _id: _id });
        if (!grantData) {
          grantData = await new GrantTemplate(fields);
          grantData.save();
        } else {
          grantData = await GrantTemplate.findOneAndUpdate(
            { _id: grantData._id },
            {
              $set: fields,
            },
            { new: true }
          );
        }
      } else {
        grantData = await new GrantTemplate(fields);
        grantData.save();
      }

      return grantData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > addNewMember" }
      );
    }
  },
};
