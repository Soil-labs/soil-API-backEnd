
const { driver } = require("../../server/neo4j_config");

module.exports = {
    createNode_neo4j: async (req, res) => {
        const { name, node, id } = req;

        console.log("change = " , name, node, id)
        const session = driver.session({database:"neo4j"});
        result = await session.writeTransaction(tx => 
            tx.run(
            `   
            MERGE (:${node} {_id: '${id}', name: '${name}'})
            `
            )
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


// module.exports = {
//     createNode: async (req, res) => {
//         const { name, type, id } = req;

//         console.log("change = " , name, type, id)
//         const session = driver.session();
//         const result = await session.run(
//             `MATCH (u:User {id: ${id}}) CREATE (u)-[:CREATED]->(n:${type} {name: ${name}}) RETURN n`,
//             { name, type, id }
//         );
//         session.close();
//         res.status(200).json(result.records[0]._fields[0].properties);
//     }
// }