const express = require("express");
const { createServer } = require("http");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws");
const { execute, subscribe } = require("graphql");
const { ApolloServer } = require("apollo-server-express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { logError } = require("./utils/logError");
const cron = require("node-cron");
const { cronFunctionToUpdateAvatar } = require("./utils/getDiscordAvatar");
const { cronJobToUpdateServerIcon } = require("./utils/getDiscordGuildAvatar");
const contextResolver = require("./auth/contextResolvers");
const authRoutes = require("./auth");
const { stripeRoutes, stripeWebhookRoutes } = require("./stripe");
const { storageRoutes } = require("./storage");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const twilio = require("twilio");

require("dotenv").config();

const typeDefs = require("./graphql/schema");
const resolvers = require("./graphql/resolvers");

async function main() {
  const app = express();

  app.use(
    rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 100, // Limit each IP to 100 requests per windowMs
    })
  );

  const httpServer = createServer(app);

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const subscriptionServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
    context: { text: "I am Context" },
  });

  const serverCleanup = useServer(
    { schema, execute, subscribe },
    subscriptionServer
  );

  const server = new ApolloServer({
    schema,
    introspection: true,
    playground: true,
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              serverCleanup.dispose();
            },
          };
        },
      },
    ],
    context: contextResolver,
    formatError: (err) => {
      logError(err);
      return err;
    },
  });
  await server.start();

  server.applyMiddleware({
    app,
    cors: {
      // origin,
    },
  });

  const PORT = process.env.PORT || 5001;

  const DATABASE_MONGO =
    process.env.REACT_APP_MONGO_DATABASE != undefined
      ? process.env.REACT_APP_MONGO_DATABASE
      : "graphQL_harveo";

  mongoose
    .connect(
      `mongodb+srv://${process.env.REACT_APP_MONGO_USERNAME}:${process.env.REACT_APP_MONGO_PASSWORD}@${process.env.REACT_APP_MONGO_CLUSTER_ADDRESS}/${DATABASE_MONGO}?retryWrites=true&w=majority`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: true,
        useCreateIndex: true,
      }
    )
    .then(() => {
      console.log("Connected to db");
    })
    .catch((err) => console.log(err.message));

  app.use("/stripe-webhooks", stripeWebhookRoutes());

  // Data parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use(cors());
  app.use("/auth", authRoutes());
  app.use("/stripe", stripeRoutes());
  app.use("/storage", storageRoutes());

  if (
    process.env.NODE_ENV &&
    process.env.NODE_ENV.toLowerCase() === "production"
  ) {
    app.use((req, res, next) => {
      if (req.header("x-forwarded-proto") !== "https")
        res.redirect(`https://${req.header("host")}${req.url}`);
      else next();
    });
    app.use(express.static("client/build"));
  }
  // app.use(morgan("tiny"));

  // app.listen(PORT, function () {
  // // console.log(`apolloServer is ready at http://localhost:${PORT}`);
  // // console.log("DATABASE_MONGO = ", DATABASE_MONGO);
  // });
  httpServer.listen(PORT, () => {
    console.log(`apolloServer is ready at http://localhost:${PORT}/graphql`);
  });

  //cron job running every five hours
  cron.schedule("0 */5 * * *", async function () {
    if (
      process.env.NODE_ENV &&
      process.env.NODE_ENV.toLowerCase() === "production"
    ) {
      console.log("start running the cron");
      await cronFunctionToUpdateAvatar();
      console.log("running a task every five hours");
    }
  });

  //running every 2 days at 1am
  cron.schedule("0 1 * * */2", async function () {
    if (
      process.env.NODE_ENV &&
      process.env.NODE_ENV.toLowerCase() === "production"
    ) {
      console.log("start running the update icon cron");
      await cronJobToUpdateServerIcon();
      console.log("ended running the task every 2 days");
    }
  });

  //setup whats notification here for te🌠

  app.post("/incoming", (req, res) => {
    const message = req.body;
    console.log(`Received message from ${message.From}: ${message.Body}`);
    res.status(200).send("OK");
    // Handle the incoming message here
  });
}

main();
