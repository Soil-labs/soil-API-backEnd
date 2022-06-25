const { Query } = require('./query');
const { Mutation } = require('./mutation');
const { Members } = require('./objectResolvers/memberResolver');
const { Skills } = require('./objectResolvers/skillsResolver');

module.exports = {
    Query,
    Mutation,
    Members,
    Skills,
}