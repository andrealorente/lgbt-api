import userType from './userType';
var User = require('./../models/userModel');
import { GraphQLDateTime } from 'graphql-iso-date';

import {
  graphql,
  GraphQLObjectType,
  GraphQLString
} from 'graphql';

var activityType = new GraphQLObjectType({
    name: 'Activity',
    fields: {
        origin_id: { type: GraphQLString }, //Cada campo puede tener un resolve
    		target_id: { type: GraphQLString },
    		action: { type: GraphQLString },
    		created_time: { type: GraphQLDateTime }
        //Devolver datos del usuario
    }
});
export default activityType;
