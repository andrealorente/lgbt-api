var graphql = require('graphql');

const commentType = new graphql.GraphQLObjectType({
	name: 'commentType',
	fields: {
		id: { type: graphql.GraphQLString },
		target_id: { type: graphql.GraphQLString }, //Id del post, evento o lo que sea
		user: { type: graphql.GraphQLString }, //Esto ser�a todos los datos necesarios del usuario
		content: { type: graphql.GraphQLString },
		created_time: { type: graphql.GraphQLString }
	}
});

module.exports = commentType;