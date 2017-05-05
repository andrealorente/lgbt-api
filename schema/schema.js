import {
 GraphQLSchema,
 GraphQLObjectType,
 GraphQLInt,
 GraphQLString,
 GraphQLList,
 GraphQLNonNull,
 GraphQLID,
 GraphQLBoolean,
 GraphQLFloat
} from 'graphql';

const query = new GraphQLObjectType({
    name: 'Query',
    description: 'Mi servidor GraphQL',
    fields: () => ({
        hola: {
            type: GraphQLString,
            description: 'Recibe un nombre para saludar',
            args: {
                name: {
                    type: GraphQLString,
                    description: 'El nombre que quieras'
                }
            },
            resolve: (_, args) => {
                return 'Hola, ${args.name}!!!';
            }
        }
    })
});

const schema = new GraphQLSchema({ query });

export default schema;