const { Members } = require("../../../models/membersModel");
const { Skills } = require("../../../models/skillsModel");
const { driver } = require("../../../../server/neo4j_config");
const { ServerTemplate } = require("../../../models/serverModel");
const { SkillCategory } = require("../../../models/skillCategoryModel");
const { SkillSubCategory } = require("../../../models/skillSubCategoryModel");
const { ApolloError } = require("apollo-server-express");
const {
  createNode_neo4j,
  createNode_neo4j_field,
  updateNode_neo4j_serverID_f,
  makeConnection_neo4j,
} = require("../../../neo4j/func_neo4j");

module.exports = {
  // DEPRECATED
  // createSkill: async (parent, args, context, info) => {

  // const {name,state,categorySkills,subCategorySkill,id_lightcast} = args.fields;
  // console.log("Mutation > createSkill > args.fields = " , args.fields)

  // if (!name) throw new ApolloError( "You need to specify the name of the skill");

  // let fields = {
  //   name,
  //   registeredAt: new Date(),
  // };

  // if (categorySkills) fields.categorySkills = categorySkills;
  // if (subCategorySkill) fields.subCategorySkill = subCategorySkill;
  // if (id_lightcast) fields.id_lightcast = id_lightcast;

  // if (state){
  //   fields = {
  //     ...fields,
  //     state,
  //   }
  // } else {
  //   fields = {
  //     ...fields,
  //     state: "waiting",
  //   }
  // }

  // try {

  //     let skillData

  //     skillData = await Skills.findOne({ name: fields.name })

  //     if (!skillData){
  //       skillData = await new Skills(fields);

  //       skillData.save()

  //       // ----------------- Save the Server on the Skills -----------------
  //       let serverData = await ServerTemplate.find({})

  //       let serverID = []
  //       serverData.map(server => {
  //         serverID.push(server._id)
  //       })
  //       // ----------------- Save the Server on the Skills -----------------

  //       await createNode_neo4j_field({
  //         fields:{
  //           node:"Skill",
  //           _id: skillData._id,
  //           serverID_code: "828",
  //           name: skillData.name,
  //           serverID: serverID,
  //         }
  //       })

  //       // ----------------- connect skills with category -----------------
  //       if (categorySkills && categorySkills.length > 0){
  //         let skillCategoryData = await SkillCategory.find({_id: categorySkills})
  //         for (let i=0;i<skillCategoryData.length;i++){ // TODO: SOS 🆘 -> add the skill on teh category mongo

  //           console.log("-----------i = " , i)
  //           // makeConnection_neo4j({
  //           //   node:["Skill","Skill_Category"],
  //           //   id:[skillData._id,skillCategoryData[i]._id],
  //           //   connection:"CATEGORY",
  //           // })

  //           // ----------------- add subcategories if dont exist -----------------
  //           for (let j=0;j<subCategorySkill.length;j++){
  //             if (!skillCategoryData[i].subCategorySkill.includes(subCategorySkill[j])){
  //               skillCategoryData[i].subCategorySkill.push(subCategorySkill[j])
  //             }
  //           }
  //           // ----------------- add subcategories if dont exist -----------------

  //           await SkillCategory.findOneAndUpdate(
  //             {_id: skillCategoryData[i]._id},
  //             {
  //                 $set: {
  //                   skills: [...skillCategoryData[i].skills, skillData._id],
  //                   subCategorySkill: skillCategoryData[i].subCategorySkill,
  //                 }
  //             },
  //             {new: true}
  //           )
  //         }
  //       }
  //       // ----------------- connect skills with category -----------------

  //       // ----------------- connect skills with sub category -----------------
  //       if (subCategorySkill && subCategorySkill.length > 0){
  //         let skillSubCategoryData = await SkillSubCategory.find({_id: subCategorySkill})
  //         for (let i=0;i<skillSubCategoryData.length;i++){ // TODO: SOS 🆘 -> add the skill on teh category mongo

  //           makeConnection_neo4j({
  //             node:["Skill","Skill_Sub_Category"],
  //             id:[skillData._id,skillSubCategoryData[i]._id],
  //             connection:"SUB_CATEGORY",
  //           })

  //           console.log("[...skillCategoryData[i].skills, skillData._id] = " , [...skillSubCategoryData[i].skills, skillData._id])

  //           // ----------------- add categories if dont exist -----------------
  //           for (let j=0;j<categorySkills.length;j++){
  //             if (!skillSubCategoryData[i].categorySkills.includes(categorySkills[j])){
  //               skillSubCategoryData[i].categorySkills.push(categorySkills[j])
  //             }
  //           }
  //           // ----------------- add categories if dont exist -----------------

  //           await SkillSubCategory.findOneAndUpdate(
  //             {_id: skillSubCategoryData[i]._id},
  //             {
  //                 $set: {
  //                   skills: [...skillSubCategoryData[i].skills, skillData._id],
  //                   categorySkills: skillSubCategoryData[i].categorySkills,

  //                 }
  //             },
  //             {new: true}
  //           )
  //         }
  //       }
  //       // ----------------- connect skills with sub category -----------------

  //       // ----------------- connect Categories and subCategories -----------------
  //       if (categorySkills && subCategorySkill && categorySkills.length > 0 && subCategorySkill.length > 0){
  //         for (let i=0;i<categorySkills.length;i++){

  //           for (let j=0;j<subCategorySkill.length;j++){

  //             makeConnection_neo4j({
  //               node:["Skill_Sub_Category","Skill_Category"],
  //               id:[subCategorySkill[j],categorySkills[i]],
  //               connection:"CATEGORY",
  //             })
  //           }
  //         }
  //       }
  //       // ----------------- connect Categories and subCategories -----------------

  //       // skillData = skillData
  //     } else {
  //       skillData= await Skills.findOneAndUpdate(
  //         {name: fields.name},
  //         {
  //             $set: fields
  //         },
  //         {new: true}
  //       )
  //     }

  //     return skillData
  //   } catch (err) {
  //     throw new ApolloError(
  //       err.message,
  //       err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
  //       { component: "tmemberQuery > addNewMember"}
  //     );
  //   }
  // },
  
   // DEPRECATED
  // relatedSkills: async (parent, args, context, info) => {
  //   const { _id, relatedSkills_id } = args.fields;
  //   console.log("Mutation > relatedSkills > args.fields = ", args.fields);

  //   if (!_id) throw new ApolloError("You need to specify the id of the skill");

  //   skillData = await Skills.findOne({ _id: _id });

  //   relatedSkillsData = await Skills.find({ _id: relatedSkills_id });

  //   try {
  //     for (let i = 0; i < relatedSkillsData.length; i++) {
  //       makeConnection_neo4j({
  //         node: ["Skill", "Skill"],
  //         id: [skillData._id, relatedSkillsData[i]._id],
  //         connection: "RELATED",
  //       });

  //       // ----------------- add related skills if dont exist -----------------
  //       if (!skillData.relatedSkills.includes(relatedSkillsData[i]._id)) {
  //         skillData.relatedSkills.push(relatedSkillsData[i]._id);
  //       }

  //       await Skills.findOneAndUpdate(
  //         { _id: skillData._id },
  //         {
  //           $set: {
  //             relatedSkills: skillData.relatedSkills,
  //           },
  //         },
  //         { new: true }
  //       );
  //       // ----------------- add related skills if dont exist -----------------

  //       // ----------------- add skill - on relatedSkill -----------------
  //       if (!relatedSkillsData[i].relatedSkills.includes(skillData._id)) {
  //         relatedSkillsData[i].relatedSkills.push(skillData._id);
  //       }

  //       await Skills.findOneAndUpdate(
  //         { _id: relatedSkillsData[i]._id },
  //         {
  //           $set: {
  //             relatedSkills: relatedSkillsData[i].relatedSkills,
  //           },
  //         },
  //         { new: true }
  //       );
  //       // ----------------- add skill - on relatedSkill -----------------
  //     }
  //   } catch (err) {
  //     throw new ApolloError(
  //       err.message,
  //       err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
  //       { component: "tmemberQuery > addNewMember" }
  //     );
  //   }

  //   return skillData;
  // },
  // DEPRECATED
  // createSkills: async (parent, args, context, info) => {

  //   const {names,state} = args.fields;
  //   console.log("Mutation > createSkills > args.fields = " , args.fields)

  //   if (!names) throw new ApolloError( "You need to specify the names of the skill");

  //   let serverData = await ServerTemplate.find({})

  //   let serverID = []
  //   serverData.map(server => {
  //     serverID.push(server._id)
  //   })

  //   try {

  //       let skillData

  //       let allSkills = []

  //       let fields
  //       let name

  //       for (i=0;i<names.length;i++){
  //         name = names[i]

  //         if (name){
  //           fields = {
  //             name,
  //             registeredAt: new Date(),
  //           };

  //           if (state){
  //             fields = {
  //               ...fields,
  //               state,
  //             }
  //           } else {
  //             fields = {
  //               ...fields,
  //               state: "waiting",
  //             }
  //           }

  //           skillData = await Skills.findOne({ name: name })

  //           if (!skillData ){
  //             skillData = await new Skills(fields);

  //             skillData.save()

  //             //Add skill to graph database

  //               // createNode_neo4j({
  //               //   node:"Skill",
  //               //   id:skillData._id,
  //               //   name:fields.name,
  //               //   serverID: serverID,
  //               // })

  //               createNode_neo4j_field({
  //                 fields:{
  //                   node:"Skill",
  //                   _id:skillData._id,
  //                   name:fields.name,
  //                   serverID: serverID,
  //                   state: state,
  //                 }
  //               })

  //           }

  //           allSkills.push(skillData)
  //         }
  //       }

  //       return allSkills
  //     } catch (err) {
  //       throw new ApolloError(
  //         err.message,
  //         err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
  //         { component: "tmemberQuery > addNewMember"}
  //       );
  //     }
  //   },
  // DEPRECATED
  // createApprovedSkill: async (parent, args, context, info) => {
  //   // Be careful only Admins can created preapproved skills

  //   const { name } = args.fields;
  //   console.log("Mutation > createApprovedSkill > args.fields = ", args.fields);

  //   if (!name)
  //     throw new ApolloError("You need to specify the name of the skill");

  //   let fields = {
  //     name,
  //     state: "approved",
  //     registeredAt: new Date(),
  //   };

  //   try {
  //     let skillData;

  //     skillData = await Skills.findOne({ name: fields.name });

  //     if (!skillData) {
  //       skillData = await new Skills(fields);

  //       skillData.save();

  //       let serverData = await ServerTemplate.find({});

  //       let serverID = [];
  //       serverData.map((server) => {
  //         serverID.push(server._id);
  //       });

  //       createNode_neo4j_field({
  //         fields: {
  //           node: "Skill",
  //           _id: skillData._id,
  //           name: fields.name,
  //           serverID: serverID,
  //           state: "approved",
  //         },
  //       });
  //     }

  //     return skillData;
  //   } catch (err) {
  //     throw new ApolloError(
  //       err.message,
  //       err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
  //       { component: "tmemberQuery > addNewMember" }
  //     );
  //   }
  // },
  // DEPRECATED
  // approveOrRejectSkill: async (parent, args, context, info) => {
  //   const { _id, state, categorySkills, subCategorySkill } = args.fields;
  //   console.log(
  //     "Mutation > approveOrRejectSkill > args.fields = ",
  //     args.fields
  //   );

  //   if (!_id) throw new ApolloError("You need to specify the ID of the skill");
  //   if (!state)
  //     throw new ApolloError(
  //       "You need to specify if you approve or reject the skill"
  //     );

  //   if (state !== "approved" && state !== "rejected")
  //     throw new ApolloError(
  //       "You need to specify if you approve or reject the skill"
  //     );

  //   try {
  //     let skillData;

  //     skillData = await Skills.findOne({ _id: _id });

  //     if (skillData) {
  //       // let updateQuery = []

  //       // ----------------- connect skills with category -----------------
  //       if (categorySkills && categorySkills.length > 0) {
  //         let skillCategoryData = await SkillCategory.find({
  //           _id: categorySkills,
  //         });
  //         for (let i = 0; i < skillCategoryData.length; i++) {
  //           // TODO: SOS 🆘 -> add the skill on teh category mongo

  //           console.log("-----------i = ", i);
  //           // makeConnection_neo4j({
  //           //   node:["Skill","Skill_Category"],
  //           //   id:[skillData._id,skillCategoryData[i]._id],
  //           //   connection:"CATEGORY",
  //           // })

  //           // ----------------- add subcategories if dont exist -----------------
  //           for (let j = 0; j < subCategorySkill.length; j++) {
  //             if (
  //               !skillCategoryData[i].subCategorySkill.includes(
  //                 subCategorySkill[j]
  //               )
  //             ) {
  //               skillCategoryData[i].subCategorySkill.push(subCategorySkill[j]);
  //             }
  //           }
  //           // ----------------- add subcategories if dont exist -----------------

  //           await SkillCategory.findOneAndUpdate(
  //             { _id: skillCategoryData[i]._id },
  //             {
  //               $set: {
  //                 skills: [...skillCategoryData[i].skills, skillData._id],
  //                 subCategorySkill: skillCategoryData[i].subCategorySkill,
  //               },
  //             },
  //             { new: true }
  //           );
  //         }
  //       }
  //       // ----------------- connect skills with category -----------------

  //       // ----------------- connect skills with sub category -----------------
  //       if (subCategorySkill && subCategorySkill.length > 0) {
  //         let skillSubCategoryData = await SkillSubCategory.find({
  //           _id: subCategorySkill,
  //         });
  //         for (let i = 0; i < skillSubCategoryData.length; i++) {
  //           // TODO: SOS 🆘 -> add the skill on teh category mongo

  //           makeConnection_neo4j({
  //             node: ["Skill", "Skill_Sub_Category"],
  //             id: [skillData._id, skillSubCategoryData[i]._id],
  //             connection: "SUB_CATEGORY",
  //           });

  //           console.log("[...skillCategoryData[i].skills, skillData._id] = ", [
  //             ...skillSubCategoryData[i].skills,
  //             skillData._id,
  //           ]);

  //           // ----------------- add categories if dont exist -----------------
  //           for (let j = 0; j < categorySkills.length; j++) {
  //             if (
  //               !skillSubCategoryData[i].categorySkills.includes(
  //                 categorySkills[j]
  //               )
  //             ) {
  //               skillSubCategoryData[i].categorySkills.push(categorySkills[j]);
  //             }
  //           }
  //           // ----------------- add categories if dont exist -----------------

  //           await SkillSubCategory.findOneAndUpdate(
  //             { _id: skillSubCategoryData[i]._id },
  //             {
  //               $set: {
  //                 skills: [...skillSubCategoryData[i].skills, skillData._id],
  //                 categorySkills: skillSubCategoryData[i].categorySkills,
  //               },
  //             },
  //             { new: true }
  //           );
  //         }
  //       }
  //       // ----------------- connect skills with sub category -----------------

  //       // ----------------- connect Categories and subCategories -----------------

  //       if (
  //         categorySkills &&
  //         subCategorySkill &&
  //         categorySkills.length > 0 &&
  //         subCategorySkill.length > 0
  //       ) {
  //         for (let i = 0; i < categorySkills.length; i++) {
  //           for (let j = 0; j < subCategorySkill.length; j++) {
  //             makeConnection_neo4j({
  //               node: ["Skill_Sub_Category", "Skill_Category"],
  //               id: [subCategorySkill[j], categorySkills[i]],
  //               connection: "CATEGORY",
  //             });
  //           }
  //         }
  //       }
  //       // ----------------- connect Categories and subCategories -----------------

  //       // ----------------- 🌱 Update 🌱 mongo skill -----------------
  //       skillData = await Skills.findOneAndUpdate(
  //         { _id: _id },
  //         {
  //           $set: {
  //             state: state,
  //             subCategorySkill: subCategorySkill,
  //             categorySkills: categorySkills,
  //           },
  //         },
  //         { new: true }
  //       );

  //       updateNode_neo4j_serverID_f({
  //         node: "Skill",
  //         id_name: "_id",
  //         id_value: skillData._id,
  //         update_name: "state",
  //         update_value: skillData.state,
  //       });
  //       // ----------------- 🌱 Update 🌱 mongo skill -----------------
  //     }

  //     return skillData;
  //   } catch (err) {
  //     throw new ApolloError(
  //       err.message,
  //       err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
  //       { component: "tmemberQuery > addNewMember" }
  //     );
  //   }
  // },
};
