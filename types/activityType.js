var graphql = require('graphql');

var activityType = new graphql.GraphQLObjectType({
    name: 'Activity',
    fields: {
        origin_id: { type: graphql.GraphQLString }, //Cada campo puede tener un resolve
    		target_id: { type: graphql.GraphQLString },
    		action: { type: graphql.GraphQLString },
    		created_time: { type: graphql.GraphQLString },
    }
});

module.exports = activityType;
