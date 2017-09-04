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
const requestType = new GraphQLObjectType({
  name: 'Request',
  fields: {
    id: { type: GraphQLString },
    userID: { type: GraphQLString },
    username: { type: GraphQLString },
    image: { type: GraphQLString },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    org: { type: GraphQLString },
    reason: { type: GraphQLString },
    state: { type: GraphQLString }
  }
});

export default requestType;