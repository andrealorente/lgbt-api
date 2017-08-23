import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
} from 'graphql';
import userType from './userType';
import reportType from './reportType';
var User = require('./../models/userModel');

const commentType = new GraphQLObjectType({
	name: 'commentType',
	fields: {
		id: { type: GraphQLString },
		target_id: { type: GraphQLString }, //Id del post, evento o lo que sea
		author_id: { type: GraphQLString },
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
		content: { type: GraphQLString },
		created_time: { type: GraphQLString },
		reports: { type: new GraphQLList(reportType) },
		state: { type: GraphQLString }
	}
});

export default commentType;
