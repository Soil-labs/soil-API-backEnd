const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");
const { Skills } = require("../../../models/skillsModel");
const { Projects } = require("../../../models/projectsModel");
const { RoleTemplate } = require("../../../models/roleTemplateModal");
const { EdenMetrics } = require("../../../models/edenMetrics");
const { Position } = require("../../../models/positionModel");

const axios = require("axios");

const {printC} = require("../../../printModule")

const { updateNodesToMember } = require("../utils/nodeModules");




const {arrayToKeyObject,getRandomIDs,fetchRandomAvatar,randomPicture,useGPTchat,generateRandomID,addNewFakeUser,addNodesToFakeMember} = require("../utils/helperFunc");

const { PineconeClient } = require("@pinecone-database/pinecone");
const { ApolloError } = require("apollo-server-express");
const { driver } = require("../../../../server/neo4j_config");
const {
  createNode_neo4j,
  makeConnection_neo4j,
  updateNode_neo4j_serverID,
  deleteConnectionBetweenNodes_neo4j,
  findAllNodesDistanceRfromNode_neo4j,
  deleteConnectionANYBetweenNodes_neo4j,
  deleteNode_neo4j,
} = require("../../../neo4j/func_neo4j");

const { uploadFileToArweave } = require("../../../utils/uploadFileToArweave");

const { combineResolvers } = require("graphql-resolvers");
const {
  IsAuthenticated,
  IsOnlyOperator,
} = require("../../../utils/authorization");
const { ACCESS_LEVELS } = require("../../../auth/constants");

const { PubSub } = require("graphql-subscriptions");
const pubsub = new PubSub();



function chooseAPIkey() {
  // openAI_keys = [
  //   "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",
  //   // "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",
  //   "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",
  //   "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",
  // ];
  openAI_keys = ["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"];

  // randomly choose one of the keys
  let randomIndex = Math.floor(Math.random() * openAI_keys.length);
  let key = openAI_keys[randomIndex];

  return key;
}

async function createEmbeddingsGPT(words_n) {
  // words_n = ["node.js", "react", "angular"];
  let OPENAI_API_KEY = chooseAPIkey();
  response = await axios.post(
    "https://api.openai.com/v1/embeddings",
    {
      input: words_n,
      model: "text-embedding-ada-002",
      // model: "text-embedding-ada-002",
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    }
  );

  res = response.data.data.map((obj) => {
    return obj.embedding;
  });

  // console.log("res = ", res);
  return res;
}


async function useGPTchatSimple(prompt,temperature=0.7) {
  
  discussion = [{
    "role": "user",
    "content": prompt
  }]


  
  let OPENAI_API_KEY = chooseAPIkey();
  response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      messages: discussion,
      model: "gpt-3.5-turbo",
      temperature: temperature,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    }
  );

  return response.data.choices[0].message.content;
}

async function generate12DigitID(inputString) {
  // Incredible funciton
  // take any string, that can be any length, and make it a 12 digit ID that will be exactly the same for the same input, but always different for a different input

  const encoder = new TextEncoder();
  const data = encoder.encode(inputString);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(digest));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const id = hashHex.slice(0, 12);
  
  return id;
}



async function upsertEmbedingPineCone(data,ID = undefined) {


  embedding = await createEmbeddingsGPT(data.text)

  const pinecone = new PineconeClient();
  await pinecone.init({
    environment: "us-east1-gcp",
    apiKey: "901d81d8-cc8d-4648-aeec-229ce61d476d",
  });


  const index = await pinecone.Index("profile-eden-information");

  if (ID == undefined) ID = await generate12DigitID(data.text)




  const upsertRequest = {
    vectors: [
      {
        id: ID,
        values: embedding,
        metadata: {
          text: data.text,
          _id: data._id,
          label: data.label,
        }
      },
    ],
  };

  const upsertResponse = await index.upsert({upsertRequest});

  return upsertResponse
}

module.exports = {
  addNewMember: combineResolvers(
    IsAuthenticated,
    async (parent, args, context, info) => {
      const {
        discordName,
        _id,
        discordAvatar,
        discriminator,
        bio,
        hoursPerWeek,
        previousProjects,
        invitedBy,
        serverID,
      } = args.fields;

      if (
        !context.user &&
        context.user.accessLevel > ACCESS_LEVELS.OPERATOR_ACCESS
      )
        throw new ApolloError("Not Authorized");

      console.log("Mutation > addNewMember > args.fields = ", args.fields);

      if (!_id)
        throw new ApolloError("_id is required, the IDs come from Discord");

      let fields = {
        _id,
        registeredAt: new Date(),
      };

      if (discordName) fields.discordName = discordName;
      if (discordAvatar) fields.discordAvatar = discordAvatar;
      if (discriminator) fields.discriminator = discriminator;
      if (bio) fields.bio = bio;
      if (hoursPerWeek) fields.hoursPerWeek = hoursPerWeek;
      if (previousProjects) fields.previousProjects = previousProjects;
      if (invitedBy) fields.invitedBy = invitedBy;

      // console.log("fields = " , fields)

      try {
        let membersData = await Members.findOne({ _id: fields._id });

        //console.log("membersData = " , membersData)

        if (!membersData) {
          let newAttributes = {
            Director: 0,
            Motivator: 0,
            Inspirer: 0,
            Helper: 0,
            Supporter: 0,
            Coordinator: 0,
            Observer: 0,
            Reformer: 0,
          };

          fields = { ...fields, attributes: newAttributes };

          if (serverID) fields.serverID = serverID;

          membersData = await new Members(fields);

          membersData.save();

          //add member node to neo4j
          await createNode_neo4j({
            node: "Member",
            id: fields._id,
            name: fields.discordName,
            serverID: membersData.serverID,
          });

          if (invitedBy) {
            await makeConnection_neo4j({
              node: ["Member", "Member"],
              id: [fields._id, invitedBy],
              connection: "INVITED_BY",
            });
          }
        } else {
          if (!membersData.serverID) {
            membersData = await Members.findOneAndUpdate(
              { _id: membersData._id },
              { serverID: serverID },
              { new: true }
            );

            updateNode_neo4j_serverID({
              node: "Member",
              id: membersData._id,
              serverID: membersData.serverID,
            });
          } else {
            let serverID_new = [...membersData.serverID];
            if (!membersData.serverID.includes(serverID)) {
              serverID_new.push(serverID);
            }
            membersData = await Members.findOneAndUpdate(
              { _id: membersData._id },
              { serverID: serverID_new },
              { new: true }
            );

            updateNode_neo4j_serverID({
              node: "Member",
              id: membersData._id,
              serverID: serverID_new,
            });
          }
        }

        pubsub.publish(membersData._id, {
          memberUpdated: membersData,
        });
        return membersData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "tmemberQuery > addNewMember" }
        );
      }
    }
  ),
  updateMember: 
  // combineResolvers(
  //   IsAuthenticated,
    async (parent, args, { user }, info) => {
      const {
        discordName,
        _id,
        discordAvatar,
        discriminator,
        bio,
        hoursPerWeek,
        previousProjects,
        interest,
        timeZone,
        level,
        links,
        budget,
        content,
        serverID,
        onbording,
        memberRole,
        experienceLevel,
        location,
      } = args.fields;

      let { skills } = args.fields;
      
      user = await Members.findOne({ _id: _id });
      console.log("user = " , user)

      console.log("Mutation > updateMember > args.fields = ", args.fields);

      // if (!_id) throw new ApolloError("_id is required");
      if (!user) throw new ApolloError("user is required");

      let fields = {
        _id: user._id,
        registeredAt: new Date(),
      };

      if (discordAvatar) fields = { ...fields, discordAvatar };
      if (discordName) fields = { ...fields, discordName };
      if (discriminator) fields = { ...fields, discriminator };
      if (bio) fields = { ...fields, bio };
      if (hoursPerWeek) fields = { ...fields, hoursPerWeek };
      if (previousProjects) fields = { ...fields, previousProjects };
      if (interest) fields = { ...fields, interest };
      if (timeZone) fields = { ...fields, timeZone };
      if (level) fields = { ...fields, level };

      if (links) fields = { ...fields, links };
      if (content) fields = { ...fields, content };
      if (memberRole) fields = { ...fields, memberRole };

      
      if (location) fields = { ...fields, location };

      let membersData = await Members.findOne({ _id: fields._id });
      let membersDataOriginal = membersData;

      if (budget != undefined) {
        fields = { 
          ...fields, 
          budget: membersData.budget 
        };

        if (budget.totalBudget) {
          fields = { 
            ...fields,
            budget: {
              ...fields.budget,
              totalBudget: budget.totalBudget,
            }
          };
        }

        if (budget.perHour) {
          fields = { 
            ...fields,
            budget: {
              ...fields.budget,
              perHour: budget.perHour,
            }
          };
        }
        if (budget.perMonth) {
          fields = { 
            ...fields,
            budget: {
              ...fields.budget,
              perMonth: budget.perMonth,
            }
          };
        }

        if (budget.token) {
          fields = { 
            ...fields,
            budget: {
              ...fields.budget,
              token: budget.token,
            }
          };
        }

      }

      if (experienceLevel) {

        fields = {
          ...fields,
          experienceLevel: {
            ...membersData.experienceLevel,
          }
        }

        if (experienceLevel.total) {
          if (experienceLevel.total!= 3 && experienceLevel.total!= 6 && experienceLevel.total!=9){
            throw new ApolloError("Experience Level must be 3, 6 or 9");
          } else {
            fields = { 
              ...fields,
              experienceLevel: {
                ...fields.experienceLevel,
                total: experienceLevel.total,
              }
            
            };
          }
        } 

        if (experienceLevel.years){
          fields = {
            ...fields,
            experienceLevel: {
              ...fields.experienceLevel,
              years: experienceLevel.years,
            }
          }
        }
       
        
      }
        
        
        // fields = { ...fields, experienceLevel };

      // console.log("memberRole = " , memberRole)
      // console.log("skills = " , skills)
      // console.log("membersData.skills = " , membersData.skills)

      // -------- Role -> Skill -----------
      if (memberRole) {
        let roleTemplateData = await RoleTemplate.findOne({ _id: memberRole });
        if (roleTemplateData) {
          if (!skills) {
            skills = membersData.skills;
          }

          let skillID = [];
          skills.forEach((skill) => {
            skillID.push(skill.id.toString());
          });

          roleTemplateData.skills.forEach((skill) => {
            if (!skillID.includes(skill.toString())) {
              skills.push({
                id: skill,
                level: "mid",
              });
            }
          });
        }
      }
      // -------- Role -> Skill -----------
      // console.log("skills = " , skills)

      if (skills) fields = { ...fields, skills };

      try {
        if (!membersData) {
          let newAttributes = {
            Director: 0,
            Motivator: 0,
            Inspirer: 0,
            Helper: 0,
            Supporter: 0,
            Coordinator: 0,
            Observer: 0,
            Reformer: 0,
          };

          fields = { ...fields, attributes: newAttributes };

          if (onbording) fields = { ...fields, onbording: onbording };

          if (serverID && serverID.length > 0) fields.serverID = serverID;

          membersData = await new Members(fields);

          membersData.save();

          //add member node to neo4j
          await createNode_neo4j({
            node: "Member",
            id: fields._id,
            name: fields.discordName,
            serverID: membersData.serverID,
          });
        } else {
          if (onbording) {
            if (
              onbording.signup != undefined &&
              onbording.percentage != undefined
            ) {
              fields = { ...fields, onbording: onbording };
            } else if (onbording.signup != undefined) {
              fields = {
                ...fields,
                onbording: {
                  ...membersData.onbording,
                  signup: onbording.signup,
                },
              };
            } else if (onbording.percentage != undefined) {
              fields = {
                ...fields,
                onbording: {
                  ...membersData.onbording,
                  percentage: onbording.percentage,
                },
              };
            }
          }

          if (!membersData.serverID) {
            if (serverID && serverID.length > 0) fields.serverID = serverID;
          } else {
            let serverID_new = [...membersData.serverID];
            if (serverID && serverID.length > 0) {
              for (let i = 0; i < serverID.length; i++) {
                const currentServerID = serverID[i];
                if (!membersData.serverID.includes(currentServerID)) {
                  serverID_new.push(currentServerID);
                }
              }
              fields.serverID = serverID_new;
            }
          }

          membersData = await Members.findOneAndUpdate(
            { _id: fields._id },
            fields,
            { new: true }
          );

          // console.log("change = -----", membersData.serverID);
          // console.log("change = -----", membersData.serverID.length);
          // console.log("change = -----", fields.serverID);
          // console.log("change = -----", fields.serverID.length);

          // console.log("membersData = " , membersData)
          if (membersData.serverID && membersData.serverID.length > 0) {
            console.log("change = ");
            updateNode_neo4j_serverID({
              node: "Member",
              id: membersData._id,
              serverID: membersData.serverID,
            });
          }
        }

        if (skills) {
          //  ---------------- Delete Connection of Deleted Skills ----------------
          console.log(
            "membersDataOriginal.skills = ",
            membersDataOriginal.skills
          );
          console.log("skills = ", skills);

          let membersDataOriginalArray = membersDataOriginal.skills.map(
            function (item) {
              return item.id.toString();
            }
          );

          let skillsArray = skills.map(function (item) {
            return item.id.toString();
          });

          console.log("membersDataOriginalArray = ", membersDataOriginalArray);
          console.log("skillsArray = ", skillsArray);

          // let difference = skills.filter(x => !membersDataOriginalArray.includes(x.id));
          let difference = membersDataOriginalArray.filter(
            (x) => !skillsArray.includes(x)
          );

          console.log("difference = ", difference);

          for (let i = 0; i < difference.length; i++) {
            let skillID = difference[i];
            deleteConnectionBetweenNodes_neo4j({
              skillID: skillID,
              memberID: membersData._id,
            });

            let skillDataN = await Skills.findOne({ _id: skillID });

            await Skills.findOneAndUpdate(
              { _id: skillID },
              {
                $set: {
                  match: {
                    recalculateProjectRoles: true,
                    distanceProjectRoles:
                      skillDataN?.match?.distanceProjectRoles,

                    recalculateMembers: true,
                    distanceMembers: skillDataN?.match?.distanceMembers,
                  },
                },
              },
              { new: true }
            );
          }

          //  ---------------- Delete Connection of Deleted Skills ----------------

          for (let i = 0; i < skills.length; i++) {
            let skill = skills[i];

            makeConnection_neo4j({
              node: ["Member", "Skill"],
              id: [membersData._id, skill.id],
              connection: "SKILL",
            });

            // Recalculate the skill match now that neo4j diagram changed

            let skillDataN = await Skills.findOne({ _id: skill.id });

            let res2 = await Skills.findOneAndUpdate(
              { _id: skill.id },
              {
                $set: {
                  match: {
                    recalculateProjectRoles: true,
                    distanceProjectRoles:
                      skillDataN?.match?.distanceProjectRoles,

                    recalculateMembers: true,
                    distanceMembers: skillDataN?.match?.distanceMembers,
                  },
                },
              },
              { new: true }
            );
            // console.log("res2 = " , res2)
          }
        }

        //add the user to the metrics model
        const memberMetricsData = await EdenMetrics.find({
          memberID: user._id,
        });

        if (!memberMetricsData) {
          //create a new one
          const newMemberMetrics = await new EdenMetrics({
            memberID: user._id,
            profileCreatedDate: new Date(),
          });
          newMemberMetrics.save();
        } else {
          //check if the profileCreatedDate has been filled
          if (!memberMetricsData.profileCreatedDate) {
            await EdenMetrics.findOneAndUpdate(
              { memberID: user._id },
              {
                $set: {
                  profileCreatedDate: new Date(),
                },
              }
            );
          }
        }

        pubsub.publish(membersData._id, {
          memberUpdated: membersData,
        });
        return membersData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "tmemberQuery > findMember" }
        );
      }
    },
  // ),

  addNodesToMember: 
  // combineResolvers(
  //   IsAuthenticated,
  //   IsOnlyOperator,
    async (parent, args, context, info) => {
      let { memberID, nodesID, nodesID_level } = args.fields;

      console.log("Mutation > addNodesToMember > args.fields = ", args.fields);

      if (!memberID) throw new ApolloError("memberID is required");

      if (!(nodesID == undefined || nodesID_level == undefined))
        throw new ApolloError(
          "you need to use nodesID or nodesID_level, you cant use both"
        );

      let nodesID_level_obj = {};
      if (nodesID == undefined) {
        nodesID = nodesID_level.map((item) => item.nodeID);

        // change nodesID_level from array of objects to an object
        for (let i = 0; i < nodesID_level.length; i++) {
          let item = nodesID_level[i];
          nodesID_level_obj[item.nodeID] = item;
        }
      }
      console.log("nodesID_level_obj = ", nodesID_level_obj);

      try {
        let memberData = await Members.findOne({ _id: memberID });

        let nodesData = await Node.find({ _id: nodesID }).select(
          "_id node match_v2_update"
        );

        // check if the nodes are already in the member (memberData.nodes)
        let nodesDataOriginalArray = memberData.nodes.map(function (item) {
          return item._id.toString();
        });

        let nodesIDArray = nodesID.map(function (item) {
          return item.toString();
        });

        let differenceNodes = nodesIDArray.filter(
          (x) => !nodesDataOriginalArray.includes(x)
        );
        console.log("differenceNodes = ", differenceNodes);

        if (differenceNodes.length > 0) {
          let nodesDataNew = [];
          for (let i = 0; i < differenceNodes.length; i++) {
            let nodeID = differenceNodes[i];
            let nodeData = nodesData.find(
              (x) => x._id.toString() == nodeID.toString()
            );

            if (nodesID_level != undefined) {
              // caluclate the skill level and add it to the nodes for the next phase
              let nodeNow_weight = await calculate_skill_level(
                nodesID_level_obj[nodeID]
              );

              nodesDataNew.push({
                ...nodeData._doc,
                weight: nodeNow_weight.weight_total,
              });
              memberData.nodes.push({
                _id: nodeID,
                orderIndex: nodeNow_weight.orderIndex,
                level: nodeNow_weight.level,
                weight: nodeNow_weight.weight_total,
                aboveNodes: nodesID_level_obj[nodeID].aboveNodes,
              });
            } else {
              nodesDataNew.push(nodeData);
              memberData.nodes.push({ _id: nodeID });
            }
          }

          // add only the new ones as relationship on Neo4j
          for (let i = 0; i < nodesDataNew.length; i++) {
            let nodeNow = nodesDataNew[i];

            if (nodeNow.weight != undefined) {
              makeConnection_neo4j({
                node: [nodeNow.node, "Member"],
                id: [nodeNow._id, memberData._id],
                connection: "connection",
                // weight: "0.1",
                weight: nodeNow.weight.toFixed(3),
              });
            } else {
              makeConnection_neo4j({
                node: [nodeNow.node, "Member"],
                id: [nodeNow._id, memberData._id],
                connection: "connection",
              });
            }

            changeMatchByServer(nodeNow, memberData);


          }
        }

        console.log("memberData.nodes = ", memberData.nodes);
        // safd2;

        memberData2 = await Members.findOneAndUpdate(
          { _id: memberID },
          {
            $set: {
              nodes: memberData.nodes,
            },
          },
          { new: true }
        );

        pubsub.publish(memberData2._id, {
          memberUpdated: memberData2,
        });

        return memberData2;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "tmemberQuery > findMember" }
        );
      }
    },
  deleteNodesFromMember: 
  // combineResolvers(
  //   IsAuthenticated,
  //   IsOnlyOperator,
    async (parent, args, context, info) => {
      const { memberID, nodesID } = args.fields;

      console.log(
        "Mutation > deleteNodesFromMember > args.fields = ",
        args.fields
      );

      if (!memberID) throw new ApolloError("memberID is required");

      try {
        let memberData = await Members.findOne({ _id: memberID });
        let nodesData = await Node.find({ _id: nodesID }).select(
          "_id name node"
        );

        // check what nodes exist on memberData.nodes
        let nodesDataOriginalArray = memberData.nodes.map(function (item) {
          return item._id.toString();
        });

        let nodesIDArray = nodesID.map(function (item) {
          return item.toString();
        });

        let nodesExistMemberAndNode = nodesDataOriginalArray.filter((x) =>
          nodesIDArray.includes(x)
        );
        console.log("nodesExistMemberAndNode = ", nodesExistMemberAndNode);

        let nodeExistOnlyMember = nodesDataOriginalArray.filter(
          (x) => !nodesIDArray.includes(x)
        );
        console.log("nodeExistOnlyMember = ", nodeExistOnlyMember);

        // console.log("change = " , change)

        if (nodesExistMemberAndNode.length > 0) {
          let nodesDataNew = [];
          for (let i = 0; i < nodesExistMemberAndNode.length; i++) {
            let nodeID = nodesExistMemberAndNode[i];
            let nodeData = nodesData.find(
              (x) => x._id.toString() == nodeID.toString()
            );
            nodesDataNew.push(nodeData);
          }

          let nodeExistOnlyMember_id = [];
          for (let i = 0; i < nodeExistOnlyMember.length; i++) {
            let nodeID = nodeExistOnlyMember[i];
            nodeExistOnlyMember_id.push({ _id: nodeID });
          }

          memberData.nodes = nodeExistOnlyMember_id;

          // console.log("nodesDataNew = " , nodesDataNew)

          // console.log("memberData = " , memberData)

          // console.log("change = " , change)

          // add only the new ones as relationship on Neo4j
          for (let i = 0; i < nodesDataNew.length; i++) {
            let nodeNow = nodesDataNew[i];
            deleteConnectionANYBetweenNodes_neo4j({
              nodeID_1: memberData._id,
              nodeID_2: nodeNow._id,
            });

            changeMatchByServer(nodeNow, memberData);
          }
        }

        let memberData2 = await Members.findOneAndUpdate(
          { _id: memberID },
          {
            $set: {
              nodes: memberData.nodes,
            },
          },
          { new: true }
        );

        pubsub.publish(memberData2._id, {
          memberUpdated: memberData2,
        });
        return memberData2;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "tmemberQuery > findMember" }
        );
      }
    },
  // ),
  updateNodesToMemberMultiTypeNode: combineResolvers(
    IsAuthenticated,
    async (parent, args, req, info) => {
      let { nodesID, nodeType } = args.fields;

      let nodesID_level = undefined // it existed vefore, so I bring it again here to not have any errors, later we will fix it completly

      console.log(
        "Mutation > updateNodesToMemberMultiTypeNode > args.fields = ",
        args.fields
      );


      if (!(nodesID == undefined || nodesID_level == undefined))
        throw new ApolloError(
          "you need to use nodesID or nodesID_level, you cant use both"
        );

      try {
        let nodesID_level_obj = {};
        if (nodesID == undefined) {
          nodesID = nodesID_level.map((item) => item.nodeID);

          // change nodesID_level from array of objects to an object
          for (let i = 0; i < nodesID_level.length; i++) {
            let item = nodesID_level[i];
            nodesID_level_obj[item.nodeID] = item;
          }
        }
        console.log("nodesID_level_obj = ", nodesID_level_obj);

        let nodesData = await Node.find({ _id: nodesID }).select(
          "_id name node match_v2_update"
        );

        console.log("nodesData = ", nodesData);
        // sdf;

        // ---------- All nodes should be equal to nodeType or else throw error -----------
        nodesID_array = [];

        let nodeTypeObj = {}

        nodesData.forEach((node) => {
          nodesID_array.push(node._id.toString());

          if (nodeTypeObj[node.node] == undefined) {
            nodeTypeObj[node.node] = [node]
          } else {
            nodeTypeObj[node.node].push(node)
          }
          // if (node.node != nodeType) {
          //   throw new ApolloError(
          //     "All nodes should be equal to nodeType, problem on nodeID = " +
          //       node._id +
          //       " with name = " +
          //       node.name +
          //       " and node = " +
          //       node.node +
          //       ""
          //   );
          // }
        });
        // ---------- All nodes should be equal to nodeType or else throw error -----------

        // loop throw the nodeTypeObj and pass the different nodeType and the nodeIDs
        for (const [key, value] of Object.entries(nodeTypeObj)) {
          nodeType = key

          let nodesID = value.map((item) => item._id)

          console.log("nodesID = " , nodesID)
          console.log("nodeType = " , nodeType)

          let fields = {}

          fields.nodesID = nodesID
          fields.nodeType = nodeType
          fields.Authorization = req.headers.authorization

          // console.log("fields = " , fields)
          // sdf19

          userData = await updateNodesToMember(fields)
  
          // sdf99

        }

        // console.log("user = " , user)
        // sdf9

        // find the user and return 
        let memberData = await Members.findOne({ _id: userData._id })
        
        return memberData
        
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "updateNodesToMemberMultiTypeNode",
          { component: "memberMutation > updateNodesToMemberMultiTypeNode" }
        );
      }
    }
  ),
  updateNodesToMember: combineResolvers(
    IsAuthenticated,
    async (parent, args, { user }, info) => {
      let { nodesID, nodesID_level, nodeType } = args.fields;

      console.log(
        "Mutation > updateNodesToMember > args.fields = ",
        args.fields
      );

      if (!(nodesID == undefined || nodesID_level == undefined))
        throw new ApolloError(
          "you need to use nodesID or nodesID_level, you cant use both"
        );

      try {
        let nodesID_level_obj = {};
        if (nodesID == undefined) {
          nodesID = nodesID_level.map((item) => item.nodeID);

          // change nodesID_level from array of objects to an object
          for (let i = 0; i < nodesID_level.length; i++) {
            let item = nodesID_level[i];
            nodesID_level_obj[item.nodeID] = item;
          }
        }
        console.log("nodesID_level_obj = ", nodesID_level_obj);

        let nodesData = await Node.find({ _id: nodesID }).select(
          "_id name node match_v2_update"
        );

        console.log("nodesData = ", nodesData);
        // sdf;

        // ---------- All nodes should be equal to nodeType or else throw error -----------
        nodesID_array = [];
        nodesData.forEach((node) => {
          nodesID_array.push(node._id.toString());
          if (node.node != nodeType) {
            throw new ApolloError(
              "All nodes should be equal to nodeType, problem on nodeID = " +
                node._id +
                " with name = " +
                node.name +
                " and node = " +
                node.node +
                ""
            );
          }
        });
        // ---------- All nodes should be equal to nodeType or else throw error -----------

        let memberData = await Members.findOne({ _id: user._id }).select(
          "_id nodes"
        );

        let nodes_member_obj = {};
        for (let i = 0; i < memberData.nodes.length; i++) {
          let item = memberData.nodes[i];
          nodes_member_obj[item._id] = item;
        }
        console.log("nodes_member_obj = ", nodes_member_obj);

        // check if the nodes are already in the member (memberData.nodes)
        let nodesID_member = memberData.nodes.map(function (item) {
          return item._id.toString();
        });

        // --------- Separate all the Nodes, and the nodeTypes ----------------
        let nodeData_member_all = await Node.find({
          _id: nodesID_member,
        }).select("_id name node");

        // console.log("nodeData_member_all = ", nodeData_member_all);
        // // sdf;

        nodeData_member_type = [];
        nodeID_member_type = [];
        nodeID_member_all = [];
        nodeData_member_all.forEach((node, idx) => {
          nodeID_member_all.push(node._id.toString());
          // console.log(
          //   "change = ",
          //   nodes_member_obj[node._id.toString()].level,
          //   nodesID_level_obj[node._id.toString()].level
          // );

          if (nodes_member_obj[node._id] && nodesID_level_obj[node._id]) {
            if (
              nodes_member_obj[node._id].level ==
                nodesID_level_obj[node._id].level &&
              nodes_member_obj[node._id].orderIndex ==
                nodesID_level_obj[node._id].orderIndex
            ) {
              if (node.node == nodeType) {
                nodeData_member_type.push(node);
                nodeID_member_type.push(node._id.toString());
              }
            }
          } else {
            if (node.node == nodeType) {
              nodeData_member_type.push(node);
              nodeID_member_type.push(node._id.toString());
            }
          }

          nodeData_member_all[idx] = {
            ...nodeData_member_all[idx]._doc,
            ...nodes_member_obj[node._id.toString()]._doc,
            ...nodesID_level_obj[node._id.toString()],
          };
        });

        // asfd;

        console.log("nodesID_array = ", nodesID_array);
        console.log("nodeID_member_type = ", nodeID_member_type);

        console.log("nodeData_member_all = ", nodeData_member_all);
        // asdf;

        // --------- Separate all the Nodes, and the nodeTypes ----------------

        // asdf;

        /// --------------- Add Nodes that Don't exist already on the member for this specific type of node ----------------
        let differenceNodes = nodesID_array.filter(
          (x) => !nodeID_member_type.includes(x)
        );
        console.log("differenceNodes = ", differenceNodes);

        // asf;
        if (differenceNodes.length > 0) {
          let nodesDataNew = [];
          for (let i = 0; i < differenceNodes.length; i++) {
            let nodeID = differenceNodes[i];
            let nodeData = nodesData.find(
              (x) => x._id.toString() == nodeID.toString()
            );

            if (nodesID_level != undefined) {
              // caluclate the skill level and add it to the nodes for the next phase
              let nodeNow_weight = await calculate_skill_level(
                nodesID_level_obj[nodeID]
              );

              // console.log("nodeNow_weight = ", nodeNow_weight);
              // sadf;

              nodesDataNew.push({
                ...nodeData._doc,
                weight: nodeNow_weight.weight_total,
              });
              nodeData_member_all.push({
                _id: nodeID,
                orderIndex: nodeNow_weight.orderIndex,
                level: nodeNow_weight.level,
                weight: nodeNow_weight.weight_total,
                aboveNodes: nodesID_level_obj[nodeID].aboveNodes,
              });
            } else {
              nodesDataNew.push(nodeData);
              nodeData_member_all.push({ _id: nodeID });
            }
            // nodesDataNew.push(nodeData);
            // nodeData_member_all.push({ _id: nodeID });
          }

          // console.log("nodesDataNew = ", nodesDataNew);

          // asdf;

          // add only the new ones as relationship on Neo4j
          for (let i = 0; i < nodesDataNew.length; i++) {
            let nodeNow = nodesDataNew[i];

            if (nodeNow.weight != undefined) {
              makeConnection_neo4j({
                node: [nodeNow.node, "Member"],
                id: [nodeNow._id, memberData._id],
                connection: "connection",
                weight: nodeNow.weight.toFixed(3),
              });
            } else {
              makeConnection_neo4j({
                node: [nodeNow.node, "Member"],
                id: [nodeNow._id, memberData._id],
                connection: "connection",
              });
            }

            changeMatchByServer(nodeNow, memberData);
          }
        }
        /// --------------- Add Nodes that Don't exist already on the member for this specific type of node ----------------

        // -------------- Remove the Nodes that are not in the nodesID_array ----------------
        let nodesExistMemberAndNode = nodeID_member_type.filter((x) =>
          nodesID_array.includes(x)
        );
        console.log("nodesExistMemberAndNode = ", nodesExistMemberAndNode);

        let nodeExistOnlyMember = nodeID_member_type.filter(
          (x) => !nodesID_array.includes(x)
        );
        console.log("nodeExistOnlyMember = ", nodeExistOnlyMember);
        console.log("nodeID_member_type = ", nodeID_member_type);
        console.log("nodesID_array = ", nodesID_array);
        // asd;

        // console.log("change = " , change)

        if (nodeExistOnlyMember.length > 0) {
          nodeData_member_all = nodeData_member_all.filter(
            (element) => !nodeExistOnlyMember.includes(element._id.toString())
          );

          console.log("nodeData_member_all = ", nodeData_member_all);

          console.log("nodeExistOnlyMember = ", nodeExistOnlyMember);

          // add only the new ones as relationship on Neo4j
          for (let i = 0; i < nodeExistOnlyMember.length; i++) {
            let nodeNow = { _id: nodeExistOnlyMember[i] };
            deleteConnectionANYBetweenNodes_neo4j({
              nodeID_1: memberData._id,
              nodeID_2: nodeNow._id,
            });

            changeMatchByServer(nodeNow, memberData);
          }
        }
        // -------------- Remove the Nodes that are not in the nodesID_array ----------------

        console.log("nodeData_member_all = ", nodeData_member_all);
        // asdf;

        memberData2 = await Members.findOneAndUpdate(
          { _id: user._id },
          {
            $set: {
              nodes: nodeData_member_all,
            },
          },
          { new: true }
        );
        pubsub.publish(memberData2._id, {
          memberUpdated: memberData2,
        });

        return memberData2;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "tmemberQuery > findMember" }
        );
      }
    }
  ),
  // deleteMember: combineResolvers(
  //   IsAuthenticated,
  //   async (parent, args, { user }, info) => {
  //     const { memberID } = args.fields;

  //     if (!user && user.accessLevel > ACCESS_LEVELS.OPERATOR_ACCESS)
  //       throw new ApolloError("Not Authorized");

  //     console.log("Mutation > deleteMember > args.fields = ", args.fields);

  //     if (!memberID) throw new ApolloError("memberID is required");

  //     try {
  //       let memberData = await Members.findOne({ _id: memberID });

  //       if (!memberData) throw new ApolloError("memberID not found");

  //       // console.log("memberData = " , memberData)

  //       // get all nodes from memberData.nodes
  //       let nodesData = await Node.find({
  //         _id: memberData.nodes.map(function (item) {
  //           return item._id.toString();
  //         }),
  //       });

  //       // console.log("nodesData = " , nodesData)

  //       // console.log("change = " , change)

  //       // console.log("change = " , change)

  //       // add only the new ones as relationship on Neo4j
  //       for (let i = 0; i < nodesData.length; i++) {
  //         let nodeNow = nodesData[i];
  //         deleteConnectionANYBetweenNodes_neo4j({
  //           nodeID_1: memberData._id,
  //           nodeID_2: nodeNow._id,
  //         });

  //         changeMatchByServer(nodeNow, memberData);
  //       }

  //       deleteNode_neo4j({
  //         nodeID: memberData._id,
  //       });

  //       // delete memberData from mongoDB database
  //       memberData2 = await Members.findOneAndDelete({ _id: memberID });

  //       return memberData2;
  //     } catch (err) {
  //       throw new ApolloError(
  //         err.message,
  //         err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
  //         { component: "tmemberQuery > findMember" }
  //       );
  //     }
  //   }
  // ),
  deleteMember: async (parent, args, { user }, info) => {
      const { memberID } = args.fields;


      console.log("Mutation > deleteMember > args.fields = ", args.fields);

      if (!memberID) throw new ApolloError("memberID is required");

      try {
        let memberData = await Members.findOne({ _id: memberID });

        if (!memberData) throw new ApolloError("memberID not found");


        // ------------ Find Positions that is subscribed to ----------
        let positionsData = await Position.find({
          "candidates.userID": memberID,
        }).select('_id candidates')


        for (let i = 0; i < positionsData.length; i++) {
          let positionNow = positionsData[i];

          // find index of the candidate
          let index_ = positionNow.candidates.findIndex(
            (x) => x.userID.toString() == memberID.toString()
          );


          // remove the candidate
          positionNow.candidates.splice(index_, 1);

          await positionNow.save();

        }
        // ------------ Find Positions that is subscribed to ----------

        // get all nodes from memberData.nodes
        let nodesData = await Node.find({
          _id: memberData.nodes.map(function (item) {
            return item._id.toString();
          }),
        });

        // console.log("nodesData = " , nodesData)

        // console.log("change = " , change)

        // console.log("change = " , change)

        // add only the new ones as relationship on Neo4j
        for (let i = 0; i < nodesData.length; i++) {
          let nodeNow = nodesData[i];
          deleteConnectionANYBetweenNodes_neo4j({
            nodeID_1: memberData._id,
            nodeID_2: nodeNow._id,
          });

          changeMatchByServer(nodeNow, memberData);
        }

        deleteNode_neo4j({
          nodeID: memberData._id,
        });

        // delete memberData from mongoDB database
        memberData2 = await Members.findOneAndDelete({ _id: memberID });

        return memberData2;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "tmemberQuery > findMember" }
        );
      }
    },

  addPreferencesToMember: combineResolvers(
    IsAuthenticated,
    async (parent, args, { user }, info) => {
      const { memberID } = args.fields;
      let { preferences } = args.fields;
      console.log(
        "Mutation > addPreferencesToMember > args.fields = ",
        args.fields
      );

      if (!memberID) throw new ApolloError("memberID is required");

      if (memberID !== user._id) throw new ApolloError("Not Authorized");

      if (!preferences) preferences = [];

      try {
        let memberData = await Members.findOne({ _id: memberID }).select(
          "_id name preferences"
        );
        if (!memberData) throw new ApolloError("Member not found");

        let current_preferences = memberData.preferences;

        console.log("current_preferences = ", current_preferences);

        for (let i = 0; i < preferences.length; i++) {
          let preferenceNow = preferences[i];

          // preferenceNow.preference -> the enum that determine what to change
          if (preferenceNow.notify !== undefined)
            current_preferences[preferenceNow.preference].notify =
              preferenceNow.notify;
          if (preferenceNow.percentage !== undefined)
            current_preferences[preferenceNow.preference].percentage =
              preferenceNow.percentage;
          if (preferenceNow.interestedMatch !== undefined)
            current_preferences[preferenceNow.preference].interestedMatch =
              preferenceNow.interestedMatch;

          // preferenceNow.pastSearch.map((x) => x);

          // console.log(
          //   "change = ",
          //   preferenceNow.pastSearch.map((x) => x)
          // );

          if (preferenceNow.pastSearch && preferenceNow.pastSearch.length > 0) {
            preferenceNow.pastSearch.forEach((x) => {
              current_preferences[preferenceNow.preference].pastSearch.push(x);
            });

            // current_preferences[preferenceNow.preference].pastSearch.push(
            //   preferenceNow.pastSearch.map((x) => x)
            // );
            // current_preferences[preferenceNow.preference].pastSearch =
            //   preferenceNow.pastSearch.map((x) => x);
          }
        }

        const optionsPref = [
          "findUser",
          "findCoFounder",
          "findMentor",
          "findMentee",
          "findProject",
        ];

        notify_global = false;
        interestedMatch_global = false;
        for (let i = 0; i < optionsPref.length; i++) {
          let optionNow = optionsPref[i];
          if (current_preferences[optionNow].notify == true)
            notify_global = true;
          if (current_preferences[optionNow].interestedMatch == true)
            interestedMatch_global = true;
        }
        console.log("notify_global = ", notify_global);
        console.log("interestedMatch_global = ", interestedMatch_global);

        current_preferences.notify = notify_global;
        current_preferences.interestedMatch = interestedMatch_global;

        memberData = await Members.findOneAndUpdate(
          { _id: memberID },
          { preferences: current_preferences },
          { new: true }
        );

        // console.log("memberData.projects = ", memberData.projects);

        pubsub.publish(memberData._id, {
          memberUpdated: memberData,
        });
        return memberData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "tmemberQuery > findMember" }
        );
      }
    }
  ),
  addFavoriteProject: combineResolvers(
    IsAuthenticated,
    async (parent, args, { user }, info) => {
      const memberID = user._id;
      const { projectID, favorite } = args.fields;
      console.log(
        "Mutation > addFavoriteProject > args.fields = ",
        args.fields
      );
      if (!memberID) throw new ApolloError("memberID is required");
      if (!projectID) throw new ApolloError("projectID is required");
      if (favorite == null) throw new ApolloError("favorite is required");

      try {
        let memberData = await Members.findOne({ _id: memberID });
        if (!memberData) throw new ApolloError("Member not found");

        let projectData = await Projects.findOne({ _id: projectID });
        if (!projectData) throw new ApolloError("Project not found");

        let currentProjects = [...memberData.projects];

        currentProjects.push({
          projectID: projectID,
          champion: false,
          favorite: favorite,
        });

        memberData = await Members.findOneAndUpdate(
          { _id: memberID },
          { projects: currentProjects },
          { new: true }
        );

        console.log("memberData.projects = ", memberData.projects);

        pubsub.publish(memberData._id, {
          memberUpdated: memberData,
        });
        return memberData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "tmemberQuery > findMember" }
        );
      }
    }
  ),
  endorseAttribute: async (parent, args, context, info) => {
    const { _id, attribute } = args.fields;
    console.log("Mutation > endorseAttribute > args.fields = ", args.fields);

    if (!_id) throw new ApolloError("_id is required");
    if (!attribute) throw new ApolloError("attribute is required");

    let fields = {
      _id,
      attribute,
    };

    // console.log("fields = " , fields)

    try {
      let membersData = await Members.findOne({ _id: fields._id });

      if (!membersData) throw new ApolloError("Member not found");

      console.log("membersData.attributes = ", membersData.attributes);
      console.log("membersData.attributes = ", membersData.attributes.Director);
      console.log("membersData.attributes = ", !membersData.attributes);
      console.log(
        "membersData.attributes = ",
        membersData.attributes.Director == undefined
      );
      console.log(
        "membersData.attributes = ",
        !membersData.attributes || membersData.attributes.Director != undefined
      );

      let newAttributes;
      if (
        !membersData.attributes ||
        membersData.attributes.Director == undefined
      ) {
        console.log("change = 1");
        newAttributes = {
          Director: 0,
          Motivator: 0,
          Inspirer: 0,
          Helper: 0,
          Supporter: 0,
          Coordinator: 0,
          Observer: 0,
          Reformer: 0,
        };

        newAttributes[attribute] = 1;

        membersData = await Members.findOneAndUpdate(
          { _id: fields._id },
          { attributes: newAttributes },
          { new: true }
        );
      } else {
        console.log("change = 2");
        newAttributes = { ...membersData.attributes };
        newAttributes[attribute] = newAttributes[attribute] + 1;
        membersData = await Members.findOneAndUpdate(
          { _id: fields._id },
          { attributes: newAttributes },
          { new: true }
        );
      }

      console.log("membersData = ", membersData);

      // console.log("change = 1" )
      // if (!membersData ){
      //   membersData = await new Members(fields);

      //   membersData.save()

      //   membersData = membersData
      // } else {

      //   membersData = await Members.findOneAndUpdate({ _id: fields._id }, fields, { new: true });
      // //console.log("change = 2" )
      // }

      //console.log("membersData.attribute = " , membersData.attribute)

      return membersData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },

  // DEPRECATED
  // addSkillToMember: async (parent, args, context, info) => {
  //   const { skillID, memberID, authorID, serverID } = args.fields;
  //   console.log("Mutation > addSkillToMember > args.fields = ", args.fields);

  //   if (!skillID) throw new ApolloError("skillID is required");
  //   if (!memberID) throw new ApolloError("memberID is required");
  //   if (!authorID) throw new ApolloError("authorID is required");

  //   let queryServerID = [];
  //   if (serverID) {
  //     serverID.forEach((id) => {
  //       queryServerID.push({ serverID: id });
  //     });
  //   }

  //   try {
  //     let fieldUpdate = {};

  //     let member; //= await Members.findOne({ _id: memberID })
  //     if (queryServerID.length > 0) {
  //       member = await Members.findOne({
  //         $and: [{ _id: memberID }, { $or: queryServerID }],
  //       });
  //     } else {
  //       member = await Members.findOne({ _id: memberID });
  //     }

  //     let authorInfo; //= await Members.findOne({ _id: authorID })
  //     if (queryServerID.length > 0) {
  //       authorInfo = await Members.findOne({
  //         $and: [{ _id: authorID }, { $or: queryServerID }],
  //       });
  //     } else {
  //       authorInfo = await Members.findOne({ _id: authorID });
  //     }

  //     let skill = await Skills.findOne({ _id: skillID });

  //     if (!member)
  //       throw new ApolloError(
  //         "member dont exist, or the author and member are not in the same server"
  //       );
  //     if (!authorInfo)
  //       throw new ApolloError(
  //         "author dont exist, or the author and member are not in the same server"
  //       );
  //     if (!skill)
  //       throw new ApolloError(
  //         "skill dont exist, you need to first creaet the skill "
  //       );

  //     // console.log("change = " , skill,authorInfo,member)

  //     let newSkills;

  //     let skillExist = true;
  //     let makeAnUpdate = false;

  //     // add skill edge from author to member & add skill edge from member to skill node
  //     if (member._id !== authorInfo._id) {
  //       await makeConnection_neo4j({
  //         node: ["Member", "Skill"],
  //         id: [member._id, skill._id],
  //         connection: "SKILL",
  //       });
  //       await makeConnection_neo4j({
  //         node: ["Member", "Member"],
  //         id: [authorInfo._id, member._id],
  //         connection: "ENDORSE",
  //       });
  //     } else {
  //       //when author endorses themselves only add skill edge from member to skill node
  //       await makeConnection_neo4j({
  //         node: ["Member", "Skill"],
  //         id: [member._id, skill._id],
  //         connection: "SKILL",
  //       });
  //     }

  //     // Recalculate the skill match now that neo4j diagram changed
  //     await Skills.findOneAndUpdate(
  //       { _id: skill._id },
  //       {
  //         $set: {
  //           match: {
  //             recalculateProjectRoles: true,
  //             distanceProjectRoles: skill.distanceProjectRoles,

  //             recalculateMembers: true,
  //             distanceMembers: skill.distanceMembers,
  //           },
  //         },
  //       },
  //       { new: true }
  //     );

  //     // check all the skills, if the skill is already in the member, then update the author
  //     const updatedSkills = member.skills.map((skillMem) => {
  //       if (skillMem.id.equals(skill._id) === true) {
  //         skillExist = false;

  //         if (!skillMem.authors.includes(authorID)) {
  //           // If the skill already exist but the author is not in the list, add it
  //           makeAnUpdate = true;

  //           skillMem.authors.push(authorID);

  //           return skillMem;
  //         } else {
  //           return skillMem;
  //         }
  //       } else {
  //         return skillMem;
  //       }
  //     });

  //     //console.log("change = 1" )

  //     // ---------- Network Member-----------
  //     let networkMember;
  //     let flagMemberExist = false;
  //     member.network.forEach((net) => {
  //       // console.log("net = " , net,net.memberID == authorID,net.memberID , authorID)
  //       // if (net.memberID.equals(authorID)===true){
  //       if (net.memberID == authorID) {
  //         flagMemberExist = true;
  //       }
  //     });
  //     //console.log("change = 2" )

  //     if (flagMemberExist === false) {
  //       networkMember = member.network.concat({ memberID: authorID });
  //     } else {
  //       networkMember = member.network;
  //     }
  //     // ---------- Network Member-----------

  //     //console.log("change = 2.5",authorInfo.network )
  //     // ---------- Network Author-----------
  //     let networkAuthor;
  //     flagMemberExist = false;
  //     authorInfo.network.forEach((net) => {
  //       if (net.memberID == authorID) {
  //         flagMemberExist = true;
  //       }
  //     });
  //     //console.log("change = 2.7" )

  //     if (flagMemberExist === false) {
  //       networkAuthor = authorInfo.network.concat({ memberID: member._id });
  //     } else {
  //       networkAuthor = authorInfo.network;
  //     }
  //     // ---------- Network Author-----------

  //     //console.log("change = 3" )

  //     let updateMembers = skill.members;
  //     // if the skill is not in the member, then add it
  //     if (skillExist === true) {
  //       makeAnUpdate = true;
  //       updatedSkills.push({
  //         id: skill._id,
  //         authors: [authorID],
  //       });
  //       updateMembers.push(member._id);
  //     }

  //     //console.log("change = 4" ,updatedSkills)
  //     //console.log("change = 4" ,networkMember)

  //     let newMember, newSkill;
  //     if (makeAnUpdate) {
  //       member = await Members.findOneAndUpdate(
  //         { _id: member._id },
  //         {
  //           $set: {
  //             skills: updatedSkills,
  //             network: networkMember,
  //           },
  //         },
  //         { new: true }
  //       );

  //       //console.log("change = 5" )

  //       authorInfo = await Members.findOneAndUpdate(
  //         { _id: authorInfo._id },
  //         {
  //           $set: {
  //             network: networkAuthor,
  //           },
  //         },
  //         { new: true }
  //       );

  //       //console.log("change = 6" )

  //       skill = await Skills.findOneAndUpdate(
  //         { _id: skill._id },
  //         {
  //           $set: {
  //             members: updateMembers,
  //           },
  //         },
  //         { new: true }
  //       );
  //     }

  //     //console.log("member = " , member)

  //     //console.log("networkAuthor 22 - = " , networkAuthor)
  //     //console.log("authorInfo 22 - = " , authorInfo)

  //     member = {
  //       ...member._doc,
  //       // skills: []
  //     };
  //     //console.log("Context", context)
  //     pubsub.publish(member._id, {
  //       memberUpdated: member,
  //     });
  //     return member;
  //   } catch (err) {
  //     throw new ApolloError(
  //       err.message,
  //       err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
  //       { component: "tmemberQuery > findMember" }
  //     );
  //   }
  // },
  memberUpdated: {
    subscribe: (parent, args, context, info) => {
      //console.log("Context", parent)
      const { _id, serverID } = args.fields;
      const temp = _id ? _id : "";

      return pubsub.asyncIterator(temp);
    },
  },
  // addEndorsement: async (parent, args, context, info) => {
  //   const { endorserID, endorseeID, endorsementMessage, discussion,stars,endorseOrReview,endorseNodes,stake,income } = args.fields;
  //   console.log("Mutation > addEndorsement > args.fields = ", args.fields);

  //   if (endorsementMessage && discussion) {
  //     throw new ApolloError(
  //       "You should either give the message, or the discussion as input, not both "
  //     );
  //   }
  //   try {
  //     if (!endorseeID || !endorserID)
  //       throw new Error(
  //         "The endorsee, endorser is required🔥"
  //       );

  //     if (stake && income) throw new Error("You can't have both stake and income, becuase you can only review or endorse | Review -> Income | Endorse -> Stake")

  //     if (endorseOrReview == "ENDORSE" && income) throw new Error("You can't have income when you endorse | Review -> Income | Endorse -> Stake")

  //     if (endorseOrReview == "REVIEW" && stake) throw new Error("You can't have stake when you review | Review -> Income | Endorse -> Stake")

  //     //verify if the endorser and endorsee exist
  //     let [endorserMember, endorseeMember] = await Promise.all([
  //       Members.findOne({ _id: endorserID }).select('_id name'),
  //       Members.findOne({ _id: endorseeID }).select('_id name endorsements'),
  //     ]);

  //     if (!endorseeMember) throw new ApolloError("The endorsee record missing");
  //     if (!endorserMember) throw new ApolloError("The endorser record missing");


  //     let newEndorsement = {
  //       endorser: endorserID,
  //       endorsee: endorseeID,
  //     }

  //     if (stars) newEndorsement.stars = stars
  //     if (endorseOrReview) newEndorsement.endorseOrReview = endorseOrReview

  //     if (endorsementMessage){
  //       newEndorsement.endorsementMessage = endorsementMessage
  //     } else if (discussion) {
  //       // -------------- Prompt of the conversation ------------
  //       let prompt_discussion = "Endorcment conversation:";
  //       let roleN
  //       for (let i = 0; i < discussion.length; i++) {
  //         roleN = "Endorser"
  //         if (discussion[i].role == "assistant") roleN = "Recruiter"
  //         prompt_discussion = prompt_discussion + "\n" + roleN + ": " + discussion[i].content;

  //       }
  //       prompt_summary=""
  //       prompt_summary += prompt_discussion 

  //       prompt_summary = prompt_summary + "\n\n" + "Summarize the endorsement in 2 sentenses given in this conversation in two sentences, Write it like the endorser is talking:"
  //       console.log("prompt_summary = " , prompt_summary)
  //       // -------------- Prompt of the conversation ------------
  //       let summaryGPT = await useGPTchatSimple(prompt_summary)

  //       console.log("summaryGPT = " , summaryGPT)

  //       newEndorsement.endorsementMessage = summaryGPT
  //     }

  //     if (endorseNodes) {
  //       // endorseNodes only take the nodeID and put them on mongoDB
  //       let endorseNodesIDArr = []
  //       let endorseNodesObj = {}
  //       for (let i = 0; i < endorseNodes.length; i++) {
  //         if (!endorseNodesObj[endorseNodes[i].nodeID]) {
  //           endorseNodesObj[endorseNodes[i].nodeID] = endorseNodes[i]
  //           endorseNodesIDArr.push(endorseNodes[i].nodeID)
  //         }
  //       }

  //       nodeData = await Node.find({ _id: endorseNodesIDArr }).select('_id name')

  //       console.log("nodeData = " , nodeData)

  //       nodesSave = []
  //       for (let i = 0; i < nodeData.length; i++) {
          
  //         console.log("nodeData[i]._id = " , nodeData[i]._id)
  //         endorseNodesObj[nodeData[i]._id] = {
  //           ...endorseNodesObj[nodeData[i]._id],
  //           ...nodeData[i]._doc
  //         }
  //         nodesSave.push(endorseNodesObj[nodeData[i]._id])
  //         // SOS 🆘 -> This is the place that you update the profile of the user for the Node and you make it more trust worthy this specific node
  //       }

  //       console.log("done = " )

  //       newEndorsement.endorseNodes = nodesSave
  //       newEndorsement.discussion = discussion
  //     }

  //     if (endorserID) newEndorsement.endorser = endorserID

  //     if (stake) newEndorsement.stake = stake

  //     if (income) newEndorsement.income = income

  //     // console.log("newEndorsement = " , newEndorsement)



  //     // ----------- Save to Arweave ------------
  //     // const fileObject = {
  //     //   endorserDiscordName: endorserMember.discordName,
  //     //   endorseeDiscordName: endorseeMember.discordName,
  //     //   message: endorsementMessage,
  //     // };

  //     //const transactionId = await uploadFileToArweave(fileObject);
  //     // if (!transactionId)
  //     //   throw new Error(
  //     //     "No transactionID, check your env if Arweave token is included"
  //     //   );
  //     // //save the endorsement to the member
  //     // ----------- Save to Arweave ------------


  //     // let newEndorsement = {
  //     //   endorser: endorserID, //memberID
  //     //   endorsementMessage: endorsementMessage,
  //     //   //arweaveTransactionID: transactionId,
  //     //   arweaveTransactionID: "https://www.arweave.org/",
  //     // };

  //     newEndorsement.arweaveTransactionID = "https://www.arweave.org/"

  //     let previousEndorsements = endorseeMember.endorsements || [];
  //     previousEndorsements.push(newEndorsement);

  //     console.log("previousEndorsements = " , previousEndorsements)

  //     // --------------- change Summary Endorse --------------
  //     let endorseReviewUpdate = {}
  //     if (endorseOrReview == "ENDORSE") {
  //       let endorseSummaryNew = {
  //         totalStars: 0,
  //         totalStake: 0,
  //         numberEndorsement: 0,
  //         endorsers: [],
  //         mainNodes: {},
  //       }

  //       let prompotAllsummary = ""
  //       for (let i = 0; i < previousEndorsements.length; i++) {
  //         if (previousEndorsements[i].endorseOrReview == "ENDORSE") {
  //           endorseSummaryNew.totalStars += previousEndorsements[i].stars
  //           endorseSummaryNew.totalStake += previousEndorsements[i].stake
  //           endorseSummaryNew.numberEndorsement += 1
  //           endorseSummaryNew.endorsers.push(previousEndorsements[i].endorser)

  //           prompotAllsummary +=  "Endorsement " + i + " " + previousEndorsements[i].endorsementMessage + "\n"

  //           for (let j = 0; j < previousEndorsements[i].endorseNodes.length; j++) {
  //             let nodeIDnow = previousEndorsements[i].endorseNodes[j].nodeID

  //             if (!endorseSummaryNew.mainNodes[nodeIDnow]) {
  //               endorseSummaryNew.mainNodes[nodeIDnow] = {
  //                 nodeID: nodeIDnow,
  //                 numberEndorsement: 1
  //               }
  //             } else {
  //               endorseSummaryNew.mainNodes[nodeIDnow].numberEndorsement += 1
  //             }
  //           }
  //         }
  //       }

  //       endorseSummaryNew.averageStars = endorseSummaryNew.totalStars / endorseSummaryNew.numberEndorsement

  //       prompt_n = prompt_n + "\n\n" + "Summarize the endorsement in 3 sentenses given all the endorsements below"

  //       prompt_n = prompt_n + "\n\n" + prompotAllsummary

  //       console.log("prompt_n = " , prompt_n)
  //       // -------------- Prompt of the conversation ------------
  //       let summaryGPT = await useGPTchatSimple(prompt_n)

  //       console.log("summaryGPT = " , summaryGPT)

  //       endorseSummaryNew.summary = summaryGPT

  //       endorseReviewUpdate = {
  //         endorseSummary: endorseSummaryNew
  //       }

  //     } else if (endorseOrReview == "REVIEW") {

  //     }
  //     // --------------- change Summary Endorse --------------

  //     // --------------- change Summary Review --------------
  //     // --------------- change Summary Review --------------



  //     endorseeMember = await Members.findOneAndUpdate(
  //       {
  //         _id: endorseeID,
  //       },
  //       {
  //         $set: { 
  //           endorsements: previousEndorsements,
  //           ...endorseReviewUpdate,
  //         },
  //       },
  //       {
  //         new: true,
  //       }
  //     );

  //     return endorseeMember;
  //   } catch (err) {
  //     throw new ApolloError(
  //       err.message,
  //       err.extensions?.code || "addEndorsement",
  //       { component: "memberMutation > addEndorsement" }
  //     );
  //   }
  // },
  uploadUserDataGPT: async (parent, args, context, info) => {
    const { memberID } = args.fields;
    console.log("Mutation > uploadUserDataGPT > args.fields = ", args.fields);


    if (!memberID) throw new Error("The memberID is required🔥");
    
    let membersData = await Members.findOne({ _id: memberID });


    try {

      console.log("membersData = " , membersData)


      // ------------ Upload Bio ------------
      upsertDoc = await upsertEmbedingPineCone({
        text: membersData.bio,
        _id: memberID,
        label: "bio",
        category: "user_data"
      })
      // ------------ Upload Bio ------------

      // ------------ Upload Nodes ------------
      // membersData to IDs
      let nodesID = membersData.nodes.map((item) => item._id)
      let nodesData = await Node.find({ _id: nodesID }).select("_id name")
      
      for (let i = 0; i < nodesData.length; i++) {
        const node = nodesData[i];
        upsertDoc = await upsertEmbedingPineCone({
          text: node.name,
          _id: memberID,
          label: "node",
          category: "user_data"
        })
      }
      // ------------ Upload Nodes ------------

      // ------------ Upload previousProjects ------------
      for (let i = 0; i < membersData.previousProjects.length; i++) {
        const project = membersData.previousProjects[i];
        upsertDoc = await upsertEmbedingPineCone({
          text: "Project Title: " + project.title + "\n" + "Project Description: " + project.description,
          _id: memberID,
          label: "previusProject",
          category: "user_data"
        })
      }
      // ------------ Upload previousProjects ------------


      return membersData

    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "uploadUserDataGPT",
        { component: "memberMutation > uploadUserDataGPT" }
      );
    }
  },
  updateMemberSignalInfo: async (parent, args, context, info) => {
    const { memberID, hoursPerWeek, timeZone, location, totalIncome, completedOpportunities } = args.fields;
    console.log("Mutation > updateMemberSignalInfo > args.fields = ", args.fields);

    if (!memberID) throw new Error("The memberID is required🔥");

    try {

      let memberData = await Members.findOne({ _id: memberID }).select('_id discordName discordID hoursPerWeek timeZone location totalIncome completedOpportunities');

      if (!memberData) throw new Error("The memberID is not valid🔥 can't find member");


      printC(memberData,"1","memberData","b")



      // update all the fields
      if (hoursPerWeek) memberData.hoursPerWeek = hoursPerWeek
      if (timeZone) memberData.timeZone = timeZone
      if (location) memberData.location = location
      if (totalIncome) memberData.totalIncome = totalIncome
      if (completedOpportunities) memberData.completedOpportunities = completedOpportunities



      // save the member
      memberData = await memberData.save()
      
      printC(memberData,"2","memberData","b")



      return memberData;

    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "updateMemberSignalInfo",
        { component: "memberMutation > updateMemberSignalInfo" }
      );
    }
  },
  createFakeUser: async (parent, args, context, info) => {
    const { memberID,expertise,interests } = args.fields;
    console.log("Mutation > createFakeUser > args.fields = ", args.fields);
    try {

      
      let userData = {}

      // --------- make random ID --------
      if (memberID){
        userData = await Members.findOne({ _id: memberID });

        if (userData){
          userData.alreadyExist = true
        } else {
          userData.alreadyExist = true
        }
      } else {
        userData.alreadyExist = false
      }

      printC(userData,"1","userData","b")


      if (!userData?._id){
        const randomID = await generateRandomID(18)
        // console.log("randomID = " , randomID) // TODO: remove
        userData._id = randomID
      } else {
        randomID = userData._id
      }

      console.log("DONE - ID = " )
      // --------- make random ID --------

      let nodeArr = []
      let nodeObj = {}
      if (!userData?._id){
        // ----------- array of IDs and object of nodes -----------
        res = await arrayToKeyObject(expertise,"expertise")
        res2 = await arrayToKeyObject(interests,"interest")

        nodeArr = [...res.nodeArr, ...res2.nodeArr]
        nodeObj = {...res.nodeObj, ...res2.nodeObj}

        const expertiseInterest = [...nodeArr]
        // ----------- array of IDs and object of nodes -----------

        // --------- Find Nodes ------------
        let nodesData = await Node.find({ _id: nodeArr }).select("-match_v2_update -match_v2  -aboveNodes -state");
        console.log("nodesData = " , nodesData) // TODO: remove
        console.log("nodesData = " , nodesData.length) // TODO: remove
        // asdf5
        // --------- Find Nodes ------------

        // --------- Find SubNodes ---------
        nodeArr = []
        for (const node of nodesData) {
          let extraNodes = []
          if (node?.subNodes?.length > 0 ){
            extraNodes = [...extraNodes, ...node.subNodes]
          } 
          if (node?.relatedNodes?.length > 0 ){
            extraNodes = [...extraNodes, ...node.relatedNodes]
          }


          numberNodes = nodeObj[node._id].numberNodes

          console.log("numberNodes = " , numberNodes)
          console.log("extraNodes = " , extraNodes)

          let relatedNodesData = await Node.find({ _id: extraNodes }).select("_id name node");

          acceptedExtraNodes = []
          for (const relatedNode of relatedNodesData) {
            if (relatedNode.node == "Skill"){
              acceptedExtraNodes = [...acceptedExtraNodes, relatedNode._id]
            }
          }
          console.log("acceptedExtraNodes = " , acceptedExtraNodes)

          // asdf9
          

          // get numberNodes random nodes from extraNodes
          const randomExtraNodes = await getRandomIDs(acceptedExtraNodes, numberNodes)
          // console.log("randomExtraNodes = " , randomExtraNodes) // TODO: remove
          nodeArr = [...nodeArr, ...randomExtraNodes]

          nodeObj[node._id] = {
            ...nodeObj[node._id], 
            ...node._doc,
            nodesAddUser: randomExtraNodes
          }
        }
        console.log("expertiseInterest = " , expertiseInterest)
        
        // --------- Find ExtraNodes ---------

        // --------- Find Nodes ------------
        nodesData = await Node.find({ _id: nodeArr }).select("-match_v2_update -match_v2 -subNodes -relatedNodes -aboveNodes -state");
        
        categoryDataNow = {}
        groupDataNode = {}
        for (const node of nodesData) {

          if (node.categoryNodes.length > 0){
            categoryData = await Node.findOne({ _id: node.categoryNodes[0] }).select("_id name node");
          }

          if (node.groupNodes.length > 0){
            groupData = await  Node.findOne({ _id: node.groupNodes[0] }).select("_id name node");
          }

          nodeObj[node._id] = {
            ...nodeObj[node._id], 
            ...node._doc,
            category: categoryData.name,
            group: groupData.name
          }
        }
        // --------- Find Nodes ------------


        console.log("DONE - Nodes = " )
        // ------------ Upload Nodes ------------
        for (let i = 0; i < nodesData.length; i++) {
          const node = nodesData[i];
          upsertDoc = await upsertEmbedingPineCone({
            text: node.name,
            _id: randomID,
            label: "node",
            category: "user_data"
          })
        }
        // ------------ Upload Nodes ------------
      } else {
        for (const node of userData.nodes) {
          nodeArr = [...nodeArr, node._id]
        }

        nodeData = await Node.find({ _id: nodeArr }).select("-match_v2_update -match_v2 -subNodes -relatedNodes -aboveNodes -state");

        for (const node of nodeData) {
          nodeObj[node._id] = {
            ...node._doc,
          }
        }
      }

      

      // --------- Get Avatar for user --------
      if (!userData?.discordAvatar){
        const avatarUser = await randomPicture()
        userData.discordAvatar = avatarUser
      }
      // --------- Get Avatar for user --------

      console.log("DONE - Avatar = " )


      



      // --------- Server IDs -----------
      if (!userData?.serverID){
        serverID =  [
          "883478451850473483",
          "996558082098339953",
          "988301790795685930",
          "695578393957236816",
          "1005112113754284112"
        ]
        userData.serverID = serverID
      }
      // --------- Server IDs -----------

      // -------- Expertise and Interst Prompt ------
      let expertiseInterestPrompt = "This is my skills and interests: \n"

      if (!userData?.nodes){
        for (const node of expertiseInterest) {
          const nodeCategoryInfo = nodeObj[node]
          for (const nodeInfo of nodeCategoryInfo.nodesAddUser) {
              expertiseInterestPrompt += " - Skill: " + nodeObj[nodeInfo].name + " - Category: " + nodeObj[nodeInfo].category + " - Group: " + nodeObj[nodeInfo].group  + "\n"

          }

        }
      } else {
        for (const key in nodeObj) {
          const nodeCategoryInfo = nodeObj[key]
          expertiseInterestPrompt += " - Skill: " + nodeCategoryInfo.name 

        }
      }
      // console.log("expertiseInterestPrompt = " , expertiseInterestPrompt) // TODO: remove
      printC(expertiseInterestPrompt,"3","expertiseInterestPrompt","p")
      // asdf9
      // -------- Expertise and Interst Prompt ------


      printC("HEY","5","HEY","r")


      if (!userData?.bio){
      // --------- find bio user ------
        let promptT = expertiseInterestPrompt + "\n" + "Give me a bio for my profile, only 1 paragraph \n"

        const bio = await useGPTchat(promptT)
        // console.log("bio = " , bio) // TODO: remove
        userData.bio = bio
        console.log("DONE - bio = " )
        // --------- find bio user ------
        
        // ------------ Upload Bio ------------
        upsertDoc = await upsertEmbedingPineCone({
          text: bio,
          _id: randomID,
          label: "bio",
          category: "user_data"
        })
        // ------------ Upload Bio ------------
      }

      printC("HEY","6","HEY","r")





      // --------- find name user ------
      if (!userData?.discordName){
        // Generate a random number between 0 and 25
        const randomNumber1 = Math.floor(Math.random() * 26);
        const randomNumber2 = Math.floor(Math.random() * 26);

        // Convert the random number to a letter
        const randomLetter1 = String.fromCharCode(97 + randomNumber1); // generates a lowercase letter
        const randomLetter2 = String.fromCharCode(65 + randomNumber2); // generates an uppercase letter

        const name = await useGPTchat("Give me only one First name of a Programmer, only 1 word, it should include the following two letters: " +randomLetter1+ " "+ randomLetter2 + "\n")
        // console.log("name = " , name) // TODO: remove
        userData.discordName = name.trim().replace("\n", "").replace("\n", "").replace("\"", "")
        console.log("DONE - name = " )
      }
      // --------- find name user ------

      

      // --------- Create Job discriptions -------
      if (!userData?.previousProjects?.length > 0){
        jobs = []

        for (let i=0;i<3;i++){
          // for (let i=0;i<Math.floor(Math.random() * 2) + 2;i++){
          let promptT = expertiseInterestPrompt + "\n" + "Give me 1 title, real position name and description (only 1 paragraph with 2 sentences) of a job that he did in his past, be creative with the title of the position. Example: \n Title: programming at Soil Corp \n Description: main programmer that was working on...  \n Result:"

          const jobData = await useGPTchat(promptT)
          
          // jobData = ` Mobile Deployment Manager at Skyscape Medpresso:
          // Managed the deployment of mobile medical apps on Amazon Appstore, Microsoft Store, and Google Play Store. Led a team responsible for testing and ensuring compatibility with Espresso and Robot Framework. Also utilized expertise in Ionic and mobile app frameworks to improve the overall user experience.`
          console.log("jobData = " , jobData) // TODO: remove
          
          const lines = jobData.split("\n");
          let title, description;

          for (const line of lines) {
            const [key, value] = line.split(": ");

            if (key === "Title") {
              title = value;
            } else if (key === "Description") {
              description = value;
            }
          }

          console.log("Res ------= " )
          console.log(title); // "Website Designer"
          console.log(description);
          console.log("Res ------= " )
          jobs.push({
            title,
            description
          })

          // ------------ Upload previousProjects ------------
          upsertDoc = await upsertEmbedingPineCone({
            text: "Project Title: " + title + "\n" + "Project Description: " + description,
            _id: randomID,
            label: "previusProject",
            category: "user_data"
          })
          // ------------ Upload previousProjects ------------

          console.log("DONE - Job = ",i )

        }
        // asfd8

        userData.previousProjects = jobs
      }
      // --------- Create Job discriptions -------
      


      // --------- create hourse per week, timezone, location, totalIncome, completedOpportunities -------

      if (!userData?.hoursPerWeek){
        // random hours per week from 10 to 40
        userData.hoursPerWeek = Math.floor(Math.random() * 30) + 10
      }

      if (!userData?.timeZone){
        // random timezone GMT + X
        userData.timeZone = "GMT " + Math.floor(Math.random() * 12) + 1
      }

      if (!userData?.location){
        // create array of 20 random location and choose one randomly from this array
        const locations = ["New York", "Los Angeles", "Chicago", "Houston", "Philadelphia", "Phoenix", "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville", "San Francisco", "Indianapolis", "Columbus", "Fort Worth", "Charlotte", "Detroit", "El Paso", "Memphis"]
        userData.location = locations[Math.floor(Math.random() * locations.length)]
      }

      if (!userData?.totalIncome){
        // random totalIncome from 1000 to 100000 and round it on the 3 digit 1423 -> 1420
        userData.totalIncome = Math.floor(Math.random() * 100000) + 1000
        userData.totalIncome = Math.floor(userData.totalIncome / 10) * 10
      }

      if (!userData?.completedOpportunities){
        // random completedOpportunities from 0 to 30
        userData.completedOpportunities = Math.floor(Math.random() * 30)
      }

      if (!userData?.budget?.perHour){
        userData.budget.perHour = Math.floor(Math.random() * 90) + 10
      }
      // --------- create hourse per week, timezone, location, totalIncome, completedOpportunities -------


      // --------- Create Experience Level -------
      if (!userData?.experienceLevel?.total){
        // random experience level it can be 3,6 or 9
        const experienceLevel = [3,6,9,9]
        userData.experienceLevel.total = experienceLevel[Math.floor(Math.random() * experienceLevel.length)]
      }


      if (!userData?.experienceLevel?.years){
        // random yars which is a multiplier of the total years, but it is a random multiplier from 1 to 3
        const multiplier = Math.floor(Math.random() * 3) + 1

        userData.experienceLevel.years = userData.experienceLevel.total * multiplier
      }


      // --------- Create Experience Level -------


      // --------- Create Role and add to User -------
      if (!userData?.memberRole){

        let promptK = ""
        if (userData?.bio){
          promptK = "Bio user: " + userData.bio + "\n" + "Give me a role based on the Bio of the user, \n Role using 1 word: \n"
        } else {
          promptK = "Bio user: " + bio + "\n" + "Give me a role based on the Bio of the user, \n Role using 1 word: \n"
        }

        let roleN = await useGPTchat(promptK)

        roleN = roleN.trim().replace("\n", "").replace("\n", "").replace("\"", "").replace(".","")
        
        printC(roleN,"1", "roleN","g")

        let roleTemplateData = await new RoleTemplate({
          title: roleN,
        });
        roleTemplateData.save();

        userData.memberRole = roleTemplateData._id
      }
      // --------- Create Role and add to User -------


      printC(userData,"1", "userData","b")
      // sf0
      


      //  --------- Create User ---------
      res = await addNewFakeUser(userData)
      //  --------- Create User ---------

      // --------- add Nodes to Member --------
      if (!userData?._id){
        nodeArr = [...nodeArr, ...expertiseInterest]
        const fields = {
          memberID: userData._id,
          nodesID: nodeArr,
        }
        userData = await addNodesToFakeMember(fields)
      }
      // --------- add Nodes to Member --------

      console.log("DONE - Add User Backend = " )


      // console.log("change = afdasfdas22efe22f2" )

      return (userData)
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "createFakeUser",
        { component: "memberMutation > createFakeUser" }
      );
    }
  },
};

// create async function that will change matchByServer
const changeMatchByServer = async (nodeNow, memberData) => {
  // find all the Nodes that need to change around the nodeNow
  // console.log("nodeNow = " , nodeNow)
  let allNodesDistanceR = await findAllNodesDistanceRfromNode_neo4j({
    nodeID: nodeNow._id,
  });

  // console.log("allNodesDistanceR = " , allNodesDistanceR)
  // console.log("change = " , change)

  // find all the node data from the allNodesDistanceR and then loop throw them
  let allNodesDistanceR_Data = await Node.find({
    _id: allNodesDistanceR,
  }).select("_id match_v2_update");

  // loop throw all the nodes and change the matchByServer
  for (let i = 0; i < allNodesDistanceR_Data.length; i++) {
    let node_n = allNodesDistanceR_Data[i];

    // Update the node
    let nodeData3 = await Node.findOneAndUpdate(
      { _id: node_n._id },
      {
        $set: {
          match_v2_update: {
            member: true,
            projectRole: node_n.match_v2_update.projectRole,
          },
        },
      },
      { new: true }
    );
  }
};

// create async function that will calculate the equation for skill level
const calculate_skill_level = async (nodeNow) => {
  console.log("nodeNow = ", nodeNow);

  // ------ Give some weight based on what is the order on the user ---------
  maxReward = 0.8;
  minReward = 0.3;
  decredationFactor = 0.7; // steepness

  if (nodeNow.orderIndex) {
    orderIndex = nodeNow.orderIndex;

    weight_orderIndex =
      (maxReward - minReward) / orderIndex ** decredationFactor + minReward;
  } else {
    weight_orderIndex = 0;
  }
  // ------ Give some weight based on what is the order on the user ---------

  // ------ Give some weight based on the level of expertise---------
  x0 = 5; // midpoint of the equation
  k = 0.8; // steepness of the curve

  if (nodeNow.level) {
    level = nodeNow.level;
    weight_level = 1 / (1 + 2.71 ** (-k * (level - x0)));
  } else {
    weight_level = 0;
  }
  // ------ Give some weight based on the level of expertise---------

  // ----- Combine the two -----------
  w1 = 0.5;
  w2 = 0.5;

  weight_total = w1 * weight_orderIndex + w2 * weight_level;
  // ----- Combine the two -----------

  nodeNow.weight_orderIndex = weight_orderIndex;
  nodeNow.weight_level = weight_level;
  nodeNow.weight_total = weight_total;
  // asdf;
  return nodeNow;
};
