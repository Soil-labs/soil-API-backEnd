const { Members } = require("../../../models/membersModel");
const { Skills } = require("../../../models/skillsModel");
const { Projects } = require("../../../models/projectsModel");

const {ApolloError} = require("apollo-server-express");
const { driver } = require("../../../../server/neo4j_config");

module.exports = {
  addNewMember: async (parent, args, context, info) => {
   

  const {discordName,_id,discordAvatar,discriminator, bio,hoursPerWeek,previusProjects} = args.fields;


    if (!_id) throw new ApolloError( "_id is required");

    let fields = {
      _id,
      registeredAt: new Date(),
    };

    
    if (discordName) fields.discordName = discordName;
    if (discordAvatar) fields.discordAvatar = discordAvatar;
    if (discriminator) fields.discriminator = discriminator;
    if (bio) fields.bio = bio;
    if (hoursPerWeek) fields.hoursPerWeek = hoursPerWeek;
    if (previusProjects) fields.previusProjects = previusProjects;


    


    try {

      let membersData = await Members.findOne({ _id: fields._id })

    //console.log("membersData = " , membersData)
    

      if (!membersData){
        let newAttributes = {
          Director: 0,
          Motivator: 0,
          Inspirer: 0,
          Helper: 0,
          Supporter: 0,
          Coordinator: 0,
          Observer: 0,
          Reformer: 0,
        }
    
        fields = {...fields, attributes: newAttributes};

        membersData = await new Members(fields);
        
        membersData.save()
        
        //add member node to neo4j
        const session = driver.session({database:"neo4j"});
        await session.writeTransaction(tx => 
        tx.run(
          `   
          MERGE (:Member {_id: ${fields._id}, name: '${fields.discordName}'})
          `
          )
        )
        session.close();
      } 
      
      // else {
      // //console.log("change = " )
      //   throw new ApolloError("Member already exists")
      // }

      console.log("membersData = " , membersData)

      return membersData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > addNewMember"}
      );
    }
  },
  updateMember: async (parent, args, context, info) => {
   

    const {discordName,_id,discordAvatar,discriminator,bio,
      hoursPerWeek,previusProjects,
      interest,timeZone,level,skills} = args.fields;

    if (!_id) throw new ApolloError( "_id is required");

    let fields = {
      _id,
      registeredAt: new Date(),
    };

    if (discordAvatar) fields =  {...fields,discordAvatar}
    if (discordName) fields =  {...fields,discordName}
    if (discriminator) fields =  {...fields,discriminator}
    if (bio) fields =  {...fields,bio}
    if (hoursPerWeek) fields =  {...fields,hoursPerWeek}
    if (previusProjects) fields =  {...fields,previusProjects}
    if (interest) fields =  {...fields,interest}
    if (timeZone) fields =  {...fields,timeZone}
    if (level) fields =  {...fields,level}
    if (skills) fields =  {...fields,skills}

    

    try {

      let membersData = await Members.findOne({ _id: fields._id })

    //console.log("change = 1" )
      if (!membersData ){
        let newAttributes = {
          Director: 0,
          Motivator: 0,
          Inspirer: 0,
          Helper: 0,
          Supporter: 0,
          Coordinator: 0,
          Observer: 0,
          Reformer: 0,
        }
    
        fields = {...fields, attributes: newAttributes};

        membersData = await new Members(fields);
        
        membersData.save()

        //add member node to neo4j
        const session = driver.session({database:"neo4j"});
        await session.writeTransaction(tx => 
        tx.run(
          `   
          MERGE (:Member {_id: ${fields._id}, name: '${fields.discordName}'})
          `
          )
        )
        session.close();
      } else {

        membersData = await Members.findOneAndUpdate({ _id: fields._id }, fields, { new: true });
      //console.log("change = 2" )
      }

    //   console.log("fields = " , fields)

    // console.log("membersData = " , membersData)

      return membersData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },
  addFavoriteProject: async (parent, args, context, info) => {

    const {memberID,projectID,favorite} = args.fields;

    if (!memberID) throw new ApolloError( "memberID is required");
    if (!projectID) throw new ApolloError( "projectID is required");
    if (favorite==null) throw new ApolloError( "favorite is required");
   
    try {

      let memberData = await Members.findOne({ _id: memberID })
      if (!memberData) throw new ApolloError( "Member not found")

      let projectData = await Projects.findOne({ _id: projectID })
      if (!projectData) throw new ApolloError( "Project not found")


      let currentProjects = [...memberData.projects]

      currentProjects.push({
        projectID: projectID,
        champion: false,
        favorite: favorite,
      })


      memberData = await Members.findOneAndUpdate({ _id: memberID }, { projects: currentProjects }, { new: true });


      console.log("memberData.projects = " , memberData.projects)



    return memberData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },
  endorseAttribute: async (parent, args, context, info) => {
   

    const {_id,attribute} = args.fields;

    if (!_id) throw new ApolloError( "_id is required");
    if (!attribute) throw new ApolloError( "attribute is required");

    let fields = {
      _id,
      attribute,
    };

    // console.log("fields = " , fields)

    

    try {

      let membersData = await Members.findOne({ _id: fields._id })

      if (!membersData ) throw new ApolloError("Member not found")

      console.log("membersData.attributes = " , membersData.attributes)
      console.log("membersData.attributes = " , membersData.attributes.Director)
      console.log("membersData.attributes = " , !membersData.attributes)
      console.log("membersData.attributes = " ,  membersData.attributes.Director==undefined)
      console.log("membersData.attributes = " , !membersData.attributes || membersData.attributes.Director!=undefined)

      let newAttributes
      if (!membersData.attributes || membersData.attributes.Director==undefined) {
        console.log("change = 1" )
        newAttributes = {
          Director: 0,
          Motivator: 0,
          Inspirer: 0,
          Helper: 0,
          Supporter: 0,
          Coordinator: 0,
          Observer: 0,
          Reformer: 0,
        }

        newAttributes[attribute] = 1

        membersData = await Members.findOneAndUpdate({ _id: fields._id }, { attributes: newAttributes }, { new: true });
      } else {
        console.log("change = 2" )
        newAttributes = {...membersData.attributes}
        newAttributes[attribute] = newAttributes[attribute] + 1
        membersData = await Members.findOneAndUpdate({ _id: fields._id }, { attributes: newAttributes }, { new: true });
      }

    console.log("membersData = " , membersData)

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

      return membersData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },
  addSkillToMember: async (parent, args, context, info) => {
  

    const {skillID,memberID,authorID} = args.fields;

    if (!skillID) throw new ApolloError( "skillID is required");
    if (!memberID) throw new ApolloError( "memberID is required");
    if (!authorID) throw new ApolloError( "authorID is required");

    try {


      let fieldUpdate = {}

      let member = await Members.findOne({ _id: memberID })

      let authorInfo = await Members.findOne({ _id: authorID })

      let skill = await Skills.findOne({ _id: skillID })


      if (!member) throw new ApolloError( "member dont exist, you need to first craete the member");
      if (!authorInfo) throw new ApolloError( "author dont exist, you need to first craete the author");
      if (!skill) throw new ApolloError( "skill dont exist, you need to first creaet the skill ");


      // console.log("change = " , skill,authorInfo,member)

      let newSkills


      let skillExist = true
      let makeAnUpdate = false
      
      // add skill edge from author to member & add skill edge from member to skill node
      if (member._id !== authorInfo._id) {
        const session2 = driver.session({database:"neo4j"});
        await session2.writeTransaction(tx => 
        tx.run(
          `   
          MATCH (member_neo:Member {_id: ${member._id}})
          MATCH (author_neo:Member {_id: ${authorInfo._id}})
          MATCH (skillNode:Skill {_id: '${skill._id}'})
          MERGE (author_neo)-[:SKILL]->(member_neo)
          MERGE (member_neo)-[:SKILL]->(skillNode)
          `
          )
        )
        session2.close();
        
      } else {
        //when author endorses themselves only add skill edge from member to skill node
        const session2 = driver.session({database:"neo4j"});
        await session2.writeTransaction(tx => 
        tx.run(
          `   
          MATCH (member_neo:Member {_id: ${member._id}})
          MATCH (author_neo:Member {_id: ${authorInfo._id}})
          MATCH (skillNode:Skill {_id: '${skill._id}'})
          MERGE (member_neo)-[:SKILL]->(skillNode)
          `
          )
        )
        session2.close();
      }
      

      // check all the skills, if the skill is already in the member, then update the author
      const updatedSkills = member.skills.map(skillMem=>{
        if (skillMem.id.equals(skill._id)===true){
            skillExist = false

            if (!skillMem.authors.includes(authorID)){ // If the skill already exist but the author is not in the list, add it
                makeAnUpdate = true

                skillMem.authors.push(authorID)

                return skillMem
            } else {
                return skillMem
            }
        } else {
            return skillMem
        }
    })

  //console.log("change = 1" )

    // ---------- Network Member-----------
    let networkMember
    let flagMemberExist = false
    member.network.forEach(net=>{
      // console.log("net = " , net,net.memberID == authorID,net.memberID , authorID)
      // if (net.memberID.equals(authorID)===true){
          if (net.memberID == authorID){
        flagMemberExist = true
      } 
    })
  //console.log("change = 2" )


    if (flagMemberExist===false){
      networkMember = member.network.concat({memberID: authorID})
    } else {
      networkMember = member.network
    }
    // ---------- Network Member-----------

  //console.log("change = 2.5",authorInfo.network )
    // ---------- Network Author-----------
    let networkAuthor
    flagMemberExist = false
    authorInfo.network.forEach(net=>{
      if (net.memberID == authorID){
        flagMemberExist = true
      } 
    })
  //console.log("change = 2.7" )

    if (flagMemberExist===false){
      networkAuthor = authorInfo.network.concat({memberID: member._id})
    } else {
      networkAuthor = authorInfo.network
    }
    // ---------- Network Author-----------


  //console.log("change = 3" )
    

    let updateMembers = skill.members
    // if the skill is not in the member, then add it
    if (skillExist === true){
        makeAnUpdate = true
        updatedSkills.push({
            id: skill._id, 
            authors: [authorID]
        })
        updateMembers.push(member._id)
    }

  //console.log("change = 4" ,updatedSkills)
  //console.log("change = 4" ,networkMember)

    let newMember,newSkill
    if (makeAnUpdate){
        member= await Members.findOneAndUpdate(
            {_id: member._id},
            {
                $set: {
                    skills: updatedSkills,
                    network: networkMember
                }
            },
            {new: true}
        )

      //console.log("change = 5" )

        authorInfo = await Members.findOneAndUpdate(
            {_id: authorInfo._id},
            {
                $set: {
                    network: networkAuthor
                }
            },
            {new: true}
        )

        //console.log("change = 6" )


        skill= await Skills.findOneAndUpdate(
            {_id: skill._id},
            {
                $set: {
                    members: updateMembers
                }
            },
            {new: true}
        )

      }
      
    //console.log("member = " , member)

    //console.log("networkAuthor 22 - = " , networkAuthor)
    //console.log("authorInfo 22 - = " , authorInfo)

    member = {
      ...member._doc,
      // skills: []
    }


      return member
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },

};
