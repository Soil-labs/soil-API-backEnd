
const base = require("../airtable_config")


function createMemberAsync(fields,base) {

    return new Promise((resolve, reject) => {
        //upload the file, then call the callback with the location of the file

        base('Members').create([
            {
              "fields": fields
            },
        ], function(err, records) {
            if (err) {
                console.error("Error createMemberAsync = ",err);
                return;
            }
            records.forEach(function (record) {
                resolve(record.id)
            });
        });
        // resolve(32)

    })
}

function createTweetAsync(categories,members) {


    const membersAirID = members.mentionUsers.map(member =>{
        return member.airtableID
    })

    console.log("membersAirID = " , membersAirID)

    return new Promise((resolve, reject) => {

        let fields = {
            "Content": categories.tweet.content,
            "Author": "@" + members?.author.discordName,
            // "Members": "@" + members?.author.discordName,
        }
        

        base('Tweets').create([
            {
                fields,
            },
        ], function(err, records) {
            if (err) {
                console.error("Error createTweetAsync = ",err);
                return;
            }
    
            // console.log("records[0]._rawJson.id = ",records[0]._rawJson.id)
            fields = {
                airtableID: records[0]._rawJson.id,
                content: fields.Content,
                author: fields.Author,
            }

            resolve(records[0]._rawJson)
        });
        // resolve(32)

    })
}


function updateMemberAsync(idUpdateMember,fields,base) {

    return new Promise((resolve, reject) => {
        //upload the file, then call the callback with the location of the file

        base('Members').update([
            {
                "id": idUpdateMember,
                "fields": fields
            },
        ], function(err, records) {
            if (err) {
                console.error("Error updateMemberAsync = ",err);
                return;
            }
            records.forEach(function (record) {


                resolve(record.id)
                
    
            });
        });
        // resolve(32)

    })
}



function createSkillAsync(fields,base) {

    return new Promise((resolve, reject) => {

        base('Skills').create([
            {
              "fields": fields
            },
        ], function(err, records) {
            if (err) {
                console.error("Error createSkillAsync 1= ",err);
                return;
            }
            records.forEach(function (record) {
                resolve(record)
            });
        });
        // resolve(32)

    })
}

function createProjectAsync(fields,base) {

    return new Promise((resolve, reject) => {

        base('Projects').create([
            {
              "fields": fields
            },
        ], function(err, records) {
            if (err) {
                console.error("Error createSkillAsync 2= ",err);
                return;
            }
            records.forEach(function (record) {
                resolve(record.id)
            });
        });
        // resolve(32)

    })
}


function createCategoriesAsync(fields,category) {


    // console.log("fields - airtable = " , fields)

    return new Promise((resolve, reject) => {

        // console.log("fields,category 2.5.2 = ",fields,category)

        base(category).create([
            {
              "fields": fields
            },
        ], function(err, records) {
            if (err) {
                console.error("Error createSkillAsync 3= ",category,err);
                return;
            }
            records.forEach(function (record) {
                resolve(record)
            });
        });
        // resolve(32)

    })
}
function updateCategoriesAsync(idRecord,fields,category,base) {

  console.log("fields 2.3.2 = ",idRecord,fields,category)


    return new Promise((resolve, reject) => {

        base(category).update([
            {
              "id": idRecord,
              "fields": fields
            },
        ], function(err, records) {
            if (err) {
                console.error("Error updateCategoriesAsync= ",err);
                return;
            }
            records.forEach(function (record) {
    
                resolve(record)

            });
        });
        // resolve(32)

    })
}

function updateSkillAsync(idRecord,fields,base) {

    return new Promise((resolve, reject) => {

        base('Skills').update([
            {
              "id": idRecord,
              "fields": fields
            },
        ], function(err, records) {
            if (err) {
                console.error("Error updateSkillAsync= ",err);
                return;
            }
            records.forEach(function (record) {
    
                resolve(record)

    
    
            });
        });
        // resolve(32)

    })
}

function updateProjectsAsync(idRecord,fields,base) {

    return new Promise((resolve, reject) => {

        base('Projects').update([
            {
              "id": idRecord,
              "fields": fields
            },
        ], function(err, records) {
            if (err) {
                console.error("Error updateProjectsAsync= ",err);
                return;
            }
            records.forEach(function (record) {
    
                resolve(record.id)

    
    
            });
        });
        // resolve(32)

    })
}



// function createTweetAsync(tweet,base,authorID="") {


//     return new Promise((resolve, reject) => {
//         //upload the file, then call the callback with the location of the file

//         let fields = {
//             "Content": tweet
//         }

//         // if (authorID){
//         //     fields = {
//         //         ...fields,
//         //         "Author": [authorID],
//         //     }
//         // }
        
//         // console.log("fields = ",fields)

//         base('Tweets').create([
//             {
//                 fields,
//             },
//         ], function(err, records) {
//             if (err) {
//                 console.error("Error createTweetAsync = ",err);
//                 return;
//             }
    
//             let tweetID
//             records.forEach(function (record) {
    
//                 tweetID = record.id
    
//             });
            

//             let results = {
//                 tweets: records,
//                 id: tweetID
//             }

//             resolve(results)
//         });
//         // resolve(32)

//     })
// }



function findSkillsAsync(skill,base) {

    let recordSkill = {
        skill,
        id: undefined,
        fields: {}
    }

    return new Promise((resolve, reject) => {
        
        base('Skills') // Find if the member already exist
            .select({view: "Grid view"})
            .eachPage((records,fetchNextPage)=>{
                records.forEach(record => {
                    
                    if (record.fields.Name == skill){ // Find if a member alrady exists
                        recordSkill = {
                            skill,
                            id: record.id,
                            fields: record._rawJson.fields
                        }
                    }
                })
                
                resolve(recordSkill)
            }
        )

        // resolve(32)

    })
}

async function findAsync(category,base) {


    return new Promise((resolve, reject) => {

        // console.log("category = " , category)
        
        base(category) // Find if the member already exist
            .select({view: "Grid view"})
            .eachPage((records,fetchNextPage)=>{
                
                // console.log("records = " , records)
                resolve(records)
            }, function done(err) {
                if (err) { console.error(err); return; }
            }
        )


    })
}

async function deleteAsync(category,id,base) {


    return new Promise((resolve, reject) => {
        

        base(category).destroy([id], function(err, deletedRecords) {
            if (err) {
              console.error(err);
              return;
            }
          // console.log('Deleted', deletedRecords.length, 'records');
          });


    })
}

function findProjectsAsync(project,base) {

    let recordProject = {
        project,
        id: undefined,
        fields: {}
    }

    return new Promise((resolve, reject) => {
        
        base('Projects') // Find if the member already exist
            .select({view: "Grid view"})
            .eachPage((records,fetchNextPage)=>{
                records.forEach(record => {
                    
                    if (record.fields.Name == project){ // Find if a member alrady exists
                        recordProject = {
                            project,
                            id: record.id,
                            fields: record._rawJson.fields
                        }
                    }
                })
                
                resolve(recordProject)
            }
        )

        // resolve(32)

    })
}

function findMembers_multiple(mentionID,authorID,base) {

    return new Promise((resolve, reject) => {
        //upload the file, then call the callback with the location of the file

        let idRecord = undefined
        let recordData = {
            mentionUser:{
                id: undefined,
                data: {}
            },
            author:{
                id: undefined,
                data: {}
            }
        }
        let results

        base('Members') // Find if the member already exist
            .select({view: "Grid view"})
            .eachPage((records,fetchNextPage)=>{

                
                

                records.forEach(record => {
                    if (record.fields.ID == mentionID){ // Find if a member alrady exists
                        idRecord = record.id
                        recordData = record._rawJson.fields
                        results = {
                            ...results,
                            mentionUser: {
                                id: idRecord,
                                data: recordData
                            }
                        }
                    }

                    if (record.fields.ID == authorID){ // Find if a member alrady exists
                        idRecord = record.id
                        recordData = record._rawJson.fields
                        results = {
                            ...results,
                            author: {
                                id: idRecord,
                                data: recordData
                            }
                        }
                    }
                })


                resolve(results)
            }
        )


        // resolve(32)
    })
}

module.exports = {findMembers_multiple,createTweetAsync,updateMemberAsync,createMemberAsync,createSkillAsync,
                    findSkillsAsync,updateSkillAsync,findProjectsAsync,createProjectAsync,
                    updateProjectsAsync,updateCategoriesAsync,
                    createCategoriesAsync,findAsync,deleteAsync};