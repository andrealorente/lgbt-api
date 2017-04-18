var graphql = require('graphql');

const channelType = new graphql.GraphQLObjectType({
    name: 'channelType',
    fields: {
        id: { type: graphql.GraphQLString },
        title: { type: graphql.GraphQLString },
        description: { type: graphql.GraphQLString },
        author: { type: graphql.GraphQLString },
    }
});

module.exports = channelType;
