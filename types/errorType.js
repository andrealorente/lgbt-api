var graphql = require('graphql');

var errorType = new graphql.GraphQLObjectType({
	name: 'errorType',
	fields: {
		code: { type: graphql.GraphQLInt },
		message: { type: graphql.GraphQLString }
	}
});

module.exports = errorType;