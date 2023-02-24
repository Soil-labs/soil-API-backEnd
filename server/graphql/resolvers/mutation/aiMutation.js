const { AI } = require("../../../models/aiModel");
const { ApolloError } = require("apollo-server-express");
const axios = require("axios");
const { Configuration, OpenAIApi } = require("openai");
const math = require("mathjs");
const numeric = require("numeric");
const fs = require("fs");

const { combineResolvers } = require("graphql-resolvers");
const { IsAuthenticated } = require("../../../utils/authorization");

const configuration = new Configuration({
  apiKey: chooseAPIkey(),
});

console.log("chooseAPIkey = ", chooseAPIkey());
const openai = new OpenAIApi(configuration);

module.exports = {
  addMessage: async (parent, args, context, info) => {
    const { creator, mentioned, message, serverID } = args.fields;
    console.log("Mutation > addMessage > args.fields = ", args.fields);
    try {
      if (!creator)
        throw new ApolloError("The creator of the message is required.");
      if (!mentioned) throw new ApolloError("The mentioned array is required");
      if (!message) throw new ApolloError("The message is required");

      let fields = {
        createdAt: new Date(),
      };

      if (serverID) fields.serverID = serverID;

      fields.message = message;
      fields.creator = creator;
      fields.mentioned = mentioned;

      const newAIData = await new AI(fields);

      newAIData.save();
      console.log("new ai data : ", newAIData);
      return newAIData;
    } catch (err) {
      throw new ApolloError(err.message, err.extensions?.code || "addMessage", {
        component: "aiMutation > addMessage",
      });
    }
  },
  addMessages: async (parent, args, context, info) => {
    const { data } = args.fields;
    console.log("Mutation > addMessages > args.fields = ", args.fields);
    try {
      if (!data || !data.length || data.length === 0)
        throw new ApolloError("The array of messages is required");
      let validData = [];
      data.forEach((addMessageInputData) => {
        const { creator, mentioned, message } = addMessageInputData;
        let valid = false;
        if (creator && mentioned && message) {
          valid = true;
        }

        if (valid) {
          addMessageInputData.createdAt = new Date();
          validData.push(addMessageInputData);
        }
      });

      if (validData.length === 0)
        throw new ApolloError("The passed data were not valid");

      console.log("valid data ", validData);

      //multiple insert
      const newAIDataArray = await AI.insertMany(validData);
      console.log("new ai data : ", newAIDataArray);
      return newAIDataArray;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "addMessages",
        {
          component: "aiMutation > addMessages",
        }
      );
    }
  },
  updateMessage: async (parent, args, context, info) => {
    const { messageID, edenAI } = args.fields;
    console.log("Mutation > updateMessage > args.fields = ", args.fields);
    try {
      if (!messageID) throw new ApolloError("The messageID is required");
      if (!edenAI) throw new ApolloError("The edenAI array is required");

      if (edenAI && edenAI.length === 0)
        throw new ApolloError("The edenAI array length must be greater than 0");

      let aiData = await AI.findOne({ _id: messageID });
      if (!aiData) throw new ApolloError("The message does not exist");

      aiData = await AI.findOneAndUpdate(
        { _id: messageID },
        {
          $set: {
            edenAI: edenAI,
          },
        },

        { new: true }
      ).lean();

      const embeddingData = convertEmbeddingToFloat(aiData.edenAI.keywords);
      aiData.edenAI.keywords = embeddingData;
      return aiData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "updateMessage",
        {
          component: "aiMutation > updateMessage",
        }
      );
    }
  },
  
  messageToGPT: combineResolvers(
    IsAuthenticated,
    async (parent, args, context, info) => {
      const { message, category, prompt } = args.fields;
      console.log("Mutation > messageToGPT > args.fields = ", args.fields);
      if (!message) throw new ApolloError("The message is required");
      let model = "text-davinci-003";
      const reason = {
        project:
          "You are a successful ceo of a company wih 10 years of experience. You talk elegant and descriptive language. Give a description of a project based on this information:  ",
        skill: "Give a description of a skill named: ",
        role: "Give a description of role with a name of: ",
      };
      const promptDescription = (descriptionOf) => {
        if (descriptionOf === "project") {
          return reason.project + message;
        } else if (descriptionOf === "skill") {
          return reason.skill + message;
        } else if (descriptionOf === "role") {
          return reason.role + message;
        } else {
          return descriptionOf + message;
        }
      };
      const response = await openai.createCompletion({
        model,
        prompt: promptDescription(prompt ? prompt : category),
        max_tokens: 200,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });
      let generatedText = response.data.choices[0].text;
      let result = generatedText.replace(/\n\n/g, "");
      try {
        return { message: result };
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "updateMessage",
          {
            component: "aiMutation > updateMessage",
          }
        );
      }
    }
  ),
  inputToGPT: async (parent, args, context, info) => {
    const { oneLinerProject, descriptionProject, titleRole, expertiseRole } =
      args.fields;
    console.log("Mutation > inputToGPT > args.fields = ", args.fields);
    if (!titleRole) throw new ApolloError("The titleRole is required");
    let model = "text-davinci-003";
    const prompt =
      'I give you four things: a one-liner for a project + a description of that project  + the title of a role for that project + [categories of specialization for that role within that same project ]\n\nYour job is to take all those 4 things and create a wholistic context from it, focus on "the title of a role for that project" and "[categories of specialization for that role within that same project ]" and to give me the following:\n1. A full description of that role(always label this output with "Role Description:")\n2. Four Expectations for that role (always label this output with "Expectations for Role:") + Return this list  as a Javascript Arra\n3. Four Benefits of this role (always label this output with "Benefits:") + Return this list  as a Javascript Array  \n\nHere we go: \n\n';

    console.log("hey 2")
    
    const input =
      prompt +
      " " +
      oneLinerProject +
      " + " +
      descriptionProject +
      " + " +
      titleRole +
      " + " +
      expertiseRole;


    console.log("hey 2")
    
    const response = await openai.createCompletion({
      model,
      prompt: input,

      max_tokens: 400,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    console.log("hey 3")

    // console.log(
    //   "prompt + oneLinerProject + descriptionProject + titleRole + expertiseRole",
    //   prompt +
    //     " " +
    //     oneLinerProject +
    //     " + " +
    //     descriptionProject +
    //     " + " +
    //     titleRole +
    //     " + " +
    //     expertiseRole
    // );

    let generatedText = response.data.choices[0].text;
    let result = generatedText.replace(/\n\n/g, "");

    console.log("hey 4")

    const descriptionRoleHandler = () => {
      const startIndex = result.indexOf("Role Description:");
      const endIndex = result.indexOf("Expectations for Role:");
      const descriptionRole = result
        .slice(startIndex + "Role Description:".length, endIndex)
        .trim();

      return descriptionRole;
    };

    console.log("hey 5")

    const expectationRoleHandler = () => {
      console.log("hey 10")
      const startIndex = result.indexOf("Expectations for Role:");
      console.log("hey 11")
      const endIndex = result.indexOf("Benefits:");
      const expectationRoleString = result
        .slice(startIndex + "Expectations for Role:".length, endIndex)
        .trim();
      console.log("hey 12",result)
      console.log("hey 12",expectationRoleString)
      

      const expectationRole = JSON.parse(expectationRoleString);
      console.log("hey 13",expectationRole)

      return expectationRole;
    };
    console.log("hey 6")


    const benefitRoleHandler = () => {
      const startIndex = result.indexOf("Benefits:");

      const benefitRoleString = result
        .slice(startIndex + "Benefits:".length)
        .trim();

      
      const benefitRole = JSON.parse(benefitRoleString);
      return benefitRole;
    };

    console.log("hey 7")


    descriptionRoleHandler()

    console.log("hey 8")


    expectationRoleHandler()

    console.log("hey 9")


    benefitRoleHandler()

    try {
      return {
        descriptionRole: descriptionRoleHandler,
        expectationsRole: expectationRoleHandler,
        benefitsRole: benefitRoleHandler,
      };
    } catch (err) {
      throw new ApolloError(err.message, err.extensions?.code || "inputToGPT", {
        component: "aiMutation > inputToGPT",
      });
    }
  },
  useAI_OnMessage: async (parent, args, context, info) => {
    const { message, cash, numberKeywords } = args.fields;
    console.log("Mutation > updateMessage > args.fields = ", args.fields);

    if (numberKeywords == undefined) numberKeywords = 10;

    try {
      // question_ask =
      //   "Extract keywords from this text, and separate them with comma:\n\n" +
      //   message +
      //   "\n\n Result:";
      // question_ask =
      //   "Extract 10 different expertise that derives from the context, and show the expertise and the confidence level higher than 8/10:\n\n" +
      //   message +
      //   "\n\n separate the result with a comma, and don't show the confidence level:";
      question_ask =
        `Extract ${numberKeywords} different expertise that derives from the context, and show the expertise and the confidence level that you have from 0 to 10:` +
        "\n\n" +
        message +
        "\n\n" +
        "result  format like this: \n - expertise: confidence";

      let keywords_mes, keyword_embed;
      // if (fs.existsSync("keywords_mes.txt")) {
      if (fs.existsSync("keywords_mes.txt") && cash == true) {
        keywords_mes = await readData("keywords_mes.txt");
        confidence_mes = await readData("confidence_mes.txt");
        generatedText = await readData("generatedText.txt");
      } else {
        [keywords_mes, confidence_mes, generatedText] =
          await useGPT_withConfidence(question_ask, 0.1);
        cashData("keywords_mes.txt", keywords_mes);
        cashData("confidence_mes.txt", confidence_mes);
        cashData("generatedText.txt", generatedText);
      }

      console.log("keywords_mes = ", keywords_mes);
      console.log("confidence_mes = ", confidence_mes);
      console.log("generatedText = ", generatedText);
      console.log("  ");
      console.log("  ");

      // console.log("keywords_mes = ", keywords_mes);

      // keywords_mes = [message]; // SOS 🆘 -> Delete, it's just for test, it's not a good idea to use the message as a keyword

      // if (fs.existsSync("keyword_embed.txt")) {
      if (fs.existsSync("keyword_embed.txt") && cash == true) {
        keyword_embed = await readData("keyword_embed.txt");
      } else {
        keyword_embed = await createEmbedingsGPT(keywords_mes);
        await cashData("keyword_embed.txt", keyword_embed);
      }

      // console.log("keyword_embed = " , keyword_embed)
      // asdf
      // console.log("keyword_embed = ", keyword_embed);

      // words_n_base = await addKnowledgeGraph_embedings();
      [words_n_base, words_n_base_embed] = await addKnowledgeGraph_embedings();

      // console.log("words_n_base_embed.length = ", words_n_base_embed.length);
      // console.log("words_n_base_embed.length = ", words_n_base_embed[0].length);
      // console.log(
      //   "words_n_base_embed.length = ",
      //   words_n_base_embed[0][0].length
      // );
      // console.log("keyword_embed.length = ", keyword_embed.length);
      // console.log("keyword_embed.length = ", keyword_embed[0].length);

      // console.log(
      //   "math.transpose(keyword_embed)[0] = ",
      //   math.transpose(keyword_embed).length
      // );
      // console.log(
      //   "math.transpose(keyword_embed)[0] = ",
      //   math.transpose(keyword_embed)[0].length
      // );

      // let testV = keyword_embed[0];

      // scores = [];
      // for (let i = 0; i < words_n_base_embed[0].length; i++) {
      //   let dot = numeric.dot(
      //     words_n_base_embed[i],
      //     math.transpose(keyword_embed)
      //   );
      //   // scores.push(
      //   //   )
      // }
      scores = []; // the score of every word in the message with the knowledgegraph
      maxima_array = []; // the maximum score of every word in the message with the knowledgegraph vertical (Design, frontEnd, etc.)
      max_graph_vertical = []; // the maximum score of every vertical (Design, frontEnd, etc.)

      maxi_graph_pos = -1; // the position of the maximum score of every vertical (Design, frontEnd, etc.)
      maxi_graph = -1; // the maximum score of every vertical (Design, frontEnd, etc.)
      for (let i = 0; i < words_n_base_embed.length; i++) {
        let dotProduct = numeric.dot(
          words_n_base_embed[i],
          math.transpose(keyword_embed)
        );

        // console.log("dotProduct = ", dotProduct[0]);

        for (let j = 0; j < dotProduct.length; j++) {
          // SOS 🆘 -> use the confidence of GPT to reduce the score
          dotProduct[j] = dotProduct[j].map(
            (element, idx) => element - confidence_mes[idx]
          );
        }

        scores.push(dotProduct);

        // console.log("dotProduct = ", dotProduct[0]);
        // asfd;

        // find maximum in 2D array, in every column
        let maxi_n_arr = dotProduct.map(function (col) {
          return Math.max.apply(Math, col);
        });
        maxima_array.push(maxi_n_arr);

        // find the average of the maxi_n array, with the fastest way
        let maxi_n = maxi_n_arr.reduce((a, b) => a + b, 0) / maxi_n_arr.length;

        console.log("maxi_n = ", words_n_base[i][0], " ->", maxi_n);

        max_graph_vertical.push(maxi_n);

        if (maxi_n > maxi_graph) {
          maxi_graph = maxi_n;
          maxi_graph_pos = i;
        }
      }

      // console.log("maxi_graph_pos = ", maxi_graph_pos);

      // maxi_graph_pos = 0; // SOS 🆘 -> Delete, this is for testing (makes it always FrontEnd result)

      if (maxi_graph < 0.81) {
        // if (maxi_graph < 0.79) {
        return {
          mainExpertise: "",
          expertiseIdentified: [],
          keywordsMessage: keywords_mes,
        };
      }
      let knowledgeGraphTopic = "";
      if (maxi_graph_pos == 0) {
        knowledgeGraphTopic = words_n_base[0][0];
      } else if (maxi_graph_pos == 1) {
        knowledgeGraphTopic = words_n_base[1][0];
      } else if (maxi_graph_pos == 2) {
        knowledgeGraphTopic = words_n_base[2][0];
      } else if (maxi_graph_pos == 3) {
        knowledgeGraphTopic = words_n_base[3][0];
      } else if (maxi_graph_pos == 4) {
        knowledgeGraphTopic = words_n_base[4][0];
      } else if (maxi_graph_pos == 5) {
        knowledgeGraphTopic = words_n_base[5][0];
      }

      console.log("The user is talking about ---> ", knowledgeGraphTopic);

      // console.log("scores[maxi_graph_pos] = ", scores[maxi_graph_pos]);

      console.log("");
      console.log("");
      console.log("");

      rolesIdentified = [];
      rolesIdentified_average_conf = [];
      min_average_conf = 1;
      max_average_conf = 0;

      // console.log("scores[maxi_graph_pos] = ", scores[maxi_graph_pos]);
      // console.log("keywords_mes = ", keywords_mes);

      for (let i = 0; i < scores[maxi_graph_pos].length; i++) {
        // console.log("scores[maxi_graph_pos][i] = ", scores[maxi_graph_pos][i]);
        // console.log(
        //   "words_n_base[maxi_graph_pos][i] = ",
        //   words_n_base[maxi_graph_pos][i]
        // );
        // find the maximum number from scores[maxi_graph_pos][i], and the position of it
        let max_n = Math.max.apply(Math, scores[maxi_graph_pos][i]);
        let max_n_pos = scores[maxi_graph_pos][i].indexOf(max_n);

        // sort the scores[maxi_graph_pos][i] but remember the position of the elements
        let sort_scores = scores[maxi_graph_pos][i].map(function (el, i) {
          return { index: i, value: math.round(el, 3) };
        });
        sort_scores.sort(function (a, b) {
          return b.value - a.value;
        });
        // console.log("sort_scores = ", sort_scores);

        // average the first 4 positions of sort_scores with the fastest way
        let average_sort_scores =
          sort_scores.slice(0, 4).reduce((a, b) => a + b.value, 0) / 4;
        // console.log("average = ", average_sort_scores);

        // asdf;

        // console.log("max_n_pos = ", max_n_pos);

        // console.log("scores[maxi_graph_pos][i] = ", scores[maxi_graph_pos][i]);

        if (average_sort_scores > 0.81) {
          rolesIdentified.push(words_n_base[maxi_graph_pos][i]);
          rolesIdentified_average_conf.push(average_sort_scores);

          if (average_sort_scores < min_average_conf) {
            min_average_conf = average_sort_scores;
          }
          if (average_sort_scores > max_average_conf) {
            max_average_conf = average_sort_scores;
          }

          console.log(
            "max_n = ---------------> ",
            words_n_base[maxi_graph_pos][i],
            average_sort_scores,
            keywords_mes[sort_scores[0].index],
            "\n",
            keywords_mes[sort_scores[1].index],
            "\n",
            keywords_mes[sort_scores[2].index],
            "\n",
            keywords_mes[sort_scores[3].index],
            "\n"
          );
          // console.log("ort_scores.slice(0, 4) = ", sort_scores.slice(0, 4));
          console.log("---------------> = ");
        }
      }
      // console.log("change = ", rolesIdentified);

      let rolesIdentified_final = [];
      for (let i = 0; i < rolesIdentified.length; i++) {
        rolesIdentified_average_conf[i] = mapRange(
          rolesIdentified_average_conf[i],
          min_average_conf,
          max_average_conf,
          0,
          100
        );

        if (rolesIdentified_average_conf[i] > 40) {
          rolesIdentified_final.push(rolesIdentified[i]);
        }
      }

      return {
        mainExpertise: knowledgeGraphTopic,
        expertiseIdentified: rolesIdentified_final,
        keywordsMessage: keywords_mes,
      };
      // return {
      //   res: res,
      // };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "updateMessage",
        {
          component: "aiMutation > updateMessage",
        }
      );
    }
  },
};

async function useGPT_withConfidence(prompt, temperature) {
  // let model = "text-curie-001";
  let model = "text-davinci-003";
  const response = await openai.createCompletion({
    model,
    prompt,
    temperature,
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  // // ----------- Clean up the Results ---------
  let generatedText = response.data.choices[0].text;

  // generatedText =
  // "generatedText =   level \n 1. Coding: 8\n 2. Javascript: 8\n 3. Neo4j: 6\n 4. Convolutional Neural Networks: 4\n 5. Figma: 4\n 6. Algorithm Design: 3\n 7. Data Structures: 3\n 8. Machine Learning: 3\n 9. Database Design: 2\n 10. UI/UX Design: 2";
  // generatedText =
  //   "- Database Design: 10\n - Database Optimization: 10\n - MySQL: 10\n - PostgreSQL: 10\n - MongoDB: 10\n - Problem Solving: 10\n - Project Management: 8\n - Troubleshooting: 9\n - Data Analysis: 8\n - Database Security: 9";

  console.log("generatedText = ", generatedText);

  // separate every new line of generatedText into an array
  let arr_genText = generatedText.split("\n");
  // console.log("arr_genText = ", arr_genText);
  // for every line of the array arr_genText take the words in the middle of the string

  let result = [];
  let keyword_mes = [];
  let confidence_mes = [];
  arr_genText.forEach((item) => {
    const parts = item.split(":");
    // console.log("parts = ", parts);
    // console.log("parts[0].split ", parts[0].split("-"));
    // console.log("parts[0].split ", parts[0].split("-")[1]);
    let prs;
    if (parts[0].indexOf(".") != -1) {
      prs = parts[0].split(".")[1];
    } else if (parts[0].indexOf("-") != -1) {
      prs = parts[0].split("-")[1];
    }

    if (prs && parts[1]) {
      const words = prs.trim();

      console.log("words = ", words);
      const confidence = Number(parts[1].trim());
      result.push({
        words: words,
        confidence: confidence,
      });
      keyword_mes.push(words);
      let confidence_new = mapRange(confidence, 0, 10, 0.1, 0);
      confidence_mes.push(confidence_new);
    }
  });
  // console.log("result = ", result);
  // console.log("keyword_mes = ", keyword_mes);
  // console.log("confidence_mes = ", confidence_mes);

  // asdf;
  // return keyword_mes;
  return [keyword_mes, confidence_mes, generatedText];
}

function mapRange(input, inputMin, inputMax, outputMin, outputMax) {
  return (
    ((input - inputMin) * (outputMax - outputMin)) / (inputMax - inputMin) +
    outputMin
  );
}

async function useGPT(prompt, temperature) {
  // let model = "text-curie-001";
  let model = "text-davinci-003";
  const response = await openai.createCompletion({
    model,
    prompt,
    temperature,
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  // ----------- Clean up the Results ---------
  let generatedText = response.data.choices[0].text;

  // console.log("generatedText = ", generatedText);
  generatedText = generatedText.replace("\n", "");
  // console.log("generatedText = ", generatedText);

  arr = generatedText.split(", ");
  // ----------- Clean up the Results ---------

  return arr;
}

async function createEmbedingsGPT(words_n) {
  // words_n = ["node.js", "react", "angular"];
  let OPENAI_API_KEY = chooseAPIkey();
  response = await axios.post(
    "https://api.openai.com/v1/embeddings",
    {
      input: words_n,
      model: "text-similarity-davinci-001",
      // model: "text-embedding-ada-002",
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    }
  );

  res = response.data.data.map((obj) => {
    return obj.embedding;
  });

  // console.log("res = ", res);
  return res;
}

const convertEmbeddingToFloat = (keywordsArray) => {
  let buildArray = [...keywordsArray];
  for (let i = 0; i < keywordsArray.length; i++) {
    let embeddingArray = keywordsArray[i].embedding;
    let newEmbeddingArray = [];
    embeddingArray.forEach((embedding) => {
      newEmbeddingArray.push(parseFloat(embedding.toString()));
    });

    buildArray[i].embedding = newEmbeddingArray;
  }

  return buildArray;
};

async function readData(name) {
  const contents = fs.readFileSync(name);
  const res_array = JSON.parse(contents);

  return res_array;
}

async function cashData(name, array) {
  fs.writeFile(name, JSON.stringify(array), function (err) {
    if (err) throw err;
    console.log("Saved!");
  });
}

function chooseAPIkey() {
  // openAI_keys = [
  //   "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",
  //   // "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",
  //   "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",
  //   "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",
  // ];
  openAI_keys = ["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"];

  // randomly choose one of the keys
  let randomIndex = Math.floor(Math.random() * openAI_keys.length);
  let key = openAI_keys[randomIndex];

  return key;
}

async function addKnowledgeGraph_embedings() {
  let words_n_base = [
    [
      "Design",
      "UX/UI",
      "Graphic Design",
      "Web Design",
      "Game Design",
      "Animation",
      "General Design support from A-Z",
      "NFT Design",
      "Brand Design",
      "Design user experiences",
      "Design interactions",
      "User flows",
      "Wireframing and prototyping",
      "Adobe Creative Suite ",
      "Illustratio",
      "Design user experiences",
      "Design user interfaces",
      "Prototyping",
      "Data visualization",
      "Create graphic designs",
      "Layout design",
    ],
    [
      "Frontend Developer",
      "UI Implementation",
      "Frontend Architecture",
      "General Frontend Support",
      "Web Development",
      "App Development",
      "JavaScript",
      "Front-end frameworks",
      "REST APIs",
      "Data management",
      "Security best pratices",
      "Scalability",
      "Optimize performance",
      "System design and architecture",
      "React ",
      "Angular ",
      "Vue.js ",
      "Bootstrap ",
    ],
    [
      "Product Manager",
      "User Research",
      "Market Research",
      "Technical Team Coordination",
      "Design Team Coordination",
      "Ideation",
      "Interviews",
    ],
    [
      "Backend Developer",
      "Provide General Backend Support",
      "Develop and implement a REST API",
      "Design and implement a database schema",
      "Handle user authentication and authorization",
      "Integrate third-party APIs",
      "Write scripts for data migration and processing",
      "Write unit and integration tests",
      "Debug and fix issues in the backend code",
      "Optimize for scalability and performance",
      "Implement security measures",
      "Write scripts for routine maintenance tasks",
      "Integrate the backend with the user interface",
      "Implement support for internationalization and localization",
      "Help team refine and prioritize features",
      "App Architecture",
    ],
    [
      "Blockchain Developer",
      "Smart Contract Development",
      "Smart Contract Auditing",
      "Blockchain Architecture & Design",
      "Lead a Technical Team",
      "General Blockchain Support",
    ],
    [
      "AI & Data Science",
      "Machine learning",
      "Natural language processing (NLP)",
      "Computer vision",
      "Robotics",
      "Deep learning",
    ],
  ];

  // - Design: confidence level
  // - UX/UI: confidence level
  // - Graphic Design: confidence level
  // - Web Design: confidence level
  // - Game Design: confidence level
  // - Animation: confidence level
  // - General Design support from A-Z: confidence level
  // - NFT Design: confidence level
  // - Brand Design: confidence level
  // - Design user experiences: confidence level
  // - Frontend Developer: confidence level
  // - UI Implementation: confidence level
  // - Frontend Architecture: confidence level
  // - General Frontend Support: confidence level
  // - Web Development: confidence level
  // - App Development: confidence level
  // - JavaScript: confidence level
  // - Front-end frameworks: confidence level
  // - Product Manager: confidence level
  // - User Research: confidence level
  // - Market Research: confidence level
  // - Technical Team Coordination: confidence level
  // - Design Team Coordination: confidence level
  // - Ideation: confidence level
  // - Interviews: confidence level

  let words_n_base_embed = [];
  if (fs.existsSync("knowledgeGranphEmb.txt")) {
    console.log("knowledgeGranphEmb.txt exists");

    const fs = require("fs");

    const contents = fs.readFileSync("knowledgeGranphEmb.txt");
    const words_n_base_embed = JSON.parse(contents);

    // return words_n_base_embed;
    return [words_n_base, words_n_base_embed];
  } else {
    console.log("knowledgeGranphEmb.txt does not exist");

    // loop words_n_base
    words_n_base_embed = [];
    for (let i = 0; i < words_n_base.length; i++) {
      let words_n = words_n_base[i];
      let res_embed = await createEmbedingsGPT(words_n);
      // put them on an array
      words_n_base_embed.push(res_embed);
    }

    // console.log("words_n_base_embed = ", words_n_base_embed);

    const json = JSON.stringify(words_n_base_embed);

    fs.writeFileSync("knowledgeGranphEmb.txt", json);

    // console.log("json = ", json);

    console.log("words_n_base = ", words_n_base);

    // return words_n_base;
    return [words_n_base, words_n_base_embed];
  }
}
