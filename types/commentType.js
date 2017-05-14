var graphql = require('graphql');
var userType = require('./userType');
var User = require('./../models/userModel');

const commentType = new graphql.GraphQLObjectType({
	name: 'commentType',
	fields: {
		id: { type: graphql.GraphQLString },
		target_id: { type: graphql.GraphQLString }, //Id del post, evento o lo que sea
		author_id: { type: graphql.GraphQLString },
		author_data: {
			type: userType,
			resolve: function(root){
				return new Promise((resolve,reject) => {
						User.findById(root.author_id, function(err, user){
								if(err) reject(err);
								else resolve(user);
						});
				});
			}
		},
		content: { type: graphql.GraphQLString },
		created_time: { type: graphql.GraphQLString },
		state: { type: graphql.GraphQLString }
	}
});

module.exports = commentType;
