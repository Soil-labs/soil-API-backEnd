
const printC = async (value="",tag="",name="",colour="") => {

    printText = ""
    if (name!=""){
        printText = name + ": "

        if (tag!=""){
            printText = printText + tag + ": "
        }
    } else {
        if (tag!=""){
            printText = " General - ", tag + ": "
        }
    }
    
    // if (value!=""){
        if (colour=="r"){
            console.log('\x1b[31m%s\x1b[0m', printText, value); 
        } else if (colour=="g"){
            console.log('\x1b[32m%s\x1b[0m', printText, value); 
        } else if (colour=="gr"){
            console.log('\x1b[30m%s\x1b[0m', printText, value); 
        } else if (colour=="p"){
            console.log('\x1b[35m%s\x1b[0m', printText, value); 
        } else if (colour=="b"){
            console.log('\x1b[34m%s\x1b[0m', printText, value); 
        } else if (colour=="y"){
            console.log('\x1b[33m%s\x1b[0m', printText, value); 
        } else {
            console.log(printText, value); 
        }
    // } else {
    //     console.log("change = armani0",value )
    //     if (colour=="r"){
    //         console.log('\x1b[31m%s\x1b[0m', printText); 
    //     } else if (colour=="g"){
    //         console.log('\x1b[32m%s\x1b[0m', printText); 
    //     } else if (colour=="b"){
    //         console.log('\x1b[34m%s\x1b[0m', printText); 
    //     } else if (colour=="y"){
    //         console.log('\x1b[33m%s\x1b[0m', printText); 
    //     } else if (colour=="p"){
    //         console.log('\x1b[35m%s\x1b[0m', printText);
    //     } else if (colour=="gr"){
    //         console.log('\x1b[30m%s\x1b[0m', printText);
    //     } else {
    //         console.log(printText); 
    //     }
    // }




}

module.exports = {
    printC,
};