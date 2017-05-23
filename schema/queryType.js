var express = require('express');
var mongoose = require('mongoose');
var graphqlHTTP = require('express-graphql');
var graphql = require('graphql');
var bodyParser = require('body-parser');
var cors = require('cors');
var formidable = require('formidable');
var cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: 'tfg-lgbt-cloud',
    api_key: '479641643612759',
    api_secret: 'VAv1oL4JL36U8Fwe9Edix4wj4as'
});
var jwt = require('jwt-simple');
var moment = require('moment');
var middleware = require('./../middleware');
var config = require('./../config');

//Models
var User = require('./../models/userModel');
var Post = require('./../models/postModel');
var Channel = require('./../models/channelModel');
var Event = require('./../models/eventModel');
var Comment = require('./../models/commentModel');
var Activity = require('./../models/activityModel');

//Custom types
var userType = require('./../types/userType');
var channelType = require('./../types/channelType');
var commentType = require('./../types/commentType');
var eventType = require('./../types/eventType');
var postType = require('./../types/postType');
var errorType = require('./../types/errorType');
var activityType = require('./../types/activityType');

var statusType = new graphql.GraphQLObjectType({
	name: 'statusType',
	description: 'Status of the relationship',
	fields: {
		incoming: {type: graphql.GraphQLString},
		outgoing: { type: graphql.GraphQLString }
	}
});


/** QUERIES **/
var queryType = new graphql.GraphQLObjectType({
    name: 'Query',
    fields: {
        /**USUARIOS**/
        user: {
            type: userType,
            //args son los argumentos que acepta la query User
            args: {
                userID: { type: graphql.GraphQLString }
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
			type: new graphql.GraphQLObjectType({
				name: 'getrelationshipResult',
				fields: {
					status: { type: statusType },
					error: { type: errorType }
				}
			}),
			args: {
				originID: { type: graphql.GraphQLString },
				targetID: { type: graphql.GraphQLString },
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

							for(i in user.relationships){
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
          type: new graphql.GraphQLList(activityType),
          description: 'Cargar la actividad de mis seguidos.',
          args: {
            userID: { type: graphql.GraphQLString } //Mi id
          },
          resolve: function(_,args) {
            //Buscar mi usuario en la bd
            return new Promise((resolve,reject) => {
              User.findById(args.userID, function(err, me){
                if(err) reject(err);
                else{
                  //Buscar a mis seguidos y obtener su actividad reciente
                  var follows = [];
                  for(i in me.relationships) {
                    if(me.relationships[i].outgoing_status == "follows"){
                      follows.push(me.relationships[i]);
                    }
                  }//Fin for

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
            type: new graphql.GraphQLObjectType({
				name: 'allPostsResult',
				fields: {
					data: { type: new graphql.GraphQLList(postType) },
					error: { type: errorType }
				}
			}),
            resolve: function(_){
                return new Promise((resolve,reject) => {
                    Post.find(function(err, post){
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
                    });
                });
            }
        },
		onePost: {
			type: new graphql.GraphQLObjectType({
				name: 'onePostResult',
				fields: {
					data: { type: postType },
					error: { type: errorType }
				}
			}),
			args: {
				postID: { type: graphql.GraphQLString }
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
      type: new graphql.GraphQLList(userType),
      args: {
        postID: { type: graphql.GraphQLString }
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
            type: new graphql.GraphQLObjectType({
				name: 'searchPostResult',
				fields: {
					data: { type: new graphql.GraphQLList(postType) },
					error: { type: errorType }
				}
			}),
            description: 'Buscar un post ya existente',
            args: {
                searchparams: {type: graphql.GraphQLString},
                type: {type: graphql.GraphQLString}
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
      type: new graphql.GraphQLObjectType({
        name: 'allChannelsResult',
        fields: {
          data: { type: new graphql.GraphQLList(channelType) },
          error: { type: errorType }
        }
      }),
        args: {
          userSusc: { type: graphql.GraphQLString }
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
			type: new graphql.GraphQLObjectType({
                name: 'oneChannelResult',
                fields: {
                  data: { type: channelType },
                  error: { type: errorType }
                }
            }),
            args: {
                channelID: { type: graphql.GraphQLString }
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
		allEvents: { //En el futuro esto va por meses
			type: new graphql.GraphQLObjectType({
                name: 'allEventsResult',
                fields: {
                    data: { type: new graphql.GraphQLList(eventType) },
                    error: { type: errorType }
                }
            }),
            args: {
                month: { type: graphql.GraphQLInt },
                year: { type: graphql.GraphQLInt }
            },
			resolve: function(_, args) {
				return new Promise((resolve, reject) => {
					Event.find(function(err, res) {
						if(err) reject(err);
						else{
                var events = [];
                //Guardar solo los eventos que sean del mes y año que se pasarle
                console.log(res);
                for(i in res) {
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
			type: new graphql.GraphQLObjectType({
                name: 'oneEventResult',
                fields: {
                    data: { type: new graphql.GraphQLList(eventType) },
                    error: { type: errorType }
                }
            }),
			args: {
				eventID: { type: graphql.GraphQLString }
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
		}
    }
});

module.exports = queryType;
