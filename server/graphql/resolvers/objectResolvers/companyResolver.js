// const { User } = require('../../../models/user');
const { Members } = require("../../../models/membersModel");
const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");
const { Node } = require("../../../models/nodeModal");
const { Position } = require("../../../models/positionModel");
const { Conversation } = require("../../../models/conversationModel");
const { Company } = require("../../../models/companyModel");

const { ApolloError } = require("apollo-server-express");

module.exports = {
  Company: {
    employees: async (parent, args, context, info) => {
      // console.log("parent = ", parent);
      try {
        const employeesData = [];
        for (const _employee of parent.employees) {
          const _employeeData = await Members.findOne({
            _id: _employee.userID,
          });
          employeesData.push({
            status: _employee.status,
            typeT: _employee.typeT,
            user: _employeeData,
          });
        }
        if (employeesData) {
          return employeesData;
        }
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "companyResolver > employees",
          }
        );
      }
    },
    communitiesSubscribed: async (parent, args, context, info) => {
      // console.log("parent = ", parent);
      try {
        const communitiesSubscribed = Company.find({
          _id: parent.communitiesSubscribed,
        });
        if (communitiesSubscribed) {
          return communitiesSubscribed;
        }
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "companyResolver > employees",
          }
        );
      }
    },
    positions: async (parent, args, context, info) => {
      // console.log("parent = ", parent);
      try {
        const positionsID = parent.positions.map((position) => {
          return position.positionID;
        });

        const positionsData = await Position.find({ _id: positionsID });

        if (positionsData) {
          return positionsData;
        }
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "companyResolver > position",
          }
        );
      }
    },
    companySubscribersCommunity: async (parent, args, context, info) => {
      // console.log("parent 323= ", parent);
      try {
        communitySubscribers = parent.communitySubscribers;

        // console.log("communitySubscribers = " , communitySubscribers)

        // find all the companyIDs
        companyIDs = [];
        communitySubscribers.forEach((subscriber) => {
          if (subscriber.companyID) {
            companyIDs.push(subscriber.companyID);
          }
        });

        const companyData = await Company.find({ _id: companyIDs });

        if (companyData) {
          return companyData;
        }
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "companyResolver > companySubscribersCommunity",
          }
        );
      }
    },
    positionSubscribersCommunity: async (parent, args, context, info) => {
      // console.log("parent 323= ", parent);
      try {
        communitySubscribers = parent.communitySubscribers;

        // find all the positionIDs
        positionIDs = [];
        companyIDs = [];
        communitySubscribers.forEach((subscriber) => {
          if (subscriber.positionID) {
            positionIDs.push(subscriber.positionID);
          }
          if (subscriber.companyID) {
            companyIDs.push(subscriber.companyID);
          }
        });

        const companyData = await Company.find({ _id: companyIDs });

        // console.log("companyData?.positions = " ,companyData)

        companyData.forEach((company) => {
          company.positions.forEach((position) => {
            positionIDs.push(position.positionID);
          });
        });

        const positionData = await Position.find({ _id: positionIDs });

        if (positionData) {
          return positionData;
        }
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "companyResolver > positionSubscribersCommunity",
          }
        );
      }
    },
    candidatesNum: async (parent, args, context, info) => {
      // console.log("parent 323= ", parent);
      try {
        positions = parent.positions;

        // console.log("positions = " , positions)

        positionsIDs = [];
        positions.forEach((position) => {
          positionsIDs.push(position.positionID);
        });

        const positionData = await Position.find({ _id: positionsIDs }).select(
          "_id candidates"
        );

        candidatesNum = 0;
        positionData.forEach((position) => {
          candidatesNum_ = position.candidates.length;

          candidatesNum += candidatesNum_;
        });

        return candidatesNum;

        // if (positionData) {
        //   return positionData;
        // }
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "companyResolver > positionSubscribersCommunity",
          }
        );
      }
    },
    skillsNum: async (parent, args, context, info) => {
      // console.log("parent 323= ", parent);
      try {
        // find random number from 20 to 80
        if (!parent.skillsNum) {
          const randomNum = Math.floor(Math.random() * (80 - 20 + 1) + 20);

          // find the company and save to mongo
          const company = await Company.findOneAndUpdate(
            { _id: parent._id },
            { skillsNum: randomNum },
            { new: true }
          );

          return randomNum;
        } else {
          return parent.skillsNum;
        }
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "companyResolver > positionSubscribersCommunity",
          }
        );
      }
    },
  },
};
