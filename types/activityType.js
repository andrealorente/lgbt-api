import userType from './userType';
var User = require('./../models/userModel');
import { GraphQLDateTime } from 'graphql-iso-date';

import {
  graphql,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean
} from 'graphql';

var activityType = new GraphQLObjectType({
  name: 'activityType',
  fields: {
    origin_id: { type: GraphQLString }, //Cada campo puede tener un resolve
		target_id: { type: GraphQLString },
		action: { type: GraphQLString },
		created_time: { type: GraphQLDateTime },
    type: { type: GraphQLInt },
    origin_data: {
      type: new GraphQLObjectType({
        name: 'minUser',
        fields: {
          username: { type: GraphQLString },
          image: { type: GraphQLString },
          public: { type: GraphQLBoolean }
        }
      }),
      resolve: function(root) {
        return new Promise((resolve,reject) => {
          User.findById(root.origin_id, function(err,res){
            if(err) reject(err);
            resolve({
              username: res.username,
              image: res.image,
              public: res.public
            });
          });
        });
      }
    }
  }
});
export default activityType;
