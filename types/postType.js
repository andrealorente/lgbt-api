
import commentType from './commentType';
var Comment = require('./../models/commentModel');
import userType from './userType';
var User = require('./../models/userModel');
import reportType from './reportType';

import {
  graphql,
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInt
} from 'graphql';

import { GraphQLDateTime } from 'graphql-iso-date';

var postType = new GraphQLObjectType({
  name: 'postType',
  fields: {
    id: { type: GraphQLString },
    title: { type: GraphQLString },
    content: { type: GraphQLString },
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
    tags: { type: new GraphQLList(GraphQLString)},
    image: { type: GraphQLString },
    comments: {
     type: new GraphQLList(commentType),
     args: {
      targetID: { type: GraphQLString }
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
  state: { type: GraphQLString },
  likes: { type: new GraphQLList(GraphQLString) },
  comments_count: {
    type: GraphQLInt,
    resolve: function(root) {
      return new Promise((resolve,reject) => {
        Comment.find({ 'target_id': root.id }, function(err, res) {
          if(err) reject(err);
          else resolve(res.length);
        });
      });
    }
  },
  reports: { type: new GraphQLList(reportType) },
  created_time: { type: GraphQLDateTime }
}
});

export default postType;
