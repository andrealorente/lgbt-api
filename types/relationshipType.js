import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
} from 'graphql';
var User = require('./../models/userModel');

const relationshipType = new GraphQLObjectType({
    name: 'Relationship',
	  description: 'Relación entre dos usuarios',
    fields: {
      id: { type: GraphQLString },
      incoming_status: { type: GraphQLString },
  		outgoing_status: { type: GraphQLString },
      user_data: {
        type: new GraphQLObjectType({
          name: 'userdataType',
          fields: {
            username: { type: GraphQLString },
            bio: { type: GraphQLString },
            public: { type: GraphQLBoolean }
          }
        }),
        resolve: (rel) => {
          return new Promise((resolve,reject) => {
            User.findById(rel.id, function(err,user){
              if(err) reject(err);
              else{
                resolve({
                  username: user.username,
                  bio: user.bio,
                  public: user.public
                });
              }
            });
          });
        }
      }
    }
});

export default relationshipType;
