// const { Members } = require("../../../models/membersModel");
const { Skills } = require("../../../models/skillsModel");
// const { RoleTemplate } = require("../../../models/roleTemplateModal");
const { ServerTemplate } = require("../../../models/serverModel");


const {createNode_neo4j,createNode_neo4j_field,updateNode_neo4j_serverID_f,makeConnection_neo4j} = require("../../../neo4j/func_neo4j");

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


    let isNewServer = false;

    try {

        let serverData
        if (_id) {
            serverData = await ServerTemplate.findOne({ _id: _id })
            if (!serverData) {
                serverData = await new ServerTemplate(fields);
                serverData.save()

                isNewServer = true;


            } else {
                serverData= await ServerTemplate.findOneAndUpdate(
                    {_id: serverData._id},
                    {
                        $set: fields
                    },
                    {new: true}
                )
            }
        } else {
            serverData = await new ServerTemplate(fields);
            serverData.save()

            isNewServer = true;


        }

        let serverData_all = await ServerTemplate.find({})

          let serverID = []
          serverData_all.map(server => {
            serverID.push(server._id)
          })

        if (isNewServer) {
          
          let skillsData = await Skills.find({})


          let serverNew = []
          for (let i = 0; i < skillsData.length; i++) {
            // console.log("skillsData[i]._id = " , skillsData[i]._id=="63003681674d6b3e9185e3e6")

            serverNew = [...serverID]

            if (i==0){
              console.log("skillsData[i] = " , skillsData[i])
              console.log("serverNew = " , serverNew)
            }

            serverNew.push(serverData._id)

            updateNode_neo4j_serverID_f({
              node:"Skill",
              id_name: "_id",
              id_value: skillsData[i]._id,
              update_name:"serverID",
              update_value:serverNew,
            })
          }

        }

        return serverData;


    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > addNewMember"}
      );
    }
  },

};
