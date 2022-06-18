
const generalMessage_skill = {
    output:{
        color: "#1ab342",
        title: 'Look at your skilltree grow! 🌳 @AUTHOR endorsed you for this skill 👇. ',
        description: '@SKILL',
        footer: ('Just out of curiosity, what’s your experience level for this skill?   \n\n '
                    + `1️⃣  don't add this to my skilltree (yet) \n\n`
                    + `2️⃣  less than 1 year \n\n`
                    + `3️⃣  between 1 and 3 years \n\n`
                    + `4️⃣  more than 3 years`),
        react: ['1️⃣','2️⃣', '3️⃣', '4️⃣'],
        // avatarURL: 'https://cdn.discordapp.com/avatars/908392557258604544/3d834ac5b2ed60c37533ffe2c3c3a2a7.webp'
    },
    nextPhase:{
        phase: 0,
        topic: 'general'
    },
    runFunctions:{
        saveInitialData: true,
        showAvatar: true,
    }
}


const generalMessage_project = {
    output:{
        color: "#1ab342",
        title: 'Working the soil I see! 💪🏽 @AUTHOR said you’re working on: ',
        description: '@PROJECT',
        footer: ('What bandwidth do you currently have for this project?  \n\n '
                    + `1️⃣  none this week \n\n`
                    + `2️⃣  couple of hours this week  \n\n`
                    + `3️⃣  < 5 hours this week  \n\n`
                    + `4️⃣  < 10 hours this week   \n\n`
                    + `5️⃣  < 20 hours this week  \n\n`
                    + `6️⃣  > 20 hours this week`),
        react: ['1️⃣','2️⃣', '3️⃣', '4️⃣']
    },
    nextPhase:{
        phase: 0,
        topic: 'general'
    },
    runFunctions:{
        saveInitialData: true,
    }
}

const generalMessage_index = {
    output:{
        color: "#1ab342",
        title: 'Wow! 🤩 @AUTHOR wrote this about you:',
        description: '@TWEET',
        footer: ('Does this info sound accurate to you?   \n\n '
                    + `✅ Yep! \n\n`
                    + `❌ Nope! \n\n`),
        react: ['✅','❌']
    },
    nextPhase:{
        phase: 0,
        topic: 'general'
    },
    runFunctions:{
        saveInitialData: true,
    }
} 
 
const startMessage_tutoria = {
        output:{
            color: "#1ab342",
            title: 'Wow! 🤩 Look at this - @AUTHOR just endorsed you for',
            description: '@SKILL',
            footer: ('\n\n'
                        + `✅  Claim \n\n`
                        + `❌  Disagree \n\n`
                        + `↩️  Skip Tutorial \n\n`),
            react: ['✅','❌','↩️']
        },
        nextPhase:{
            phase: 1,
            topic: 'tutorial'
        },
        runFunctions:{
            saveInitialData: true,

        }
    }

const finalMessage_tutorial = {
        output:{
            color: "#1ab342",
        title: 'Well that was easy 🎉 You now know the basics 🤩',
        description: 'Type `!soil_help` to get an overview of all the tools that are currently availabile to you. \n\n\n Let’s realise the promise of this DAO\'s together & turn our community into a fertile ground filled with opportunities for everyone! WAGMI',
            footer: '',
            react: []
        },
        nextPhase:{
            phase: 0,
            topic: "general",
        },
        runFunctions:{
        }
    }

// const helpCommand = {
//     output:{
//         color: "#1ab342",
//         title: 'Hi there, it’s Benny and here’s what I can do:',
//         description: 
//         '!skill - to add a skill to the person \n\n'+

//         '!project - to add a project to the person\n\n'+

//         '!index - make a general input \n\n'+
        
//         '!airtable - to get a link to the DAO database\n\n'+
        
//         '!endorse @SOMEOUN - Add the skills of someone in a Form \n\n'+

//         '!help_soil - Show you all the commands \n\n'+

//         '!error - Give us feedback about an error or a new feature \n\n'+
        
//         '!search - to initiate in-app smart search',
//         footer: '',
//         react: []
//     },
//     nextPhase:{
//         phase: 0,
//         topic: 'general'
//     },
//     runFunctions:{
//         saveInitialData: true,
//     }
// }  

const helpCommand = {
    output:{
        color: "#1ab342",
        title: 'Hi fren - skillset here 👋. Here’s how I can help you:',
        description:'',
        footer: '',
        fields: [
            {
                name: '`!endorse` _@name_',
                value: 'lets you endorse your own or someone else’s skills',
            },
            {
                name: '`!project` _@name_ projec_tname',
                value: 'lets you add 1 or multiple discord handles as part of a project. ',
            },
            {
                name: '`!search` project_name',
                value: 'Lets you see all the Messages related to a project',
            },
            {
                name: '`!airtable` ',
                value: 'pulls up full access to the airtable of your DAO ',
            },
            {
                name: '!`error`',
                value: 'allows you to log an error or suggest a new feature to us so we can get straight on fixing it! 😉',
            },
            {
                name: '`!index` _@name_ `!skill` `!project` ',
                value: 'lets you write free text about a person & saves it straight to the graph. \n You can use multiple tags like !skill & !project tags to save the information in the right place. \nFor example: !index @Bluepanda has amazing !skill leadership abilities, I think he would make a great candidate for the !project mentorship_program especially given his !skill coaching skills from having led a 20 person team.',
            },
            {
                name: '`!skill` _@name_ skill_name',
                value: 'lets you endorse your own or someone else’s skill in freeform. Mainly used in combination with !index 👆',
            },
        ],
        react: []
    },
    nextPhase:{
        phase: 0,
        topic: 'general'
    },
    runFunctions:{
        saveInitialData: true,
    }
}  


const errorCommand = {
    output:{
        color: "#1ab342",
        title: 'You found an error! good work 🥵 Super grateful 🙏 that you want to help us improve soil 🌱 \n\n Here’s the form that will let you report it👇',
        description: '@LINK',
        footer: '',
        react: []
    },
    nextPhase:{
        phase: 0,
        topic: "general",
    },
    runFunctions:{
    }
}

const discussion = 
{
    general:{
        "0":{
            "!project":generalMessage_project,
            "!skill":generalMessage_skill,
            "!map":generalMessage_index,
            "!index":generalMessage_index,
            "!help_soil":helpCommand,
            "!error": errorCommand,
            "!tutorial": startMessage_tutoria,
        }
    },
    search:{
        "0":{
            "!search":{
                output:{
                    color: "#1ab342",
                    title: 'Let me help you look for that @AUTHOR 😊',
                    description: '@TWEET',
                    footer: ('Would you rather show the results \n\n '
                                + `1️⃣  on airtable \n\n`
                                + `2️⃣  stay in discord \n\n`),
                    react: ['1️⃣','2️⃣']
                },
                nextPhase:{
                    phase: 1
                },
                runFunctions:{
                    saveInitialData: true,
                }
            },
        },
        "1":{
            "1️⃣":{
                output:{
                    color: "#1ab999",
                    title: 'Here is the link with your search results. I went ahead & did the filtering for you. YW! 😉 ',
                    description: '',
                    footer: '',
                    react: []
                },
                nextPhase:{
                    phase: 0,
                    topic: 'general'
                },
                runFunctions:{
                    airtableFilteredSearch: true,
                    dontShowOutput_mainArea: true,
                }
            },
            "2️⃣":{
                // output:{
                //     color: "#1ab342",
                //     title: 'The results of your search are',
                //     description: '@RESULT',
                //     footer: '',
                //     react: []
                // },
                nextPhase:{
                    phase: 2,
                    // topic: 'general'
                },
                runFunctions:{
                    elasticSearch_tweet: true,
                }
            },
            "!project":generalMessage_project,
            "!skill":generalMessage_skill,
            "!map":generalMessage_index,
            "!index":generalMessage_index,
            "!help_soil":helpCommand,
            "!error": errorCommand,
        },
        "2":{
            "1️⃣":{
                // output:{color: "#1ab342",title: '123',description: 'asdf',footer: 'asdf',react: []},
                nextPhase:{
                    phase: 0,
                    topic: 'general'
                },
                runFunctions:{
                    elasticSearch_showResults: true,
                }
            },
            "2️⃣":{
                // output:{color: "#1ab342",title: 'asdf',description: 'adsf',footer: 'asdf',react: []},
                nextPhase:{
                    phase: 0,
                    topic: 'general'
                },
                runFunctions:{
                    elasticSearch_showResults: true,
                }
            },
            "!project":generalMessage_project,
            "!skill":generalMessage_skill,
            "!map":generalMessage_index,
            "!index":generalMessage_index,
            "!help_soil":helpCommand,
            "!error": errorCommand,
        }
    },
    search_elastic: {
        "0":{
            "empty":{
                output:{
                    color: "#1ab342",
                    title: '',
                    description: '',
                    footer: '',
                    react: []
                },
                nextPhase:{
                },
                runFunctions:{
                }
            }
        },
    },
    tutorial: {
        "0":{
            "!project":startMessage_tutoria,
            "!skill":startMessage_tutoria,
            "!map":startMessage_tutoria,
            "!index":startMessage_tutoria,
            "!help_soil":helpCommand,
            "!error": errorCommand,
        },
        "1":{
            "✅":{
                output:{
                    color: "#1ab342",
                    title: 'Hi fren👋 I’m Soil 🌱 - my job is to turn this community into a rich field of exciting opportunities with & for you 🥰',
                    description: 'There’s a lot happening across the community - it’s hard to keep track of it all without being online 24/7. That’s why my graph, my AI and I are working really hard to make it easy for you to search, match & post cool opportunities. Also, based on your requierements, I can recomend people and projects to you! \n\n ',
                    footer: (' '
                                + `✅  Continue \n\n`
                                + `↩️  Skip Tutorial \n\n`),
                    react: ['✅','↩️']
                },
                nextPhase:{
                    phase: 2,
                },
                runFunctions:{
                }
            },
            "❌":{
                output:{
                    color: "#1ab342",
                    title: 'Hi fren👋 I’m soil 🌱 - my job is to turn this community into a rich field of exciting opportunities with & for you 🥰',
                    description: 'There’s a lot happening across the community - it’s hard to keep track of it all without being online 24/7. That’s why my graph, my AI and I are working really hard to make it easy for you to search, match & post cool opportunities. Also, based on your requierements, I can recomend people and projects to you!\n\n ',
                    footer: (' '
                                + `✅  Continue \n\n`
                                + `↩️  Skip Tutorial \n\n`),
                    react: ['✅','↩️']
                },
                nextPhase:{
                    phase: 2,
                },
                runFunctions:{
                }
            },
            "↩️":finalMessage_tutorial,
            "!project":startMessage_tutoria,
            "!skill":startMessage_tutoria,
            "!map":startMessage_tutoria,
            "!index":startMessage_tutoria,
            "!help_soil":helpCommand,
            "!error": errorCommand,
        },
        "2": {
            "✅": {
                output: {
                    color: "#1ab342",
                    title: '',
                    description: 'All I ask is that you let me know when important stuff is happening. For example, you are starting a new project or someone blows your mind with their skills 🤯 - type the command and let me know. This way I can find people that might be interested in helping you out at the right time, for the right reasons & vice - versa. \n\n ',
                    footer: (' '
                        + `✅  Continue \n\n`
                        + `↩️  Skip Tutorial \n\n`),
                    react: ['✅', '↩️']
                },
                nextPhase: {
                    phase: 3,
                },
                runFunctions: {
                }
            },
            "↩️": finalMessage_tutorial,
            "!project": startMessage_tutoria,
            "!skill": startMessage_tutoria,
            "!map": startMessage_tutoria,
            "!index": startMessage_tutoria,
            "!help_soil": helpCommand,
            "!error": errorCommand,
        },
        "3": {
            "✅": {
                output: {
                    color: "#1ab342",
                    title: '',
                    description: 'With the contributions of others I’ll be able to help you with the things like:\n- Matching you with projects based on your skills & interests.\n- Building your on-chain reputation by giving & getting skill endorsements, recognising fellow contributors or letting others give you kudos for the projects you’ve been an absolute rockstar on.\n - & a whole bunch of tricks up my sleeve, that I’ll teach you along the way.',
                    footer: (' '
                        + `✅  Continue \n\n`
                        + `↩️  Skip Tutorial \n\n`),
                    react: ['✅', '↩️']
                },
                nextPhase: {
                    phase: 4,
                },
                runFunctions: {
                }
            },
            "↩️": finalMessage_tutorial,
            "!project": startMessage_tutoria,
            "!skill": startMessage_tutoria,
            "!map": startMessage_tutoria,
            "!index": startMessage_tutoria,
            "!help_soil": helpCommand,
            "!error": errorCommand,
        },

        "4":{
            "✅":{
                output:{
                    color: "#1ab342",
                    title: 'Let me walk you through how you and me can turn this community into a rich field of opportunities together. 🌱 \n\n Let’s start by you telling me what projects you’re a part of. \n\n Type:',
                    description: '`!project cool_project` _@ME_',
                    footer: (' '
                                + `↩️  Skip Tutorial \n\n`),
                    react: ['↩️']
                },
                nextPhase:{
                    phase: 5,
                },
                runFunctions:{
                }
            },
            "↩️":finalMessage_tutorial,
            "!project":startMessage_tutoria,
            "!skill":startMessage_tutoria,
            "!map":startMessage_tutoria,
            "!index":startMessage_tutoria,
            "!help_soil":helpCommand,
            "!error": errorCommand,

        },  
        "5":{
            "!project":{
                output:{
                    color: "#1ab342",
                    title: 'Nice! You’ve joined the _cool_people project_. ',
                    description: 'This means I’ll send you updates & requests to settle formalities on availability, committed hours, etc. \n\n Remember‼️our most vigorous contributors will be able to mint a `Soul Bound Token` for this project! Proving on-chain, once and for all, that you are a very cool person. 😎',
                    footer: (' '
                                + `✅  Continue \n\n`
                                + `↩️  Skip Tutorial \n\n`),
                    react: ['✅','↩️']
                },
                nextPhase:{
                    phase: 6,
                },
                runFunctions:{
                }
            },
            "↩️":finalMessage_tutorial,
            "!skill":startMessage_tutoria,
            "!map":startMessage_tutoria,
            "!index":startMessage_tutoria,
            "!help_soil":helpCommand,
            "!error": errorCommand,

        },
        "6":{
            "✅":{
                output:{
                    color: "#1ab342",
                    title: 'One more thing before we go.',
                    description: 'To find opportunities for you, I have to know what skills you have & what your high level interests are. \n\n Similarly, you can help your fellow colleagues to get access to better and bigger opportunities by endorsing their skills. _Which of those do you want to try first?_',
                    footer: ('\n\n'
                                + `1️⃣ Add my own skills \n\n`
                                + `2️⃣ Endorse someone else’s skills \n\n`
                                + `↩️  Skipp Tutorial \n\n`),
                    react: ['1️⃣','2️⃣','↩️']
                },
                nextPhase:{
                    phase: 7,

                },
                runFunctions:{
                }
            },
            "↩️":finalMessage_tutorial,
            "!project":startMessage_tutoria,
            "!skill":startMessage_tutoria,
            "!map":startMessage_tutoria,
            "!index":startMessage_tutoria,
            "!help_soil":helpCommand,
            "!error": errorCommand,
        },
        "7":{
            "1️⃣":{
                output:{
                    color: "#1ab342",
                    title: 'Great! 🤩 Simply type:',
                    description: '!endorse @ME',
                    footer: (' '
                                + `↩️  Skip Tutorial \n\n`),
                    react: ['↩️']
                },
                nextPhase:{
                    phase: 8,

                },
                runFunctions:{
                }
            },
            "2️⃣":{
                output:{
                    color: "#1ab342",
                    title: 'Great 😋 Type the command  & replace _“@yourfriend”_ by mentioning your friend in the discord. ',
                    description: '⚠️ not in this DM, but in a public channel - don’t worry, nobody will see the message, we’ll delete it before you can say “soil” ⚠️ \n\n\n `!endorse` _@yourfriend_',
                    footer: (' '
                                + `↩️  Skip Tutorial \n\n`),
                    react: ['↩️']
                },
                nextPhase:{
                    phase: 8,

                },
                runFunctions:{
                }
            },
            "↩️":finalMessage_tutorial,
            "!project":startMessage_tutoria,
            "!skill":startMessage_tutoria,
            "!map":startMessage_tutoria,
            "!index":startMessage_tutoria,
            "!help_soil":helpCommand,
            "!error": errorCommand,
        }, 
        "8":{
            "!endorse":{
                output:{
                    color: "#1ab342",
                    title: 'You’re a natural. 😍 Here’s the link that will take you to the form to set/update skills 👇.',
                    description: '_Pro tip💡: take your time and emphasise the detail & be honest!_',
                    footer: '',
                    react: []
                },
                nextPhase:{
                    phase: 0,
                    topic: "general",
                },
                runFunctions:{
                }
            },
            "↩️":finalMessage_tutorial,
            "!project":startMessage_tutoria,
            "!skill":startMessage_tutoria,
            "!map":startMessage_tutoria,
            "!index":startMessage_tutoria,
            "!help_soil":helpCommand,
            "!error": errorCommand,

        },
        "9":{
            "empty":finalMessage_tutorial
        },
        
    }
}




module.exports = {discussion};
