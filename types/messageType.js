var graphql = require('graphql');

//Definir User type
var messageType = new graphql.GraphQLObjectType({
    name: 'Message',
    fields: {
        id: { type: graphql.GraphQLString }, //Cada campo puede tener un resolve
        user: { type: graphql.GraphQLString },
		content: { type: graphql.GraphQLString },
		created_at: { type: graphql.GraphQLString }
    }
});

module.exports = messageType;