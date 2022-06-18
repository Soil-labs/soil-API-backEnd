const { Client, CategoryChannel, MessageEmbed } = require("discord.js")
const client = require("../discordBot_config")
const Discord = require('discord.js');



async function sentEmbed(messageEmbed,id) {


    let user = await client.users.fetch(id)
          
    let embed

    if (messageEmbed.fields){
        embed = new MessageEmbed()
            .setColor(messageEmbed.color)
            .setTitle(messageEmbed.title)
            .addFields(messageEmbed.fields)

    } else {

        if (messageEmbed.showAvatar){
          embed = new Discord.MessageEmbed()
              .setColor(messageEmbed.color)
              .setTitle(messageEmbed.title)
              .setDescription(messageEmbed.description)
              .setFooter(messageEmbed.footer)
              .setAuthor(messageEmbed.authorName,messageEmbed.avatarUrl)
        } else {
          embed = new Discord.MessageEmbed()
              .setColor(messageEmbed.color)
              .setTitle(messageEmbed.title)
              .setDescription(messageEmbed.description)
              .setFooter(messageEmbed.footer)
        }
    }
              
    

    let messageEm = await user.send({embed: embed})



    if (!messageEmbed.react) return 

    messageEmbed.react.forEach(reactN=>{
        messageEm.react(reactN)

    })


}


module.exports = {sentEmbed};