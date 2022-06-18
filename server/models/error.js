const mongoose = require('mongoose')

const errorSchema = mongoose.Schema({
    name: String,       // error.name
    code: String,       // error.extensions.code
    component: String,  // component name
    message: String,    // error.message
    stacktrace: [String], // error.extensions.stacktrace
    user: {             // req.user.id
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
}, { timestamps: true })

const ErrorLog = mongoose.model('ErrorLog', errorSchema);
module.exports = { ErrorLog };