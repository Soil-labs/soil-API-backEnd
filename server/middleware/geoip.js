// const express = require("express");
// const geoip = require("geoip-lite");
// const app = express();

// const originAuth = (req, res, next) => {
//   const ip = req.ip.includes("::ffff:") ? req.ip.split("::ffff:")[1] : req.ip;
//   const geo = geoip.lookup(ip);
//   const host = req.headers.host || "";
//   const allowedDomain = "edeprotocol.app";
//   const developDomain = "eden-saas-develop.vercel.app";

//   //   console.log("IP", ip);
//   //   console.log("GEO", geo);
//   //   console.log("Region", geo.region);

//   if (
//     host.includes(allowedDomain) ||
//     host.includes(developDomain) ||
//     (geo && geo.region === "TN") ||
//     (geo && geo.region === "CT")
//   ) {
//     next();
//   } else {
//     res.status(403).send("Access Denied.");
//   }
// };

// module.exports = originAuth;
