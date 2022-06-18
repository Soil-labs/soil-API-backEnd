

function findSkillsOnTweet(tweet) {


    let skill = tweet.substring(tweet.indexOf('^') + 1);


    if (skill.indexOf(' ')>0)
        skill = skill.substring(0,skill.indexOf(' '));
    else
        skill = skill.substring(0,skill.length);


    if (skill == tweet)
        return -1

    return skill
}

function findSkill_skillCommand(tweet) {


    let skill = tweet.substring(tweet.indexOf('@') + 1);


    if (skill.indexOf(' ')>0){
        skill = skill.substring(skill.indexOf(' ')+1);
        skill = skill.replaceAll(' ','_')
    }

    if (skill == tweet)
        return -1

    return skill
}

function findProjectsOnTweet(tweet) {


    let project = tweet.substring(tweet.indexOf('*') + 1);


    if (project.indexOf(' ')>0)
        project = project.substring(0,project.indexOf(' '));
    else
        project = project.substring(0,project.length);


    if (project == tweet)
        return -1

    return project
}

function deleteLastMessage(message) {


    if ( message.channel.type.toUpperCase() !== 'DM'){ // if I am not inside the DMs
        
        message.channel.messages.fetch({limit: 1}).then(messages => {
            message.channel.bulkDelete(messages)
        })
    }
}




module.exports = {findSkillsOnTweet,findSkill_skillCommand,deleteLastMessage,findProjectsOnTweet };