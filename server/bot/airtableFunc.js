const airTable = require("../commandAPI/airTable");
const mongoFunc = require("../bot/mongoFunc");
const NLP = require("../bot/NLP");
const elasticSearch = require("../bot/elasticSearch");
const botFunc = require("../bot/botFunc");
const { Projects } = require("../models/projectsModel");



async function createTweet(tweet,author,base) {


    // console.log("tweet = ",tweet,author)
    // ------------- Create Tweet -------------
    let resultsTweet
                
    if (author && author.discordName)
        resultsTweet = await createTweetAsync(tweet.content,base,"@"+author.discordName) 
    else
        resultsTweet = await createTweetAsync(tweet.content,base) 
    // ------------- Create Tweet -------------

    tweet = {
        ...tweet,
        airtableID: resultsTweet.id
    }

    return (tweet)
}



function createTweetAsync(tweet,base,authorName="") {


    return new Promise((resolve, reject) => {

        let fields = {
            "Content": tweet
        }

        if (authorName){
            fields = {
                ...fields,
                "Author": authorName,
            }
        }
        
        // console.log("fields SOS = ",fields)

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

            mongoFunc.addTweet(fields)

            resolve(records[0]._rawJson)
        });
        // resolve(32)

    })
}
 
    

async function createOrUpdateCategories(categories,tweetID,base,category,members) {

 
    
    
    let categorySmall = category.toLowerCase();
    
    let newSkillID,fields,newTweet
  //console.log("posiion 2.1")
    for (let i=0;i<categories[categorySmall].length;i++) {

        

        
        if (categories[categorySmall][i].airtableID){

            // console.log("posiion 2.3",categories[categorySmall][i])


            // console.log("posiion 2.3")

            fields = {
                'Name': categories[categorySmall][i].content,
            }

            let tweets
            if (categories[categorySmall][i].tweets)
                tweets = categories[categorySmall][i].tweets
            else 
                tweets = []

    
            if (tweetID)
                tweets.push(tweetID)


            if (tweets.length===0)
                tweets = undefined
            
          //console.log("tweets = ",tweets)


            if (tweets) 
                fields = {
                    ...fields,
                    'Tweets': tweets,
                }

            if (categories[categorySmall][i].members && categories[categorySmall][i].members[0]!=null) 
                fields = {
                    ...fields,
                    'Members': categories[categorySmall][i].members,
                }
            
            if (categories[categorySmall][i].skills) 
                fields = {
                    ...fields,
                    'Skills': categories[categorySmall][i].skills,
                }
            if (categories[categorySmall][i].description) 
                fields = {
                    ...fields,
                    'Description': categories[categorySmall][i].description,
                }
            if (categories[categorySmall][i].title) 
                fields = {
                    ...fields,
                    'Title': categories[categorySmall][i].title,
                }
            if (categories[categorySmall][i].champion) 
                fields = {
                    ...fields,
                    'Champion': categories[categorySmall][i].champion,
                }

          console.log("fields 2.3.1 = ",categories[categorySmall][i].members)
          console.log("fields 2.3.1 = ",fields)


            newSkillID = await airTable.updateCategoriesAsync(categories[categorySmall][i].airtableID,fields,category,base)


            let members_all

            console.log("fields.Members = " , fields.Members)
            if (fields.Members!=null)
                members_all = [...fields.Members]

            console.log("members_all 1= " , members_all)
            // console.log("members = " , members)

            if (members && members_all){
                members.mentionUsers.forEach(memberN=>{
                    // console.log("memberN.airtableID = " , memberN.airtableID)
                    if (members_all.includes(memberN.airtableID)===false && memberN.airtableI)
                        members_all.push(memberN.airtableID)

                })
            }

          console.log("members_all 2 = " , members_all)


            let fieldsMongo = {
                airtableID: newSkillID.id,
                content: fields.Name,
                members: members_all,
                skills: fields.Skills,
                description: fields.Description,
                title: fields.Title,
                champion: fields.Champion,
            }
          //console.log("fields.tweets = " , fields.tweets)
            if (fields.Tweets){
                fieldsMongo = {
                    ...fieldsMongo,
                    tweets: fields.Tweets,
                }
            }
        //console.log("categories OLD = ",categories)
        //console.log("fields.Members OLD = ",fields.Members)
        //console.log("fieldsMongo OLD = ",fieldsMongo)
            newCategory = await mongoFunc.updateCategories(fieldsMongo,category)

        } 
        else {

            // console.log("posiion 2.2")
            

            fields = {
                "Name": categories[categorySmall][i].content,
                // "Tweets": [tweetID]
            }

    
            if (tweetID){
                tweets = [tweetID]
                fields = {
                    ...fields,
                    "Tweets": tweets
                }
            }
            

            newSkillID = await airTable.createCategoriesAsync(fields,category,base)

            // console.log("newSkillID = " , newSkillID)

            let members_all
            if (fields.Members){
                members_all = fields.Members
            } else {
                members_all = []
            }

          //console.log("members_all = " , members_all)
            // console.log("members = " , members)

            if (members){
                members.mentionUsers.forEach(memberN=>{
                    // console.log("memberN.airtableID = " , memberN.airtableID)
                    if (members_all.includes(memberN.airtableID)===false)
                        members_all.push(memberN.airtableID)

                })
            }

          //console.log("members_all = " , members_all)


            let fieldsMongo = {
                airtableID: newSkillID.id,
                content: fields.Name,
                tweets: fields.Tweets,
                members: members_all,
            }

            // console.log("fieldsMongo NEW= ",fieldsMongo)

            newCategory = await mongoFunc.addCategories(fieldsMongo,category)

        }


        categories[categorySmall][i] = {
            ...categories[categorySmall][i],
            airtableID: newSkillID.id,
        }
        if (fields.Tweets){
            categories[categorySmall][i] = {
                ...categories[categorySmall][i],
                tweets: fields.Tweets,
            }
        }
    }

    

    return (categories)
}

function collectIDs(data) {

    let IDs = []

    data.forEach(dat => {
        if (dat.airtableID)
            IDs.push(dat.airtableID)
    })

    return IDs
}


async function createTweetsFrom_Form(dataTweets,members,base,client,Discord,sentMessage) {




    // categories.tweet = await airtableFunc.createTweet(categories.tweet,members.author,base)


    // // console.log("categories 2 = ",categories)


    // categories = await airtableFunc.createOrUpdateCategories(categories,categories.tweet.airtableID,base,'Skills')


    let tweet = ""
    let skill_n
    let categories
    let skills_all_airtableIDs = []

    for (let i=0;i<dataTweets.extraSkills.length;i++){
        skill_n = dataTweets.extraSkills[i]
        
        // tweet = tweet + "!skill "+ skill_n.replace(" & ","_").replace(" ","_") + " "
        tweet = "!skill "+ skill_n.replace(" & ","_").replace(":","_").replace("(","_").replace("+","_").replace("/","_").replace(")","_").replace(" ","_").replace(" ","_").replace(" ","_") +" "+ "@"+ members.mentionUsers[0].discordName
        // if (i>0){
            // } else {
                //     tweet = 
                
                // }

        // console.log("tweet = " , tweet)


        categories = {
            skills: [{
                content: skill_n.replace(" & ","_").replace(":","_").replace("(","_").replace("+","_").replace("/","_").replace(")","_").replace(" ","_").replace(" ","_").replace(" ","_"),
                airtableID: undefined, 
                members: [],
                tweets: [],
            }],
            projects: [],
            tweet: {
                content: tweet,
                airtableID: undefined, 
                members: [],
            },
        }

        categories.tweet = await createTweet(categories.tweet,members.author,base)


        categories = await mongoFunc.findCategories_all(categories)

        // console.log("categories = " , categories)
        


        categories.skills.forEach(skill=>{ // add all the skills in order to search the projects later
            skills_all_airtableIDs.push(skill.airtableID)
        })



        // console.log("categories - createTweet = " , categories)

        categories = await createOrUpdateCategories(categories,categories.tweet.airtableID,base,'Skills',members)

        // console.log("categories - createOrUpdateCategories = " , categories)

        // console.log("members - before = " , members)


        members = await createOrUpdateMembers(members,categories,categories.tweet.airtableID,'!skill',base)
    
        
        // console.log("members - createOrUpdateMembers = " , members)

        // members = await createOrUpdateMembers(members,categories,categories.tweet.airtableID,'!skill',base,false,client)



        const elasticRes = await  elasticSearch.add(categories.tweet.content,members)



    }



    // members = await botFunc.SentDM_responed_discussion(categories.tweet.content,'!skill',members,client,Discord,base,sentMessage)


    // ----------------- Find all the projects taht match the IDs of this user -----------------

    let projectsMatch_skills = await mongoFunc.findProjects_matchSkills(skills_all_airtableIDs)

    console.log("projectsMatch_skills = " , projectsMatch_skills)

    if (projectsMatch_skills.length>0){

        let descriptionN = ""
        let projectNames = projectsMatch_skills.map((project,idx) => {
            descriptionN = descriptionN + "Project "+(idx+1)+" - "+project.content + "\n"
            return (project.content)
        })
        descriptionN =descriptionN +  "\n\n"
        

        console.log("projectNames = " , projectNames)
        console.log("members = " , members)

        if (members.mentionUsers.length>0){
            const numberProjects = projectNames.length
            let discussionOutput = {
                color: "#1ab342",
                title: ` @${members.mentionUsers[0].discordName} just endorse you about skills 🌱, and we found ${numberProjects} projects that are perfect for you! 😊`,
                description: descriptionN,
                footer: `To search on of this projects type: \n !search ${projectNames[0]}`,
                authorName: members.author.discordName,
                avatarUrl: members.author.discordAvatar,
                react: []
            }

            // console.log("change = " , change)

            sentMessage.sentEmbedNew(discussionOutput,members.mentionUsers[0].discordID,client,Discord,true)
        }

    }
    // ----------------- Find all the projects taht match the IDs of this user -----------------



    
    
    
    
    // tweet = tweet + dataTweets.discordName
    
    // console.log("tweet = " , tweet)

    // // results = NLP.splitCommandAndMention(tweet,[],message.author)

    // // members = results.members
    // // categories = results.categories


    // console.log("members = " , members)
    // // console.log("categories = " , categories)

}


async function createOrUpdateMembers_Form(members,base) {


    
    
    for (let i=0;i<members.mentionUsers.length;i++) {

      // console.log("members.mentionUsers[i] 34= ",members.mentionUsers[i])
        
        if (members.mentionUsers[i].airtableID!=="NEW"){
            

        

            fields = {
                
            }

            if (members.mentionUsers[i].skills){
                fields = {
                    ...fields,
                    "Skills": members.mentionUsers[i].skills
                }
            } else {
                fields = {
                    ...fields,
                    "Skills": []
                }
            }

            if (members.mentionUsers[i].projects){
                fields = {
                    ...fields,
                    "Projects": members.mentionUsers[i].projects
                }
            } else {
                fields = {
                    ...fields,
                    "Projects": []
                }
            }

          // console.log("fields 1223= ",fields)

            


            newSkillID = await airTable.updateCategoriesAsync(members.mentionUsers[i].airtableID,fields,"Members",base)


            let fieldsMongo = {
                airtableID: members.mentionUsers[i].airtableID,
                skills: fields["Skills"],
                projects: fields["Projects"],

                registeredAt: new Date()

            }

          // console.log("members.mentionUsers[i] = ",i,fieldsMongo.discordName, fieldsMongo.skills )



            // let fieldsMongo = {
            //     airtableID: newSkillID.id,
            //     content: fields.Name,
            //     tweets: fields.Tweets, d
            //     members: fields.Members,
            // }
            // console.log("fieldsMongo OLD = ",fieldsMongo)
            newCategory = await mongoFunc.updateCategories(fieldsMongo,'Members')

          // console.log("fieldsMongo 22322= ",fieldsMongo)


        } else {

            fields = {
                "Discord Name": members.mentionUsers[i].discordName.replace('@',''),
                "ID": members.mentionUsers[i].discordID
            }

            if (members.mentionUsers[i].skills){
                fields = {
                    ...fields,
                    "Skills": members.mentionUsers[i].skills
                }
            } else {
                fields = {
                    ...fields,
                    "Skills": []
                }
            }

            if (members.mentionUsers[i].projects){
                fields = {
                    ...fields,
                    "Projects": members.mentionUsers[i].projects
                }
            } else {
                fields = {
                    ...fields,
                    "Projects": []
                }
            }

          // console.log("fields 8822= ",fields)

            // fields = {
                // "Discord Name": members.mentionUsers[i].discordName,
                // "ID": members.mentionUsers[i].discordID,
            //     // "Skills": skillsIDs
            //     "Tweets": [categories.tweet.airtableID],
            //     "Phase": 0,
            //     "Discussion": "general",
            // }
            // if (skillsIDs.length>0){
            //     fields = {
            //         ...fields,
            //         "Skills": skillsIDs
            //     }
            // }
            // if (projectsIDs.length>0){
            //     fields = {
            //         ...fields,
            //         "Projects": projectsIDs
            //     }
            // }

          // console.log("fields = ",fields)

            newSkillID = await airTable.createCategoriesAsync(fields,'Members',base)


            let fieldsMongo = {
                airtableID: newSkillID.id,
                discordName: members.mentionUsers[i].discordName,
                discordID: members.mentionUsers[i].discordID,

                discussion:{
                    phase: 0,
                    topic: 'tutorial',
                },

                registeredAt: new Date()

            }
            if (fields['Skills'].length>0){
                fieldsMongo = {
                    ...fieldsMongo,
                    skills: fields['Skills']
                }
            }
            if (fields['Projects'].length>0){
                fields = {
                    ...fields,
                    projects: fields['Projects']
                }
            }

          // console.log("fieldsMongo = ",fieldsMongo)

            // console.log("fieldsMongo = ",fieldsMongo)

            // console.log("fieldsMongo NEW= ",fieldsMongo)

            newCategory = await mongoFunc.addCategories(fieldsMongo,'Members')

        }


        // members.mentionUsers = {
        //     ...members.mentionUsers,
        //     airtableID: newSkillID.id,
        //     tweets: fields.Tweets,
        // }
    }

    

    return (members)
}

async function changeDiscussionMember(feildSave) {

    if (feildSave.airtableID){

        let fieldsMongo = {
            airtableID:feildSave.airtableID,
            registeredAt: new Date()
        }

        if (feildSave.topic){
            fieldsMongo = {
                ...fieldsMongo,
                discussion:{
                    ...fieldsMongo.discussion,
                    topic: feildSave.topic,

                },
                
            }
        }
        if (typeof feildSave.phase === 'number'){
            fieldsMongo = {
                ...fieldsMongo,
                discussion:{
                    ...fieldsMongo.discussion,
                    phase: feildSave.phase,
                },
                
            }
        }

        if (feildSave.authorName){
            fieldsMongo = {
                ...fieldsMongo,
                discussion:{
                    ...fieldsMongo.discussion,
                    authorName: feildSave.authorName,
                    command: feildSave.command,
                    tweet: feildSave.tweet,
                }
            }
        }

        if (feildSave.discussExtraData){
            fieldsMongo = {
                ...fieldsMongo,
                discussExtraData: feildSave.discussExtraData,
                
            }
        }


        
        newCategory = await mongoFunc.updateCategories(fieldsMongo,'Members')


    } 

}


async function createOrUpdateMembers(members,categories,tweetID,command,base,authorUpdate = false,client=false) {


    // console.log("categories = ",categories)
    // console.log("members = ",members)


  // console.log(" tt tt ")


    skillsIDs = collectIDs(categories.skills)

    projectsIDs = collectIDs(categories.projects)

  ////console.log("skillsIDs = ",skillsIDs)
  ////console.log("projectsIDs = ",projectsIDs)
    
    tweetID = categories.tweet.airtableID
    
    let newSkillID,fields,newTweet

    let authorIsAlsoMember = false
    let idxAuthor = -1
    for (let i=0;i<members.mentionUsers.length;i++) {

        if (members.mentionUsers[i].discordID == members.author.discordID){
            authorIsAlsoMember = true
            idxAuthor = i
          ////console.log("authorIsAlsoMember = " , authorIsAlsoMember)
        }
        
        if (members.mentionUsers[i].airtableID){
            
            let tweets = members.mentionUsers[i].tweets

    
            if (tweetID)
                tweets.push(tweetID)

        

            fields = {
                "Discord Name": members.mentionUsers[i].discordName,
                "ID": members.mentionUsers[i].discordID,
                // "Skills": skillsIDs
                "Tweets": tweets,
                "Phase": members.mentionUsers[i].phase,
                "Discussion": members.mentionUsers[i].descussion
            }

            // ------------ Skills ----------------
            let skills_all = [...skillsIDs]

            // console.log("skills_all = ",skills_all,"skillsIDs = ",skillsIDs)

            
            let skillsNow = members.mentionUsers[i].skills

            // console.log("skillsNow = ",skillsNow)


            // console.log("skills_all - 1 ",skills_all,skillsNow)

          //console.log("skills_all - 1 ",skills_all)


            if (skillsNow.length>0){
                skillsNow.forEach(skil=>{
                    if (skills_all.includes(skil)===false)
                        skills_all.push(skil)

                })
            } 
          //console.log("skillsNow 2 = ",skillsNow)


          //console.log("skills_all - 2 ",skills_all)


            fields = {
                ...fields,
                "Skills": skills_all
            }
            // ------------ Skills ----------------


            // ------------ Project ----------------
            let projects_all = projectsIDs

            // console.log("projects_all - 1 ",projects_all)

            let projectsNow = members.mentionUsers[i].projects
            if (projectsNow.length>0){
                projectsNow.forEach(proj=>{
                    if (projects_all.includes(proj)===false)
                        projects_all.push(proj)

                })
            }

            // console.log("projects_all - 2 ",projects_all)


            fields = {
                ...fields,
                "Projects": projects_all
            }
            // ------------ Project ----------------


            


            newSkillID = await airTable.updateCategoriesAsync(members.mentionUsers[i].airtableID,fields,"Members",base)



            let fieldsMongo = {
                airtableID: members.mentionUsers[i].airtableID,
                discordName: members.mentionUsers[i].discordName,
                discordID: members.mentionUsers[i].discordID,
                tweets: fields["Tweets"],
                skills: fields["Skills"],
                projects: fields["Projects"],

                registeredAt: new Date()

            }

            if (client){
                let user = await client.users.fetch(members.mentionUsers[i].discordID)
              //console.log("user 223 = " , user)
                fieldsMongo = {
                    ...fieldsMongo,
                    discordAvatar: user.displayAvatarURL(),
                }
            }

          //console.log("fieldsMongo 22= " , fieldsMongo,client)

          ////console.log("members.mentionUsers[i] - airtableFunc = " , members.mentionUsers[i])

          // console.log("members.mentionUsers[i] = ",i,fieldsMongo.discordName, fieldsMongo.skills )



            // let fieldsMongo = {
            //     airtableID: newSkillID.id,
            //     content: fields.Name,
            //     tweets: fields.Tweets, d
            //     members: fields.Members,
            // }
            // console.log("fieldsMongo OLD = ",fieldsMongo)
            newCategory = await mongoFunc.updateCategories(fieldsMongo,'Members')

          // console.log("fieldsMongo 22322= ",fieldsMongo)
            members.mentionUsers[i].airtableID = newCategory.airtableID
            members.mentionUsers[i].skills = newCategory.skills


        } else {

          //////console.log("members.mentionUsers[i] AirtableFunc = " , members.mentionUsers[i])

            fields = {
                "Discord Name": members.mentionUsers[i].discordName,
                "ID": members.mentionUsers[i].discordID,
                // "Skills": skillsIDs
                // "Tweets": [categories.tweet.airtableID],
            }

            if (categories.tweet.airtableID){
                fields = {
                    ...fields,
                    "Tweets": [categories.tweet.airtableID],
                }
            }

            if (skillsIDs.length>0){
                fields = {
                    ...fields,
                    "Skills": skillsIDs
                }
            }
            if (projectsIDs.length>0){
                fields = {
                    ...fields,
                    "Projects": projectsIDs
                }
            }

            // console.log("fields = ",fields)

            newSkillID = await airTable.createCategoriesAsync(fields,'Members',base)


            let fieldsMongo = {
                airtableID: newSkillID.id,
                discordName: members.mentionUsers[i].discordName,
                discordID: members.mentionUsers[i].discordID,
                discussion:{
                    topic: "tutorial",
                    phase: 1,
                    authorName: members.author.discordName,
                    command: command,
                    tweet: categories.tweet.content
                },
                tweets: categories.tweet.airtableID,

                registeredAt: new Date()

            }
            if (skillsIDs.length>0){
                fieldsMongo = {
                    ...fieldsMongo,
                    skills: skillsIDs
                }
            }
            if (projectsIDs.length>0){
                fieldsMongo = {
                    ...fieldsMongo,
                    projects: projectsIDs
                }
            }

            if (client){
                let user = await client.users.fetch(members.mentionUsers[i].discordID)
                fieldsMongo = {
                    ...fieldsMongo,
                    discordAvatar: user.displayAvatarURL(),
                }
            }

          


            newCategory = await mongoFunc.addCategories(fieldsMongo,'Members')

        }




        // members.mentionUsers = {
        //     ...members.mentionUsers,
        //     airtableID: newSkillID.id,
        //     tweets: fields.Tweets,
        // }

        members.mentionUsers[i].airtableID = newCategory.airtableID
        members.mentionUsers[i].skills = newCategory.skills
    }

    if (!members.author.airtableID && authorUpdate && authorIsAlsoMember===true) {
        members.author.airtableID = members.mentionUsers[idxAuthor].airtableID
    }

    if (!members.author.airtableID && authorUpdate && authorIsAlsoMember===false) {
        // if (!members.author.airtableID && authorUpdate) {

        // console.log("members.mentionUsers[i] AirtableFunc = " , members.mentionUsers[i])

        fields = {
            "Discord Name": members.author.discordName,
            "ID": members.author.discordID,
        }

        if (categories.tweet.airtableID){
            fields = {
                ...fields,
                "Tweets": [categories.tweet.airtableID],
            }
        }

        if (skillsIDs.length>0){
            fields = {
                ...fields,
                "Skills": skillsIDs
            }
        }
        if (projectsIDs.length>0){
            fields = {
                ...fields,
                "Projects": projectsIDs
            }
        }

        // console.log("fields = ",fields)

        newSkillID = await airTable.createCategoriesAsync(fields,'Members',base)


        let fieldsMongo = {
            airtableID: newSkillID.id,
            discordName: members.author.discordName,
            discordID: members.author.discordID,
            discussion:{
                topic: "tutorial",
                phase: 1,
                authorName: members.author.discordName,
                command: command,
                tweet: categories.tweet.content
            },
            tweets: categories.tweet.airtableID,

            registeredAt: new Date()

        }
        if (skillsIDs.length>0){
            fieldsMongo = {
                ...fieldsMongo,
                skills: skillsIDs
            }
        }
        if (projectsIDs.length>0){
            fields = {
                ...fields,
                projects: projectsIDs
            }
        }
        if (client){
            let user = await client.users.fetch(members.author.discordID)
            fieldsMongo = {
                ...fieldsMongo,
                discordAvatar: user.displayAvatarURL(),
            }
        }

      ////console.log("fieldsMongo - airtableFunc = " , fieldsMongo)

        newCategory = await mongoFunc.addCategories(fieldsMongo,'Members')

        members.author.airtableID = newCategory.airtableID
        members.author.skills = newCategory.skills

    }

    // console.log("newCategory = " , newCategory)

    // members.airtableID = newCategory.airtableID

    return (members)
}

async function extraSkills_newField (json,field){
    // async function extraSkills_newField (categories,field){

    let extraSkills = []
    if (json.extraSkills){
        extraSkills = json.extraSkills
    } 
    if (field){
        extraSkills = extraSkills.concat(field)
    }

    json = {
        ...json,
        extraSkills,
    }

    // console.log("categories = " , categories)

    // if (field){
    //     field.forEach(fieldN => {
            // categories.skills.push({
            //     content: fieldN.replace(" & ","_").replace(" ","_").replace(" ","_").replace(" ","_"),
            //     airtableID: undefined, 
            //     members: [],
            //     tweets: [],
            // })
    //     })
    // }


    return json
    // return categories

}


async function checkAirtableNewFormRows(base,client,Discord,sentMessage) {


    // console.log("change = " )

    const res = await airTable.findAsync('Updates',base)





    let members

    let temp
    // console.log("res  = " , res )
    res.forEach( async record => {


        // console.log("record = " , record)

        if (record.fields['AuthorName']) {


            members = {
                author: {
                    discordID: "",
                    discordName: record.fields['AuthorName'].replace("@",""),
                    airtableID: record.fields['AuthorID'], 
                    tweets: [],
                    skills: [],
                    projects: [],
                    discussion:{
                        topic: "tutorial",
                        phase: 0,
                    },
                    discriminator: "",
                },
                mentionUsers: [{
                    discordID: "",
                    discordName: record.fields['discord Name'].replace("@",""),
                    airtableID: record.fields['Parent Record ID'], 
                    tweets: [],
                    skills: [],
                    projects: [],
                    discussion:{
                        topic: "tutorial",
                        phase: 0,
                    },
                    discriminator: "",
                }]
            }

        ////console.log("members - before= " , members)

            members = await mongoFunc.findMentionUsers(members,true)

        //console.log("members after findMentionUsers = " , members)


            temp = {}
            temp = {
                discordID: record.fields['ID'],
                discordName: record.fields['discord Name'],
                airtableID: record.fields['Parent Record ID'], 
            }

            if (record.fields['Skills'])
                temp = {...temp,
                    skills: record.fields['Skills']
                }

            if (record.fields['Projects'])
                temp = {...temp,
                    projects: record.fields['Projects']
                }
        
            // let categories = {
            //     skills: [],
            //     projects: [],
            //     tweet: {
            //         content: "",
            //         airtableID: undefined, 
            //         members: [],
            //     },
            // }
            
            temp = await extraSkills_newField(temp,record.fields['Web3 Expertise'])
            temp = await extraSkills_newField(temp,record.fields['Consulting Specialism'])
            temp = await extraSkills_newField(temp,record.fields['General Consulting Skills'])
            temp = await extraSkills_newField(temp,record.fields['Technical Skills'])
            temp = await extraSkills_newField(temp,record.fields['Soft Skills'])
            temp = await extraSkills_newField(temp,record.fields['Product & Design Skills'])
            temp = await extraSkills_newField(temp,record.fields['Marketing Skills'])
            temp = await extraSkills_newField(temp,record.fields['Operations Skills'])
            temp = await extraSkills_newField(temp,record.fields['Finance Skills'])
            temp = await extraSkills_newField(temp,record.fields['Legal Skills'])
            temp = await extraSkills_newField(temp,record.fields['Soft Skills'])
            // temp = await extraSkills_newField(temp,record.fields['High Level Skill Areas'])
            temp = await extraSkills_newField(temp,record.fields['Other Skills Not In The List'])
    


            // // console.log("temp = " , temp)


            // const res = await Projects.find({ skills: "rec2YYJfLCUXQmvAR" })

            // console.log("res = " , res)

            // // return (res)
            

            createTweetsFrom_Form(temp,members,base,client,Discord,sentMessage)
            
            await airTable.deleteAsync("Updates",record.id,base)

        }
        
    })
    
}



async function checkAirtableNewFormRows_project(base,client,Discord,sentMessage) {


    // console.log("change = " )

    const res = await airTable.findAsync('Project Update',base)





    let members

    let temp
    // console.log("res  = " , res )
    res.forEach( async record => {


      //console.log("record = " , record)



        let categories = {
            skills: [],
            projects: [{
                content: record.fields['Project Name'],
                airtableID: record.fields['Parent Record ID'], 
                // members: record.fields['Members'],
                // tweets: record.fields['Tweets'],
            }],
            tweet: {
                content: "",
                airtableID: undefined, 
                members: [],
            },
        }

        if (record.fields['Members'])
            categories.projects[0] = {...categories.projects[0],
                members: record.fields['Members']
            }

        if (record.fields['Tweets'])
            categories.projects[0] = {...categories.projects[0],
                tweets: record.fields['Tweets']
            }

        if (record.fields['Skills'])
            categories.projects[0] = {...categories.projects[0],
                skills: record.fields['Skills']
            }

        if (record.fields['Description'])
            categories.projects[0] = {...categories.projects[0],
                description: record.fields['Description']
            }

        if (record.fields['Title'])
            categories.projects[0] = {...categories.projects[0],
                title: record.fields['Title']
            }

        if (record.fields['Champion'])
            categories.projects[0] = {...categories.projects[0],
                champion: record.fields['Champion']
            }


      //console.log("categories = 22 " , categories)


        categories = await createOrUpdateCategories(categories,categories.tweet.airtableID,base,'Projects')


        //  ----------- Members ------------------------------
        let members = {
            author: {},
            mentionUsers: []
        }

        record.fields['Members'].forEach(airtableID=>{
            members.mentionUsers.push({
                discordID: undefined,
                discordName: undefined,
                airtableID: airtableID, 
                tweets: [],
                skills: [],
                projects: [],
                discussion:{
                    topic: "tutorial",
                    phase: 0,
                },
                discriminator: undefined,
            })
        })

        // console.log("members = " , members)
        //  ----------- Members ------------------------------


        members = await mongoFunc.findMentionUsers(members,true)


        // console.log("members 2 = " , members)


        members = await createOrUpdateMembers(members,categories,"",'!project',base,false,client)



        await airTable.deleteAsync("Project Update",record.id,base)



        // members = {
        //     author: {
        //         discordID: "",
        //         discordName: record.fields['AuthorName'].replace("@",""),
        //         airtableID: record.fields['AuthorID'], 
        //         tweets: [],
        //         skills: [],
        //         projects: [],
        //         discussion:{
        //             topic: "tutorial",
        //             phase: 0,
        //         },
        //         discriminator: "",
        //     },
        //     mentionUsers: [{
        //         discordID: "",
        //         discordName: record.fields['discord Name'].replace("@",""),
        //         airtableID: record.fields['Parent Record ID'], 
        //         tweets: [],
        //         skills: [],
        //         projects: [],
        //         discussion:{
        //             topic: "tutorial",
        //             phase: 0,
        //         },
        //         discriminator: "",
        //     }]
        // }

    //   ////console.log("members - before= " , members)

    //     members = await mongoFunc.findMentionUsers(members,true)

    // //console.log("members after findMentionUsers = " , members)


    //     temp = {}
    //     temp = {
    //         discordID: record.fields['ID'],
    //         discordName: record.fields['discord Name'],
    //         airtableID: record.fields['Parent Record ID'], 
    //     }

    //     if (record.fields['Skills'])
    //         temp = {...temp,
    //             skills: record.fields['Skills']
    //         }

    //     if (record.fields['Projects'])
    //         temp = {...temp,
    //             projects: record.fields['Projects']
    //         }
    
    //     // let categories = {
    //     //     skills: [],
    //     //     projects: [],
    //     //     tweet: {
    //     //         content: "",
    //     //         airtableID: undefined, 
    //     //         members: [],
    //     //     },
    //     // }
        
    //     temp = await extraSkills_newField(temp,record.fields['Web3 Expertise'])
    //     temp = await extraSkills_newField(temp,record.fields['Consulting Specialism'])
    //     temp = await extraSkills_newField(temp,record.fields['General Consulting Skills'])
    //     temp = await extraSkills_newField(temp,record.fields['Technical Skills'])
    //     temp = await extraSkills_newField(temp,record.fields['Soft Skills'])
    //     temp = await extraSkills_newField(temp,record.fields['Product & Design Skills'])
    //     temp = await extraSkills_newField(temp,record.fields['Marketing Skills'])
    //     temp = await extraSkills_newField(temp,record.fields['Operations Skills'])
    //     temp = await extraSkills_newField(temp,record.fields['Finance Skills'])
    //     temp = await extraSkills_newField(temp,record.fields['Legal Skills'])
    //     temp = await extraSkills_newField(temp,record.fields['Soft Skills'])
    //     // temp = await extraSkills_newField(temp,record.fields['High Level Skill Areas'])
    //     temp = await extraSkills_newField(temp,record.fields['Other Skills Not In The List'])
   

    //     // console.log("temp - checkAirtableNewFormRows = " , record.fields)

        

    //     createTweetsFrom_Form(temp,members,base,client,Discord,sentMessage)

    //     // console.log("res = ",res)

        
    })
    
}



module.exports = {createTweet,createOrUpdateCategories,createOrUpdateMembers,
                    createOrUpdateMembers_Form,checkAirtableNewFormRows,checkAirtableNewFormRows_project,
                    changeDiscussionMember,createTweetsFrom_Form};