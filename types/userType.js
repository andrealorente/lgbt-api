var graphql = require('graphql');
var relationshipType = require('./relationshipType');
var activityType = require('./activityType');

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
    		relationships: { type: new graphql.GraphQLList(relationshipType) },
    		activity: { type: new graphql.GraphQLList(activityType) },
    		public: { type: graphql.GraphQLBoolean },
    		token: { type: graphql.GraphQLString }
    }
});

module.exports = userType;
