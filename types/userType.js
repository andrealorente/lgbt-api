var graphql = require('graphql');

//Definir min User type
var minuserType = new graphql.GraphQLObjectType({
    name: 'MinUser',
    fields: {
        id: { type: graphql.GraphQLString },
        name: { type: graphql.GraphQLString }
    }
});

//Definir User type
var userType = new graphql.GraphQLObjectType({
    name: 'User',
    fields: {
        id: { type: graphql.GraphQLString }, //Cada campo puede tener un resolve
        name: { type: graphql.GraphQLString },
		pswd: { type: graphql.GraphQLString },
		bio: { type: graphql.GraphQLString },
        email: { type: graphql.GraphQLString },
		place: { type: graphql.GraphQLString },
        followers: { type: new graphql.GraphQLList(minuserType)},
		token: { type: graphql.GraphQLString }
    }
});

module.exports = userType;