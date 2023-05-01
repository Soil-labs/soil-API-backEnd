
const { ApolloError } = require("apollo-server-express");

const { Company } = require("../../../models/companyModel");

// const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");

const { addMultipleQuestionsToEdenAIFunc } = require("../utils/questionsEdenAIModules");



module.exports = {
  updateCompany: async (parent, args, context, info) => {
      const { _id,name } = args.fields;
      console.log("Mutation > updateCompany > args.fields = ", args.fields);


      try {

        let companyData
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
        }
        
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "updateCompany",
          { component: "companyMutation > updateCompany" }
        );
      }
    },
    addEmployeesCompany: async (parent, args, context, info) => {
      const { companyID,employees } = args.fields;
      console.log("Mutation > addEmployeesCompany > args.fields = ", args.fields);

      if (!employees) throw new ApolloError("Employees is required", "addEmployeesCompany", { component: "companyMutation > addEmployeesCompany" });

      if (!companyID) throw new ApolloError("Company ID is required", "addEmployeesCompany", { component: "companyMutation > addEmployeesCompany" });

      companyData = await Company.findOne({ _id: companyID });

      if (!companyData) throw new ApolloError("Company not found", "addEmployeesCompany", { component: "companyMutation > addEmployeesCompany" });

 

      try {


        let compEmployees = await updateEmployees(companyData.employees, employees);

        console.log("compEmployees = " , compEmployees)


        // find one and updates
        let companyDataN = await Company.findOneAndUpdate(
          { _id: companyID },
          { employees: compEmployees },
          { new: true }
        );

        return companyDataN
        
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "addEmployeesCompany",
          { component: "companyMutation > addEmployeesCompany" }
        );
      }
    },
    addQuestionsToAskCompany: async (parent, args, context, info) => {
      const { companyID } = args.fields;
      let {questionsToAsk} = args.fields;
      console.log("Mutation > addQuestionsToAskCompany > args.fields = ", args.fields);

      if (!questionsToAsk) throw new ApolloError("Employees is required", "addQuestionsToAskCompany", { component: "companyMutation > addQuestionsToAskCompany" });

      if (!companyID) throw new ApolloError("Company ID is required", "addQuestionsToAskCompany", { component: "companyMutation > addQuestionsToAskCompany" });

      companyData = await Company.findOne({ _id: companyID });

      if (!companyData) throw new ApolloError("Company not found", "addQuestionsToAskCompany", { component: "companyMutation > addQuestionsToAskCompany" });

 

      try {

        questionsToAsk = await addMultipleQuestionsToEdenAIFunc(questionsToAsk)

        console.log("questionsToAsk = " , questionsToAsk)
        // asdf12


        let questionsToAskN = await updateEmployees(companyData.questionsToAsk, questionsToAsk,"questionID");

        console.log("questionsToAskN = " , questionsToAskN)


        // find one and updates
        let companyDataN = await Company.findOneAndUpdate(
          { _id: companyID },
          { questionsToAsk: questionsToAskN },
          { new: true }
        );
        
        return companyDataN
        
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "addQuestionsToAskCompany",
          { component: "companyMutation > addQuestionsToAskCompany" }
        );
      }
    },
    addCandidatesCompany: async (parent, args, context, info) => {
      const { companyID,candidates } = args.fields;
      console.log("Mutation > addCandidatesCompany > args.fields = ", args.fields);

      if (!candidates) throw new ApolloError("Employees is required", "addCandidatesCompany", { component: "companyMutation > addCandidatesCompany" });

      if (!companyID) throw new ApolloError("Company ID is required", "addCandidatesCompany", { component: "companyMutation > addCandidatesCompany" });

      companyData = await Company.findOne({ _id: companyID });

      if (!companyData) throw new ApolloError("Company not found", "addCandidatesCompany", { component: "companyMutation > addCandidatesCompany" });

 
      try {


        let candidatesN = await updateEmployees(companyData.candidates, candidates,"userID");

        console.log("candidatesN = " , candidatesN)


        // find one and updates
        let companyDataN = await Company.findOneAndUpdate(
          { _id: companyID },
          { candidates: candidatesN },
          { new: true }
        );
        
        return companyDataN
        
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "addCandidatesCompany",
          { component: "companyMutation > addCandidatesCompany" }
        );
      }
    },
}

async function updateEmployees(arr1, arr2,compareKey = "userID") {

  // arr1New = [...arr1]
  arr2.forEach(employee2 => {
    const index = arr1.findIndex(employee1 => {

      
      if (employee1[compareKey] && employee2[compareKey]) return (employee1[compareKey].toString() == employee2[compareKey].toString())
      else return -1
      
    });
    if (index !== -1) {
      arr1[index] = employee2;
    } else {
      arr1.push(employee2);

    }
  });


  return arr1;
}