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
const userType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: GraphQLString }, //Cada campo puede tener un resolve
    username: { type: GraphQLString },
    name: { type: GraphQLString },
    pswd: { type: GraphQLString },
    bio: { type: GraphQLString },
    image: { type: GraphQLString },
    gender: { type: GraphQLString },
    email: { type: GraphQLString },
    place: { type: GraphQLString },
    relationships: { type: new GraphQLList(relationshipType) },
    activity: {
      type: new GraphQLList(activityType),
      args: {
        after: { type: GraphQLDateTime }
      },
      resolve: (user, args) => {
        return new Promise((resolve,reject) => {
          Activity.find({ 
            origin_id: user.id,
            created_time: { $lt: args.after } }, function(err, act){
            if(err) reject(err);
            else{
              resolve(act);
            }
          }).sort('-created_time');
        });
      }
    },
    counts: {
      type: new GraphQLObjectType({
        name: 'UserCounts',
        fields: {
          followedby: { type: GraphQLInt },
          following: { type: GraphQLInt }
        }
      }),
      resolve: (user) => {
        var fby = 0;
        var f = 0;
        for(var i in user.relationships){
          if(user.relationships[i].outgoing_status == "follows")
            f++;
          if(user.relationships[i].incoming_status == "followed-by")
            fby++;

        }//Fin for
        return({
          followedby: fby,
          following: f
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
    reports: { type: new GraphQLList(reportType) },
    role: { type: GraphQLString },
    confirm: { type: GraphQLBoolean },
    firebase_token: { type: GraphQLString },
    state: { type: GraphQLString }
  }
});

export default userType;
