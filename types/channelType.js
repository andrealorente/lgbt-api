import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLBoolean,
  GraphQLInt
} from 'graphql';
import messageType from './messageType';

import { GraphQLDateTime } from 'graphql-iso-date';

const channelType = new GraphQLObjectType({
    name: 'channelType',
    fields: {
        id: { type: GraphQLString },
        title: { type: GraphQLString },
        description: { type: GraphQLString },
        image: { type: GraphQLString },
        author: { type: GraphQLString },
        messages: { type: new GraphQLList(messageType)},
        susc: { type: new GraphQLList(GraphQLString)},
        reports: { type: new GraphQLList(GraphQLString) },
        created_time: { type: GraphQLDateTime },
        state: { type: GraphQLString },
        author_data: {
          type: userType,
          resolve: function(root){
            return new Promise((resolve,reject) => {
              User.findById(root.author, function(err, user){
                if(err) reject(err);
                else resolve(user);
              });
            });
          }
        },
    }
});

export default channelType;
