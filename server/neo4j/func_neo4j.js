const { printSchema } = require("graphql");
const { driver } = require("../../server/neo4j_config");


module.exports = {
  generalFunc_neo4j: async (req, res) => {
    const { request } = req;

    const session = driver.session({ database: "neo4j" });

    result = await session.writeTransaction((tx) => tx.run(request));

    session.close();

    return result;
  },
  createNode_neo4j: async (req, res) => {
    const { name, node, id, serverID } = req;

    console.log(
      "change -----------createNode_neo4j---------= ",
      name,
      node,
      id,
      serverID
    );

    let serverID_string = arrayToString(serverID);

    let fun = "";
    if (serverID && serverID.length > 0) {
      fun = `   
                        MERGE (:${node} {_id: '${id}', name: '${name}', serverID: ${serverID_string}})
            `;
    } else {
      fun = `   
                        MERGE (:${node} {_id: '${id}', name: '${name}'})
            `;
    }

    console.log("fun = ", fun);

    const session = driver.session({ database: "neo4j" });

    result = await session.writeTransaction((tx) => tx.run(fun));

    session.close();
  },
  createNode_neo4j_field: async (req, res) => {
    const { fields } = req;

    console.log("fields = ", fields);

    let temp;
    let str = "";
    for (var key in fields) {
      console.log("key,fields[key] = ", key, fields[key]);

      if (fields[key]) {
        if (key == "serverID" && fields[key].length > 0) {
          temp = arrayToString(fields[key]);

          str += `${key}: ${temp},`;
        } else if (key != "node") {
          temp = fields[key];

          str += `${key}: '${temp}',`;
        }
      }
    }
    str = str.slice(0, -1);

    let fun = ` 
                MERGE (:${fields.node} {${str}})
                `;

    console.log("fun = ", fun);

    const session = driver.session({ database: "neo4j" });

    result = await session.writeTransaction((tx) => tx.run(fun));

    session.close();
  },
  updateNode_neo4j_serverID_f: async (req, res) => {
    const { id_name, id_value, update_name, update_value, node } = req;

    let fun;

    let update_value_n;

    console.log(
      "id_name,id_value,update_name,update_value,node  ------------> ",
      id_name,
      id_value,
      update_name,
      update_value,
      node
    );

    // console.log("id_name,id_value,update_name,update_value,node = " , id_name,id_value,update_name,update_value,node)

    if (update_name == "serverID") {
      update_value_n = arrayToString(update_value);

      fun = `
                MATCH (n:${node}{${id_name}:'${id_value}'})
                SET n.${update_name} = ${update_value_n}
                RETURN n
            `;
    } else {
      fun = `
                MATCH (n:${node}{${id_name}:'${id_value}'})
                SET n.${update_name} = "${update_value}"
                RETURN n
            `;
    }

    const session = driver.session({ database: "neo4j" });

    result = await session.writeTransaction((tx) => tx.run(fun));

    session.close();
  },
  updateNode_neo4j_serverID: async (req, res) => {
    const { id, node, serverID } = req;

    console.log(
      "change -----------updateNode_neo4j_serverID---------= ",
      node,
      id,
      serverID
    );

    if (!(serverID && serverID.length > 0)) return;

    if (!id) return;

    if (!node) return;

    let serverID_string = arrayToString(serverID);

    let fun = `
            MATCH (n:${node}{_id:'${id}'})
            SET n.serverID = ${serverID_string}
            RETURN n
        `;

    // console.log("fun = ", fun);

    const session = driver.session({ database: "neo4j" });

    result = await session.writeTransaction((tx) => tx.run(fun));

    session.close();
  },
  updateNode_neo4j_serverID_projectID: async (req, res) => {
    const { project_id, node, serverID } = req;

    console.log(
      "change -----------updateNode_neo4j_serverID---------= ",
      node,
      project_id,
      serverID
    );

    if (!(serverID && serverID.length > 0)) return;

    if (!project_id) return;

    if (!node) return;

    let serverID_string = arrayToString(serverID);

    let fun = `
            MATCH (n:${node}{project_id:'${project_id}'})
            SET n.serverID = ${serverID_string}
            RETURN n
        `;

    const session = driver.session({ database: "neo4j" });

    result = await session.writeTransaction((tx) => tx.run(fun));

    session.close();
  },
  makeConnection_neo4j: async (req, res) => {
    const { node, id, connection, weight = undefined } = req;

    console.log(
      "change -------------makeConnection_neo4j---------= ",
      node,
      id,
      connection,
      weight
    );
    const session = driver.session({ database: "neo4j" });

    fun = "";
    node.forEach((n, idx) => {
      if (n == "Member") {
        fun += `
                MATCH (n${idx}:Member {_id: '${id[idx]}'})
                `;
      } else {
        fun += `
                MATCH (n${idx}:${n} {_id: '${id[idx]}'})
                `;
      }
    });
    fun += `
            MERGE (n0)-[r:${connection}]->(n1)
        `;

    if (weight) {
      fun += `
            ON CREATE SET r.weight = ${weight}
            ON MATCH SET r.weight = ${weight}
        `;
    }

    // console.log("fun = " , fun)
    result = await session.writeTransaction((tx) => tx.run(fun));

    // console.log("result = " , result)

    session.close();
  },
  deleteConnectionBetweenNodes_neo4j: async (req, res) => {
    const { skillID, memberID } = req;

    console.log(
      "change -----------deleteConnectionBetweenNodes_neo4j---------= ",
      skillID,
      memberID
    );

    if (!skillID) return;

    if (!memberID) return;

    let fun = `
            MATCH (n:Skill {_id: '${skillID}'})-[r]-(P:Member{_id: '${memberID}'})
            DELETE r
        `;

    const session = driver.session({ database: "neo4j" });

    result = await session.writeTransaction((tx) => tx.run(fun));

    session.close();
  },
  deleteConnectionANYBetweenNodes_neo4j: async (req, res) => {
    const { nodeID_1, nodeID_2 } = req;

    console.log(
      "change -----------deleteConnectionBetweenNodes_neo4j---------= ",
      nodeID_1,
      nodeID_2
    );

    if (!nodeID_1) return;

    if (!nodeID_2) return;

    let fun = `
            MATCH (n {_id: '${nodeID_1}'})-[r]-(P {_id: '${nodeID_2}'})
            DELETE r
        `;

    const session = driver.session({ database: "neo4j" });

    result = await session.writeTransaction((tx) => tx.run(fun));

    session.close();
  },
  deleteNode_neo4j: async (req, res) => {
    const { nodeID } = req;

    console.log(
      "change -----------deleteConnectionBetweenNodes_neo4j---------= ",
      nodeID
    );

    if (!nodeID) return;

    let fun = `
            MATCH (p {_id:'${nodeID}'}) 
            DETACH DELETE p

        `;

    const session = driver.session({ database: "neo4j" });

    result = await session.writeTransaction((tx) => tx.run(fun));

    session.close();
  },
  connectNeighborNodesKG_neo4j: async (req, res) => {
    const { nodeID, graphNeighborsDict} = req;

    const session = driver.session({ database: "neo4j" });


    // ----------------- find on Neo4j and add on Dictionary-----------------
    // let resultConnectedNodes = await session.writeTransaction((tx) =>
    //   tx.run(`MATCH (start:SKILL {_id: "${nodeID}"})-[*0..2]-(neighbors)
    //   RETURN DISTINCT neighbors`)
    // );
    let resultConnectedNodes = await session.writeTransaction((tx) =>
      tx.run(`// find 1 to 3 hop nodes with Id
      MATCH rp = (start:SKILL {_id: "${nodeID}"})-[*0..3]-(neighbors)
      RETURN rp`)
    );

    
    let recConnectedNodes = resultConnectedNodes.records.map((row) => {
      return row;
    });


    let nodesConnectedSimple = [];
    let nodesConnectedDict = {};
    let nodesConnectedIDs =  [];
    if (recConnectedNodes.length > 0) {
      for (let i = 0; i < recConnectedNodes.length; ++i) {
        if ( recConnectedNodes[i] && recConnectedNodes[i]._fields[0]) {

          nPath = recConnectedNodes[i]._fields[0];
          
          if (nPath.end && nPath.segments && nPath.segments.length > 0 ) {
            // console.log("nPath = ",nPath.end.properties.name,"-- hop = ",nPath.segments.length)

            // --- If the node is already on dictionary continue -----
            let replace  = false
            if (graphNeighborsDict[nPath.end.properties._id]) {
              if (graphNeighborsDict[nPath.end.properties._id].hopN <= nPath.segments.length) {
                continue;
              } else {
                replace = true
              }
            }
            // --- If the node is already on dictionary continue -----

            nodesConnectedSimple.push({
              nodeID: nPath.end.properties._id,
              hopN: nPath.segments.length,
              weightTotal: 0,
              weightSeparate: [],
            });

            let nodConIdx = nodesConnectedSimple.length - 1;

            for (let j = 0; j < nPath.segments.length; ++j) {
              // console.log("nPath.segments[j] = ",nPath.segments[j].end.properties.name, "-- Weight = ",nPath.segments[j].relationship.properties.weight.low)

              nodesConnectedSimple[nodConIdx].weightTotal += nPath.segments[j].relationship.properties.weight.low;

              nodesConnectedSimple[nodConIdx].weightSeparate.push({
                nodeID: nPath.segments[j].end.properties._id,
                weight: nPath.segments[j].relationship.properties.weight.low,
                hopNum: j+1,
              });

            }

            // SOS 🆘
            // ------------ Calculate the score ------------
            const weightTotal = (nodesConnectedSimple[nodConIdx].weightTotal)*0.1
            const hopN = (nodesConnectedSimple[nodConIdx].hopN * 1.1)
            
            let averageWeight = weightTotal/hopN
            let score = averageWeight ** hopN

            nodesConnectedSimple[nodConIdx].score = score
            // ------------ Calculate the score ------------

            // if (nPath.end.properties._id.toString() == "6584a1f493e35f75b8d65f8c"){
            //   console.log("hey",nPath.segments.length)
            // }
            // if (replace == true ){
            //   console.log("replace = ",nPath.end.properties._id)
            // }
            // console.log("nPath.end.properties._id,",nPath.end.properties._id)
            nodesConnectedIDs.push(nPath.end.properties._id)
            if (nodesConnectedDict[nPath.end.properties._id]){

              if ( nPath.segments.length < nodesConnectedDict[nPath.end.properties._id].hopN ){
                nodesConnectedDict[nPath.end.properties._id] = {
                  nodeID: nPath.end.properties._id,
                  hopN: nPath.segments.length,
                  weightTotal: nodesConnectedSimple[nodConIdx].weightTotal,
                  score: nodesConnectedSimple[nodConIdx].score,
                  weightSeparate: nodesConnectedSimple[nodConIdx].weightSeparate,
                  replace: replace,
                }
              }

            } else {
              nodesConnectedDict[nPath.end.properties._id] = {
                nodeID: nPath.end.properties._id,
                hopN: nPath.segments.length,
                weightTotal: nodesConnectedSimple[nodConIdx].weightTotal,
                score: nodesConnectedSimple[nodConIdx].score,
                weightSeparate: nodesConnectedSimple[nodConIdx].weightSeparate,
                replace: replace,
              }
            }
          }
        }
        // console.log("---------------")
      }
    }
    // ----------------- find on Neo4j and add on Dictionary-----------------

    //  ---- Add the hop 0 node which is itself ----
    if (!graphNeighborsDict[nodeID] && !nodesConnectedDict[nodeID]){
      nodesConnectedIDs.push(nodeID)
      nodesConnectedDict[nodeID] = {
        nodeID: nodeID,
        hopN: 0,
        weightTotal: 1,
        score: 1,
        weightSeparate: [],
        replace: false,
      }
    }

    // console.log("nodesConnectedDict = ",nodesConnectedDict)
    // f1

    //  ---- Add the hop 0 node which is itself ----
    

    return {
      nodesConnected: nodesConnectedSimple,
      nodesConnectedIDs: nodesConnectedIDs,
      nodesConnectedDict: nodesConnectedDict,
    };
  },
  matchMembersToProject_neo4j: async (req, res) => {
    console.log("change = 11100011");
    const { projectID } = req;

    const session = driver.session({ database: "neo4j" });

    console.log("change = 0011001 ");

    console.log("change = 1", projectID);

    // ----------------- One Hope -----------------
    result_oneHopeMatch = await session.writeTransaction((tx) =>
      tx.run(`//oneHopMatch
                MATCH (p:Project{_id:'${projectID}'})-[]-(r:Role)-[]-(s:Skill)-[]-(m:Member)
                WHERE NOT (m)-[]-(p)
                RETURN (p)-[]-(r)-[]-(s)-[]-(m)`)
    );

    let names_oneHopeMatch = result_oneHopeMatch.records.map((row) => {
      return row;
    });
    member_oneHopeMatch = [];
    if (names_oneHopeMatch.length > 0) {
      for (let i = 0; i < names_oneHopeMatch.length; ++i) {
        if (
          names_oneHopeMatch[i] &&
          names_oneHopeMatch[i]._fields &&
          names_oneHopeMatch[i]._fields[0][0]
        ) {
          if (
            names_oneHopeMatch[i]._fields[0][0].end &&
            names_oneHopeMatch[i]._fields[0][0].end.properties
          ) {
            member_oneHopeMatch.push(
              names_oneHopeMatch[i]._fields[0][0].end.properties
            );
          }
        }
      }
    }
    // ----------------- One Hope -----------------

    // console.log("change = " , member_oneHopeMatch)
    // ----------------- Two Hope -----------------
    result_twoHopeMatch = await session.writeTransaction((tx) =>
      tx.run(`//twoHopMatch
                MATCH (p:Project{_id:'${projectID}'})-[]-(r:Role)-[]-(s:Skill)
                MATCH (s)-[]-(o:Skill)
                MATCH (o)-[]-(m:Member)
                WHERE NOT (m)-[]-(p)
                RETURN (p)-[]-(r)-[]-(s)-[]-(o)-[]-(m)`)
    );

    let names_twoHopeMatch = result_twoHopeMatch.records.map((row) => {
      return row;
    });
    member_twoHopeMatch = [];
    if (names_twoHopeMatch.length > 0) {
      for (let i = 0; i < names_twoHopeMatch.length; ++i) {
        if (
          names_twoHopeMatch[i] &&
          names_twoHopeMatch[i]._fields &&
          names_twoHopeMatch[i]._fields[0][0]
        ) {
          if (
            names_twoHopeMatch[i]._fields[0][0].end &&
            names_twoHopeMatch[i]._fields[0][0].end.properties
          ) {
            member_twoHopeMatch.push(
              names_twoHopeMatch[i]._fields[0][0].end.properties
            );
          }
        }
      }
    }
    // console.log("member_twoHopeMatch = " , member_twoHopeMatch)
    // ----------------- Two Hope -----------------

    // ----------------- Three Hope -----------------
    result_threeHopeMatch = await session.writeTransaction((tx) =>
      tx.run(`//thirdHopMatch
                MATCH (p:Project{_id:'${projectID}'})-[]-(r:Role)-[]-(s:Skill)
                MATCH (s)-[]-(o:Skill)-[]-(q:Skill)
                MATCH (q)-[]-(m:Member)
                WHERE NOT (m)-[]-(p)
                RETURN (p)-[]-(r)-[]-(s)-[]-(o)-[]-(q)-[]-(m)`)
    );
    let names_threeHopeMatch = result_threeHopeMatch.records.map((row) => {
      return row;
    });
    member_threeHopeMatch = [];
    if (names_threeHopeMatch.length > 0) {
      for (let i = 0; i < names_threeHopeMatch.length; ++i) {
        if (
          names_threeHopeMatch[i] &&
          names_threeHopeMatch[i]._fields &&
          names_threeHopeMatch[i]._fields[0][0]
        ) {
          if (
            names_threeHopeMatch[i]._fields[0][0].end &&
            names_threeHopeMatch[i]._fields[0][0].end.properties
          ) {
            member_threeHopeMatch.push(
              names_threeHopeMatch[i]._fields[0][0].end.properties
            );
          }
        }
      }
    }
    // ----------------- Three Hope -----------------

    session.close();

    // return({
    //     oneHopeMatch: member_oneHopeMatch,
    //     twoHopeMatch: member_twoHopeMatch,
    //     threeHopeMatch: member_threeHopeMatch
    // })

    return [member_oneHopeMatch, member_twoHopeMatch, member_threeHopeMatch];
  },
  matchMembersToProjectRole_neo4j: async (req, res) => {
    console.log("change = 11100011");
    const { projectRoleID } = req;

    const session = driver.session({ database: "neo4j" });
    console.log("change = 0011001 ");

    // console.log("change = 1",projectID)

    // ----------------- One Hope -----------------
    result_oneHopeMatch = await session.writeTransaction((tx) =>
      tx.run(`MATCH (r:Role{_id: '${projectRoleID}'})-[]-(s:Skill)-[]-(m:Member)
            MATCH (p:Project)
            WHERE NOT (m)-[]-(p)
            RETURN (r)-[]-(s)-[]-(m)`)
    );

    console.log("change = 03");

    let names_oneHopeMatch = result_oneHopeMatch.records.map((row) => {
      return row;
    });
    member_oneHopeMatch = [];
    if (names_oneHopeMatch.length > 0) {
      for (let i = 0; i < names_oneHopeMatch.length; ++i) {
        if (
          names_oneHopeMatch[i] &&
          names_oneHopeMatch[i]._fields &&
          names_oneHopeMatch[i]._fields[0][0]
        ) {
          if (
            names_oneHopeMatch[i]._fields[0][0].end &&
            names_oneHopeMatch[i]._fields[0][0].end.properties
          ) {
            member_oneHopeMatch.push(
              names_oneHopeMatch[i]._fields[0][0].end.properties
            );
          }
        }
      }
    }
    // ----------------- One Hope -----------------

    // console.log("change = " , member_oneHopeMatch)
    // ----------------- Two Hope -----------------
    result_twoHopeMatch = await session.writeTransaction((tx) =>
      tx.run(`//roleToMembersTwoHop
            MATCH (r:Role{_id: '${projectRoleID}'})-[]-(s:Skill)-[]-(t:Skill)-[]-(m:Member)
            MATCH (p:Project)
            WHERE NOT (m)-[]-(p)
            RETURN (r)-[]-(s)-[]-(t)-[]-(m)`)
    );

    let names_twoHopeMatch = result_twoHopeMatch.records.map((row) => {
      return row;
    });
    member_twoHopeMatch = [];
    if (names_twoHopeMatch.length > 0) {
      for (let i = 0; i < names_twoHopeMatch.length; ++i) {
        if (
          names_twoHopeMatch[i] &&
          names_twoHopeMatch[i]._fields &&
          names_twoHopeMatch[i]._fields[0][0]
        ) {
          if (
            names_twoHopeMatch[i]._fields[0][0].end &&
            names_twoHopeMatch[i]._fields[0][0].end.properties
          ) {
            member_twoHopeMatch.push(
              names_twoHopeMatch[i]._fields[0][0].end.properties
            );
          }
        }
      }
    }
    // console.log("member_twoHopeMatch = " , member_twoHopeMatch)
    // ----------------- Two Hope -----------------

    // ----------------- Three Hope -----------------
    result_threeHopeMatch = await session.writeTransaction((tx) =>
      tx.run(`//roleToMembersThreeHop
            MATCH (r:Role{_id: '${projectRoleID}'})-[]-(s:Skill)-[]-(t:Skill)-[]-(u:Skill)-[]-(m:Member)
            MATCH (p:Project)
            WHERE NOT (m)-[]-(p)
            RETURN (r)-[]-(s)-[]-(t)-[]-(u)-[]-(m)`)
    );
    let names_threeHopeMatch = result_threeHopeMatch.records.map((row) => {
      return row;
    });
    member_threeHopeMatch = [];
    if (names_threeHopeMatch.length > 0) {
      for (let i = 0; i < names_threeHopeMatch.length; ++i) {
        if (
          names_threeHopeMatch[i] &&
          names_threeHopeMatch[i]._fields &&
          names_threeHopeMatch[i]._fields[0][0]
        ) {
          if (
            names_threeHopeMatch[i]._fields[0][0].end &&
            names_threeHopeMatch[i]._fields[0][0].end.properties
          ) {
            member_threeHopeMatch.push(
              names_threeHopeMatch[i]._fields[0][0].end.properties
            );
          }
        }
      }
    }
    // ----------------- Three Hope -----------------

    session.close();

    // return({
    //     oneHopeMatch: member_oneHopeMatch,
    //     twoHopeMatch: member_twoHopeMatch,
    //     threeHopeMatch: member_threeHopeMatch
    // })

    // return([member_oneHopeMatch])
    // return([member_oneHopeMatch,member_twoHopeMatch])
    return [member_oneHopeMatch, member_twoHopeMatch, member_threeHopeMatch];
  },
  matchPrepareSkillToMembers_neo4j: async (req, res) => {
    console.log("change = 11100011");
    const { skillID } = req;

    const session = driver.session({ database: "neo4j" });
    console.log("change = 0011001 ", skillID);

    // console.log("change = 1",projectID)

    // // ----------------- One Hope -----------------
    result_oneHopeMatch = await session.writeTransaction((tx) =>
      tx.run(`MATCH (s:Skill{_id: '${skillID}'})-[:SKILL]-(m:Member)
            RETURN (s)-[]-(m)`)
    );

    let names_oneHopeMatch = result_oneHopeMatch.records.map((row) => {
      return row;
    });

    // console.log("change = 03 = ",names_oneHopeMatch )

    member_oneHopeMatch = [];
    if (names_oneHopeMatch.length > 0) {
      for (let i = 0; i < names_oneHopeMatch.length; ++i) {
        // if (i==0) console.log("change = ",names_oneHopeMatch[i] )
        if (
          names_oneHopeMatch[i] &&
          names_oneHopeMatch[i]._fields &&
          names_oneHopeMatch[i]._fields[0][0]
        ) {
          if (
            names_oneHopeMatch[i]._fields[0][0].end &&
            names_oneHopeMatch[i]._fields[0][0].end.properties
          ) {
            member_oneHopeMatch.push(
              names_oneHopeMatch[i]._fields[0][0].end.properties
            );
          }
        }
      }
    }
    // ----------------- One Hope -----------------

    // console.log("change = " , member_oneHopeMatch)
    // ----------------- Two Hope -----------------
    result_twoHopeMatch = await session.writeTransaction((tx) =>
      tx.run(`MATCH (s:Skill{_id: '${skillID}'})-[:RELATED]-(o:Skill)-[:SKILL]-(m:Member)
            RETURN (s)-[]-(o)-[]-(m)`)
    );

    let names_twoHopeMatch = result_twoHopeMatch.records.map((row) => {
      return row;
    });
    // console.log("names_twoHopeMatch = " , names_twoHopeMatch)
    member_twoHopeMatch = [];
    if (names_twoHopeMatch.length > 0) {
      for (let i = 0; i < names_twoHopeMatch.length; ++i) {
        // if (i==0) console.log("change = ",names_twoHopeMatch[i] )
        if (
          names_twoHopeMatch[i] &&
          names_twoHopeMatch[i]._fields &&
          names_twoHopeMatch[i]._fields[0][0]
        ) {
          if (
            names_twoHopeMatch[i]._fields[0][0].end &&
            names_twoHopeMatch[i]._fields[0][0].end.properties
          ) {
            member_twoHopeMatch.push(
              names_twoHopeMatch[i]._fields[0][0].end.properties
            );
          }
        }
      }
    }
    console.log("member_twoHopeMatch = ", member_twoHopeMatch);
    // ----------------- Two Hope -----------------

    // ----------------- Three Hope -----------------
    result_threeHopeMatch = await session.writeTransaction((tx) =>
      tx.run(`MATCH (s:Skill{_id: '${skillID}'})-[:RELATED]-(o:Skill)-[:RELATED]-(t:Skill)-[:SKILL]-(m:Member)
            RETURN (s)-[]-(o)-[]-(t)-[]-(m)`)
    );
    let names_threeHopeMatch = result_threeHopeMatch.records.map((row) => {
      return row;
    });
    member_threeHopeMatch = [];
    if (names_threeHopeMatch.length > 0) {
      for (let i = 0; i < names_threeHopeMatch.length; ++i) {
        if (
          names_threeHopeMatch[i] &&
          names_threeHopeMatch[i]._fields &&
          names_threeHopeMatch[i]._fields[0][0]
        ) {
          if (
            names_threeHopeMatch[i]._fields[0][0].end &&
            names_threeHopeMatch[i]._fields[0][0].end.properties
          ) {
            member_threeHopeMatch.push(
              names_threeHopeMatch[i]._fields[0][0].end.properties
            );
          }
        }
      }
    }
    // console.log("member_threeHopeMatch = " , member_threeHopeMatch)
    // ----------------- Three Hope -----------------

    session.close();

    // return({
    //     oneHopeMatch: member_oneHopeMatch,
    //     twoHopeMatch: member_twoHopeMatch,
    //     threeHopeMatch: member_threeHopeMatch
    // })

    // return([member_oneHopeMatch])
    // return ([])
    // return([member_oneHopeMatch,member_twoHopeMatch])
    return [member_oneHopeMatch, member_twoHopeMatch, member_threeHopeMatch];
  },
  matchPrepareAnything_neo4j_old: async (req, res) => {
    const { nodeID, node, serverID, find } = req;

    matchRelativePosition = {};
    

    let member_oneHopeMatch = await findMatch_translateArray_path(
      `
            MATCH  ms = ((n:${node}{_id: '${nodeID}'})-[]-(p:${find}))
            WITH *
            WHERE '${serverID}' IN p.serverID
            RETURN ms
        `,
      matchRelativePosition,
      0
    );
    // console.log("member_oneHopeMatch = ", member_oneHopeMatch);
    // console.log("matchRelativePosition = ", matchRelativePosition);

    let member_twoHopeMatch = await findMatch_translateArray_path(
      `
            MATCH  ms = ((n:${node}{_id: '${nodeID}'})-[]-(a)-[]-(p:${find}))
            WHERE NOT (a:Member OR a:Project OR a:Role)
            WITH *
            WHERE '${serverID}' IN p.serverID
            RETURN ms
        `,
      matchRelativePosition,
      1
    );

    // // console.log("member_twoHopeMatch = " , member_twoHopeMatch)

    let member_threeHopeMatch = await findMatch_translateArray_path(
      `
            MATCH  ms = ((n:${node}{_id: '${nodeID}'})-[]-(a)-[]-(b)-[]-(p:${find}))
            WHERE NOT (a:Member OR a:Project OR a:Role) AND NOT (b:Member OR b:Project OR b:Role)
            WITH *
            WHERE '${serverID}' IN p.serverID
            RETURN ms
        `,
      matchRelativePosition,
      2
    );

    // console.log("member_threeHopeMatch = " , member_threeHopeMatch)

    console.log("matchRelativePosition = ", matchRelativePosition);
    asdf;
    // loop throw matchRelativePosition which is an object

    MR = [];
    for (const [key, value] of Object.entries(matchRelativePosition)) {
      // console.log("key = ", key);
      // console.log("value = ", value);
      // console.log("value.connectionsT = ", value.connectionsT);
      MR.push({
        nodeID: key,
        path: value,
      });
    }

    // console.log("MR = ", MR);
    // asdf;
    // console.log(
    //   "member_oneHopeMatch, member_twoHopeMatch, member_threeHopeMatch = ",
    //   member_oneHopeMatch,
    //   member_twoHopeMatch,
    //   member_threeHopeMatch
    // );

    // asdf;

    // return two variables
    return {
      hop_users: [
        member_oneHopeMatch,
        member_twoHopeMatch,
        member_threeHopeMatch,
      ],
      MR: MR,
    };

    // return matchRelativePosition;

    // return [member_oneHopeMatch, member_twoHopeMatch, member_threeHopeMatch];
    // return [member_oneHopeMatch];
  },
  ping_neo4j: async (req, res) => {

    matchRelativePosition = {};

    const session = driver.session({ database: "neo4j" });


    result_threeHopeMatch = await session.writeTransaction((tx) =>
      tx.run(`//Find the main nodes of KG
      MATCH (n)-[r]-()
      WITH n, COUNT(r) AS numConnections
      ORDER BY numConnections DESC
      RETURN n, numConnections
      LIMIT 1`)
    );
    let names_threeHopeMatch = result_threeHopeMatch.records.map((row) => {
      return row;
    });

    session.close();

    // console.log("names_threeHopeMatch = ", names_threeHopeMatch);
    // console.log("names_threeHopeMatch = ", names_threeHopeMatch[0]._fields[0]);

    if (names_threeHopeMatch.length > 0 && names_threeHopeMatch[0]._fields[0] && names_threeHopeMatch[0]._fields[0].properties) {
      nodeID = names_threeHopeMatch[0]._fields[0].properties._id;

      // find node 
      return nodeID;
    }
    return "no node found";


  },
  matchPrepareAnything_neo4j: async (req, res) => {
    const { nodeID, node, serverID, find, weightSkills } = req;

    matchRelativePosition = {};

    // find all the nodes that have distance from 1 to 3 hops from the node with ID "nodeID"
    // all the nodes should be on the save server with ID "serverID"
    await findMatch_translateArray_path_K_hop(
      `
            MATCH (n{_id: '${nodeID}'}),
            p = (n)-[*1..3]-(friend:${find})
            WHERE NONE(x IN relationships(p) WHERE type(x) = '${find}')
              AND '${serverID}' IN friend.serverID
            RETURN p
        `,
      matchRelativePosition,
      weightSkills
    );

    // await findMatch_translateArray_path(
    //   `
    //         MATCH  ms = ((n:${node}{_id: '${nodeID}'})-[]->(p:${find}))
    //         WITH *
    //         WHERE '${serverID}' IN p.serverID
    //         RETURN ms
    //     `,
    //   matchRelativePosition,
    //   0
    // );

    // await findMatch_translateArray_path(
    //   `
    //         MATCH  ms = ((n:${node}{_id: '${nodeID}'})-[]->(a)-[]->(p:${find}))
    //         WHERE NOT (a:Member OR a:Project OR a:Role)
    //         WITH *
    //         WHERE '${serverID}' IN p.serverID
    //         RETURN ms
    //     `,
    //   matchRelativePosition,
    //   1
    // );

    // await findMatch_translateArray_path(
    //   `
    //         MATCH  ms = ((n:${node}{_id: '${nodeID}'})-[]->(a)-[]->(b)-[]->(p:${find}))
    //         WHERE NOT (a:Member OR a:Project OR a:Role) AND NOT (b:Member OR b:Project OR b:Role)
    //         WITH *
    //         WHERE '${serverID}' IN p.serverID
    //         RETURN ms
    //     `,
    //   matchRelativePosition,
    //   2
    // );

    return matchRelativePosition;
  },
  matchPrepareAnything_AI4_neo4j: async (req, res) => {
    const { nodeID, find, weightSkills,distancePenalty } = req;

    matchRelativePosition = {};

    // find all the nodes that have distance from 1 to 3 hops from the node with ID "nodeID"
    // all the nodes should be on the save server with ID "serverID"
    await findMatch_translateArray_path_K_hop_AI4(
      `
            MATCH (n{_id: '${nodeID}'}),
            p = (n)-[*1..3]-(friend:${find})
            WHERE NONE(x IN relationships(p) WHERE type(x) = '${find}')
            RETURN p
        `,
      matchRelativePosition,
      weightSkills,
      distancePenalty
    );
    

    // console.log("matchRelativePosition = " , matchRelativePosition)
    // asdf

    return matchRelativePosition;
  },
  findAllNodesDistanceRfromNode_neo4j: async (req, res) => {
    const { nodeID } = req;

    // console.log("nodeID,node = " , nodeID)

    let member_oneHopeMatch = await findMatch_translateArray(`
            MATCH  ((n {_id: '${nodeID}'})-[]-(p))
            WHERE NOT (p:Member OR p:Project )
            RETURN p
        `);
    // console.log("member_oneHopeMatch = " , member_oneHopeMatch)

    let member_twoHopeMatch = await findMatch_translateArray(`
            MATCH  ms = ((n {_id: '${nodeID}'})-[]-(a)-[]-(p))
            WHERE NOT (a:Member OR a:Project OR p:Member OR p:Project )
            RETURN p
        `);
    // console.log("member_twoHopeMatch = " , member_twoHopeMatch)

    let member_threeHopeMatch = await findMatch_translateArray(`
            MATCH  ms = ((n {_id: '${nodeID}'})-[]-(a)-[]-(b)-[]-(p))
            WHERE NOT (a:Member OR a:Project OR b:Member OR b:Project OR p:Member OR p:Project )
            RETURN p
        `);
    // console.log("member_threeHopeMatch = " , member_threeHopeMatch)

    // put together the object _id of member_oneHopeMatch and member_twoHopeMatch and member_threeHopeMatch
    // only if it is unique _id
    console.log("nodeID = ", nodeID);
    let allNodes = [nodeID.toString()];
    let uniqueNodes = {
      [nodeID.toString()]: true,
    };
    for (let i = 0; i < member_oneHopeMatch.length; ++i) {
      if (member_oneHopeMatch[i] && member_oneHopeMatch[i]._id) {
        if (!uniqueNodes[member_oneHopeMatch[i]._id]) {
          uniqueNodes[member_oneHopeMatch[i]._id] = true;
          allNodes.push(member_oneHopeMatch[i]._id);
        }
      }
    }
    for (let i = 0; i < member_twoHopeMatch.length; ++i) {
      if (member_twoHopeMatch[i] && member_twoHopeMatch[i]._id) {
        if (!uniqueNodes[member_twoHopeMatch[i]._id]) {
          uniqueNodes[member_twoHopeMatch[i]._id] = true;
          allNodes.push(member_twoHopeMatch[i]._id);
        }
      }
    }
    for (let i = 0; i < member_threeHopeMatch.length; ++i) {
      if (member_threeHopeMatch[i] && member_threeHopeMatch[i]._id) {
        if (!uniqueNodes[member_threeHopeMatch[i]._id]) {
          uniqueNodes[member_threeHopeMatch[i]._id] = true;
          allNodes.push(member_threeHopeMatch[i]._id);
        }
      }
    }
    // console.log("allNodes = " , allNodes)

    // console.log("change = " , change)

    return allNodes;
  },
  matchPrepareSkillToProjectRoles_neo4j: async (req, res) => {
    console.log("change = 11100011");
    const { skillID } = req;

    const session = driver.session({ database: "neo4j" });
    console.log("change = 0011001 ", skillID);

    // console.log("change = 1",projectID)

    // // ----------------- One Hope -----------------
    result_oneHopeMatch = await session.writeTransaction((tx) =>
      tx.run(`MATCH (s:Skill{_id: '${skillID}'})-[:ROLE_SKILL]-(r:Role)
                    RETURN (s)-[]-(r)`)
    );

    let names_oneHopeMatch = result_oneHopeMatch.records.map((row) => {
      return row;
    });

    // console.log("change = 03 = ",names_oneHopeMatch )

    member_oneHopeMatch = [];
    if (names_oneHopeMatch.length > 0) {
      for (let i = 0; i < names_oneHopeMatch.length; ++i) {
        // if (i==0) console.log("change = ",names_oneHopeMatch[i] )
        if (
          names_oneHopeMatch[i] &&
          names_oneHopeMatch[i]._fields &&
          names_oneHopeMatch[i]._fields[0][0]
        ) {
          if (
            names_oneHopeMatch[i]._fields[0][0].end &&
            names_oneHopeMatch[i]._fields[0][0].end.properties
          ) {
            member_oneHopeMatch.push(
              names_oneHopeMatch[i]._fields[0][0].end.properties
            );
          }
        }
      }
    }
    // ----------------- One Hope -----------------

    // console.log("change = " , member_oneHopeMatch)
    // ----------------- Two Hope -----------------
    result_twoHopeMatch = await session.writeTransaction((tx) =>
      tx.run(`MATCH (s:Skill{_id: '${skillID}'})-[:RELATED]-(o:Skill)-[]-(r:Role)
            RETURN (s)-[]-(o)-[]-(r)`)
    );

    let names_twoHopeMatch = result_twoHopeMatch.records.map((row) => {
      return row;
    });
    // console.log("names_twoHopeMatch = " , names_twoHopeMatch)
    member_twoHopeMatch = [];
    if (names_twoHopeMatch.length > 0) {
      for (let i = 0; i < names_twoHopeMatch.length; ++i) {
        // if (i==0) console.log("change = ",names_twoHopeMatch[i] )
        if (
          names_twoHopeMatch[i] &&
          names_twoHopeMatch[i]._fields &&
          names_twoHopeMatch[i]._fields[0][0]
        ) {
          if (
            names_twoHopeMatch[i]._fields[0][0].end &&
            names_twoHopeMatch[i]._fields[0][0].end.properties
          ) {
            member_twoHopeMatch.push(
              names_twoHopeMatch[i]._fields[0][0].end.properties
            );
          }
        }
      }
    }
    // console.log("member_twoHopeMatch = " , member_twoHopeMatch)
    // ----------------- Two Hope -----------------

    // ----------------- Three Hope -----------------
    result_threeHopeMatch = await session.writeTransaction((tx) =>
      tx.run(`MATCH (s:Skill{_id: '${skillID}'})-[:RELATED]-(o:Skill)-[:RELATED]-(t:Skill)-[:ROLE_SKILL]-(r:Role)
            RETURN (s)-[]-(o)-[]-(t)-[]-(r)`)
    );
    let names_threeHopeMatch = result_threeHopeMatch.records.map((row) => {
      return row;
    });
    member_threeHopeMatch = [];
    if (names_threeHopeMatch.length > 0) {
      for (let i = 0; i < names_threeHopeMatch.length; ++i) {
        if (
          names_threeHopeMatch[i] &&
          names_threeHopeMatch[i]._fields &&
          names_threeHopeMatch[i]._fields[0][0]
        ) {
          if (
            names_threeHopeMatch[i]._fields[0][0].end &&
            names_threeHopeMatch[i]._fields[0][0].end.properties
          ) {
            member_threeHopeMatch.push(
              names_threeHopeMatch[i]._fields[0][0].end.properties
            );
          }
        }
      }
    }
    // console.log("member_threeHopeMatch = " , member_threeHopeMatch)
    // ----------------- Three Hope -----------------

    session.close();

    // return({
    //     oneHopeMatch: member_oneHopeMatch,
    //     twoHopeMatch: member_twoHopeMatch,
    //     threeHopeMatch: member_threeHopeMatch
    // })

    // return([member_oneHopeMatch])
    // return ([])
    // return([member_oneHopeMatch,member_twoHopeMatch])
    return [member_oneHopeMatch, member_twoHopeMatch, member_threeHopeMatch];

    // return ([])
  },
};

function arrayToString(arrayT) {
  if (arrayT && Array.isArray(arrayT) && arrayT.length > 0) {
    let stringResult = "[";

    arrayT.forEach((a, idx) => {
      if (idx === arrayT.length - 1) {
        stringResult += `"${a}"`;
      } else {
        stringResult += `"${a}",`;
      }
    });

    stringResult += "]";

    //   console.log("stringResult = ", stringResult);

    return stringResult;
  } else {
    return arrayT;
  }
}

async function findMatch_translateArray(shyperCode) {
  const session = driver.session({ database: "neo4j" });

  // // ----------------- Hope -----------------
  result_oneHopeMatch = await session.writeTransaction((tx) =>
    tx.run(shyperCode)
  );

  let names_oneHopeMatch = result_oneHopeMatch.records.map((row) => {
    return row;
  });

  member_oneHopeMatch = [];
  if (names_oneHopeMatch.length > 0) {
    for (let i = 0; i < names_oneHopeMatch.length; ++i) {
      if (
        names_oneHopeMatch[i] &&
        names_oneHopeMatch[i]._fields &&
        names_oneHopeMatch[i]._fields[0]
      ) {
        member_oneHopeMatch.push(names_oneHopeMatch[i]._fields[0].properties);
      }
    }
  }

  // -----------------  Hope -----------------

  session.close();

  return member_oneHopeMatch;
}

async function findMatch_translateArray_path_K_hop(
  shyperCode,
  matchRelativePosition,
  weightSkills
) {
  const session = driver.session({ database: "neo4j" });

  // console.log("weightSkills = ", weightSkills);

  // // ----------------- Hope -----------------
  // calculate all the connections between the nodes and the Users
  result_oneHopeMatch = await session.writeTransaction((tx) =>
    tx.run(shyperCode)
  );

  let names_oneHopeMatch = result_oneHopeMatch.records.map((row) => {
    return row;
  });

  kt = [
    // This is the weight for each hop // it was choosen base on intuition
    [9, 0.7], // hop 1
    [3, 0.4], // hop 2
    [1, 0], // hop 3
  ];

  member_oneHopeMatch = [];
  if (names_oneHopeMatch.length > 0) {
    for (let i = 0; i < names_oneHopeMatch.length; ++i) {
      // make a for loop to all the connections between the nodes and the Users
      if (
        names_oneHopeMatch[i] &&
        names_oneHopeMatch[i]._fields &&
        names_oneHopeMatch[i]._fields[0]
      ) {
        let totalWeight = 0;
        let N_weight = 0;
        let mul_weight = 1;
        nodeConnID_pathLastConnection = ""; // the nodeID for the connected node
        pathLength = names_oneHopeMatch[i]._fields[0].segments.length;

        let flag_dontRunIfUseMemberOnPath = false;
        names_oneHopeMatch[i]._fields[0].segments.forEach((s, idx) => {
          // go over the path that made the connection between the node and the user and calculate the weight

          if (s.relationship.properties.weight) {
            // if they have weight then it adds it to the weight of the path

            if (s.relationship.type == "connection") {
              if (weightSkills == true) {
                mul_weight *= s.relationship.properties.weight;
                totalWeight += s.relationship.properties.weight;
                N_weight += 1;
              }
            } else {
              mul_weight *= s.relationship.properties.weight;
              totalWeight += s.relationship.properties.weight;
              N_weight += 1;
            }
          } else {
            // it doesn't have weight, so 1
            totalWeight += 1;
            N_weight += 1;
          }
          if (idx === pathLength - 1) {
            nodeConnID_pathLastConnection = s.start.properties._id;
          } else {
            // SOS 🆘 -> Take out all the paths that has in the middle nodes that are not on the knowledge graph and they are Members,Projects, etc.
            if (
              s.end.labels[0] == "Member" ||
              s.end.labels[0] == "Project" ||
              s.end.labels[0] == "Role"
            ) {
              flag_dontRunIfUseMemberOnPath = true;
            }
          }
        });

        // console.log("totalWeight = ", totalWeight);
        // console.log("N_weight = ", N_weight);

        // asfd;

        if (flag_dontRunIfUseMemberOnPath == true) continue;

        totalWeight_avg = totalWeight; // calculate the average of the weights
        if (N_weight > 0) totalWeight_avg = totalWeight / N_weight;

        member_oneHopeMatch.push(
          names_oneHopeMatch[i]._fields[0].end.properties
        );

        const nodeID = names_oneHopeMatch[i]._fields[0].end.properties._id; // find what is the ID of the member that connects throw this path

        let hop = N_weight;


        if (matchRelativePosition[nodeID]) {
          // make all the equations for this specific path
          let WH_now = matchRelativePosition[nodeID].WH;
          let N_now = matchRelativePosition[nodeID].N;

          let wh_k = matchRelativePosition[nodeID].wh_k;
          let k_sum = matchRelativePosition[nodeID].k_sum;

          let wh_k_arr = matchRelativePosition[nodeID].wh_k_arr;

          let conn_node_wh_obj = matchRelativePosition[nodeID].conn_node_wh_obj;

          WH_new = totalWeight_avg ** (hop);

          if (WH_new > kt[0][1]) {
            // if the new weight is bigger then the weight of the first hop then it adds it to the weight of the first hop
            wh_k += WH_new * kt[0][0];
            k_sum += kt[0][0];

            wh_k_arr[0].wh_sum += WH_new;
            wh_k_arr[0].numPath += 1;
          } else if (WH_new > kt[1][1]) {
            wh_k += WH_new * kt[1][0];
            k_sum += kt[1][0];

            wh_k_arr[1].wh_sum += WH_new;
            wh_k_arr[1].numPath += 1;
          } else if (WH_new > kt[2][1]) {
            wh_k += WH_new * kt[2][0];
            k_sum += kt[2][0];

            wh_k_arr[2].wh_sum += WH_new;
            wh_k_arr[2].numPath += 1;
          }

          let totAvW = totalWeight_avg ** (hop);

          if (conn_node_wh_obj[nodeConnID_pathLastConnection]) {
            conn_node_wh_obj[nodeConnID_pathLastConnection].wh_sum += totAvW;
            conn_node_wh_obj[nodeConnID_pathLastConnection].numPath += 1;
          } else {
            conn_node_wh_obj[nodeConnID_pathLastConnection] = {
              wh_sum: WH_new,
              numPath: 1,
            };
          }

          matchRelativePosition[nodeID] = {
            // it saves the new values of the weight and the number of paths
            WH: WH_now + totAvW,
            N: N_now + 1,
            wh_k,
            k_sum,
            wh_k_arr,
            conn_node_wh_obj,
          };
        } else {
          // here it is to update, so if there is multiple times the same node will update the weights of the path base on the equaltions
          let wh_k = 0;
          let k_sum = 0;

          let wh_k_arr = [
            {
              wh_sum: 0,
              numPath: 0,
            },
            {
              wh_sum: 0,
              numPath: 0,
            },
            {
              wh_sum: 0,
              numPath: 0,
            },
          ];

          WH_new = totalWeight_avg ** (hop );

          if (WH_new > kt[0][1]) {
            wh_k += WH_new * kt[0][0];
            k_sum += kt[0][0];

            wh_k_arr[0].wh_sum += WH_new;
            wh_k_arr[0].numPath += 1;
          } else if (WH_new > kt[1][1]) {
            wh_k += WH_new * kt[1][0];
            k_sum += kt[1][0];

            wh_k_arr[1].wh_sum += WH_new;
            wh_k_arr[1].numPath += 1;
          } else if (WH_new > kt[2][1]) {
            wh_k += WH_new * kt[2][0];
            k_sum += kt[2][0];

            wh_k_arr[2].wh_sum += WH_new;
            wh_k_arr[2].numPath += 1;
          }

          matchRelativePosition[nodeID] = {
            // here is the part that updates it
            WH: totalWeight_avg ** (hop),
            N: 1,
            wh_k,
            k_sum,
            wh_k_arr,
            conn_node_wh_obj: {
              [nodeConnID_pathLastConnection]: {
                wh_sum: WH_new,
                numPath: 1,
              },
            },
          };
        }
      }
    }
  }
  // asdf;

  // -----------------  Hope -----------------

  session.close();

  return member_oneHopeMatch;
}

async function findMatch_translateArray_path_K_hop_AI4(
  shyperCode,
  matchRelativePosition,
  weightSkills,
  distancePenalty = [1,1,1]
) {
  const session = driver.session({ database: "neo4j" });

  // // ----------------- Hope -----------------
  // calculate all the connections between the nodes and the Users
  result_oneHopeMatch = await session.writeTransaction((tx) =>
    tx.run(shyperCode)
  );

  let names_oneHopeMatch = result_oneHopeMatch.records.map((row) => {
    return row;
  });

  // console.log("names_oneHopeMatch = " , names_oneHopeMatch)
  

  kt = [
    // This is the weight for each hop // it was choosen base on intuition
    [9, 0.7], // hop 1
    [3, 0.4], // hop 2
    [1, 0], // hop 3
  ];

  member_oneHopeMatch = [];
  if (names_oneHopeMatch.length > 0) {
    for (let i = 0; i < names_oneHopeMatch.length; ++i) {
      // make a for loop to all the connections between the nodes and the Users
      if (
        names_oneHopeMatch[i] &&
        names_oneHopeMatch[i]._fields &&
        names_oneHopeMatch[i]._fields[0]
      ) {

        res = await weightPath( names_oneHopeMatch[i] )

        let totalWeight = res.totalWeight;
        let N_weight = res.N_weight;
        let nodeConnID_pathLastConnection = res.nodeConnID_pathLastConnection;
        let flag_dontRunIfUseMemberOnPath = res.flag_dontRunIfUseMemberOnPath;

        // console.log("totalWeight = ", totalWeight);
        // console.log("N_weight = ", N_weight);

        // asfd;

        if (flag_dontRunIfUseMemberOnPath == true) continue;

        totalWeight_avg = totalWeight; // calculate the average of the weights
        if (N_weight > 0) totalWeight_avg = totalWeight / N_weight;

        member_oneHopeMatch.push(
          names_oneHopeMatch[i]._fields[0].end.properties
        );

        const nodeID = names_oneHopeMatch[i]._fields[0].end.properties._id; // find what is the ID of the member that connects throw this path

        let hop = N_weight;

        if (matchRelativePosition[nodeID]) {
          // make all the equations for this specific path
          let WH_now = matchRelativePosition[nodeID].WH;
          let N_now = matchRelativePosition[nodeID].N;

          let conn_node_wh_obj = matchRelativePosition[nodeID].conn_node_wh_obj;

          WH_new = (totalWeight_avg ** (hop))*distancePenalty[hop-1];

          if (conn_node_wh_obj[nodeConnID_pathLastConnection]) {
            conn_node_wh_obj[nodeConnID_pathLastConnection].wh_sum += WH_new;
            conn_node_wh_obj[nodeConnID_pathLastConnection].numPath += 1;
          } else {
            conn_node_wh_obj[nodeConnID_pathLastConnection] = {
              wh_sum: WH_new,
              numPath: 1,
            };
          }

          matchRelativePosition[nodeID] = {
            // it saves the new values of the weight and the number of paths
            WH: WH_now + WH_new,
            N: N_now + 1,
            conn_node_wh_obj,
          };
        } else {
          // here it is to update, so if there is multiple times the same node will update the weights of the path base on the equaltions

          WH_new = (totalWeight_avg ** (hop))*distancePenalty[hop-1];

          matchRelativePosition[nodeID] = {
            // here is the part that updates it
            WH: WH_new,
            N: 1,
            conn_node_wh_obj: {
              [nodeConnID_pathLastConnection]: {
                wh_sum: WH_new,
                numPath: 1,
              },
            },
          };
        }
      }
    }
  }
  // asdf;

  // -----------------  Hope -----------------

  session.close();

  return member_oneHopeMatch;
}

async function findMatch_translateArray_path(
  shyperCode,
  matchRelativePosition,
  hop
) {
  const session = driver.session({ database: "neo4j" });

  // // ----------------- Hope -----------------
  result_oneHopeMatch = await session.writeTransaction((tx) =>
    tx.run(shyperCode)
  );

  let names_oneHopeMatch = result_oneHopeMatch.records.map((row) => {
    return row;
  });

  kt = [
    [9, 0.7],
    [3, 0.4],
    [1, 0],
  ];

  // wh_sum -> the sum of all the weights^hop
  // numPath -> Number of Paths to create this WH
  // N -> number of paths to create this WH
  // K -> splits the WH to 3 parts based on WH value (WH>0.7) (0.7>WH>0.3) (WH<0.3) and give different K points (9) (3) (1) -> in order to create weighted average
  // k_sum -> the sum of all K values that were given
  // wh_k -> The total weighted average of the WH based on K values
  // wh_k_arr -> split the WH to 3 parts based on WH value (was analysed on K)
  // C1 -> the first part of the equation, based on the number of paths
  // C2 -> the second part of the equation, based on the weighted average of the WH
  // pers -> the final percentage of the -> pers = w1*C1 + w2*C2
  // conn_node_wh_obj -> the object with nodes and the WH of every node

  member_oneHopeMatch = [];
  if (names_oneHopeMatch.length > 0) {
    for (let i = 0; i < names_oneHopeMatch.length; ++i) {
      if (
        names_oneHopeMatch[i] &&
        names_oneHopeMatch[i]._fields &&
        names_oneHopeMatch[i]._fields[0]
      ) {
        let totalWeight = 0;
        let N_weight = 0;
        let mul_weight = 1;
        nodeConnID = ""; // the nodeID for the connected node
        names_oneHopeMatch[i]._fields[0].segments.forEach((s, idx) => {
          if (s.relationship.properties.weight) {
            mul_weight *= s.relationship.properties.weight;
            totalWeight += s.relationship.properties.weight;
            N_weight += 1;
          } else {
            // it doesn't have weight, so 1
            totalWeight += 1;
            N_weight += 1;
          }
          if (idx === names_oneHopeMatch[i]._fields[0].segments.length - 1) {
            // console.log("s.relationship = ", s.start.properties);
            nodeConnID = s.start.properties._id;
          }
        });

        totalWeight_avg = totalWeight;
        if (N_weight > 0) totalWeight_avg = totalWeight / N_weight;

        member_oneHopeMatch.push(
          names_oneHopeMatch[i]._fields[0].end.properties
        );

        const nodeID = names_oneHopeMatch[i]._fields[0].end.properties._id;

        console.log("N_weight,hop ------------------= ", N_weight - 1, hop);
        if (N_weight - 1 != hop) {
          console.log("Don't match = ");
        }


        if (matchRelativePosition[nodeID]) {
          let WH_now = matchRelativePosition[nodeID].WH;
          let N_now = matchRelativePosition[nodeID].N;

          let wh_k = matchRelativePosition[nodeID].wh_k;
          let k_sum = matchRelativePosition[nodeID].k_sum;

          let wh_k_arr = matchRelativePosition[nodeID].wh_k_arr;

          let conn_node_wh_obj = matchRelativePosition[nodeID].conn_node_wh_obj;

          WH_new = totalWeight_avg ** (hop + 1);

          if (WH_new > kt[0][1]) {
            wh_k += WH_new * kt[0][0];
            k_sum += kt[0][0];

            wh_k_arr[0].wh_sum += WH_new;
            wh_k_arr[0].numPath += 1;
          } else if (WH_new > kt[1][1]) {
            wh_k += WH_new * kt[1][0];
            k_sum += kt[1][0];

            wh_k_arr[1].wh_sum += WH_new;
            wh_k_arr[1].numPath += 1;
          } else if (WH_new > kt[2][1]) {
            wh_k += WH_new * kt[2][0];
            k_sum += kt[2][0];

            wh_k_arr[2].wh_sum += WH_new;
            wh_k_arr[2].numPath += 1;
          }

          let totAvW = totalWeight_avg ** (hop + 1);

          if (conn_node_wh_obj[nodeConnID]) {
            conn_node_wh_obj[nodeConnID].wh_sum += totAvW;
            conn_node_wh_obj[nodeConnID].numPath += 1;
          } else {
            conn_node_wh_obj[nodeConnID] = {
              wh_sum: WH_new,
              numPath: 1,
            };
          }

          matchRelativePosition[nodeID] = {
            WH: WH_now + totAvW,
            N: N_now + 1,
            wh_k,
            k_sum,
            wh_k_arr,
            conn_node_wh_obj,
          };
        } else {
          let wh_k = 0;
          let k_sum = 0;

          let wh_k_arr = [
            {
              wh_sum: 0,
              numPath: 0,
            },
            {
              wh_sum: 0,
              numPath: 0,
            },
            {
              wh_sum: 0,
              numPath: 0,
            },
          ];

          WH_new = totalWeight_avg ** (hop + 1);

          if (WH_new > kt[0][1]) {
            wh_k += WH_new * kt[0][0];
            k_sum += kt[0][0];

            wh_k_arr[0].wh_sum += WH_new;
            wh_k_arr[0].numPath += 1;
          } else if (WH_new > kt[1][1]) {
            wh_k += WH_new * kt[1][0];
            k_sum += kt[1][0];

            wh_k_arr[1].wh_sum += WH_new;
            wh_k_arr[1].numPath += 1;
          } else if (WH_new > kt[2][1]) {
            wh_k += WH_new * kt[2][0];
            k_sum += kt[2][0];

            wh_k_arr[2].wh_sum += WH_new;
            wh_k_arr[2].numPath += 1;
          }

          matchRelativePosition[nodeID] = {
            WH: totalWeight_avg ** (hop + 1),
            N: 1,
            wh_k,
            k_sum,
            wh_k_arr,
            conn_node_wh_obj: {
              [nodeConnID]: {
                wh_sum: WH_new,
                numPath: 1,
              },
            },
          };
        }
      }
    }
  }
  // asdf;

  // -----------------  Hope -----------------

  session.close();

  return member_oneHopeMatch;
}




async function weightPath(
  names_oneHopeMatch
) {
  let totalWeight = 0;
  let N_weight = 0;
  let mul_weight = 1;
  nodeConnID_pathLastConnection = ""; // the nodeID for the connected node
  pathLength = names_oneHopeMatch._fields[0].segments.length;

  let flag_dontRunIfUseMemberOnPath = false;
  names_oneHopeMatch._fields[0].segments.forEach((s, idx) => {
    // go over the path that made the connection between the node and the user and calculate the weight

    if (s.relationship.properties.weight) {
      // if they have weight then it adds it to the weight of the path

      let weightN
      if (s.relationship.properties.weight.low == undefined){
        weightN = s.relationship.properties.weight
      } else {
        weightN = 0.8
      }

      if (s.relationship.type == "connection") {
        if (weightSkills == true) {
          mul_weight *= weightN;
          totalWeight += weightN;
          N_weight += 1;
        }
      } else {
        mul_weight *= weightN;
        totalWeight += weightN;
        N_weight += 1;
      }
    } else {
      // it doesn't have weight, so 1
      totalWeight += 1;
      N_weight += 1;
    }
    if (idx === pathLength - 1) {
      nodeConnID_pathLastConnection = s.start.properties._id;
    } else {
      // SOS 🆘 -> Take out all the paths that has in the middle nodes that are not on the knowledge graph and they are Members,Projects, etc.
      if (
        s.end.labels[0] == "Member" ||
        s.end.labels[0] == "Project"
        // || s.end.labels[0] == "Role"
      ) {
        flag_dontRunIfUseMemberOnPath = true;
      }
    }
  });

  return {
    totalWeight,
    N_weight,
    nodeConnID_pathLastConnection,
    flag_dontRunIfUseMemberOnPath,
  }

}
