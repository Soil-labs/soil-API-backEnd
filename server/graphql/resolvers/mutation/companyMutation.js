const { ApolloError } = require("apollo-server-express");
// const { combineResolvers } = require("graphql-resolvers");

const { Company } = require("../../../models/companyModel");
const { Members } = require("../../../models/membersModel");

module.exports = {
  updateCompany: async (parent, args, context, info) => {
    const {
      _id,
      name,
      slug,
      description,
      type,
      addCompanySubscribersID,
      addPositionSubscribersID,
      communitiesSubscribedID,
    } = args.fields;
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
              return (
                subscriber?.positionID?.toString() == positionID?.toString()
              );
            });
            if (index == -1) {
              communitySubscribers.push({
                positionID: positionID,
              });
            }
          });
        }
        //  ----------- communitiesSubscribed -----------
        const communitiesSubscribed = companyData.communitiesSubscribed || [];

        if (communitiesSubscribedID) {
          communitiesSubscribedID.forEach((communityID) => {
            communitiesSubscribed.push(communityID);
          });
        }

        // update
        if (name) companyData.name = name;
        if (slug) companyData.slug = slug;
        if (type) companyData.type = type;
        if (addCompanySubscribersID)
          companyData.communitySubscribers = communitySubscribers;
        if (addPositionSubscribersID)
          companyData.communitySubscribers = communitySubscribers;
        if (description) companyData.description = description;
        if (description) companyData.description = description;
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
        //  ----------- communitiesSubscribed -----------
        const communitiesSubscribed = [];

        if (communitiesSubscribedID) {
          communitiesSubscribedID.forEach((communityID) => {
            communitiesSubscribed.push(communityID);
          });
        }

        companyData = await new Company({
          name,
          slug,
          type,
          description,
          communitySubscribers,
          communitiesSubscribed,
        });
      }
      await companyData.save();

      return companyData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "updateCompany",
        { component: "companyMutation > updateCompany" }
      );
    }
  },

  updateCompanyDetails: async (parent, args, context, info) => {
    const {
      slug,
      imageUrl,
      description,
      employeesNumber,
      tags,
      whatsToLove,
      mission,
      insights,
      edenTake,
      funding,
      culture,
      benefits,
      values,
      founders,
      glassdoor,
    } = args.fields;
    console.log(
      "Mutation > updateCompanyDetails > args.fields = ",
      args.fields
    );

    try {
      if (!slug) {
        throw new ApolloError("slug is required", "updateCompanyDetails", {
          component: "companyMutation > updateCompanyDetails",
        });
      }

      let companyData;
      companyData = await Company.findOne({ slug });

      if (!companyData) {
        throw new ApolloError("company not found", "updateCompanyDetails", {
          component: "companyMutation > updateCompanyDetails",
        });
      }

      // update
      if (description) companyData.description = description;
      if (imageUrl) companyData.imageUrl = imageUrl;
      if (employeesNumber) companyData.employeesNumber = employeesNumber;
      if (tags) companyData.tags = tags;
      if (whatsToLove) companyData.whatsToLove = whatsToLove;
      if (mission) companyData.mission = mission;
      if (insights) companyData.insights = insights;
      if (edenTake) companyData.edenTake = edenTake;
      if (funding) companyData.funding = funding;
      if (culture) companyData.culture = culture;
      if (benefits) companyData.benefits = benefits;
      if (values) companyData.values = values;
      if (founders) companyData.founders = founders;
      if (glassdoor) companyData.glassdoor = glassdoor;

      await companyData.save();

      return companyData;
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
  subscribeToCommunity: async (parent, args, context, info) => {
    const { companyID, communityID } = args.fields;
    console.log(
      "Mutation > subscribeToCommunity > args.fields = ",
      args.fields
    );

    if (!communityID)
      throw new ApolloError("communityID is required", "subscribeToCommunity", {
        component: "companyMutation > subscribeToCommunity",
      });

    if (!companyID)
      throw new ApolloError("Company ID is required", "subscribeToCommunity", {
        component: "companyMutation > subscribeToCommunity",
      });

    companyData = await Company.findOne({ _id: companyID });

    if (!companyData) {
      throw new ApolloError("Company not found", "subscribeToCommunity", {
        component: "companyMutation > subscribeToCommunity",
      });
    }

    try {
      const companyCommunities = companyData.communitiesSubscribed || [];
      if (
        !companyCommunities.some(
          (_communityID) => _communityID.toString() === communityID.toString()
        )
      ) {
        companyCommunities.push(communityID);
      }

      let companyDataN = await Company.findOneAndUpdate(
        { _id: companyID },
        { communitiesSubscribed: companyCommunities },
        { new: true }
      );

      return companyDataN;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "subscribeToCommunity",
        { component: "companyMutation > subscribeToCommunity" }
      );
    }
  },

  addEmployeesCompany:
    // combineResolvers(
    async (parent, args, context, info) => {
      const { companyID, employees } = args.fields;
      console.log(
        "Mutation > addEmployeesCompany > args.fields = ",
        args.fields
      );

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
        const _employeesToUpdate = [];
        for (const _employee of employees) {
          try {
            const _member = await Members.findOne({ _id: _employee.userID });
            if (!_member) return;
            let memberCompanies = await updateArr(
              _member.companies,
              [{ companyID: companyID, typeT: _employee.typeT }],
              "companyID"
            );
            await Members.findOneAndUpdate(
              { _id: _employee.userID },
              { companies: memberCompanies }
            );
            _employeesToUpdate.push(_employee);
          } catch {
            return;
          }
        }

        let compEmployees = await updateArr(
          companyData.employees,
          _employeesToUpdate,
          "userID"
        );

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
  // ),
};

async function updateArr(arr1, arr2, compareKey) {
  arr2.forEach((item2) => {
    const index = arr1.findIndex((item1) => {
      if (item1[compareKey] && item2[compareKey])
        return item1[compareKey].toString() == item2[compareKey].toString();
      else return -1;
    });
    if (index != -1) {
      arr1[index] = item2;
    } else {
      arr1.push({
        ...item2,
      });
    }
  });

  return arr1;
}
