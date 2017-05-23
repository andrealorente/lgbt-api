var graphql = require('graphql');
var relationshipType = require('./relationshipType');
var activityType = require('./activityType');
var Activity = require('./../models/activityModel');

//Definir User type
var userType = new graphql.GraphQLObjectType({
    name: 'User',
    fields: {
        id: { type: graphql.GraphQLString }, //Cada campo puede tener un resolve
        username: { type: graphql.GraphQLString },
    		name: { type: graphql.GraphQLString },
    		pswd: { type: graphql.GraphQLString },
    		bio: { type: graphql.GraphQLString },
        email: { type: graphql.GraphQLString },
    		place: { type: graphql.GraphQLString },
    		relationships: { type: new graphql.GraphQLList(relationshipType) },
    		activity: {
          type: new graphql.GraphQLList(activityType),
          resolve: (user) => {
            return new Promise((resolve,reject) => {
              Activity.find({ origin_id: user.id}, function(err, act){
                if(err) reject(err);
                else{
                  resolve(act);
                }
              });
            });
          }
        },
    		public: { type: graphql.GraphQLBoolean },
    		token: { type: graphql.GraphQLString },
        channels: { type: new graphql.GraphQLList(new graphql.GraphQLObjectType({
          name: 'minChannel',
          fields: {
            channel_id: { type: graphql.GraphQLString },
            notifications: { type: graphql.GraphQLBoolean }
          }
        })
      )},
        reports: { type: new graphql.GraphQLList(graphql.GraphQLString) }
    }
});

module.exports = userType;
