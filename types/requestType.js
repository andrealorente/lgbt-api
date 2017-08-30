import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLBoolean,
  GraphQLInt,
} from 'graphql';
import relationshipType from './relationshipType';
import activityType from './activityType';
import Activity from './../models/activityModel';
import reportType from './reportType';

//Definir User type
const userType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: GraphQLString }, //Cada campo puede tener un resolve
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    org: { type: GraphQLString },
    reason: { type: GraphQLString },
    state: { type: GraphQLString }
  }
});

export default userType;