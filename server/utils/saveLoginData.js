const { EdenMetrics } = require("../models/edenMetrics");
const { ApolloError } = require("apollo-server-express");

const saveDailyLogin = async (memberID, loginDate) => {
  try {
    const userMetrics = await EdenMetrics.findOne({ memberID: memberID });

    if (!userMetrics) {
      //create a new metrics profile
      const newMetrics = await new EdenMetrics({
        memberID: memberID,
        activeUserLogin: [{ date: new Date() }],
      });
      newMetrics.save();
      return;
    }

    let oldLoginStamps = userMetrics.activeUserLogin;
    let findLogin = oldLoginStamps.find(
      (stamp) => stamp.date.getTime() == new Date(loginDate * 1000).getTime() //multiply by 1000 to get the date in milliseconds
    );
    if (!findLogin) {
      //save the timestamp 🙉
      await EdenMetrics.findOneAndUpdate(
        { memberID: memberID },
        {
          $push: { activeUserLogin: { date: new Date(loginDate * 1000) } },
        },
        { new: true }
      );
    }
  } catch (err) {
    throw new ApolloError(
      err.message,
      err.extensions?.code || "saveDailyLogin",
      { component: "tmemberMutation > saveDailyLogin" }
    );
  }
};

module.exports = { saveDailyLogin };
