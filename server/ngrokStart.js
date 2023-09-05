const ngrok = require('ngrok'); 
const { spawn } = require('child_process'); 

(async () => { 
const url = await ngrok.connect(process.env.PORT || 5001); 
console.log(`ngrok tunnel opened at ${url}`); 
const receiveWhatsAppMessageProcess = spawn('node', ['server/server.js'], { stdio: 'inherit', }); 
process.on('SIGINT', async () => { 
    console.log('Shutting down…'); 
    await ngrok.kill(); 
    receiveWhatsAppMessageProcess.kill('SIGINT'); 
    process.exit(0); 
  }); 
 })();