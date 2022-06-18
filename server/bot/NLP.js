
function isMessageTriggerCommand (message,triggerText){

  // console.log("message,triggerText = ",message,triggerText)

    if (!message) return false
    let command = false

    for (let i=0;i<triggerText.length;i++){
        trigger = triggerText[i]
        if (message.toLowerCase().slice(0,trigger.length) === trigger.toLowerCase()){
            command = trigger
            return command
        }
    }
    return command
}

module.exports = {isMessageTriggerCommand};