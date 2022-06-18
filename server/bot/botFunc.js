

function deleteLastMessage(message) {


    if ( message.channel.type.toUpperCase() !== 'DM'){ // if I am not inside the DMs
        
        message.channel.messages.fetch({limit: 1}).then(messages => {
            message.channel.bulkDelete(messages)
        })
    }
}


module.exports = {deleteLastMessage};