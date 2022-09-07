
const { Members } = require("../../../models/membersModel");
const mongoose = require("mongoose");
const { Projects } = require("../../../models/projectsModel");
const { driver } = require("../../../../server/neo4j_config");


const {
  ApolloError,
} = require("apollo-server-express");


module.exports = {
  findMember: async (parent, args, context, info) => {
       
    const {_id,serverID} = args.fields;

    if (!_id) {
      throw new ApolloError("No id provided");
    }

    let queryServerID = []
    if (serverID) {
      serverID.forEach(id => {
        queryServerID.push({ serverID: id })
      })
    }
    
    try {

      // let memberData = await Members.findOne({ _id: _id })

      let memberData

      if (queryServerID.length>0){
        memberData = await Members.findOne({ $and:[{ _id: _id },{$or:queryServerID}]})
      } else {
        memberData = await Members.findOne({ _id: _id })
      }
      


      console.log("memberData = " , memberData)

      return memberData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },

  findMembers: async (parent, args, context, info) => {
       
    const {_id,serverID} = args.fields;

    let queryServerID = []
    if (serverID) {
      serverID.forEach(id => {
        queryServerID.push({ serverID: id })
      })
    }

    
    try {

      let membersData

      if (_id){
        if (queryServerID.length>0){
          membersData = await Members.find({ $and:[{ _id: _id },{$or:queryServerID}]})
        } else {
          membersData = await Members.find({ _id: _id })
        }
      } else{
        if (queryServerID.length>0){
          membersData = await Members.find({$or:queryServerID})
        } else {
          membersData = await Members.find({})

        }
      }


    //console.log("membersData = " , membersData)

      return membersData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },

  members_autocomplete: async (parent, args, context, info) => {
   

    const {search} = args.fields;
    console.log("change = 1" ,search)
    let collection = mongoose.connection.db.collection("members")


    try {

      console.log("change = 1" ,search)
      let result = await collection.aggregate([ { 
          "$search": {
              "autocomplete": { 
                  "query": search,
                  "path": "discordName", 
                  "fuzzy": { 
                      "maxEdits": 1, 
                  } 
              } 
          } 
      }])
      .toArray();

      console.log("result = " , result)

      
      return result
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > members_autocomplete"}
      );
    }
  },

  matchMembersToUser: async (parent, args, context, info) => {
       
    const {memberID,serverID} = args.fields;

    if (!memberID) throw new ApolloError("memberID is required");

    let queryServerID = []
    if (serverID) {
      serverID.forEach(id => {
        queryServerID.push({ serverID: id })
      })
    }

     
    try {

      let memberData

      // memberData = await Members.findOne({ _id: memberID })

      if (queryServerID.length>0){
        memberData = await Members.findOne({ $and:[{ _id: memberID },{$or:queryServerID}]})
      } else {
        memberData = await Members.findOne({ _id: memberID })
      }
      
      if (!memberData) throw new ApolloError("The member need to exist on the database ");

      skillsArray_user = memberData.skills.map(skill => skill.id) // separate all teh skills



      
      
      // let membersMatch_User = await Members.find({ 'skills.id':skillsArray_user}) // Find the members that have the same skill

      let membersMatch_User

      if (queryServerID.length>0){
        membersMatch_User = await Members.find({ $and:[{ 'skills.id':skillsArray_user },{$or:queryServerID}]})
      } else {
        membersMatch_User = await Members.find({ 'skills.id':skillsArray_user })
      }


      if (membersMatch_User.length == 0){
        // membersMatch_User = await Members.find({})
        if (queryServerID.length>0){
          membersMatch_User = await Members.find({ $and:[{ },{$or:queryServerID}]})
        } else {
          membersMatch_User = await Members.find({ })
        }
        membersMatch_User = membersMatch_User.slice(0, 4)

      }
      
      //filter out my user
      membersMatch_User = membersMatch_User.filter(member => member._id != memberID )
      


      let memberMatch,matchPercentage
      let memberMatch_Result = []
      for (let i = 0; i < membersMatch_User.length; i++) {
        memberMatch = membersMatch_User[i]

        skill_memberMatch = memberMatch.skills.map(skill => skill.id)

        filteredSkillArray = skillsArray_user.filter(skill => skill_memberMatch.includes(skill))

        if (skillsArray_user.length>0){
          matchPercentage = (filteredSkillArray.length/skillsArray_user.length)*100
        } else {
          matchPercentage = 0
        }

        memberMatch_Result.push({
          member: memberMatch,
          matchPercentage: matchPercentage,
          commonSkills: filteredSkillArray
        })

      }

      memberMatch_Result.sort((a,b) => (a.matchPercentage < b.matchPercentage) ? 1 : -1)

      return memberMatch_Result
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },
  matchMembersToSkills: async (parent, args, context, info) => {
       
    const {skillsID,serverID} = args.fields;

    if (!skillsID) throw new ApolloError("skillsID is required");
    
    let queryServerID = []
    if (serverID) {
      serverID.forEach(id => {
        queryServerID.push({ serverID: id })
      })
    }

     
    try {


      // let membersMatch_User = await Members.find({ 'skills.id':skillsID}) // Find the members that have the same skill

      let membersMatch_User

      if (queryServerID.length>0){
        membersMatch_User = await Members.find({ $and:[{ 'skills.id':skillsID },{$or:queryServerID}]})
      } else {
        membersMatch_User = await Members.find({ 'skills.id':skillsID })
      }

    
      let memberMatch
      let memberMatch_Result = []
      for (let i = 0; i < membersMatch_User.length; i++) {
        memberMatch = membersMatch_User[i]

        skill_memberMatch = memberMatch.skills.map(skill => skill.id)

        filteredSkillArray = skillsID.filter(skill => skill_memberMatch.includes(skill))



        memberMatch_Result.push({
          member: memberMatch,
          matchPercentage: (filteredSkillArray.length/skillsID.length)*100,
          commonSkills: filteredSkillArray
        })

      }

      return memberMatch_Result
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },
  matchMembersToProject: async (parent, args, context, info) => {
       
    const {projectID,serverID} = args.fields;

    if (!projectID) throw new ApolloError("projectID is required");
    
    let queryServerID = []
    if (serverID) {
      serverID.forEach(id => {
        queryServerID.push({ serverID: id })
      })
    }

     
    try {



      let project

      if (queryServerID.length>0){
        projectMatch_User = await Projects.find({ $and:[{ _id: projectID },{$or:queryServerID}]})
      } else {
        projectMatch_User = await Projects.find({ _id: projectID })
      }
      console.log("projectMatch_User = " , projectMatch_User)

      // ------------ WiseTy -----------------
      const session = driver.session({database:"neo4j"});
      const res = await session.readTransaction(tx =>
        tx.run(
          `MATCH (p:Project{project_id: '630055b20d42a70004246dcb'})-[]-(r:Role)-[]-(s:Skill)
           MATCH (s:Skill)-[]-(m:Member)
           WHERE NOT (m)-[]-(p)
           RETURN (p)-[]-(r)-[]-(s)-[]-(m)`
        )
      )
    
      const names = res.records.map(row => {
        // return row.get('m')
        // for (let i = 0; i<row._fields; ++i) {
        //   console.log('nodes', row._fields[i]);
        // }
        
        return row
      })
      console.log('nodes and edges: ',names[0]._fields[0][0].segments); 
      console.log('nodes and edges2: ',names[0]._fields[0]); 
      console.log('nodes and edges3: ',names[0]._fields); 
      console.log('nodes and edges4: ',names[0]);
      console.log('nodes and edges: 5',names);  
      const listsOfPaths = names[1]._fields[0][0].segments
      
        for (let i = 0; i<listsOfPaths.length; ++i) {
          console.log('start node name ', i, listsOfPaths[i].start.properties.name);
          console.log('start node id ', i, listsOfPaths[i].start.properties._id);
          console.log('start node label ', i, listsOfPaths[i].start.labels);
          console.log('👇');
          console.log('relationship ', i, listsOfPaths[i].relationship.type);
          console.log('👇');
          console.log('end node name ', i, listsOfPaths[i].end.properties.name);
          console.log('end node id ', i, listsOfPaths[i].end.properties._id);
          console.log('end node label ', i, listsOfPaths[i].end.labels);
          console.log('👇');

        }

      // console.log(names[0]);
      // console.log('fields: ',names[0]._fields);
      // console.log('start node: ',names[0]._fields[0][0].start);
      // console.log('end node : ',names[0]._fields[0][0].end);
      // console.log('nodes and edges: ',names[0]._fields[0][0].segments); 
      // console.log('first element in list of segments ',names[0]._fields[0][0].segments[0]); 
      // console.log('second element in list of segments ',names[0]._fields[0][0].segments[1]); 
      // console.log('third element in list of segments ',names[0]._fields[0][0].segments[2]); 
      




      // ------------ WiseTy -----------------


      return [{}]
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },
  

  
  
};
