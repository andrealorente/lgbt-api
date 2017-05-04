var graphql = require('graphql');

var activityType = new graphql.GraphQLObjectType({
    name: 'Activity',
    fields: {
        id: { type: graphql.GraphQLString }, //Cada campo puede tener un resolve
		target: { type: graphql.GraphQLString },
		action: { type: graphql.GraphQLString },
		created_at: { type: graphql.GraphQLString },
    }
});

module.exports = activityType;