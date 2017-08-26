import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull
} from 'graphql';

var messageType = new GraphQLObjectType({
    name: 'Message',
    fields: {
      id: { type: GraphQLString },
  		content: { type: GraphQLString },
  		created_time: { type: GraphQLString },
  		channel: { type: GraphQLString }
    }
});

export default messageType;
