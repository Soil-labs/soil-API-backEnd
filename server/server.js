
const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { logError } = require("./utils/logError");


require("dotenv").config();


const typeDefs = require("./graphql/schema");
const resolvers = require("./graphql/resolvers");




 
  
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

server.applyMiddleware({
  app,
  cors: {
    // origin,
  },
});


const PORT = process.env.PORT || 5001;


console.log("process.env.REACT_APP_MONGO_DATABASE  = " , process.env.REACT_APP_MONGO_DATABASE )

const DATABASE_MONGO =
  process.env.REACT_APP_MONGO_DATABASE != undefined
    ? process.env.REACT_APP_MONGO_DATABASE
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

