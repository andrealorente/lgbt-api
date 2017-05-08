var graphql = require('graphql');

var messageType = new graphql.GraphQLObjectType({
    name: 'Message',
    fields: {
        id: { type: graphql.GraphQLString },
		content: { type: graphql.GraphQLString },
		created_time: { type: graphql.GraphQLString },
		channel: { type: graphql.GraphQLString }
    }
});

module.exports = messageType;