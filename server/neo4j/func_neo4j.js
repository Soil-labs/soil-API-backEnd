
const { driver } = require("../../server/neo4j_config");

module.exports = {
    createNode_neo4j: async (req, res) => {
        const { name, node, id, serverID } = req;

        console.log("change -----------createNode_neo4j---------= " , name, node, id,serverID)

        let serverID_string = arrayToString(serverID)

        let fun = ""
        if (serverID && serverID.length>0){
            fun = `   
                        MERGE (:${node} {_id: '${id}', name: '${name}', serverID: ${serverID_string}})
            `
        } else {
            fun = `   
                        MERGE (:${node} {_id: '${id}', name: '${name}'})
            `
        }

        console.log("fun = " , fun)

        const session = driver.session({database:"neo4j"});


        result = await session.writeTransaction(tx => 
            tx.run(fun)
        )

        session.close()
        
    },
    createNode_neo4j_field: async (req, res) => {
        const { fields } = req;
        
        console.log("fields = " , fields)

        let temp
        let str = ''
        for (var key in fields) {
            console.log("key,fields[key] = " , key,fields[key])

            if (fields[key] ){
                if (key == 'serverID'){
                    temp = arrayToString(fields[key])

                    str += `${key}: ${temp},`
                } else if (key != 'node') {
                    temp = fields[key]

                    str += `${key}: '${temp}',`
                }
            }

        }
        str = str.slice(0,-1)


        let fun = ` 
                MERGE (:${fields.node} {${str}})
                `


        console.log("fun = " , fun)

        const session = driver.session({database:"neo4j"});


        result = await session.writeTransaction(tx => 
            tx.run(fun)
        )

        session.close()
        
    },
    updateNode_neo4j_serverID_f: async (req, res) => {
        const { id_name,id_value,update_name,update_value,node } = req;


        let fun

        let update_value_n

        console.log("id_name,id_value,update_name,update_value,node  ------------> " , id_name,id_value,update_name,update_value,node )

        // console.log("id_name,id_value,update_name,update_value,node = " , id_name,id_value,update_name,update_value,node)


        if (update_name == 'serverID'){
            update_value_n = arrayToString(update_value)

            fun = `
                MATCH (n:${node}{${id_name}:'${id_value}'})
                SET n.${update_name} = ${update_value_n}
                RETURN n
            `
        } else {

            fun = `
                MATCH (n:${node}{${id_name}:'${id_value}'})
                SET n.${update_name} = "${update_value}"
                RETURN n
            `
        }

        


        const session = driver.session({database:"neo4j"});


        result = await session.writeTransaction(tx => 
            tx.run(fun)
        )

        session.close()
        
    },
    updateNode_neo4j_serverID: async (req, res) => {
        const { id,node, serverID } = req;

        console.log("change -----------updateNode_neo4j_serverID---------= " , node, id,serverID)


        if (!(serverID && serverID.length>0)) return 

        if (!id) return 

        if (!node) return 


        let serverID_string = arrayToString(serverID)

        let fun = `
            MATCH (n:${node}{_id:'${id}'})
            SET n.serverID = ${serverID_string}
            RETURN n
        `


        const session = driver.session({database:"neo4j"});


        result = await session.writeTransaction(tx => 
            tx.run(fun)
        )

        session.close()
        
    },
    updateNode_neo4j_serverID_projectID: async (req, res) => {
        const { project_id,node, serverID } = req;

        console.log("change -----------updateNode_neo4j_serverID---------= " , node, project_id,serverID)


        if (!(serverID && serverID.length>0)) return 

        if (!project_id) return 

        if (!node) return 


        let serverID_string = arrayToString(serverID)

        let fun = `
            MATCH (n:${node}{project_id:'${project_id}'})
            SET n.serverID = ${serverID_string}
            RETURN n
        `


        const session = driver.session({database:"neo4j"});


        result = await session.writeTransaction(tx => 
            tx.run(fun)
        )

        session.close()
        
    },
    makeConnection_neo4j: async (req, res) => {
        const { node, id,connection } = req;

        console.log("change -------------makeConnection_neo4j---------= " , node,id, connection)
        const session = driver.session({database:"neo4j"});

        fun = ''
        node.forEach((n,idx) => {
            if (n=='Member'){
                fun += `
                MATCH (n${idx}:Member {_id: '${id[idx]}'})
                `
            } else {
                fun += `
                MATCH (n${idx}:${n} {_id: '${id[idx]}'})
                `
            }
        })
        fun += `
            MERGE (n0)-[:${connection}]->(n1)
        `

        console.log("fun = " , fun)
        result = await session.writeTransaction(tx => 
            tx.run(fun)
        )

        session.close()
        
    }
}

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