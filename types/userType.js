var graphql = require('graphql');

//Definir User type
var userType = new graphql.GraphQLObjectType({
    name: 'User',
    fields: {
        id: { type: graphql.GraphQLString }, //Cada campo puede tener un resolve
        username: { type: graphql.GraphQLString },
		name: { type: graphql.GraphQLString },
		pswd: { type: graphql.GraphQLString },
		bio: { type: graphql.GraphQLString },
        email: { type: graphql.GraphQLString },
		place: { type: graphql.GraphQLString },
		follows: { type: new graphql.GraphQLList(graphql.GraphQLString)},
        followers: { type: new graphql.GraphQLList(graphql.GraphQLString)},
		public: { type: graphql.GraphQLBoolean },
		token: { type: graphql.GraphQLString }
    }
});

module.exports = userType;