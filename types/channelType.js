var graphql = require('graphql');
var messageType = require('./messageType');

var channelType = new graphql.GraphQLObjectType({
    name: 'channelType',
    fields: {
        id: { type: graphql.GraphQLString },
        title: { type: graphql.GraphQLString },
        description: { type: graphql.GraphQLString },
        author: { type: graphql.GraphQLString },
        messages: { type: new graphql.GraphQLList(messageType)}
    }
});

module.exports = channelType;
