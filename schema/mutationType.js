import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLBoolean,
  GraphQLInt,
} from 'graphql';

//Models
var User = require('./../models/userModel');
var Post = require('./../models/postModel');
var Channel = require('./../models/channelModel');
var Event = require('./../models/eventModel');
var Comment = require('./../models/commentModel');
var Activity = require('./../models/activityModel');
var Request = require('./../models/requestModel');

//Custom types
import userType from './../types/userType';
import channelType from './../types/channelType';
import commentType from './../types/commentType';
import eventType from './../types/eventType';
import postType from './../types/postType';
import errorType from './../types/errorType';
import activityType from './../types/activityType';
import messageType from './../types/messageType';

//Definir mutation type
const mutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({

    loginUser: {
      type: new GraphQLObjectType({
        name: 'loginUserResult',
        fields: {
          user: {
            type: userType
          },
          error: {
            type: errorType
          }
        }
      }),
      description: 'Loguear usuario',
      args: {
        username: {
          type: new GraphQLNonNull(GraphQLString)
        },
        password: {
          type: new GraphQLNonNull(GraphQLString)
        }
      },
      resolve: function(_, args) {
        return new Promise((resolve, reject) => {
          //Comprobar que existe el nombre de usuario o email en la bd
          User.findOne({
            $or: [{
                'username': args.username
              },
              {
                'email': args.username
              }
            ]
          }, function(err, user) {
            if (err) reject(err);
            else if (user != null) {
              //Comprobar que la contraseña coincide con la que es
              if (user.pswd == args.password) {
                resolve({
                  user: user,
                  error: null
                });
              } else {
                resolve({
                  user: null,
                  error: {
                    code: 2,
                    message: "La contraseña no es correcta."
                  }
                });
              }

            } else {
              resolve({
                user: null,
                error: {
                  code: 1,
                  message: "No existe un usuario con ese nombre o correo."
                }
              });
            }
          });
        });
      }
    },

    createUser: {
      type: new GraphQLObjectType({
        name: 'createUserResult',
        fields: {
          user: {
            type: userType
          },
          error: {
            type: errorType
          }
        }
      }),
      description: 'Crear un nuevo usuario',
      args: {
        username: {
          type: GraphQLString
        },
        email: {
          type: GraphQLString
        },
        pswd: {
          type: GraphQLString
        }
      },
      resolve: function(_, args) {
        return new Promise((resolve, reject) => {

          User.findOne({
            username: args.username
          }, function(err, user) {
            if (err) reject(err);
            else if (user != null) { //Nombre de usuario ya utilizado
              console.log("Nombre de usuario ya utilizado.");
              resolve({
                user: null,
                error: {
                  code: 1,
                  message: "Nombre de usuario en uso."
                }
              });
            } else {

              User.findOne({
                email: args.email
              }, function(err, user) {
                if (err) reject(err);
                else if (user != null) { //Correo ya en uso
                  resolve({
                    user: null,
                    error: {
                      code: 2,
                      message: "Correo electrónico ya en uso."
                    }
                  });
                } else {
                  User.create({
                    username: args.username,
                    name: args.username,
                    email: args.email,
                    pswd: args.pswd,
                    public: true,
                    role: "user",
                    confirm: false
                  }, function(err, res) {
                    if (err) reject(err);
                    else {
                      console.log(res);
                      resolve({
                        user: res,
                        error: null
                      });
                    }

                  });
                }
              });
            }
          });
        });
      }
    },

    confirmAccount: {
      type: new GraphQLObjectType({
        name: 'confirmAccountResult',
        fields: {
          data: { type: userType },
          error: { type: errorType}
        }
      }),
      description: 'Confirmar correo de la cuenta.',
      args: {
        userID: { type: GraphQLString }
      },
      resolve: function(_,args) {
        //Cambiar campo 'confirm' en el usuario a true
        return new Promise((resolve, reject) => {
          User.findById(args.userID, function(err, user){
            if(err) reject(err);
            else{
              user.confirm = true;
              user.save(function(err){
                if(err) reject(err);
                else{
                  resolve({
                    data: user,
                    error: null
                  });
                }
              });
            }
          });
        });
      }
    },

    editUser: {
      type: userType,
      description: 'Editar datos de un usuario existente',
      args: {
        userID: {
          type: GraphQLString
        },
        username: {
          type: GraphQLString
        },
        name: {
          type: GraphQLString
        },
        email: {
          type: GraphQLString
        },
      },
      resolve: function(_, args) {

        //Primero buscar al usuario a partir de la id
        //Luego actualizar datos
        /*
        var query = { name: 'borne' };
        Model.update(query, { name: 'jason borne' }, options, callback)

        // is sent as

        Model.update(query, { $set: { name: 'jason borne' }}, options, callback)

        */
      }
    },
    /** Modificar la relación entre dos usuarios **/
    relationship: {
      type: new GraphQLObjectType({
        name: 'relationshipResult',
        fields: {
          status: {
            type: GraphQLString
          },
          error: {
            type: errorType
          }
        }
      }),
      description: 'Modificar la relación con un usuario',
      args: {
        originID: {
          type: GraphQLString
        },
        targetID: {
          type: GraphQLString
        },
        action: {
          type: GraphQLString
        } //valores: follow || request || unfollow || approve || ignore
      },
      resolve: function(_, args) {

        return new Promise((resolve, reject) => {

          User.find({
            _id: {
              $in: [args.originID, args.targetID]
            },
            'relationships.id': {
              $in: [args.originID, args.targetID]
            }
          }, function(err, res) { //obtiene los dos usuarios

            console.log(res);

            //Según qué acción sea
            var outgoing_status = "";
            var incoming_status = "";
            var outgoing_status2 = "";
            var incoming_status2 = "";

            if (args.action == "follow") {
              outgoing_status = "follows";
              incoming_status2 = "followed-by";
            } else if(args.action == "request"){
              outgoing_status = "requested";
              incoming_status2 = "requested-by";
            } else if (args.action == "unfollow") {
              outgoing_status = "none";
              incoming_status2 = "none";
            } else if (args.action == "approve") {
              incoming_status = "followed-by";
              outgoing_status2 = "follows";
            } else if (args.action == "ignore") {
              incoming_status = "none";
              outgoing_status = "none";
            }

            if (res.length == 0) { //No existe esa relación entre los usuarios

              User.find({
                  _id: {
                    $in: [args.originID, args.targetID]
                  }
                }, //Busca a los dos usuarios origin y target (NO LOS DEVUELVE EN ORDEN JODER)
                function(err, users) {
                  if (err) reject(err);
                  else {
                    console.log(users);
                    var user1 = {};
                    var user2 = {};

                    if (users[0]._id == args.targetID) {
                      user1 = users[1];
                      user2 = users[0];
                    } else {
                      user1 = users[0];
                      user2 = users[1];
                    }
                    //ORIGIN
                    //Comprobar si el user2 es privado
                    var aux = "follows";
                    if(user2.public == false)
                      aux = "requested";

                    user1.relationships.push({
                      id: args.targetID,
                      outgoing_status: aux,
                      incoming_status: "none"
                    });

                    user1.save(function(err) {
                      if (!err) {
                        //TARGET
                        var aux2 = "followed-by";
                        if(aux == "requested")
                          aux2 = "requested-by";

                        user2.relationships.push({
                          id: args.originID,
                          outgoing_status: "none",
                          incoming_status: aux2
                        });

                        user2.save(function(err) {
                          if (!err) {
                            //Registrar actividad
                            Activity.create({
                              origin_id: args.originID,
                              target_id: args.targetID,
                              action: " ha seguido a ",
                              created_time: new Date()
                            },function(err,act){
                              if(err) reject(err);
                              else{
                                resolve({
                                  status: "Following",
                                  error: null
                                });
                              }
                            });
                          } else reject(err);
                        });
                      } else reject(err);

                    });
                  }
                });

            } else {
              //Ya existe la relación, solo hay que actualizarla
              console.log("Existe la relación!!!!");
              console.log(res);

              var user1 = {};
              var user2 = {};

              if (res[0]._id == args.originID) {
                user1 = res[0];
                user2 = res[1];
              } else {
                user1 = res[1];
                user2 = res[0];
              }

              //Buscar el doc en el usuario origin
              for (i in user1.relationships) {

                if (user1.relationships[i].id == args.targetID) {
                  if (outgoing_status != '')
                    user1.relationships[i].outgoing_status = outgoing_status;
                  if (incoming_status != '')
                    user1.relationships[i].incoming_status = incoming_status;
                }
              }

              user1.save(function(err) {
                if (err) reject(err);
                else {
                  //Buscar el doc en el usuario target
                  for (j in user2.relationships) {

                    if (user2.relationships[j].id == args.originID) {
                      if (outgoing_status2 != '')
                        user2.relationships[j].outgoing_status = outgoing_status2;
                      if (incoming_status2 != '')
                        user2.relationships[j].incoming_status = incoming_status2;
                    }
                  }

                  user2.save(function(err) {
                    if (err) reject(err);
                    else {
                      resolve({
                        status: "Relación modificada correctamente.",
                        error: null
                      });
                    }
                  });
                }
              });
            } //Fin else res==null
          });
        });
      }
    },

    editRequest: {
      type: new GraphQLObjectType({
        name: 'editRequestResult',
        fields: {
          data: {
            type: userType
          },
          error: {
            type: errorType
          }
        }
      }),
      description: 'Enviar solicitud para ser editor.',
      args: {
        userID: { type: GraphQLString },
        email: { type: GraphQLString },
        reason: { type: GraphQLString }
      },
      resolve: function(_,args) {
        return new Promise((resolve,reject) => {
          User.findById(args.userID, function(err,user){
            if(err) reject(err);
            else{
              if(user.role != 'editor'){
                Request.create({
                  userID: args.userID,
                  email: args.email,
                  reason: reason
                }, function(err,res){
                  if(err) reject(err);
                  else{
                    resolve({
                      data: user,
                      error: null
                    });
                  }
                });
              }
            }
          });
        });
      }
    },

    /**POSTS**/

    createPost: {
      type: new GraphQLObjectType({
        name: 'createPostResult',
        fields: {
          data: {
            type: postType
          },
          error: {
            type: errorType
          }
        }
      }),
      description: 'Crear un nuevo post',
      args: {
        title: {
            type: GraphQLString
        },
        content: {
            type: GraphQLString
        },
        tags: {
          type: new GraphQLList(GraphQLString)
        },
        image: {
          type: GraphQLString
        },
        state: {
          type: GraphQLString
        },
        author_id: {
            type: GraphQLString
        },
      },
      resolve: function(root, args) {
        return new Promise((resolve, reject) => {
          Post.create({
              title: args.title,
              content: args.content,
              tags: args.tags,
              image: args.image,
              state: args.state,
              author_id: args.author_id
          }, function(err, post) {
              if (err) reject(err);
              else if (post != null) {
                resolve({
                  data: post,
                  error: null
                });
              } else {
                resolve({
                  data: null,
                  error: {
                    code: 1,
                    message: "No se ha podido crear el post."
                  }
                });
              }
          });
        });
      }
    },

    updatePost: {
      type: new GraphQLObjectType({
        name: 'updatePostResult',
        fields: {
          data: {
            type: postType
          },
          error: {
            type: errorType
          }
        }
      }),
      description: 'Editar un post ya existente',
      args: {
        postID: {
          type: GraphQLString
        },
        title: {
          type: GraphQLString
        },
        content: {
          type: GraphQLString
        },
        tags: {
          type: new GraphQLList(GraphQLString)
        },
        image: {
          type: GraphQLString
        },
        state: {
          type: GraphQLString
        }
      },
      resolve: function(root, args) {
        console.log(args.state);
        return new Promise((resolve, reject) => {
          Post.findOneAndUpdate({
              _id: args.postID
            }, //"58e7ca08a364171f3c3fe58d"},
            {
              $set: {
                title: args.title,
                content: args.content,
                tags: args.tags,
                image: args.image,
                state: args.state
              }
            }, {
              new: true
            },
            function(err, post) {
              if (err) reject(err);
              else if (post != null) {
                resolve({
                  data: post,
                  error: null
                });

              } else {
                resolve({
                  data: null,
                  error: {
                    code: 1,
                    message: "No existe el post que deseas modificar."
                  }
                });
              }
            });
        });
      }
    },

    deletePost: {
      type: postType,
      description: 'Eliminar un post ya existente',
      args: {
        postID: {
          type: GraphQLString
        }
      },
      resolve: function(root, args) {
        return new Promise((resolve, reject) => {
          Post.findOneAndDelete({
            _id: args.postID
          }, function(err, res) {
            if (err) reject(err);
            else {
              resolve(res);
            }
          });
        });
      }
    },

    commentPost: {
      type: new GraphQLObjectType({
        name: 'commentPostResult',
        fields: {
          data: {
            type: commentType
          },
          error: {
            type: errorType
          }
        }
      }),
      description: 'Enviar un comentario en un post.',
      args: {
        userID: {
          type: GraphQLString
        },
        postID: {
          type: GraphQLString
        },
        content: {
          type: GraphQLString
        }
      },
      resolve: function(root,args) {
        return new Promise((resolve, reject) => {
          //Igual antes habría que comprobar si existe ese post o evento
          var date = new Date();
          Comment.create({
            target_id: args.postID,
            content: args.content,
            author: args.userID,
            created_time: date,
          }, function(err, res) {
            if (err) reject(err);
            else {
              //Registrar actividad
              Activity.create({
                origin_id: args.userID,
                target_id: args.postID,
                action: " ha comentado en ",
                created_time: date
              }, function(err,activity){
                if(err) reject(err);
                else{
                  resolve({
                    data: res,
                    error: null
                  });
                }
              });

            }
          });
        });
      }
    },

    likePost: {
      type: new GraphQLObjectType({
        name: 'likePostResult',
        fields: {
          data: {
            type: GraphQLInt
          },
          error: {
            type: errorType
          }
        }
      }),
      description: 'Dar o quitar like de un post',
      args: {
        userID: { type: GraphQLString },
        postID: { type: GraphQLString }
      },
      resolve: function(_,args) {
        return new Promise((resolve, reject) => {
        //Buscar post
        Post.findById(args.postID, function(err,post){
          if(err) reject(err);
          else{
            //Buscar si está el usuario entre los likes del post o no
            var index = post.likes.indexOf(args.userID);
            var action = "";
            if(index==-1){
              post.likes.push(args.userID);
              action = " ha dado me gusta a ";
            }else{
              //Borrar del array la id del usuario
              post.likes.splice(index,1);
            }

            post.save(function(err){
              //Registrar actividad
              /*Activity.create({ //Si se quita el like no registrar la actividad (borrarla tb???)
                origin_id: args.userID,
                target_id: args.postID,
                action: " ha dado me gusta a ",
                created_time: new Date()
              },function(err,res){

              });*/
              if(err) reject(err);
              else {
                  resolve({
                    data: post.likes.length,
                    error: null
                  });
              }
            });
          }
        });
      });
      }
    },

    /**CANALES**/

    createChannel: {
      type: new GraphQLObjectType({
        name: 'createChannelResult',
        fields: {
          data: {
            type: channelType
          },
          error: {
            type: errorType
          }
        }
      }),
      description: 'Crear un nuevo canal',
      args: {
        title: {
            type: GraphQLString
        },
        description: {
            type: GraphQLString
        },
        created_time: {
          type: GraphQLString
        },
        image: {
          type: GraphQLString
        },
        author_id: {
            type: GraphQLString
        },
      },
      resolve: function(root, args) {
        return new Promise((resolve, reject) => {
          Channel.create({
              title: args.title,
              description: args.description,
              created_time: new Date(),
              image: args.image,
              author_id: args.author_id
          }, function(err, channel) {
              if (err) reject(err);
              else if (channel != null) {
                resolve({
                  data: channel,
                  error: null
                });
              } else {
                resolve({
                  data: null,
                  error: {
                    code: 1,
                    message: "No se ha podido crear el canal."
                  }
                });
              }
          });
        });
      }
    },

    updateChannel: {
      type: new GraphQLObjectType({
        name: 'updateChannelResult',
        fields: {
          data: {
            type: channelType
          },
          error: {
            type: errorType
          }
        }
      }),
      description: 'Editar un canal ya existente',
      args: {
        channelID: {
          type: GraphQLString
        },
        title: {
          type: GraphQLString
        },
        description: {
          type: GraphQLString
        },
        image: {
          type: GraphQLString
        }
      },
      resolve: function(root, args) {
        //console.log(args.state);
        return new Promise((resolve, reject) => {
          Post.findOneAndUpdate({
              _id: args.channelID
            }, //"58e7ca08a364171f3c3fe58d"},
            {
              $set: {
                title: args.title,
                description: args.description,
                image: args.image
              }
            }, {
              new: true
            },
            function(err, channel) {
              if (err) reject(err);
              else if (channel != null) {
                resolve({
                  data: channel,
                  error: null
                });

              } else {
                resolve({
                  data: null,
                  error: {
                    code: 1,
                    message: "No existe el canal que deseas modificar."
                  }
                });
              }
            });
        });
      }
    },

    deleteChannel: {
      type: channelType,
      description: 'Eliminar un canal ya existente',
      args: {
        channelID: {
          type: GraphQLString
        }
      },
      resolve: function(root, args) {
        return new Promise((resolve, reject) => {
          Channel.findOneAndDelete({
            _id: args.channelID
          }, function(err, res) {
            if (err) reject(err);
            else {
              resolve(res);
            }
          });
        });
      }
    },

    sendMessage: {
       type: new GraphQLObjectType({
        name: 'sendMessageResult',
        fields: {
          data: {
            type: messageType
          },
          error: {
            type: errorType
          }
        }
      }),
      description: 'Enviar un mensaje a un canal',
      args: {
        channelID: {
          type: GraphQLString
        },
        content:{
           type: GraphQLString
        }
      },
      resolve: function(root, args) {
        console.log(args.state);
        return new Promise((resolve, reject) => {
          //Buscar canal
          Channel.findById(args.channelID, function(err,channel){
            if(err) reject(err);
            else if(channel!=null){
              channel.messages.push({
                content: args.content,
                created_time: new Date(),
                channel: args.channelID
              });

              channel.save(function(err){
                if(err) reject(err);
                else{
                  resolve({
                    data: {
                        content: args.content,
                        created_time: new Date(),
                        channel: args.channelID
                    },
                    error: null
                  });
                }
              });
            }else {
                resolve({
                  data: null,
                  error: {
                    code: 1,
                    message: "No se ha podido enviar el mensaje."
                  }
                });
            }
          });
        });
      }
    },

    suscribeChannel: {
      type: userType,
      description: 'Suscribirte o desuscribirte de un canal.',
      args: {
        userID: { type: GraphQLString },
        channelID: { type: GraphQLString }
      },
      resolve: function(_,args){
        return new Promise((resolve, reject) => {
          User.find({
            _id: args.userID,
            'channels.channel_id': args.channelID
          }, function(err, res) {
            if(err) reject(err);
            else{
              if(res.length == 0){
                //No está suscrito al canal
                User.findById(args.userID, function(err, user){
                  user.channels.push({
                    channel_id: args.channelID,
                    notifications: true
                  });

                  user.save(function(err){
                    if(err) reject(err);
                    else{
                      //Añadir la ID al array de suscriptores del canal
                      Channel.findOneAndUpdate({
                        _id: args.channelID
                        }, { $push: { susc: args.userID } }, {
                        new: true
                        }, function(err, result){
                          if(err) reject(err);
                          else resolve(user);
                      });
                    }
                  });
                });
              }else{ //Si está suscrito
                //Buscar el canal que es
                for(i in res[0].channels){
                  if(res[0].channels[i].channel_id == args.channelID){
                    res[0].channels.splice(i, 1);
                    res[0].save(function(err){
                      if(err) reject(err);
                      Channel.findOneAndUpdate(
                        { _id: args.channelID },
                        { $pull: { susc: args.userID } },
                      function(err){
                        if(err) reject(err);
                        resolve(res[0]);
                      });
                    });
                  }
                } //Fin del for
              }
            }
          });
        });
      }
    },

    notifChannel: {
      type: userType,
      description: 'Activar/desactivar notificaciones de un canal',
      args: {
        userID: { type: GraphQLString },
        channelID: { type: GraphQLString }
      },
      resolve: function(_,args) {
        return new Promise((resolve, reject) => {
          User.findOne({
            _id: args.userID,
            'channels.channel_id': args.channelID
          },function(err, res){
            if(err) reject(err);
            for(i in res.channels){
              if(res.channels[i].channel_id == args.channelID){
                res.channels[i].notifications = (!res.channels[i].notifications);
                resolve(res);
              }
            }
          });
        });
      }
    },

    /**EVENTOS**/

    assistEvent: {
      type: eventType,
      description: 'Asistir (o dejar de asistir) a un evento',
      args: {
        userID: { type: GraphQLString },
        eventID: { type: GraphQLString }
      },
      resolve: function(_,args) {
        return new Promise((resolve, reject) => {
          //Buscar evento
          Event.findById(args.eventID, function(err,ev){
            if(err) reject(err);
            else{
              var index = ev.assistants.indexOf(args.userID);
              if(index==-1){
                ev.assistants.push(args.userID);
                //Hay que quitarlo de interesados
                var index2 = ev.interested.indexOf(args.userID);
                if(index2 != -1)
                  ev.interested.splice(index2,1);
              }else{
                ev.assistants.splice(index,1);
              }

              //Guardar evento
              ev.save(function(err){
                if(err) reject(err);
                else{
                  //Registrar actividad

                  resolve(ev);
                }
              });
            }//Fin else
          });
        });
      }
    },

    interestEvent: {
      type: eventType,
      description: 'Marcar si te interesa o no un evento.',
      args: {
        userID: { type: GraphQLString },
        eventID: { type: GraphQLString }
      },
      resolve: function(_,args) {
        return new Promise((resolve, reject) => {
          //Buscar evento
          Event.findById(args.eventID, function(err,ev){
            if(err) reject(err);
            else{
              var index = ev.interested.indexOf(args.userID);
              if(index == -1){
                ev.interested.push(args.userID);
                //Hay que quitarlo de asistentes si está
                var index2 = ev.assistants.indexOf(args.userID);
                if(index2 != -1)
                  ev.assistants.splice(index2,1);
              }else
                ev.interested.splice(index,1);

              ev.save(function(err){
                if(err) reject(err);
                else{
                  //Registrar actividad

                  resolve(ev);
                }
              });
            }
          });
        });
      }
    },

    report: {
      description: 'Reportar usuario, comentario o canal.',
      type: new GraphQLObjectType({
        name: 'reportResult',
        fields: {
          data: { type: GraphQLBoolean },
          error: { type: errorType }
        }
      }),
      args: {
        originID: { type: GraphQLString },
        targetID: { type: GraphQLString },
        targetType: {
          type: GraphQLInt,
          description: 'Tipo de objeto que se está reportando. 1: Usuario, 2: Comentario, 3: Canal.' },
        reason: { type: GraphQLString }
      },
      resolve: function(_,args) {
        return new Promise((resolve, reject) => {
          if(args.targetType == 1){
            //Reportar usuario
            User.findById(args.targetID, function(err, user){
              if(err) reject(err);
              else{
                if(user == null){
                  resolve({
                    data: false,
                    error: {
                      code: 1,
                      message: 'No existe el usuario con ese identificador.'
                    }
                  });
                }else{
                  //Guardar el reporte con qué datos?? el motivo y el usuario que ha hecho el reporte?
                  user.reports.push(args.reason);

                  user.save(function(err){
                    if(err) reject(err);
                    else{
                      resolve({
                        data: true,
                        error: null
                      })
                    }
                  });
                }//Fin else
              }
            });
          }else if(args.targetType == 2){
            //Reportar comentario (en post o evento)
            Comment.findById(args.targetID, function(err, comm){
              if(err) reject(err);
              else if(comm == null){
                resolve({
                  data: false,
                  error: {
                    code: 2,
                    message: 'No existe el comentario a reportar.'
                  }
                });
              }else{
                comm.reports.push(args.reason);
                comm.save(function(err){
                  if(err) reject(err);
                  else{
                    resolve({
                      data: true,
                      error: null
                    });
                  }
                });
              }
            });
          }else if(args.targetType == 3){
            //Reportar canal
            Channel.findById(args.targetID, function(err,chan){
              if(err) reject(err);
              else if(chan==null){
                resolve({
                  data: false,
                  error: {
                    code: 3,
                    message: 'No existe el canal a reportar.'
                  }
                });
              }else{
                chan.reports.push(args.reason);
                chan.save(function(err){
                  if(err) reject(err);
                  else{
                    resolve({
                      data: true,
                      error: null
                    });
                  }
                });
              }
            });
          }
        }); //Fin Promise
      }//Fin resolve
    }
  })
});

export default mutationType;
