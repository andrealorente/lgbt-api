var graphql = require('graphql');

var relationshipType = new graphql.GraphQLObjectType({
    name: 'Relationship',
	description: 'Relación entre dos usuarios',
    fields: {
        id: { type: graphql.GraphQLString }, 
        incoming_status: { type: graphql.GraphQLString },
		outgoing_status: { type: graphql.GraphQLString }
    }
});

module.exports = relationshipType;