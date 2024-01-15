const express = require("express");
const geoip = require("geoip-lite");

const originAuth = (req, res, next) => {
  let ip;
  if (req.headers["x-forwarded-for"]) {
    ip = req.headers["x-forwarded-for"].includes("::ffff:")
      ? req.headers["x-forwarded-for"].split("::ffff:")[1]
      : req.headers["x-forwarded-for"];
  } else {
    ip = req.ip.includes("::ffff:") ? req.ip.split("::ffff:")[1] : req.ip;
  }
  const geo = geoip.lookup(ip);
  const referer = req.headers.referer || "";
  const allowedDomain = "edeprotocol.app";
  const developDomain = "eden-saas-develop.vercel.app";

  // console.log("middleware ======= ", referer);
  // console.log("middleware ======= ", geo);
  // console.log("middleware ======= ", ip);
  if (
    process.env.NODE_ENV !== "production" ||
    referer.includes(allowedDomain) ||
    referer.includes(developDomain) ||
    (geo && geo.region === "TN") ||
    (geo && geo.country === "ES")
  ) {
    next();
  } else {
    res.status(403).send("Access Denied.");
  }
};

module.exports = originAuth;
