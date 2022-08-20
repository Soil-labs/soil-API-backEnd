const { Members } = require("../../../models/membersModel");
const { Skills } = require("../../../models/skillsModel");
const { driver } = require("../../../../server/neo4j_config");
const { ServerTemplate } = require("../../../models/serverModel");
const {ApolloError} = require("apollo-server-express");
const {createNode_neo4j,createNode_neo4j_field,updateNode_neo4j_serverID_f,makeConnection_neo4j} = require("../../../neo4j/func_neo4j");

module.exports = {
  createSkill: async (parent, args, context, info) => {
   
  const {name,state} = args.fields;


  if (!name) throw new ApolloError( "You need to specify the name of the skill");

  let fields = {
    name,
    registeredAt: new Date(),
  };

  if (state){ 
    fields = {
      ...fields,
      state,
    }
  } else {
    fields = {
      ...fields,
      state: "waiting",
    }
  }
  



  try {

      let skillData

      skillData = await Skills.findOne({ name: fields.name })


      if (!skillData){
        skillData = await new Skills(fields);
        
        skillData.save()
        console.log("skill info = ", skillData);
        
        //Add skill to graph database


        let serverData = await ServerTemplate.find({})

        let serverID = []
        serverData.map(server => {
          serverID.push(server._id)
        })

        createNode_neo4j_field({
          fields:{
            node:"Skill",
            _id:skillData._id,
            name:fields.name,
            serverID: serverID,
            state: fields.state,
          }
        })

        

        skillData = skillData
      }
      
      

      return skillData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > addNewMember"}
      );
    }
  },
  createSkills: async (parent, args, context, info) => {
   
    const {names,state} = args.fields;
  
  
    if (!names) throw new ApolloError( "You need to specify the names of the skill");
  
    
    let serverData = await ServerTemplate.find({})

    let serverID = []
    serverData.map(server => {
      serverID.push(server._id)
    })
     
  
    try {

        let skillData

        let allSkills = []

        let fields
        let name
      
        for (i=0;i<names.length;i++){
          name = names[i]

          if (name){
            fields = {
              name,
              registeredAt: new Date(),
            };
          
            if (state){ 
              fields = {
                ...fields,
                state,
              }
            } else {
              fields = {
                ...fields,
                state: "waiting",
              }
            }

            skillData = await Skills.findOne({ name: name })


            if (!skillData ){
              skillData = await new Skills(fields);
              
              skillData.save()

              //Add skill to graph database

                

                // createNode_neo4j({
                //   node:"Skill",
                //   id:skillData._id,
                //   name:fields.name,
                //   serverID: serverID,
                // })

                createNode_neo4j_field({
                  fields:{
                    node:"Skill",
                    _id:skillData._id,
                    name:fields.name,
                    serverID: serverID,
                    state: state,
                  }
                })
              
              
            }

            allSkills.push(skillData)
          }
        }
  
        return allSkills
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "tmemberQuery > addNewMember"}
        );
      }
    },
  createApprovedSkill: async (parent, args, context, info) => {
    // Be careful only Admins can created preapproved skills
   
    const {name} = args.fields;
  
  
    if (!name) throw new ApolloError( "You need to specify the name of the skill");
  
    let fields = {
      name,
      state: "approved",
      registeredAt: new Date(),
    };
  
  
  
    try {
  
        let skillData
  
        skillData = await Skills.findOne({ name: fields.name })
  
  
        if (!skillData ){
          skillData = await new Skills(fields);
          
          skillData.save()
  
          let serverData = await ServerTemplate.find({})

          let serverID = []
          serverData.map(server => {
            serverID.push(server._id)
          })

          createNode_neo4j_field({
            fields:{
              node:"Skill",
              _id:skillData._id,
              name:fields.name,
              serverID: serverID,
              state: "approved",
            }
          })
        }
  
  
        return skillData
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "tmemberQuery > addNewMember"}
        );
      }
    },
  approveOrRejectSkill: async (parent, args, context, info) => {
   
    const {_id,state} = args.fields;
  
  
    if (!_id) throw new ApolloError( "You need to specify the ID of the skill");
    if (!state) throw new ApolloError( "You need to specify if you approve or reject the skill");
  
    if (state !== "approved" && state !== "rejected") throw new ApolloError( "You need to specify if you approve or reject the skill");
  
  
    try {
  
        let skillData
  
        skillData = await Skills.findOne({ _id: _id })
  
        
  
        if (skillData ){

          skillData= await Skills.findOneAndUpdate(
              {_id: _id},
              {
                  $set: {
                    state: state,
                  }
              },
              {new: true}
          )

          updateNode_neo4j_serverID_f({
              node:"Skill",
              id_name: "_id",
              id_value: skillData._id,
              update_name:"state",
              update_value:skillData.state,
          })

        }

        

  
  
        return skillData
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "tmemberQuery > addNewMember"}
        );
      }
    },
  

};
