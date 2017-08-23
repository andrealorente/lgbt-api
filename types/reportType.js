import {
  graphql,
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString
} from 'graphql';

import { GraphQLDateTime } from 'graphql-iso-date';

var reportType = new GraphQLObjectType({
  name: 'reportType',
  fields: {
    id: { type: GraphQLString },
    origin_id: { type: GraphQLString },
    target_id: { type: GraphQLString },
    target_type: { type: GraphQLInt },
    reason: { type: GraphQLString }
  }
});

export default reportType;