const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const SALT_I = 10;

const USER_ACCESS = ["admin", "superAdmin", "regular", "junior"];
const USER_ROLES = [
  "recruiter",
  "employ",
];
const CONNECTION_ROLE = ["recruiter", "employ"];

const NFT_TYPE = ["project", "job_expirience", "course", "field_seniority"];

const TAGS = ["Blockchain", "web3", "Cpp", "Machine_Learning","Python","JavaScript","Java"];

const FIELDS = ["Fintech", "project","workExpirience","robotics","education"];


const MONTHS = [
  "January ",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "Septembe",
  "October ",
  "November",
  "December",
];

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "invalid email"],
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
  },
  isPasswordRandom: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
    maxlength: 100,
  },
  registeredAt: Date,
  lastname: {
    type: String,
    maxlength: 100,
  },
  number: String,
  googleAccount: {
    email: String,
    googleId: String,
    imageUrl: String,
    name: String,
  },
  token: {
    type: String,
  },
  access: {
    type: String,
    required: [
      true,
      "You need to choose if the user will be admin/employee/client",
    ],
    enum: USER_ACCESS,
  },
  role: {
    type: String,
    required: [
      true,
      "You need to choose if the user will be broker/agent/observer",
    ],
    enum: USER_ROLES,
  },
  walletAddress: {
    type: String,
    maxlength: 100,
  },
  flatOrPercentage: String,
  commissionFlat: { type: Number },
  commissionPercentage: { type: Number },
  languagePlatform: {
    type: String,
  },
  FavFSCompany: String,
  creatorNote: {
    title: String,
    description: String,
  },
  mainNote: {
    title: String,
    description: String,
  },


  employs: [mongoose.Schema.ObjectId],

  managers: [mongoose.Schema.ObjectId],

  createdBy: mongoose.Schema.ObjectId,
  createdUsers: [mongoose.Schema.ObjectId],



  numberProjects: String,
  jobTitle: {
    type: String,
    maxlength: 100,
  },

  

  tags:[{
    type:{
      type: String,
      enum: TAGS,
    },
    points: Number
  }],

  fields:[{
    type:{
      type: String,
      enum: FIELDS,
    },
    points: Number
  }],

  allTags: String,

  review: Number,
  salary: Number,

  description:String,
  nfts:[{
    idNFT: String,
    title: String,
    description_1: String,
    description_2: String,
    description_3: String,
    Date: Date,
    createdBy: String,
    NFTlink: String,
    primary: Boolean,
    type: {
      type: String,
      enum: NFT_TYPE,
    },
  }],

  

  archiveUser: {
    type: Boolean,
    default: false,
  },
});

// userSchema.index({name: 'text', 'email': 'text'});

userSchema.pre("save", function (next) {
  var user = this;

  if (user.isModified("password")) {
    bcrypt.genSalt(SALT_I, function (err, salt) {
      if (err) return next(err);

      bcrypt.hash(user.password, salt, function (err, hash) {
        if (err) return next(err);
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});



userSchema.methods.generateToken = async function () {
  var user = this;

  // console.log(process.env.SECRET);

// console.log("Find token 1", user._id, user.email);

  var token = await jwt.sign(
    { _id: user._id, email: user.email },
    "myawesomesupersecretpassword",
    {
      expiresIn: "7d",
    }
  );

// console.log("Find token 2");

  user.token = token;
// console.log("Find token 3", token);

  user.save();
// console.log("Find token 4");

  return user;
  // return user.save();
};

userSchema.methods.comparePassword = function (candidatePassword) {
// console.log("compare passors = ");
  var user = this;

// console.log("compare passors = ", candidatePassword, user.password);
  return bcrypt
    .compare(candidatePassword, user.password)
    .then(function (result) {
      return result;
    });
};

const User = mongoose.model("User", userSchema);
module.exports = { User };
