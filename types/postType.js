var graphql = require('graphql');
var commentType = require('./commentType');
var Comment = require('./../models/commentModel');
var userType = require('./userType');
var User = require('./../models/userModel');

var postType = new graphql.GraphQLObjectType({
    name: 'postType',
    fields: {
        id: { type: graphql.GraphQLString },
        title: { type: graphql.GraphQLString },
        content: { type: graphql.GraphQLString },
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
        tags: { type: new graphql.GraphQLList(graphql.GraphQLString)},
        image: { type: graphql.GraphQLString },
		    comments: {
			      type: new graphql.GraphQLList(commentType),
			      args: {
				          targetID: { type: graphql.GraphQLString }
			      },
            resolve: function(_, { targetID }) {
				    return new Promise((resolve,reject) => {
                Comment.find({ 'target_id': targetID }, function(err, res){
                    if(err) reject(err);
                    else resolve(res);
                });
            });
			}
		},
        state: { type: graphql.GraphQLString },
        likes: { type: new graphql.GraphQLList(graphql.GraphQLString) }
    }
});

module.exports = postType;
