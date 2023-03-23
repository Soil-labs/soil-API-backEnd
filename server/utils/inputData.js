// const { EdenMetrics } = require("../models/edenMetrics");

// const InputData = async () => {
//   console.log("starting to input data: ");

//   await EdenMetrics.findOneAndUpdate(
//     { memberID: "518418233968295940" },

//     {
//       $push: {
//         actions: {
//           actionType: "sendMessage",
//           actionDate: new Date("4/15/2023"),
//         },
//       },
//     }
//   );
//   // user1.save();

//   // const user2 = await new EdenMetrics({
//   //   memberID: "908392557258604544",
//   //   profileCreatedDate: new Date(),
//   //   actions: [
//   //     {
//   //       actionType: "messageUser",
//   //       actionDate: new Date("3/19/2023"),
//   //     },
//   //     {
//   //       actionType: "messageUser",
//   //       actionDate: new Date("3/15/2023"),
//   //     },
//   //     {
//   //       actionType: "messageUser",
//   //       actionDate: new Date("3/17/2023"),
//   //     }
//   //   ]
//   // });
//   // user2.save();

//   // const user3 = await new EdenMetrics({
//   //   memberID: "901188444057907310",
//   //   profileCreatedDate: new Date(),
//   //   actions: [
//   //     {
//   //       actionType: "messageUser",
//   //       actionDate: new Date("3/16/2023"),
//   //     },
//   //     {
//   //       actionType: "messageUser",
//   //       actionDate: new Date("3/15/2023"),
//   //     },
//   //     {
//   //       actionType: "messageUser",
//   //       actionDate: new Date("3/19/2023"),
//   //     }
//   //   ]
//   // });
//   // user3.save();

//   // const user4 = await new EdenMetrics({
//   //   memberID: "702954417946886286",
//   //   profileCreatedDate: new Date(),
//   //   actions: [
//   //     {
//   //       actionType: "messageUser",
//   //       actionDate: new Date("3/17/2023"),
//   //     },
//   //     {
//   //       actionType: "messageUser",
//   //       actionDate: new Date("3/15/2023"),
//   //     },
//   //     {
//   //       actionType: "messageUser",
//   //       actionDate: new Date("3/17/2023"),
//   //     }
//   //   ]
//   // });
//   // user4.save();

//   // const user5 = await new EdenMetrics({
//   //   memberID: "812342397790191638",
//   //   profileCreatedDate: new Date(),
//   //   actions: [
//   //     {
//   //       actionType: "messageUser",
//   //       actionDate: new Date("3/18/2023"),
//   //     },
//   //     {
//   //       actionType: "messageUser",
//   //       actionDate: new Date("3/15/2023"),
//   //     },
//   //     {
//   //       actionType: "messageUser",
//   //       actionDate: new Date("3/18/2023"),
//   //     }
//   //   ]
//   // });
//   // user5.save();

//   // const user6 = await new EdenMetrics({
//   //   memberID: "812526237074456577",
//   //   profileCreatedDate: new Date(),
//   //   actions: [
//   //     {
//   //       actionType: "messageUser",
//   //       actionDate: new Date("3/20/2023"),
//   //     },
//   //     {
//   //       actionType: "messageUser",
//   //       actionDate: new Date("3/15/2023"),
//   //     },
//   //     {
//   //       actionType: "messageUser",
//   //       actionDate: new Date("3/17/2023"),
//   //     }
//   //   ]
//   // });
//   // user6.save();

//   // const user7 = await new EdenMetrics({
//   //   memberID: "961730944170090516",
//   //   profileCreatedDate: new Date(),
//   //   actions: [
//   //     {
//   //       actionType: "messageUser",
//   //       actionDate: new Date("3/15/2023"),
//   //     },
//   //     {
//   //       actionType: "messageUser",
//   //       actionDate: new Date("3/16/2023"),
//   //     },
//   //     {
//   //       actionType: "messageUser",
//   //       actionDate: new Date("3/17/2023"),
//   //     }
//   //   ]
//   // });
//   // user7.save();

//   const newMembersArray = [
//     "518418233968295940",
//     "908392557258604544",
//     "901188444057907310",
//     "702954417946886286",
//     "812342397790191638",
//     "812526237074456577",
//     "961730944170090516",
//   ];

//   console.log("ended input of data : ");
// };

// module.exports = { InputData };
