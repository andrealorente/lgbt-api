import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLBoolean,
  GraphQLInt,
} from 'graphql';
import messageType from './messageType';

const channelType = new GraphQLObjectType({
    name: 'channelType',
    fields: {
        id: { type: GraphQLString },
        title: { type: GraphQLString },
        description: { type: GraphQLString },
        author: { type: GraphQLString },
        messages: { type: new GraphQLList(messageType)},
        susc: { type: new GraphQLList(GraphQLString)},
        reports: { type: new GraphQLList(GraphQLString) }
    }
});

export default channelType;
