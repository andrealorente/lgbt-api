var graphql = require('graphql');
var commentType = require('./commentType');
var Comment = require('./../models/commentModel');

const eventType = new graphql.GraphQLObjectType({
    name: 'eventType',
    fields: {
        id: { type: graphql.GraphQLString },
        title: { type: graphql.GraphQLString },
        image: { type: graphql.GraphQLString },
        description: { type: graphql.GraphQLString },
        author: { type: graphql.GraphQLString },
        place: { type: graphql.GraphQLString },
    		start_time: { type: graphql.GraphQLString },
        end_time: { type: graphql.GraphQLString },
    		comments: {
    			type: new graphql.GraphQLList(commentType),
    			args: {
    				targetID: { type: graphql.GraphQLString }
    			},
    			resolve: function(root, { targetID }) {
    				return new Promise((resolve,reject) => {
              Comment.find({ 'target_id': root.id }, function(err, res){
                  if(err) reject(err);
                  else resolve(res);
              });
            });
    			}
    		},
        assistants: { type: new graphql.GraphQLList(graphql.GraphQLString) },
        interested: { type: new graphql.GraphQLList(graphql.GraphQLString) },
        
    }
});

module.exports = eventType;
