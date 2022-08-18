
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


        const session = driver.session({database:"neo4j"});


        result = await session.writeTransaction(tx => 
            tx.run(fun)
        )

        session.close()
        
    },
    updateNode_neo4j: async (req, res) => {
        const { id,node, serverID } = req;

        console.log("change -----------updateNode_neo4j---------= " , node, id,serverID)


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
    // console.log("change sd =-==-=---=--===--==- ");
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
  
      console.log("stringResult = ", stringResult);
  
      return stringResult;
    } else {
      return arrayT;
    }
  }