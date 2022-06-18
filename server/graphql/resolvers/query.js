
const { findTweets } = require("./query/tweetQuery");


const { errors } = require("./query/errorQuery");


module.exports = {
  Query: {

    // ------------- DEV-ONLY QUERY ----------------
    errors,


    // ------------- USER QUERY -----------------
    findTweets,

  },
};
