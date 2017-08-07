import userType from './userType';
var User = require('./../models/userModel');
import { GraphQLDateTime } from 'graphql-iso-date';

import {
  graphql,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt
} from 'graphql';

var activityType = new GraphQLObjectType({
    name: 'Activity',
    fields: {
        origin_id: { type: GraphQLString }, //Cada campo puede tener un resolve
        origin_data: { 
          type: userType,
          resolve: function(root){
            return new Promise((resolve,reject) => {
                User.findById(root.origin_id, function(err, user){
                    if(err) reject(err);
                    else resolve(user);
                });
            });
          }
        },
    		target_id: { type: GraphQLString },
    		action: { type: GraphQLString },
    		created_time: { type: GraphQLDateTime },
        type: { type: GraphQLInt }
        //Devolver datos del usuario
    }
});
export default activityType;
