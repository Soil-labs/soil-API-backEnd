const tutorial_skill = 
[
    {
        phase: 0,
        messages: [{
            color: "#1ab342",
            title: '@ added a new set of skills for you',
            description: '@',
            footer: ('How confident do you feel with this skillset?  \n\n'
                        + `1️⃣ don't add it to the Community Intelligence (yet) \n\n`
                        + `2️⃣ I have < 1 year of experience \n\n`
                        + `3️⃣ I have < 3 years of experience \n\n`
                        + `4️⃣ I have > 3 years of experience`),
            react: ['1️⃣','2️⃣','3️⃣','4️⃣']
        }]
        
    },
]
const tutorial_project = 
[
    {
        phase: 0,
        messages: [{
            color: "#1ab342",
            title: '@ said you are working a project:',
            description: '@',
            footer: ('How much bandwidth do you currently have for this ☝️?  \n\n'
                        + `1️⃣ none right now actually \n\n`
                        + `2️⃣ couple of hours & it will be done  \n\n`
                        + `3️⃣ allocating < 5 hours a week  \n\n`
                        + `4️⃣ allocating < 10 hours a week   \n\n`
                        + `5️⃣ allocating < 20 hours a week  \n\n`
                        + `6️⃣ allocating > 20 hours a week`),
            react: ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣']
        }]
        
    },
]

const tutorial_map = 
[
    {
        phase: 0,
        messages: [{
            color: "#1ab342",
            title: '@ created a new map entry for you',
            description: '@',
            footer: ('Sounds about right?  \n\n'
                        + `✅ yup \n\n`
                        + `❌ nope \n\n`),
            react: ['✅','❌']
        }]
        
    },
]


const tutorial = 
[
    {
        phase: 0,
        messages: [{
            color: "#1ab342",
            title: '@ added a new set of skills for you',
            description: '@',
            footer: ('How confident do you feel with this skillset?  \n\n'
                        + `1️⃣ don't add it to the Community Intelligence (yet) \n\n`
                        + `2️⃣ I have < 1 year of experience \n\n`
                        + `3️⃣ I have < 3 years of experience \n\n`
                        + `4️⃣ I have > 3 years of experience`),
            react: ['1️⃣','2️⃣','3️⃣','4️⃣']
        }]
        
    },
]
const tutorial2 = 
[
    {
        phase: 0,
        command: "!skill",
        messages: [{
            color: "#FFFFFF",
            title: 'Hey, Just now @ add you into the network',
            description: 'He wrote: @',
            footer: '',
            react: []
        },{
            title: 'You can try to use it, just add one of your skills',
            color: "#FFFFFF",
            description: 'You just have to write:',
            footer: '!skill @ Programmer',
            react: []  
        }]
        
    },
    {
        phase: 1,
        command: "!project",
        messages: [{
            color: "#FFFFFF",
            title: 'Boom you did it, now you can add a project that you do',
            description: 'You just have to write:',
            footer: '!project @ Mentorship',
            react: []
        }]
    },
    {
        phase: 2,
        command: "!map",
        messages: [{
            color: "#FFFFFF",
            title: 'Perfect, now members can check your project and skill',
            description: '',
            footer: '',
            react: []
        },{
            title: 'Now you can tweet about your fiends',
            color: "#FFFFFF",
            description: '🆘 Dont forget, You can write about others only inside D_D discord',
            footer: '!map @ is awesome',
            react: []  
        }]
        
    },
    // {
    //     phase: 3,
    //     command: "!airtable",
    //     messages: [{
    //         color: "#FFFFFF",
    //         title: 'I think is the time to see what is writen about you and search in D_D database',
    //         description: 'Just click the link that will popup after using this command:',
    //         footer: '!airtable',
    //         react: []
    //     }]
        
    // },
    {
        phase: 3,
        messages: [{
            color: "#FFFFFF",
            title: 'You just had a new Skill entry from *',
            description: '@',
            footer: ('Do you Accept it \n\n'
                        + `✅ Yes\n\n`
                        + `❌ N`),
            react: ['✅','❌']
        }]
        
    },
]


module.exports = {tutorial_skill,tutorial_project,tutorial_map};