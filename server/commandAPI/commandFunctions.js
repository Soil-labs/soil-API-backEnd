

function isMessageTriggerCommand (message,triggerText){
    return message.toLowerCase().slice(0,triggerText.length) === triggerText.toLowerCase()
}


module.exports = {isMessageTriggerCommand };