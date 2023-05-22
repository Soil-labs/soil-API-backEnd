const { ApolloError } = require("apollo-server-express");

const { Company } = require("../../../models/companyModel");
const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");

const { Conversation } = require("../../../models/conversationModel");
const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");

const {
  addMultipleQuestionsToEdenAIFunc,
  updateQuestionSmall,
} = require("../utils/questionsEdenAIModules");

const { checkAndAddCompanyToMember } = require("../utils/companyModules");

const { printC } = require("../../../printModule");

const {
  useGPTchatSimple,
  deletePineCone,
  upsertEmbedingPineCone,
  findBestEmbedings,
  getMemory,
} = require("../utils/aiModules");

const { arrayToObj } = require("../utils/endorsementModules");

module.exports = {
  updateCompany: async (parent, args, context, info) => {
    const { _id, name } = args.fields;
    console.log("Mutation > updateCompany > args.fields = ", args.fields);

    try {
      let companyData;
      if (_id) {
        companyData = await Company.findOne({ _id });

        // update
        if (name) companyData.name = name;
        await companyData.save();
      } else {
        companyData = await new Company({
          name,
        });

        await companyData.save();
      }

      return {
        _id: companyData._id,
        name: companyData.name,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "updateCompany",
        { component: "companyMutation > updateCompany" }
      );
    }
  },

  updateCompanyUrl: async (parent, args, context, info) => {
    const { companyID } = args.fields;
    let { url } = args.fields;
    console.log("Mutation > updateUrl > args.fields = ", args.fields);

    if (!url)
      throw new ApolloError("Url is required", "updateUrl", {
        component: "companyMutation > updateUrl",
      });

    if (!companyID)
      throw new ApolloError("Company ID is required", "updateUrl", {
        component: "companyMutation > updateUrl",
      });

    companyData = await Company.findOne({ _id: companyID });

    if (!companyData)
      throw new ApolloError("Company not found", "updateUrl", {
        component: "companyMutation > updateUrl",
      });

    try {
      // find one and updates
      let companyDataN = await Company.findOneAndUpdate(
        { _id: companyID },
        { url: url },
        { new: true }
      );

      return companyDataN;
    } catch (err) {
      throw new ApolloError(err.message, err.extensions?.code || "updateUrl", {
        component: "companyMutation > updateUrl",
      });
    }
  },

  addEmployeesCompany: async (parent, args, context, info) => {
    const { companyID, employees } = args.fields;
    console.log("Mutation > addEmployeesCompany > args.fields = ", args.fields);

    if (!employees)
      throw new ApolloError("Employees is required", "addEmployeesCompany", {
        component: "companyMutation > addEmployeesCompany",
      });

    if (!companyID)
      throw new ApolloError("Company ID is required", "addEmployeesCompany", {
        component: "companyMutation > addEmployeesCompany",
      });

    companyData = await Company.findOne({ _id: companyID });

    if (!companyData)
      throw new ApolloError("Company not found", "addEmployeesCompany", {
        component: "companyMutation > addEmployeesCompany",
      });

    try {
      let compEmployees = await updateEmployees(
        companyData.employees,
        employees
      );

      console.log("compEmployees = ", compEmployees);

      // find one and updates
      let companyDataN = await Company.findOneAndUpdate(
        { _id: companyID },
        { employees: compEmployees },
        { new: true }
      );

      return companyDataN;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "addEmployeesCompany",
        { component: "companyMutation > addEmployeesCompany" }
      );
    }
  },
};

async function updateEmployees(arr1, arr2, compareKey = "userID") {
  // arr1New = [...arr1]
  arr2.forEach((employee2) => {
    const index = arr1.findIndex((employee1) => {
      if (employee1[compareKey] && employee2[compareKey])
        return (
          employee1[compareKey].toString() == employee2[compareKey].toString()
        );
      else return -1;
    });
    if (index !== -1) {
      arr1[index] = {
        ...employee2,
        readyToDisplay: false,
      };
      if (employee2.conversationID) {
        arr1[index].conversationID = employee2.conversationID;
      }
    } else {
      arr1.push({
        ...employee2,
        readyToDisplay: false,
      });

      if (employee2.conversationID) {
        arr1[arr1.length - 1].conversationID = employee2.conversationID;
      }
    }
  });

  return arr1;
}
