const { ApolloError } = require("apollo-server-express");

const { Company } = require("../../../models/companyModel");

module.exports = {
  updateCompany: async (parent, args, context, info) => {
    const { _id, name, slug, type, addCompanySubscribersID,addPositionSubscribersID } = args.fields;
    console.log("Mutation > updateCompany > args.fields = ", args.fields);

    try {
      let companyData;
      if (_id) {
        companyData = await Company.findOne({ _id });


        //  ----------- communitySubscribers -----------
        communitySubscribers = companyData.communitySubscribers;

        if (addCompanySubscribersID) {
          // check if the addCompanySubscribersID exist inside communitySubscribers.companyID if they don't add them
          addCompanySubscribersID.forEach((companyID) => {
              const index = communitySubscribers.findIndex((subscriber) => {
                return subscriber?.companyID?.toString() == companyID?.toString();
              });
              if (index == -1) {
                communitySubscribers.push({
                  companyID: companyID,
                });
              }
          });
        }

        if (addPositionSubscribersID) {
          addPositionSubscribersID.forEach((positionID) => {
            const index = communitySubscribers.findIndex((subscriber) => {
              return subscriber?.positionID?.toString() == positionID?.toString();
            });
            if (index == -1) {
              communitySubscribers.push({
                positionID: positionID,
              });
            }
          });
        }
        //  ----------- communitySubscribers -----------

        // update
        if (name) companyData.name = name;
        if (slug) companyData.slug = slug;
        if (type) companyData.type = type;
        if (addCompanySubscribersID) companyData.communitySubscribers = communitySubscribers;
        if (addPositionSubscribersID) companyData.communitySubscribers = communitySubscribers;
        
      } else {
        const companyWithSameSlug = await Company.findOne({ slug: slug });
        if (companyWithSameSlug) {
          throw new ApolloError(
            "Company with same slug already exists",
            "updateCompany",
            { component: "companyMutation > updateCompany" }
          );
        }

        //  ----------- communitySubscribers -----------
        communitySubscribers = [];

        if (addCompanySubscribersID) {

          addCompanySubscribersID.forEach((companyID) => {
            communitySubscribers.push({
              companyID: companyID,
            });
          });
        }

        if (addPositionSubscribersID) {
          addPositionSubscribersID.forEach((positionID) => {
            communitySubscribers.push({
              positionID: positionID,
            });
          });
        }
        //  ----------- communitySubscribers -----------


        companyData = await new Company({
          name,
          slug,
          type,
          communitySubscribers,
        });

      }
      await companyData.save();

      return companyData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "updateCompany",
        { component: "companyMutation > updateCompany" }
      );
    }
  },

  updateUrlCompany: async (parent, args, context, info) => {
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
    if (index != -1) {
      // arr1[index] = {
      //   ...employee2,
      //   ...arr1[index],
      //   readyToDisplay: false,
      // }
      arr1[index].readyToDisplay = false;
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
