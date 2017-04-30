var graphql = require('graphql');

var postType = new graphql.GraphQLObjectType({
    name: 'postType',
    fields: {
        id: { type: graphql.GraphQLString },
        title: { type: graphql.GraphQLString },
        content: { type: graphql.GraphQLString },
        author: { type: graphql.GraphQLString },
        tags: { type: new graphql.GraphQLList(graphql.GraphQLString)},
        image: { type: graphql.GraphQLString }
		//El campo de comments sería como en eventType (copiar)
    }
});

module.exports = postType;