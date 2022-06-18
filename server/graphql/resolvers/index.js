const { Query } = require('./query');
const { Mutation } = require('./mutation');
const { User } = require('./objectResolvers/userResolver');

module.exports = {
    Query,
    Mutation,
    User
}