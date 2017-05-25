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

//Definir User type
const userType = new GraphQLObjectType({
    name: 'User',
    fields: {
        id: { type: GraphQLString }, //Cada campo puede tener un resolve
        username: { type: GraphQLString },
    		name: { type: GraphQLString },
    		pswd: { type: GraphQLString },
    		bio: { type: GraphQLString },
        email: { type: GraphQLString },
    		place: { type: GraphQLString },
    		relationships: { type: new GraphQLList(relationshipType) },
    		activity: {
          type: new GraphQLList(activityType),
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
    		public: { type: GraphQLBoolean },
    		token: { type: GraphQLString },
        channels: { type: new GraphQLList(new GraphQLObjectType({
          name: 'minChannel',
          fields: {
            channel_id: { type: GraphQLString },
            notifications: { type: GraphQLBoolean }
          }
        })
      )},
        reports: { type: new GraphQLList(GraphQLString) }
    }
});

export default userType;
