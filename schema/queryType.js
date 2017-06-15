import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLBoolean,
  GraphQLInt,
} from 'graphql';
import { GraphQLDateTime } from 'graphql-iso-date';
//Models
var User = require('./../models/userModel');
var Post = require('./../models/postModel');
var Channel = require('./../models/channelModel');
var Event = require('./../models/eventModel');
var Comment = require('./../models/commentModel');
var Activity = require('./../models/activityModel');

//Custom types
import userType from './../types/userType';
import channelType from './../types/channelType';
import commentType from './../types/commentType';
import eventType from './../types/eventType';
import postType from './../types/postType';
import errorType from './../types/errorType';
import activityType from './../types/activityType';

const statusType = new GraphQLObjectType({
	name: 'statusType',
	description: 'Status of the relationship',
	fields: {
		incoming: {type: GraphQLString},
		outgoing: { type: GraphQLString }
	}
});


/** QUERIES **/
const queryType = new GraphQLObjectType({
    name: 'Query',
    fields: {
        /**USUARIOS**/
        user: {
            type: userType,
            //args son los argumentos que acepta la query User
            args: {
                userID: { type: GraphQLString }
            },
            resolve: function( _, {userID} ) {

                return new Promise((resolve,reject) => {
                    //Aquí se recuperan los datos de la bd
                    User.findOne({ _id: userID}, function(err, res) {
                        if (err) reject(err);
                        else resolve(res);
                    });
                }); //Fin Promise

            } //Fin resolve
        }, //Fin consultar user
		//Consultar relación entre dos usuarios
		relationship: {
			type: new GraphQLObjectType({
				name: 'getrelationshipResult',
				fields: {
					status: { type: statusType },
					error: { type: errorType }
				}
			}),
			args: {
				originID: { type: GraphQLString },
				targetID: { type: GraphQLString },
			},
			resolve: function(_, args){
				return new Promise((resolve,reject) => {
					User.find({_id: {
					$in: [args.originID, args.targetID ]}, 'relationships.id':{$in: [args.originID, args.targetID ]}},function(err, res){ //obtiene los dos usuarios

						console.log(res);

						if(res.length == 0){ //No hay relación
							resolve({
								status: {
									outgoing: "none",
									incoming: "none"
								},
								error: null
							});
						}else{ //Existe relación

							var user = {};
							//Buscar el doc del usuario origin
							if(res[0]._id == args.originID)
								user = res[0];
							else
								user = res[1];

							for(var i in user.relationships){
								if(user.relationships[i].id == args.targetID){
									console.log(user.relationships[i]);
									resolve({
										status: {
											outgoing: user.relationships[i].outgoing_status,
											incoming: user.relationships[i].incoming_status
										},
										error: null
									});
								}
							}
						}
					});
				});
			}
		},
        activity: {
          type: new GraphQLList(activityType),
          description: 'Cargar la actividad de mis seguidos.',
          args: {
            userID: { type: GraphQLString } //Mi id
          },
          resolve: function(_,args) {
            //Buscar mi usuario en la bd
            return new Promise((resolve,reject) => {
              User.findById(args.userID, function(err, me){
                if(err) reject(err);
                else{
                  //Buscar a mis seguidos y obtener su actividad reciente
                  var follows = [];
                  for(var i in me.relationships) {
                    if(me.relationships[i].outgoing_status == "follows"){
                      follows.push(me.relationships[i].id);
                    }
                  }//Fin for
                  console.log(follows);

                  Activity.find({
                    'origin_id': { $in: follows }
                  },function(err,activities){
                    console.log(activities);
                    resolve(activities);
                  });
                }
              });
            });
          }
        },
        /**POSTS**/
        allPosts: {
            type: new GraphQLObjectType({
    				name: 'allPostsResult',
    				fields: {
    					data: { type: new GraphQLList(postType) },
    					error: { type: errorType }
    				}
    			}),
          args: {
            after: { type: GraphQLDateTime }
          },
          resolve: function(_, {after}){
              return new Promise((resolve,reject) => {
                console.log(after);

                  Post.find({ created_time: { $lt: after }}, function(err, post){
                      if(err) reject(err);
            					else if(post!=null){
                        resolve({
                            data: post,
                            error: null
                        });
            					}else{
            						resolve({
            							data: null,
            							error: {
            								code: 1,
            								message: "No hay ningún post creado."
            							}
            						});
            					}
                  }).sort('-created_time').limit( 3 );
              });
          }
        },
		onePost: {
			type: new GraphQLObjectType({
				name: 'onePostResult',
				fields: {
					data: { type: postType },
					error: { type: errorType }
				}
			}),
			args: {
				postID: { type: GraphQLString }
			},
			resolve: function(_, {postID}) {
				return new Promise((resolve,reject) => {
					Post.findById(postID, function(err, post) {
						if(err) reject(err);
						else if(post!=null){
                resolve({
                    data: post,
                    error: null
                });
						}else{
							resolve({
								data: null,
								error: {
									code: 1,
									message: "No existe este post."
								}
							});
						}
					});
				});
			}
		},
        getUsersLikes: {
      type: new GraphQLList(userType),
      args: {
        postID: { type: GraphQLString }
      },
      resolve: function(_,args){
        return new Promise((resolve,reject) => {
          Post.findById(args.postID, function(err, post){
            if(err) reject(err);
            else{
              if(post!=null){
                User.find({
                  '_id': { $in: post.likes }
                  }, function(err, docs){
                       console.log(docs);
                       resolve(docs);
                  });
              }
            }

          });

      });
    }
    },
        searchPost: {
            type: new GraphQLObjectType({
				name: 'searchPostResult',
				fields: {
					data: { type: new GraphQLList(postType) },
					error: { type: errorType }
				}
			}),
            description: 'Buscar un post ya existente',
            args: {
                searchparams: {type: GraphQLString},
                type: {type: GraphQLString}
            },
            resolve: function(_, {searchparams}){
                console.log(searchparams);
                return new Promise((resolve, reject) => {
                    Post.find( { $or: [ { title: { $regex: ".*"+searchparams+".*", $options: 'i' } }, { content: { $regex: ".*"+searchparams+".*", $options: 'i' }  } ] }
                    ,function(err, post){
                        if(err) reject(err);
						else if(post!=null){
                            //if(post.author == args.password){
                            console.log(post);
                            resolve({
                                data: post,
                                error: null
                            });
							//}else{
								//resolve({
									//postMessage: null,
									//error: {
										//code: 2,
										//message: "La contraseña no es correcta."
									//}
								//});
							//}

						}else{
							resolve({
								data: null,
								error: {
									code: 1,
									message: "No se encuentra ningún post con esa búsqueda."
								}
							});
						}

                    });
                });
            }
        },
        /**CANALES**/
		allChannels: { //Esto sería más bien para la página de Explorar canales (que muestra todos)
      type: new GraphQLObjectType({
        name: 'allChannelsResult',
        fields: {
          data: { type: new GraphQLList(channelType) },
          error: { type: errorType }
        }
      }),
        args: {
          userSusc: { type: GraphQLString }
        },
			resolve: function(_,args) {
				return new Promise((resolve, reject) => {
          if(args.userSusc == ""){ //Se piden todos los canales de la app
            Channel.find(function(err, channel){
              if(err) reject(err);
              else if(channel!=null){
                resolve({
                    data: channel,
                    error: null
                });
              }else{
                resolve({
                  data: null,
                  error: {
                    code: 1,
                    message: "No hay ningún canal creado."
                  }
                });
            }
  					});
          }else{
            User.findById(args.userSusc, function(err, user){
              var arrayIDs = [];
              for(var i in user.channels){
                arrayIDs.push(user.channels[i].channel_id);
              }
              Channel.find({
                '_id': { $in: arrayIDs }
              },function(err,channels){
                if(err)reject(err);
                else{
                  resolve({
                    data: channels,
                    error: null
                  });
                }
              });
            });
          }

				});
			}
		},
		oneChannel: {
			type: new GraphQLObjectType({
              name: 'oneChannelResult',
              fields: {
                data: { type: channelType },
                error: { type: errorType }
              }
          }),
          args: {
              channelID: { type: GraphQLString }
          },
          resolve: function(_, {channelID}) {
              return new Promise((resolve,reject) => {
                if (channelID.match(/^[0-9a-fA-F]{24}$/)) {
                  // Yes, it's a valid ObjectId, proceed with `findById` call.
                  Channel.findById(channelID, function(err, channel) {
                      if (err) reject(err);
                      else if(channel != null) {
                          resolve({
                              data: channel,
                              error: null
                          });
                      }else{
                          resolve({
                              data: null,
                              error: {
                                  code: 2,
                                  message: 'No se ha encontrado un canal con esa ID'
                              }
                          });
                      }
                  });
                }else{
                  //No es una ID válida para hacer la llamada a la bd
                  resolve({
                      data: null,
                      error: {
                          code: 1,
                          message: 'No es una ID válida'
                      }
                  });
                }
              });
            }
        },
        //searchChannel: {},
        /**EVENTOS**/
		allEvents: {
			type: new GraphQLObjectType({
                name: 'allEventsResult',
                fields: {
                    data: { type: new GraphQLList(eventType) },
                    error: { type: errorType }
                }
            }),
            args: {
                month: { type: GraphQLInt },
                year: { type: GraphQLInt }
            },
			resolve: function(_, args) {
				return new Promise((resolve, reject) => {
					Event.find(function(err, res) {
						if(err) reject(err);
						else{
                var events = [];
                //Guardar solo los eventos que sean del mes y año que se pasarle
                console.log(res);
                for(var i in res) {
                    var date = new Date(res[i].start_time);
                    console.log(date);
                    if(date.getMonth() == args.month && date.getFullYear() == args.year){
                        events.push(res[i]);
                    }
                }
                //Faltaría ordenar por días
                resolve({
                    data: events,
                    error: null
                });
            }
					});
				});
			}
		},
		oneEvent: {
			type: new GraphQLObjectType({
                name: 'oneEventResult',
                fields: {
                    data: { type: eventType },
                    error: { type: errorType }
                }
            }),
			args: {
				eventID: { type: GraphQLString }
			},
			resolve: function(_, { eventID }) {
				return new Promise((resolve, reject) => {

					Event.findById(eventID, function(err, event){
						if(err) reject(err);
						else{
                resolve({
                    data: event,
                    error: null
                });
            }
					});
				});
			}
		},
        /**ADMINISTRACION**/
        usersReported: {
            type: new GraphQLObjectType({
                name: 'usersReportedResult',
                fields: {
                    data: { type: new GraphQLList(userType) },
                    error: { type: errorType }
                }
            }),
            args: {
                userID: { type: GraphQLString }
            },
            resolve: function( _, {userID} ) {
                return new Promise((resolve,reject) => {
                    User.findOne({ _id: userID}, function(err, user) {
                        if (err) reject(err);
                        else{
                            resolve({
                                data: user,
                                error: null
                            });
                        }
                    });
                }); //Fin Promise

            } //Fin resolve
        }
    }
});

//module.exports = queryType;
export default queryType;
