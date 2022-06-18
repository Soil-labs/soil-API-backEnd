

const NLP = require("../bot/NLP");
const botFunc = require("../bot/botFunc");

const Discord = require('discord.js');

// const {MessageActionRow, MessageSelectMenu } = require('discord.js');

// const Discord = require('discord.js');

// const {MessageMenuOption, MessageMenu,MessageActionRow} = require('discord-buttons')
const { DiscordMenus, ButtonBuilder, MenuBuilder } = require('discord-menus');


// const myCoolMenu = new MenuBuilder()
//     .addLabel('Value 1', { description: 'This the value 1 description', value: 'value-1' })
//     .addLabel('Value 2', { description: 'This is the value 2 description', value: 'value-2' })
//     .addLabel('Value 3', {
//         description: 'This is the value 3 description (with an emoji)', value: 'value-3', emoji: {
//             name: '🌌'
//         }
//     })
//     .setMaxValues(1)
//     .setMinValues(1)
//     .setCustomID('cool-custom-id')
//     .setPlaceHolder('Select an option');


module.exports =  async (client, MenusManager,myCoolMenu,sentMessage,Discord) => {
    

      client.on('message', async (message) => {
            
            if (message.content === '!soil') {

                  console.log("message.author = " , message.author)

                  if ( message.channel.type.toUpperCase() == 'DM' ){
            
                        await sentMessage.sentEmbed("#233423","",
                              "🆘 You can use `!soil` command only on a public channel not inside the Bot 🌱  ",message.author.id,client,Discord)

                        return 
                  }

                  console.log("message.content = " , message.content)
                  await MenusManager.sendMenu(message,"Hi my name is Soil 🌱 click one of my commands: ", { menu: myCoolMenu }, { ephemeral: true })
                  // .then( async msg => {
                  //     console.log(msg.id);
                  //     await msg.edit('Some edit', { ephemeral: true });
                  // })
            }
          });
          
          MenusManager.on('MENU_CLICKED', (menu) => {

            console.log("we have a click = ")
            switch(menu.values[0]){
                  case "ENDORSE":
                    menu.reply("The command line is: \n\n !endorse @Name_Discord", { ephemeral: true })
                  break;
                  case "SEARCH":
                    menu.reply("The command line is: \n\n !search project", { ephemeral: true })
                  break;
                  case "AIRTABLE":
                    menu.reply("The command line is: \n\n !airtable", { ephemeral: true })
                  break;
                  case "UPDATE_PROJECT":
                    menu.reply("The command line is: \n\n !update_project project", { ephemeral: true })
                  break;
                  case "ERROR_FEATURE":
                    menu.reply("The command line is: \n\n !Error", { ephemeral: true })
                  break;
                  case "INDEX":
                    menu.reply("The command line is: \n\n !index _@name_ !skill !project`", { ephemeral: true })
                  break;
                  case "SKILL":
                    menu.reply("The command line is: \n\n !skill _@name_ skill_name", { ephemeral: true })
                  break;
                  default: 
                    menu.reply("nothing", { ephemeral: true })
                  break;
              }
            // menu.reply('some reply')
            // console.log(menu.values);
          });

 
//       client.on('message', async (message) => {

            

//             let results,members,categories
//             const command = NLP.isMessageTriggerCommand(message.content,['!soil'])

//             if (command ){

//                   const Option1 = new MessageMenuOption()
//                         .setLabel("Endorse")
//                         .setDescription("Endorse someone that you know or yourself")
//                         .setEmoji("🎙")
//                         .setValue("ENDORSE")

//                   let selection = new MessageMenu()
//                         .setID('Selection')
//                         .setPlaceholder('Here is what I can do')
//                         .addOption(Option1)
//                         // .addOptions([
//                         //       {
//                         //             label: 'Endorse',
//                         //             description: 'Endorse someone that you know or yourself',
//                         //             value: 'ENDORSE',
//                         //             emoji: '🎙',
//                         //       },
//                         //       {
//                         //             label: 'Search',
//                         //             description: 'See all the Messages related to a project',
//                         //             value: 'SEARCH',
//                         //             emoji: '👀',
//                         //       },
//                         //       {
//                         //             label: 'Airtable',
//                         //             description: 'See all the Messages related to a project',
//                         //             value: 'AIRTABLE',
//                         //             emoji: '🧩',
//                         //       },
//                         //       {
//                         //             label: 'Update Project',
//                         //             description: 'Create a new project or update a current project',
//                         //             value: 'UPDATE_PROJECT',
//                         //             emoji: '💻',
//                         //       },
//                         //       {
//                         //             label: 'Error / Feature',
//                         //             description: 'Found new Error or Feature or Update',
//                         //             value: 'ERROR_FEATURE',
//                         //             emoji: '🐞',
//                         //       },
//                         //       {
//                         //             label: 'Index',
//                         //             description: 'lets you write free text about a person/project',
//                         //             value: 'INDEX',
//                         //             emoji: '🗺',
//                         //       },
//                         //       {
//                         //             label: 'Skill',
//                         //             description: 'lets you endorse your own or someone else’s skill',
//                         //             value: 'SKILL',
//                         //             emoji: '💪',
//                         //       },
//                         // ])


//                   const Row1 = new MessageActionRow().addComponent(selection)
                        


//                   // console.log("message.author.id = " , message.author.id)
//                   let user = await client.users.fetch(message.author.id)

//                   // let messageEm = await user.send('Hi my name is Soil 🌱',selection)
//                   // let messageEm = await user.send({embed: embed})

//                   // await message.channel.send('Hi my name is Soil 🌱',selection)


//                   await message.channel.send('Hi my name is Soil 🌱',{components: [Row1]})

//                   // if ( message.channel.type.toUpperCase().toUpperCase() != 'DM'){
//                   //       botFunc.deleteLastMessage(message)
//                   // }


//                   function menuselection(menu){
//                         switch(menu.values[0]){
//                             case "ENDORSE":
//                               menu.reply.send("The command line is: \n\n !endorse @Name_Discord",true)
//                             break;
//                             case "SEARCH":
//                               menu.reply.send("The command line is: \n\n !search project",true)
//                             break;
//                             case "AIRTABLE":
//                               menu.reply.send("The command line is: \n\n !airtable",true)
//                             break;
//                             case "UPDATE_PROJECT":
//                               menu.reply.send("The command line is: \n\n !update_project project",true)
//                             break;
//                             case "ERROR_FEATURE":
//                               menu.reply.send("The command line is: \n\n !Error",true)
//                             break;
//                             case "INDEX":
//                               menu.reply.send("The command line is: \n\n !index _@name_ !skill !project`",true)
//                             break;
//                             case "SKILL":
//                               menu.reply.send("The command line is: \n\n !skill _@name_ skill_name",true)
//                             break;
//                             default: 
//                               menu.reply.send("nothing",true)
//                             break;
//                         }
//                   }

//                   client.on("clickMenu", async (menu)=>{

//                   //     console.log("menu = " , menu.reply)
//                       //console.log("menu 1= " , menu.message)
//                       //console.log("menu 2= " , menu.message.id,message.id)
//                       //console.log("menu 3= " ,menu.clicker.user.id , message.author.id)
//                         // console.log("menu 2= " , menu.reply().defer())

//                         // let embed = new Discord.MessageEmbed()
//                         //       .setColor("#234234")
//                         //       .setTitle("my nsme")
//                         //       .setDescription("torino")

//                         // menu.reply.send({embed: embed})


//                         //sos // menu.reply.send({content: ":x: you are not allowed to pick something",fetchReply: true})

//                         // await menu.reply.defer()
//                         // menu.channel.send("here is your cola")


//                         menu.message.update("here is your cola",null)



//                   //       if (menu.message.id == message.id) {
//                   //           if (menu.clicker.user.id == message.author.id){
//                   //               menuselection(menu)
//                   //           } else {
//                   //               menu.reply.send(":x: you are not allowed to pick something",true)
//                   //           }
//                   //     }
//                   })
//             //     client.on('interactionCreate', async interaction => {

//             //       console.log("interaction = " , interaction)

//             //     })

//             }

//     });

    
}