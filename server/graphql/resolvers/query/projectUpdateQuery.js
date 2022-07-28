
const { Skills } = require("../../../models/skillsModel");
const {Projects} = require("../../../models/projectsModel");
const {Members} = require("../../../models/membersModel");
const {Team} = require("../../../models/teamModal");
const {ProjectUpdate} = require("../../../models/projectUpdateModal");


const {
  ApolloError,
} = require("apollo-server-express");


module.exports = {
  findProjectUpdates: async (parent, args, context, info) => {
   

    console.log("change = " )
    const {_id,projectID,memberID,teamID} = args.fields;

    let fields = {}

    if (_id) fields = {...fields,_id}
    if (projectID) fields = {...fields,projectID}
    if (memberID) fields = {...fields,memberID}
    if (teamID) fields = {...fields,teamID}



    console.log("fields = " , fields)

    // let querySearch = [
    //   // { _id: fields._id },

    //   { projectID: fields.projectID[0]  },
    //   { memberID: fields.memberID[0]  },
    //   { memberID: fields.memberID[1]  },

    // ]

    let querySearch = []
  
    if (projectID) {
      projectID.forEach(id => {
        querySearch.push({ projectID: id })
      })
    }

    if (memberID) {
      memberID.forEach(id => {
        querySearch.push({ memberID: id })
      })
    }

    if (teamID) {
      teamID.forEach(id => {
        querySearch.push({ teamID: id })
      })
    }


    try {

      if (Object.keys(fields).length > 0) {
        console.log("change = 1" )
        // projectUpdateData = await ProjectUpdate.find( {
        //   $and: [
        //     // { _id: fields._id },

        //     { projectID: fields.projectID[0]  },
        //     { memberID: fields.memberID[0]  },
        //     { memberID: fields.memberID[1]  },

        //   ]
        // } )
        projectUpdateData = await ProjectUpdate.find( {
          $and: querySearch
        } )
        // projectUpdateData = await ProjectUpdate.find(fields)
        // projectUpdateData = await ProjectUpdate.find({memberID: fields.memberID[0]})
      } else {
        console.log("change = 2" )
        projectUpdateData = await ProjectUpdate.find( {})

        console.log("projectUpdateData = " , projectUpdateData)
      }


    //   let projectsData
    //   if (_id) {
        
    //     projectsData = await Projects.find({ _id: _id })
    //   } else {
        

    //     projectsData = await Projects.find({})
    //   }
    // //console.log("projectsData = " , projectsData)


      


      return projectUpdateData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill"}
      );
    }
  },
  
  
  
};
