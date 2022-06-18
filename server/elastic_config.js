const { Client } = require('@elastic/elasticsearch')
fs = require('fs');

// const client = new Client({ 
//     node: 'https://localhost:9200',
//     auth: {
//         username: 'elastic',
//         password: 'hpY68TSUMETsI*y=DJbg'
//     },
//     tls: {
//         rejectUnauthorized: false
//     }
// })

const client = new Client({ 
    cloud: {
        id: "DAU:ZXUtd2VzdC0xLmF3cy5mb3VuZC5pbyQ2ZjI1NmRkZGUyYzU0YzI2ODhlNGJjZmMyMTg0MTRmMiRhMWYxM2Q0ZDljZWE0MzdmYjEwYmFhMDc3MzIyNDU3OQ=="
    },
    auth: {
        username: 'elastic',
        password: 'eoo1LGtsLXd6qXydgqDvo6Ro'
    },
})


// console.log("client = ",client)

module.exports = client;
