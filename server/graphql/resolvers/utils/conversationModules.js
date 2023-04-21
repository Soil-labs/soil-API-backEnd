


function concatenateFirstTwoMessages(arr) {
    // Extract the first two messages from the array
    const message1 = arr[0].content.substring(0, 10).replace(/\s+/g, '_');
    const message2 = arr[1].content.substring(0, 10).replace(/\s+/g, '_');
  
    // Concatenate the messages together and return the result
    return message1 + message2;
}
  
  



module.exports = {
    concatenateFirstTwoMessages,
};