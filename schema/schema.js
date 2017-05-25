import { GraphQLSchema } from 'graphql';
import queryType from './queryType';
import mutationType from './mutationType';

const Schema = new GraphQLSchema({query: queryType, mutation: mutationType});

export default Schema;
