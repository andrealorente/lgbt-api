var graphql = require('graphql');
var User = require('./../models/userModel');

var relationshipType = new graphql.GraphQLObjectType({
    name: 'Relationship',
	  description: 'Relación entre dos usuarios',
    fields: {
      id: { type: graphql.GraphQLString },
      incoming_status: { type: graphql.GraphQLString },
  		outgoing_status: { type: graphql.GraphQLString },
      user_data: {
        type: new graphql.GraphQLObjectType({
          name: 'userdataType',
          fields: {
            username: { type: graphql.GraphQLString },
            bio: { type: graphql.GraphQLString }
          }
        }),
        resolve: (rel) => {
          return new Promise((resolve,reject) => {
            User.findById(rel.id, function(err,user){
              if(err) reject(err);
              else{
                resolve({
                  username: user.username,
                  bio: user.bio
                });
              }
            });
          });
        }
      }
    }
});

module.exports = relationshipType;
