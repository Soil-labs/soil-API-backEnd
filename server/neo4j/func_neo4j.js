
const { driver } = require("../../server/neo4j_config");

module.exports = {
    createNode_neo4j: async (req, res) => {
        const { name, node, id, serverID } = req;

        console.log("change --------------------= " , name, node, id,serverID)


        let fun = ""
        if (serverID && serverID.length>0){
            fun = `   
                        MERGE (:${node} {_id: '${id}', name: '${name}', serverID: '${serverID}'})
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
    makeConnection_neo4j: async (req, res) => {
        const { node, id,connection } = req;

        console.log("change = " , node,id, connection)
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
