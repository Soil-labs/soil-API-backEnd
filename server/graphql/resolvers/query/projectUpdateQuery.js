
const { Skills } = require("../../../models/skillsModel");
const {Projects} = require("../../../models/projectsModel");
const {Members} = require("../../../models/membersModel");
const {Team} = require("../../../models/teamModal");
const {Role} = require("../../../models/roleModel");
const {ProjectUpdate} = require("../../../models/projectUpdateModal");


const {
  ApolloError,
} = require("apollo-server-express");


module.exports = {
  findProjectUpdates: async (parent, args, context, info) => {
   

    console.log("change = " )
    const {_id,projectID,memberID,teamID,serverID,roleID,dateStart,dateEnd} = args.fields;

    console.log("dateStart,dateEnd = " , dateStart,dateEnd)

    let fields = {}

    if (_id) fields = {...fields,_id}
    if (projectID) fields = {...fields,projectID}
    if (memberID) fields = {...fields,memberID}
    if (teamID) fields = {...fields,teamID}
    if (roleID) fields = {...fields,roleID}



    // console.log("fields = " , fields)

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

    if (roleID) {
      roleID.forEach(id => {
        querySearch.push({ roleID: id })
      })
    }

    let queryServerID = []
    if (serverID) {
      serverID.forEach(id => {
        queryServerID.push({ serverID: id })
      })
    }

    if (queryServerID.length>0){
      querySearch.push({ $or: queryServerID })
    }

    console.log("querySearch = " , querySearch)


    if (dateStart){
      querySearch.push({ registeredAt: {$gt: dateStart} })
    }

    if (dateEnd){
      querySearch.push({ registeredAt: {$lt: dateEnd} })
    }


    try {

      if (querySearch.length > 0) {
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
        // console.log("change = 2" )
        projectUpdateData = await ProjectUpdate.find( {})

        // console.log("projectUpdateData = " , projectUpdateData)
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

  findAllProjectsTeamsAnouncments: async (parent, args, context, info) => {
   

    console.log("change = " )

    const {dateStart,dateEnd} = args.fields;
    

    try {

     let projectsData = await Projects.find( {} )

     let teamData = await Team.find({})

     


    //  console.log("teamData = " , teamData)

      projectTeamsAnouncments = []
      if (projectsData){
        for (let i=0;i<projectsData.length;i++){
          let ProjectNow = projectsData[i]
          // console.log("ProjectNow = " , ProjectNow)


          let teamsForProject = []
          for (let j=0;j<teamData.length;j++){
            let teamNow = teamData[j]

            // console.log("ProjectNow._id ,teamNow.projectID, = " , ProjectNow._id ,teamNow.projectID,ProjectNow._id.equals(teamNow.projectID))

            if (ProjectNow._id.equals(teamNow.projectID)){


              let querySearch = []

              querySearch.push({projectID: ProjectNow._id})
              querySearch.push({teamID: teamNow._id})

              if (dateStart){
                querySearch.push({ registeredAt: {$gt: dateStart} })
              }
          
              if (dateEnd){
                querySearch.push({ registeredAt: {$lt: dateEnd} })
              }



              let anouncmentsDataNow = await ProjectUpdate.find( {$and: querySearch} )
              // console.log("ProjectNow._id,teamNow.projectID = " , ProjectNow._id,teamNow._id)
              // console.log("anouncmentsDataNow = " , anouncmentsDataNow)

              // console.log("change = ",{
              //   teamData: teamNow,
              //   announcements: anouncmentsDataNow,
              // })

              teamsForProject.push({
                teamData: teamNow,
                announcement: anouncmentsDataNow,
              })
            }
          }

          if (teamsForProject.length>0){
            projectTeamsAnouncments.push({
              project:ProjectNow,
              team: teamsForProject,
            })
        }

        }
      }

      // console.log("projectTeamsAnouncments = " , projectTeamsAnouncments)





      // return projectUpdateData
      return projectTeamsAnouncments

      return [{}]
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill"}
      );
    }
  },
  

  findGarden: async (parent, args, context, info) => {
   

    // console.log("change = " )

    const {dateStart,dateEnd,serverID} = args.fields;

    let querySearch = []
    if (serverID) {
      serverID.forEach(id => {
        querySearch.push({ serverID: id })
      })
    }

    if (dateStart){
      querySearch.push({ registeredAt: {$gt: dateStart} })
    }

    if (dateEnd){
      querySearch.push({ registeredAt: {$lt: dateEnd} })
    }


    console.log("querySearch = " , querySearch)

    let searchQ = {}
    if (querySearch.length > 0) {
      searchQ = {$and: querySearch}
    } 
    

    let generalRole 
    
    generalRole = await Role.findOne({name: "General"})

    if (!generalRole){
      generalRole = await new Role({
        name: "General",
        serverID,
      }).save()
    }

    let generalTeam = await Team.findOne({name: "General"})

    // console.log("generalRole = " , generalRole)
    // console.log("generalTeam = " , generalTeam)


    //  ------------ Projects Index -----------------
    let projects_all = await Projects.find( {} )
    
    project_index = {}

    projects_all.forEach((project,idx) => {
      project_index[project._id] = idx
    })
    // console.log("project_index = " , project_index)
    //  ------------ Projects Index -----------------

    
    //  ------------ Team Index -----------------
    let team_all = await Team.find( {} )
    
    team_index = {}

    team_all.forEach((team,idx) => {
      team_index[team._id] = idx
    })
    // console.log("team_index = " , team_index)
    //  ------------ Team Index -----------------



    //  ------------ Role Index -----------------
    let role_all = await Role.find( {} )
    
    role_index = {}

    role_all.forEach((team,idx) => {
      role_index[team._id] = idx
    })
    console.log("role_index = " , role_index)
    //  ------------ Role Index -----------------



    // let garden_projectTeamRole = [{_id:"62f685952dc2d40004d395c8"}]
    let garden_projectTeamRole = []

    try {

      let projectsData


      let anouncmentsData = await ProjectUpdate.find( searchQ )

      // console.log("anouncmentsData = " , anouncmentsData)

      for (let i=0;i<anouncmentsData.length;i++){
        // for (let i=0;i<10;i++){
        let anouncment = anouncmentsData[i]

        
        // console.log("i = " , i)
        // console.log("anouncment = " , anouncment)

        //  ---------------- Find Project Position -----------------
        var findProject_position = -1
        
        garden_projectTeamRole.find((project,idx) => {
          // console.log("project = " , project._id,anouncment.projectID,anouncment.projectID.equals(project._id),idx)
          if (anouncment.projectID.equals(project._id)){
            findProject_position = idx
            return idx
          }
        })

        // console.log("change = " )
        

        if (findProject_position==-1){ // new Project, find info
          // projectsData = await Projects.findOne( {_id: anouncment.projectID } )
          projectsData = projects_all[project_index[anouncment.projectID]]

          // console.log("projectsData = " , projectsData)
          garden_projectTeamRole.push({
            _id: projectsData._id,
            project: projectsData,
            team: [],
          })

          findProject_position = garden_projectTeamRole.length-1

        } 

        //  ---------------- Find Project Position -----------------


        // console.log("findProject_position = " , findProject_position)
        // console.log("garden_projectTeamRole[findProject_position] = " , garden_projectTeamRole[findProject_position])

        //  ---------------- Find Team Position -----------------

        let searchTeamID 
        if (anouncment.teamID && anouncment.teamID[0]){
          searchTeamID = anouncment.teamID[0]
        } else {
          searchTeamID = generalTeam._id
        }

        var findTeam_position = -1



        garden_projectTeamRole[findProject_position].team.find((team,idx) => {
          // console.log("team = " , team._id,searchTeamID,searchTeamID.equals(team._id),idx)
          if (searchTeamID.equals(team._id)){
            findTeam_position = idx
            return idx
          }
        })


        if (findTeam_position==-1){ // new Team, find info
          
          // let teamData = await Team.findOne( {_id: searchTeamID } )
          teamData = team_all[team_index[searchTeamID]]


          garden_projectTeamRole[findProject_position].team.push({
            _id: teamData._id,
            teamData: teamData,
            role: [],
          })
          findTeam_position = garden_projectTeamRole[findProject_position].team.length-1

        }

        

        //  ---------------- Find Team Position -----------------


        // console.log("findProject_position = " , findProject_position)
        // console.log("garden_projectTeamRole[findProject_position] = " , garden_projectTeamRole[findProject_position])

        //  ---------------- Find Team Position -----------------

        // console.log("generalRole = " , generalRole)
        let searchRoleID
        if (anouncment.roleID && anouncment.roleID[0]){
          searchRoleID = anouncment.roleID[0]
        } else {
          searchRoleID = generalRole._id
        }

        var findRole_position = -1

        garden_projectTeamRole[findProject_position].team[findTeam_position].role.find((role,idx) => {
          // console.log("role = " , role._id,searchRoleID,searchRoleID.equals(role._id),idx)
          if (searchRoleID.equals(role._id)){
            findRole_position = idx
            return idx
          }
        })

        // console.log("anouncment ---- tokio = " , anouncment)

        if (findRole_position==-1){ // new Role, find info

          if (anouncment._id.equals("6308f4ae4bd2180004c841f4")){
            console.log("change =a s asddf fsd a " ,searchRoleID,role_index,role_index[searchRoleID],role_all[role_index[searchRoleID]])
          }

          // let roleData = await Role.findOne( {_id: searchRoleID } )
          if (role_index[searchRoleID] && role_all[role_index[searchRoleID]]){
            roleData = role_all[role_index[searchRoleID]]


            // console.log("roleData = " , searchRoleID,role_index,roleData)
            garden_projectTeamRole[findProject_position].team[findTeam_position].role.push({
              _id: roleData._id,
              roleData: roleData,
              announcement: [anouncment],
            })
            findRole_position = garden_projectTeamRole[findProject_position].team[findTeam_position].role.length-1
          }

        } else {
          garden_projectTeamRole[findProject_position].team[findTeam_position].role[findRole_position].announcement.push(anouncment)
        }


        

        //  ---------------- Find Team Position -----------------



          

      }




      // return [{}]
      return garden_projectTeamRole

    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill"}
      );
    }
  },
  
  
};
