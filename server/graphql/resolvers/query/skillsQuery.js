
const { Skills } = require("../../../models/skillsModel");

const mongoose = require("mongoose");

const {
  ApolloError,
} = require("apollo-server-express");


module.exports = {
  findSkill: async (parent, args, context, info) => {
   

    const {_id,id_lightcast} = args.fields;

    // if (!_id) throw new ApolloError( "You need to specify the id of the skill");

    let searchQuery = {}

    if (_id){
      searchQuery = { _id: _id };
    } else if (id_lightcast){
      searchQuery = { id_lightcast: id_lightcast };
    } else {
      throw new ApolloError( "You need to specify the id of the skill");
    }


    

    try {
      let skillData= await Skills.findOne( searchQuery) 



      return skillData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill"}
      );
    }
  },
  findSkills: async (parent, args, context, info) => {
   

    const {_id,id_lightcast} = args.fields;

    let searchQuery = {}

    if (_id){
      searchQuery = {
        $and: [
          { _id: _id },
          { state: "approved" },
        ]
      } ;
    } else if (id_lightcast){
      searchQuery = {
        $and: [
          { id_lightcast: id_lightcast },
          { state: "approved" },
        ]
      } ;
    } else {
      searchQuery = {
        $and: [
          { state: "approved" },
        ]
      } ;
    }

  //console.log("fields = " , fields)
    

    try {
      let membersData
      // if (_id) {
      // //console.log("change =1 ")

      //     membersData = await Skills.find( {
      //       $and: [
      //         { _id: fields._id },
      //         { state: "approved" },
      //       ]
      //   } )


      // } else {
      // //console.log("change =2 ")

      //   membersData = await Skills.find({state: "approved"})
      // //console.log("membersData = " , membersData)
      // }

      membersData = await Skills.find(searchQuery)

      


      return membersData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill"}
      );
    }
  },
  skills_autocomplete: async (parent, args, context, info) => {
   

    const {search} = args.fields;

    let collection = mongoose.connection.db.collection("skills")


    try {

      console.log("change = 1" ,search)
      let result = await collection.aggregate([ { 
          "$search": {
              "autocomplete": { 
                  "query": search,
                  "path": "name", 
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
        { component: "tmemberQuery > findSkill"}
      );
    }
  },
  adminFindAllSkillsEveryState: async (parent, args, context, info) => {
   

    const {_id} = args.fields;

    let fields = {
    };

    if (_id) fields = { ...fields, _id };

  //console.log("fields = " , fields)
    

    try {
      let membersData
      if (_id) {
      //console.log("change =1 ")

        membersData = await Skills.find({ _id: fields._id })


      } else {
      //console.log("change =2 ")

        membersData = await Skills.find({})
      //console.log("membersData = " , membersData)
      }

      


      return membersData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill"}
      );
    }
  },
  waitingToAproveSkills: async (parent, args, context, info) => {
   

    let fields = {
    };
    

    try {
      let membersData

        membersData = await Skills.find({state: "waiting"})

      


      return membersData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill"}
      );
    }
  },
  
  
};
