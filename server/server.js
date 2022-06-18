
const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { logError } = require("./utils/logError");

const Airtable = require('airtable')

require("dotenv").config();



const base = new Airtable({ apiKey: process.env.REACT_APP_AIRTABLE_TOKEN}).base(process.env.REACT_APP_AIRTABLE_ID);


const typeDefs = require("./graphql/schema");
const resolvers = require("./graphql/resolvers");


const Discord = require('discord.js');

const client = new Discord.Client({intents: 32767,partials: ["MESSAGES", "CHANNEL","REACTION"]})

const dbs = require('discord-buttons');
dbs(client)



const airTableCommand = require("./commands/airTableCommand")
const onboarding = require("./commands/onboarding")
const searchTweets = require("./commands/searchTweets")
const projectUpdateForm = require("./commands/projectUpdateForm")
const skill = require("./commands/skill")
const selectPanel = require("./commands/selectPanel")
const replyCommands = require("./commands/replyCommands")
const checkResponceDiscussion = require("./commands/checkResponceDiscussion")
const reaction = require("./commands/reaction")


const tutorialText = require("./commandAPI/tutorialText")
// https://discord.com/developers/applications/976271446034767893/bot

;
const airTable = require("./commandAPI/airTable");
const airtableFunc = require("./bot/airtableFunc");
const tweetF = require("./commandAPI/tweetFunctions");
const sentMessage = require("./commandAPI/sentMessage");
const commandF = require("./commandAPI/commandFunctions");
// const botFunc = require("./bot/botFunc");

const { MessageActionRow, MessageEmbed, MessageSelectMenu } = require('discord.js');

const { DiscordMenus, ButtonBuilder, MenuBuilder } = require('discord-menus');
const MenusManager = new DiscordMenus(client);

const myCoolMenu = new MenuBuilder()
    .addLabel('Endorse', {description: 'Endorse someone that you know or yourself', value: 'ENDORSE', emoji: {name: '🎙'}})
    .addLabel('Search', {description: 'See all the Messages related to a project', value: 'SEARCH', emoji: {name: '👀'}})
    .addLabel('Airtable', {description: 'See all the Messages related to a project', value: 'AIRTABLE', emoji: {name: '🧩'}})
    .addLabel('Update Project', {description: 'Create a new project or update a current project', value: 'UPDATE_PROJECT', emoji: {name: '💻'}})
    .addLabel('Error / Feature', {description: 'Found new Error or Feature or Update', value: 'ERROR_FEATURE', emoji: {name: '🐞'}})
    .addLabel('Index', {description: 'lets you write free text about a person/project', value: 'INDEX', emoji: {name: '🗺'}})
    .addLabel('Skill', {description: 'lets you endorse your own or someone else’s skill', value: 'SKILL', emoji: {name: '💪'}})
    .setMaxValues(1)
    .setMinValues(1)
    .setCustomID('cool-custom-id')
    .setPlaceHolder('Select one of my Commands');
 
  
const app = express();
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true,
  context: ({ req }) => {
    if (req.body) {
      req.body.query = req.body.query;
    }
    try {
      req.header["Access-Control-Allow-Origin"] = "*"
      req.header["Access-Control-Allow-Headers"] = "Origin, X-Requested-With, Content-Type, Accept"
      if (req.headers.authorization) {
        req.headers.authorization.replace(/[&#,+()$~%.:*?<>]/g, "");
        const payload = jwt.decode(
          req.headers.authorization.replace("Bearer ", "")
        );
        const user = { id: payload._id, email: payload.email };
        req.user = user;
      }
    } catch (err) {
    // console.log(err);
    }

    return { req };
  },
  formatError: (err) => {
    logError(err);
    return err;
  },
});

const origin = process.env.ALLOWED_DOMAINS.split(",");

server.applyMiddleware({
  app,
  cors: {
    // origin,
  },
});


const PORT = process.env.PORT || 5001;



const DATABASE_MONGO =
  process.env.BASEONDATAP != undefined
    ? process.env.BASEONDATAP
    : "graphQL_harveo";

    
    
mongoose
  .connect(
    `mongodb+srv://milts10:O1eSaOUKmE1xXiEz@cluster0.tilvd.mongodb.net/${DATABASE_MONGO}?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: true,
      useCreateIndex: true,
    }
  )
  .then(() => console.log("Connected to db"))
  .catch((err) => console.log(err.message));

// Data parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));



if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    
    if (req.header("x-forwarded-proto") !== "https")
      res.redirect(`https://${req.header("host")}${req.url}`);
    else next();
  });
  app.use(express.static("client/build"));
}
// app.use(morgan("tiny"));

app.listen(PORT, function () {
// console.log(`apolloServer is ready at http://localhost:${PORT}`);
// console.log("DATABASE_MONGO = ", DATABASE_MONGO);
});


// ------------- Discord ----------------

client.commands = new Discord.Collection();


// client.on('interactionCreate', async interaction => {

//   console.log("change = " )
// 	if (!interaction.isCommand()) return;

// 	if (interaction.commandName === 'ping') {
// 		const row = new MessageActionRow()
//         .addComponents(
//           new MessageSelectMenu()
//             .setCustomId('select')
//             .setPlaceholder('Nothing selected')
//             .addOptions([
//               {
//                 label: 'Select me',
//                 description: 'This is a description',
//                 value: 'first_option',
//               },
//               {
//                 label: 'You can select me too',
//                 description: 'This is also a description',
//                 value: 'second_option',
//               },
//             ]
//           ),
// 			  );

// 		const embed = new MessageEmbed()
// 			.setColor('#0099ff')
// 			.setTitle('Some title')
// 			.setURL('https://discord.js.org/')
// 			.setDescription('Some description here');

// 		await interaction.reply({ content: 'Pong!', ephemeral: true, embeds: [embed], components: [row] });
// 	}
// });

// client.on('message', async (message) => {
//   if (message.content === '!menu') {
//       console.log("message.content = " , message.content)
//       await MenusManager.sendMenu(message,"Hi my name is Soil 🌱", { menu: myCoolMenu })
//       // .then( async msg => {
//       //     console.log(msg.id);
//       //     await msg.edit('Some edit', { ephemeral: true });
//       // })
//   }
// });

// MenusManager.on('MENU_CLICKED', (menu) => {
//   menu.reply('some reply')
//   console.log(menu.values);
// });




client.once('ready', () =>{
console.log("Bot is online!")

  airTableCommand(client,'!airtable',Discord,base,airTable,tweetF,sentMessage)
  onboarding(client,'!endorse',Discord,base,airTable,tweetF,sentMessage)
  searchTweets(client,'!search',Discord,base,airTable,tweetF,sentMessage)
  projectUpdateForm(client,'!update_project',Discord,base,airTable,tweetF,sentMessage)


  
  skill(client,'!skill',Discord,base,airTable,tweetF,sentMessage,commandF,tutorialText)
  selectPanel(client,MenusManager,myCoolMenu,sentMessage,Discord)
  // selectPanel(client)
  checkResponceDiscussion(client,'!skill',Discord,base,airTable,tweetF,sentMessage,commandF,tutorialText)
  // search(client,'!search','pong!',Discord,base)
  

  

  // checkAirtable(client,'!checkAirtable',Discord,base,airTable,tweetF,sentMessage,commandF,tutorialText)
  
   
   
  reaction(client,Discord,base)
  replyCommands(client,Discord,base,sentMessage)

  
  // airtableFunc.checkAirtableNewFormRows_project(base,client,Discord,sentMessage)

 

  setInterval(function(){ 
// console.log("Check Updates Airtable")
    airtableFunc.checkAirtableNewFormRows(base,client,Discord,sentMessage)
    airtableFunc.checkAirtableNewFormRows_project(base,client,Discord,sentMessage)

  }, 10000);
// }, 30000);

})



client.login(process.env.REACT_APP_BOT_TOKEN)

// ------------- Discord ----------------
