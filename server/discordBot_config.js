const Discord = require('discord.js');


const client = new Discord.Client({intents: 32767,partials: ["MESSAGES", "CHANNEL","REACTION"]})


module.exports = client;
