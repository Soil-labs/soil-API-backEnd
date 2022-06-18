const { User } = require('../models/user');
const { customErrorObject } = require('../utils/logError');
const { ApolloError } = require('apollo-server-express');
// some imports of roles might happen here

const checkAccess = (userId) => {
    if (!userId) return true

    try {
        const checkedUser = User.findById(userId)

        // some more checking on the roles might be used here later
        if (checkedUser) return false // condition that passes test 
        return true

    } catch (err) {
        throw new ApolloError(
            err.name,
            'DATABASE_WRITE_ERROR',
            { component: 'checkAccess function', user: userId })
    }
}

module.exports = { checkAccess };