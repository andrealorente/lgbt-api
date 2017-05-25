import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
} from 'graphql';
import commentType from './commentType';
var Comment = require('./../models/commentModel');

const eventType = new GraphQLObjectType({
    name: 'eventType',
    fields: {
        id: { type: GraphQLString },
        title: { type: GraphQLString },
        image: { type: GraphQLString },
        description: { type: GraphQLString },
        author: { type: GraphQLString },
        place: { type: GraphQLString },
    		start_time: { type: GraphQLString },
        end_time: { type: GraphQLString },
    		comments: {
    			type: new GraphQLList(commentType),
    			args: {
    				targetID: { type: GraphQLString }
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
        assistants: { type: new GraphQLList(GraphQLString) },
        interested: { type: new GraphQLList(GraphQLString) },

    }
});

export default eventType;
