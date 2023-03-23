const { EdenMetrics } = require("../../../models/edenMetrics");
const { ApolloError } = require("apollo-server-express");
const { combineResolvers } = require("graphql-resolvers");
const { IsAuthenticated } = require("../../../utils/authorization");

module.exports = {
  saveCoreProductFeatureInteration: combineResolvers(
    IsAuthenticated,
    async (parent, args, { user }, info) => {
      const { buttonClicked } = args.fields;
      try {
        const memberMetricsData = await EdenMetrics.findOne({
          memberID: user._id,
        });

        if (memberMetricsData) {
          //check if the button has alraedy been clicked

          let featureArray =
            memberMetricsData.exploreFeatures != undefined || null
              ? memberMetricsData.exploreFeatures
              : [];
          //check if the button has been clicked before

          const findElement = featureArray.find(
            (element) => element.buttonClicked == buttonClicked
          );
          if (!findElement) {
            //add a new one and get the index of the lastone
            let lastItem = featureArray[featureArray.length - 1];
            let index = 1;
            if (lastItem && lastItem.index) {
              index = lastItem.index + 1;
            }

            const newButtonClicked = {
              buttonClicked: buttonClicked,
              timeClicked: new Date(),
              index: index,
            };

            featureArray.push(newButtonClicked);
            await EdenMetrics.findOneAndUpdate(
              {
                memberID: user._id,
              },
              {
                $set: {
                  exploreFeatures: featureArray,
                },
              },

              { new: true }
            );
            return true;
          }
        }
        return false;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "saveCoreProductFeatureInteration",
          {
            component: "edenMetricsMutation > saveCoreProductFeatureInteration",
          }
        );
      }
    }
  ),
  saveDailyLogin: combineResolvers(
    IsAuthenticated,
    async (parent, args, { user }, info) => {
      const { loginDate } = args.fields;
      const dateToAdd = new Date(loginDate);
      try {
        await EdenMetrics.findOneAndUpdate(
          { memberID: user._id },
          {
            $push: { activeUserLogin: { date: dateToAdd } },
          },
          { new: true }
        );
        return true;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "saveDailyLogin",
          {
            component: "edenMetricsMutation > saveDailyLogin",
          }
        );
      }
    }
  ),
  saveActionsPerformed: combineResolvers(
    IsAuthenticated,
    async (parent, args, { user }, info) => {
      const { actionType } = args.fields;
      try {
        await EdenMetrics.findOneAndUpdate(
          { memberID: user._id },
          {
            $push: { actions: { actionType: actionType, actionDate: new Date() } },
          },
          { new: true }
        );
        return true;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "saveActionsPerformed",
          {
            component: "edenMetricsMutation > saveActionsPerformed",
          }
        );
      }
    }
  ),
};

//activeUserLogin
