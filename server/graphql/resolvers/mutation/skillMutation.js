const { Members } = require("../../../models/membersModel");
const { Skills } = require("../../../models/skillsModel");
const { driver } = require("../../../../server/neo4j_config");
const {ApolloError} = require("apollo-server-express");

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
        const session = driver.session({database:"neo4j"});
        session.writeTransaction(tx => 
        tx.run(
          `  
          MERGE (:Skill {name: '${fields.name}', _id: '${skillData._id}'})
          `
          )
        )
        .catch(error=>{
          console.log(error)
        })
        .then(()=> session.close())

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
              const session = driver.session({database:"neo4j"});
              session.writeTransaction(tx => 
              tx.run(
                `  
                MERGE (:Skill {name: '${skillData.name}', _id: '${skillData._id}'})
                `
                )
              )
              .catch(error=>{
                console.log(error)
              })
              .then(()=> session.close())

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
  approveOrRejectSkill: async (parent, args, context, info) => {
   
    const {_id,state} = args.fields;
  
  
    if (!_id) throw new ApolloError( "You need to specify the ID of the skill");
    if (!state) throw new ApolloError( "You need to specify if you approve or reject the skill");
  
    if (state !== "approved" && state !== "rejected") throw new ApolloError( "You need to specify if you approve or reject the skill");
  
  
    try {
  
        let skillData
  
        skillData = await Skills.findOne({ _id: _id })
  
      //console.log("skillData = " , skillData)
  
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
        }

      //console.log("skillData 2= " , skillData)

  
  
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
