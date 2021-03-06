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
import requestType from './../types/requestType';

var FCM = require('fcm-push');

var serverKey = 'AIzaSyCthSLMQ7tsBAC_j2KbRK-ppy1YdIctRyg';
var fcm = new FCM(serverKey);

// create reusable transporter object using SMTP transport
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'lgbtcast.tfg@gmail.com', // Nuestro e-mail
        pass: 'ayc1994tfgua' // Nuestra contraseña
        // Para que funcione, iniciar sesión en google e ir a: https://www.google.com/settings/security/lesssecureapps
    }
});

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('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');

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
                if(!user.confirm){ //Si no está confirmao no puede hacer login
                  resolve({
                    user: null,
                    error:  {
                      code: 3,
                      message: 'Debes confirmar tu correo para poder iniciar sesión'
                    }
                  });
                }
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

    loginFBGg: {
      type: new GraphQLObjectType({
        name: 'loginFBGgResult',
        fields: {
          user: { type: userType },
          error: { type: errorType }
        }
      }),
      description: 'Iniciar sesión o registrar usuario con Facebook o Google.',
      args: {
          email: { type: GraphQLString },
          name: { type: GraphQLString }
      },
      resolve: function(_,args) {
        return new Promise((resolve,reject) => {
          User.findOne({'email': args.email}, function(err, user) {
            if(err) reject(err);
            else{
              if(user==null){
                //Registrar usuario
                var password = Math.random().toString(36).slice(-8);
                var parts = args.name.split(" ");
                var username = parts[0]+"_"+parts[1];
                User.create({
                  username: username,
                  name: args.name,
                  email: args.email,
                  pswd: password,
                  image: 'http://res.cloudinary.com/tfg-lgbt-cloud/image/upload/v1502812240/users/default-user_fss0lr.png',
                  public: true,
                  role: "user",
                  confirm: false
                }, function(err, res) {
                  resolve({
                    user: res,
                    error: null
                  })
                });

              }else{
                //Loguear
                resolve({
                  user: user,
                  error: null
                });
              }
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
                    image: "http://res.cloudinary.com/tfg-lgbt-cloud/image/upload/v1502812240/users/default-user_fss0lr.png",
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
      type: new GraphQLObjectType({
        name: 'editUserResult',
        fields: {
          data: { type: userType },
          error: { type: errorType }
        }
      }),
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
        bio: {
          type: GraphQLString
        },
        gender: {
          type: GraphQLString
        },
        image: {
          type: GraphQLString
        }
      },
      resolve: function(_, args) {

        return new Promise((resolve, reject) => {

          //Si quiere cambiar el username se debe comprobar primero que este no está ya registrado en la bd
          User.findOne({username: args.username}, function(err, res){
            if(res==null || args.userID == res._id){ //No existe ese nombre de usuario en la bd o ha dejado el mismo nombre de usuario
              User.findOneAndUpdate({
                  _id: args.userID
                },
                {
                  $set: {
                    username: args.username,
                    name: args.name,
                    bio: args.bio,
                    gender: args.gender,
                    image: args.image
                  }
                }, {
                  new: true
                },
                function(err, user) {
                  if (err) reject(err);
                  else if (user != null) {
                    resolve({
                      data: user,
                      error: null
                    });

                  } else {
                    resolve({
                      data: null,
                      error: {
                        code: 2,
                        message: "No se han podido actualizar los datos del usuario."
                      }
                    });
                  }
                });
            }else{
              resolve({
                data: null,
                error: {
                  code: 1,
                  message: "Ese nombre de usuario está ya en uso."
                }
              });
            }
          }); //Fin findOne
        });//Fin Promise
      }
    },
    /** Modificar privacidad de un usuario */
    privacity: {
      type: new GraphQLObjectType({
        name: 'privacityResult',
        fields: {
          data: { type: GraphQLBoolean },
          error: { type: errorType }
        }
      }),
      description: 'Modificar la privacidad de un usuario.',
      args: {
        userID: { type: GraphQLString }
      },
      resolve: function(_,{ userID }) {
        return new Promise((resolve,reject) => {
          User.findById(userID, function(err, user){
            if(err) reject(err);
            user.public = !user.public;
            user.save(function(err, res){
              if(err) reject(err);
              resolve({
                data: res.public,
                error: null
              });
            });
          });
        });
      }
    },
    // Modificar contraseña de usuario
    changePswd: {
      type: new GraphQLObjectType({
        name: 'changePswdResult',
        fields: {
          data: { type: GraphQLString },
          error: { type: errorType }
        }
      }),
      description: 'Cambiar la contraseña de un usuario.',
      args: {
        userID: { type: GraphQLString },
        oldPswd: { type: GraphQLString },
        newPswd: { type: GraphQLString }
      },
      resolve: function(_, args) {
        return new Promise((resolve,reject) => {
          User.findById(args.userID, function(err, user) {
            if(err) reject(err);

            //Comprobar la vieja contraseña
            console.log("Contraseña del usuario consultado: " + user.pswd);
            console.log("Contraseña actual recibida por args: " + args.oldPswd);
            console.log("Contraseña nueva: "+ args.newPswd);
            if(user.pswd != args.oldPswd){
              resolve({
                data: null,
                error: {
                  code: 1,
                  message: 'Tu contraseña actual no coincide.'
                }
              });
            }else{
              user.pswd = args.newPswd;
              user.save(function(err,res){
                if(err) reject(err);
                resolve({
                  data: res.pswd,
                  error: null
                });
              });
            }   
          });
        });
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
                              created_time: new Date().toISOString(),
                              type: 3
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
              for (var i in user1.relationships) {

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
                  for (var j in user2.relationships) {

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
        name: { type: GraphQLString },
        org: { type: GraphQLString },
        reason: { type: GraphQLString }
      },
      resolve: function(_,args) {
        return new Promise((resolve,reject) => {

          User.findById(args.userID, function(err,user){
            if(err) reject(err);
            else{
              
                Request.create({
                  userID: args.userID,
                  name: args.name,
                  org: args.org,
                  email: args.email,
                  reason: args.reason,
                  state: 'pending'
                }, function(err,res){
                  if(err) reject(err);
                  else{
                    console.log(res);
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
    
    editRequestCMS: {
      type: new GraphQLObjectType({
        name: 'editRequestCMSResult',
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
        email: { type: GraphQLString },
        username: { type: GraphQLString },
        pswd: { type: GraphQLString },
        org: { type: GraphQLString },
        reason: { type: GraphQLString }
      },
      resolve: function(_,args) {
        return new Promise((resolve,reject) => {

          User.findOne({username: args.username}, function(err,user){
            if(err) reject(err);
            else if(user != null){
                if(user.pswd == args.pswd){
                    if(user.confirm == true){
                        Request.create({
                          userID: user.id,
                          username: args.username,
                          name: user.name,
                          image: user.image,
                          org: args.org,
                          email: args.email,
                          reason: args.reason,
                          state: 'pending'
                        }, function(err,res){
                          if(err) reject(err);
                          else{
                            console.log(res);
                            resolve({
                              data: user,
                              error: null
                            });
                          }
                        });
                    }
                    else{
                        resolve({
                            data: null,
                            error: {
                                code: 3,
                                message: "Aún no has validado tu cuenta."
                            }
                        });
                    }
                }
                else{
                    resolve({
                        data: null,
                        error: {
                            code: 2,
                            message: "Contraseña incorrecta."
                        }
                    });
                }
              
            }else{
                resolve({
                    data: null,
                    error: {
                        code: 1,
                        message: "No existe un usuario con ese nombre. Regístrate desde la App"
                    }
                });
            }
          });
        });
      }
    },  
      
    recoverPassword: {
        type: new GraphQLObjectType({
            name: 'recoverPasswordResult',
            fields: {
                data: {
                    type: userType
                },
                error: {
                    type: errorType
                }
            }
        }),
        description: 'Recuperar contraseña',
        args: {
            username: {
                type: new GraphQLNonNull(GraphQLString)
            }
        },
        resolve: function(_, args) {
            return new Promise((resolve, reject) => {
            //Comprobar que existe el nombre de usuario o email en la bd
            User.findOne({ 'email': args.username
            }, function(err, user) {
                if (err) reject(err);
                else if (user != null) {
                    var theuserbefore = JSON.parse(JSON.stringify(user));
                    var newPassword;
                    var sendedPassword;
                    crypto.randomBytes(4, function(err, buffer) {
                    if (err) res.send(err);
                        sendedPassword = buffer.toString('hex');
                        newPassword = sendedPassword;
                        newPassword= crypto.createHash('md5').update(newPassword).digest("hex");
                        user.pswd = newPassword;

                    // setup e-mail data with unicode symbols
                    var mailOptions = {
                        from: 'LGBTCast <lgbtcast.tfg@gmail.com>', // sender address
                        to: user.email, // list of receivers
                        subject: 'LGBTCast: Recuperar contraseña', // Subject line
                        //text: 'Tu contraseña recuperada es: '+newPassword, // plaintext body
                        html: '<link href="https://fonts.googleapis.com/css?family=Ubuntu" rel="stylesheet" type="text/css">' +
                        '<div style="font-family: Ubuntu, sans-serif; background-color: rgba(83, 35, 54, 0.08);">' +
                        '<div style="background-color: #4F2365; text-align: center"><img src="https://tfg-cms.herokuapp.com/app/assets/images/logocms.png" width="80px" style="margin-bottom: -10px"></div>' +
                        '<div style="padding: 8px;"><h1>Recuperaci&oacute;n de contrase&ntilde;a</h1>' +
                        '<p><br>Hola <strong>'+user.username+'</strong>!</p>' +
                        '<p>Parece ser que has olvidado la contrase&ntilde;a para iniciar sesi&oacute;n.<br>' +
                        'A continuaci&oacute;n se muestran tus nuevos datos de inicio:</p>' +
                        '<div style="border: 1px black solid; padding: 10px 18px; background-color: #e5e5ff"> <strong>Usuario:</strong> ' + user.username + '<br>' +
                        ' <strong>Contrase&ntilde;a:</strong> <span style="color: red">'+ sendedPassword+'</span></div>' +
                        '<p><br>Accede a tu cuenta <a href="https://tfg-cms.herokuapp.com/login">aqu&iacute;</a> con esta informaci&oacute;n y cambia la contrase&ntilde;a por una propia.</p>' +
                        '<h4>Un saludo,</h4>' +
                        '<h3><a href="https://tfg-cms.herokuapp.com/">LGBTCast</a></h3>' +
                        '</div></div>'// html body
                    }; console.log(mailOptions);
                    // send mail with defined transport object
                        sgMail.send(mailOptions);
                        user.save(function(err,user){
                            if(err) reject(err);
                            resolve({
                              data: user,
                              error: null
                            });
                        });
                });

                } else {
                    resolve({
                        data: null,
                        error: {
                            code: 1,
                            message: "No existe un usuario con ese email."
                        }
                    });
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
              author_id: args.author_id,
              created_time: new Date().toISOString()
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
          data: { type: postType },
          error: { type: errorType }
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
      resolve: function(_, args) {
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
          var date = new Date().toISOString();
          Comment.create({
            target_id: args.postID,
            content: args.content,
            author_id: args.userID,
            created_time: date,
          }, function(err, res) {
            if (err) reject(err);
            else {
              //Registrar actividad
              Activity.create({
                origin_id: args.userID,
                target_id: args.postID,
                action: " ha comentado en una ",
                created_time: date,
                type: 1
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
              if(err) reject(err);
              else {

                Activity.create({ //Si se quita el like no registrar la actividad (borrarla tb???)
                  origin_id: args.userID,
                  target_id: args.postID,
                  action: " ha dado me gusta a una ",
                  created_time: new Date().toISOString(),
                  type: 1
                },function(err,res){
                  if(err) reject(err);
                  resolve({
                    data: post.likes.length,
                    error: null
                  });
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
        image: {
          type: GraphQLString
        },
        author: {
            type: GraphQLString
        },
        state: {
            type: GraphQLString
        }
      },
      resolve: function(root, args) {
        return new Promise((resolve, reject) => {
          Channel.create({
              title: args.title,
              description: args.description,
              created_time: new Date().toISOString(),
              image: args.image,
              author: args.author,
              state: args.state
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
        },
        state: {
          type: GraphQLString
        }
      },
      resolve: function(root, args) {
        //console.log(args.state);
        return new Promise((resolve, reject) => {
          Channel.findOneAndUpdate({
              _id: args.channelID
            }, //"58e7ca08a364171f3c3fe58d"},
            {
              $set: {
                title: args.title,
                description: args.description,
                image: args.image,
                state: args.state
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
      type: new GraphQLObjectType({
            name: 'deleteChannelResult',
            fields: {
                data: {
                    type: channelType
                },
                error: {
                    type: errorType
                }
            }
        }),
      description: 'Eliminar un canal ya existente',
      args: {
        channelID: { type: GraphQLString },
        state: { type: GraphQLString }
      },
      resolve: function(root, args) {
        return new Promise((resolve, reject) => {
          Channel.findOneAndUpdate({
                    _id: args.channelID
                },
                {
                    $set: {
                        state: args.state
                    }
                }, {
                    new: true
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
                            error: "No existe el canal que deseas eliminar."
                        });
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
        console.log(args);
        return new Promise((resolve, reject) => {
          //Buscar canal
          Channel.findById(args.channelID, function(err,channel){
            if(err) reject(err);
            else if(channel!=null){
                console.log(channel);
              channel.messages.push({
                content: args.content,
                created_time: new Date().toISOString(),
                channel: args.channelID
              });

              channel.save(function(err){
                if(err) reject(err);
                
                //Enviar notificación
                var message = {
                  'to': '/topics/'+channel.id,
                  'notification': {
                    'title': channel.title,
                    'body': args.content,
                    'sound':"default", //If you want notification sound
                    'icon':'fcm_push_icon',
                    "click_action":"FCM_PLUGIN_ACTIVITY" },
                    "data":{
                      "channelID": channel.id,
                    }
                };

                fcm.send(message, function(err, response){
                  if(err){
                    console.log('Algo ha salido mal con la notificación.');
                    console.log(err);
                  }else{
                    console.log('Notificación enviada correctamente');
                    console.log(response);
                  }
                });

                resolve({
                  data: {
                    content: args.content,
                    created_time: new Date().toISOString(),
                    channel: args.channelID
                  },
                  error: null
                });
              
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

                          //registrar actividad de suscribirte a un canal
                          Activity.create({
                            origin_id: args.userID,
                            target_id: args.channelID,
                            action: " se ha suscrito a un ",
                            created_time: new Date().toISOString(),
                            type: 4
                          }, function(err,act){
                            if(err) reject(err);
                            resolve(user);
                          });
                          
                      });
                    }
                  });
                });
              }else{ //Si está suscrito
                //Buscar el canal que es
                for(var i in res[0].channels){
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
            for(var i in res.channels){
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

    createEvent: {
      type: new GraphQLObjectType({
        name: 'createEventResult',
        fields: {
          data: { type: eventType },
          error: { type: errorType }
        }
      }),
      description: 'Crear un evento.',
      args: {
        title: { type: GraphQLString },
        image: { type: GraphQLString },
        description: { type: GraphQLString },
        place: { type: GraphQLString },
        author_id: { type: GraphQLString },
        start_time: { type: GraphQLDateTime },
        end_time: { type: GraphQLDateTime },
        state: { type: GraphQLString }
      },
      resolve: function(_,args) {
        return new Promise((resolve,reject) => {
          Event.create({
            title: args.title,
            image: args.image,
            description: args.description,
            place: args.place,
            author_id: args.author_id,
            created_time: new Date().toISOString(),
            start_time: args.start_time,
            end_time: args.end_time,
            state: args.state
          }, function(err, ev){
            if(err) reject(err);
            else if(ev != null){
              //Registrar actividad
              resolve({
                data: ev,
                error: null
              });
            } else {
              resolve({
                data: null,
                error: {
                  code: 1,
                  message: 'No se ha podido crear el evento.'
                }
              });
            }
          });
        });
      }
    },

    assistEvent: {
      type: eventType,
      description: 'Asistir (o dejar de asistir) a un evento',
      args: {
        userID: { type: GraphQLString },
        eventID: { type: GraphQLString }
      },
      resolve: function(_,args) {

        return new Promise((resolve, reject) => {
          var assist = true;
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
                assist = false;
              }

              //Guardar evento
              ev.save(function(err){
                if(err) reject(err);
                else{
                  //Registrar actividad
                  if(assist){
                    Activity.create({
                      origin_id: args.userID,
                      target_id: args.eventID,
                      action: " asistirá a un ",
                      created_time: new Date().toISOString(),
                      type: 2
                    }, function(err,activity){
                      if(err) reject(err);
                      resolve(ev);
                    });
                  }else{
                    Activity.remove({
                      origin_id: args.userID,
                      target_id: args.eventID,
                      action: " asistirá a un "
                    }, function(err,activity){
                      if(err) reject(err);
                      resolve(ev);
                    });
                  }
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
          var interest = true;
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
              }else{
                ev.interested.splice(index,1);
                interest = false;
              }

              ev.save(function(err){
                if(err) reject(err);
                //Registrar actividad
                if(interest){
                  Activity.create({
                    origin_id: args.userID,
                    target_id: args.eventID,
                    action: " ha marcado que le interesa un ",
                    created_time: new Date().toISOString(),
                    type: 2
                  }, function(err,activity){
                    if(err) reject(err);
                    resolve(ev);
                  });
                }else{
                  Activity.create({
                    origin_id: args.userID,
                    target_id: args.eventID,
                    action: " ha marcado que le interesa un ",
                    created_time: new Date().toISOString(),
                    type: 2
                  }, function(err,activity){
                    if(err) reject(err);
                    resolve(ev);
                  });
                }
                
              });
            }
          });
        });
      }
    },

    commentEvent: {
      description: 'Enviar un comentario a un evento.',
      type: new GraphQLObjectType({
        name: 'commentEventResult',
        fields: {
          data: { type: commentType },
          error: { type: errorType }
        }
      }),
      args: {
        userID: {
          type: GraphQLString
        },
        eventID: {
          type: GraphQLString
        },
        content: {
          type: GraphQLString
        }
      },
      resolve: function(root,args) {
        return new Promise((resolve, reject) => {
          //Igual antes habría que comprobar si existe ese post o evento
          var date = new Date().toISOString();
          Comment.create({
            target_id: args.eventID,
            content: args.content,
            author_id: args.userID,
            created_time: date,
          }, function(err, res) {
            if (err) reject(err);
            else {
              //Registrar actividad
              Activity.create({
                origin_id: args.userID,
                target_id: args.eventID,
                action: " ha comentado en un ",
                created_time: date,
                type: 2
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
            Post.findById(args.targetID, function(err, post){
              if(err) reject(err);
              else{
                if(post == null){
                  resolve({
                    data: false,
                    error: {
                      code: 1,
                      message: 'No existe el post con ese identificador.'
                    }
                  });
                }else{
                  
                  post.reports.push({
                    origin_id: args.originID,
                    target_id: args.targetID,
                    reason: args.reason,
                    created_time: new Date().toISOString()
                  });

                  post.save(function(err){
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
                  User.findById(comm.author_id, function(err, user){
                      if(err) reject(err);
                      else if(user == null){
                        resolve({
                          data: false,
                          error: {
                            code: 2,
                            message: 'No existe el comentario a reportar.'
                          }
                        });
                      }else{
                          user.reports.push({
                              origin_id: args.originID,
                              target_id: args.targetID,
                              reason: args.reason,
                              comment: comm.content,
                              created_time: new Date().toISOString()             
                          });
                          user.save();
                          comm.reports.push({
                              origin_id: args.originID,
                              target_id: args.targetID,
                              reason: args.reason,
                              created_time: new Date().toISOString()
                            });
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
                console.log(chan);
                chan.reports.push({
                  origin_id: args.originID,
                  target_id: args.targetID,
                  reason: args.reason,
                  created_time: new Date().toISOString()
                });
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
    },
    saveFirebase: {
      description: 'Guardar token que recibe el usuario en su dispositivo al Iniciar sesión para recibir notificaciones.',
      type: new GraphQLObjectType({
        name: 'FirebaseResult',
        fields: {
          data: { type: GraphQLString },
          error: { type: errorType }
        }
      }),
      args: {
        userID: { type: GraphQLString },
        token: { type: GraphQLString }
      },
      resolve: function(root,args){
        return new Promise((resolve,reject) =>{
          User.findById(args.userID, function(err,user){
            if(err) reject(err);
            else{
              user.firebase_token = args.token;
              user.save(function(err){
                if(err) reject(err);
                resolve({
                  data: args.token,
                  error: null
                });
              });
            }
          });
        });
      }//Fin resolve
    },
      
    /**ADMINISTRACION**/
        
    deleteUser: {
        type: new GraphQLObjectType({
            name: 'deleteUserResult',
            fields: {
                data: {
                    type: userType
                },
                error: {
                    type: errorType
                }
            }
        }),
        description: 'Eliminar un usuario ya existente',
        args: {
            userID: { type: GraphQLString },
            type: { type: GraphQLString }
        },
        resolve: function(root, args) {
            return new Promise((resolve, reject) => {
                User.findOneAndUpdate({
                    _id: args.userID
                },
                {
                    $set: {
                        state: args.type
                    }
                }, {
                    new: true
                }, function(err, user) {
                    if (err) reject(err);
                    else if (user != null) {
                        resolve({
                            data: user,
                            error: null
                        });

                    } else {
                        resolve({
                            data: null,
                            error: "No existe el usuario que deseas eliminar."
                        });
                    }
                });
            });
        }
    },
    
    convertEditor: {
        type: new GraphQLObjectType({
            name: 'convertEditorResult',
            fields: {
                data: {
                    type: userType
                },
                error: {
                    type: errorType
                }
            }
        }),
        description: 'Convertir o no un usuario en editor',
        args: {
            id: { type: GraphQLString },
            userID: { type: GraphQLString },
            type: { type: GraphQLString }
        },
        resolve: function(root, args) {
            return new Promise((resolve, reject) => {
                Request.remove({ _id: args.id }, function (err,req){
                    if(err){
                        resolve({
                            data: null,
                            error: "Ha ocurrido un error."
                        });
                    }
                    else{
                        User.findOneAndUpdate({
                            _id: args.userID
                        },
                        {
                            $set: {
                                role: args.type
                            }
                        }, {
                            new: true
                        },function(err, user) {
                            if (err) reject(err);
                            else if (user != null) {
                                resolve({
                                    data: user,
                                    error: null
                                });

                            } else {
                                resolve({
                                    data: null,
                                    error: "No existe el usuario que deseas modificar."
                                });
                            }
                        });
                    }
                });
                
            });
        }
    },
        
    deleteComment: {
        type: new GraphQLObjectType({
            name: 'deleteCommentResult',
            fields: {
                data: {
                    type: commentType
                },
                error: {
                    type: errorType
                }
            }
        }),
        description: 'Aprobar o elimina un comentario',
        args: {
            commentID: { type: GraphQLString },
            state: { type: GraphQLString }
        },
        resolve: function(root, args) {
            return new Promise((resolve, reject) => {
                Comment.findOneAndUpdate({
                    _id: args.commentID
                },
                {
                    $set: {
                        state: args.state
                    }
                }, {
                    new: true
                },function(err, comment) {
                    if (err) reject(err);
                    else if (comment != null) {
                        resolve({
                            data: comment,
                            error: null
                        });

                    } else {
                        resolve({
                            data: null,
                            error: "No existe el comentario que deseas modificar."
                        });
                    }
                });
            });
        }
    },
     /*   
    deletePost: {
        type: new GraphQLObjectType({
            name: 'deletePostResult',
            fields: {
                data: {
                    type: postType
                },
                error: {
                    type: errorType
                }
            }
        }),
        description: 'Aprobar o elimina un post',
        args: {
            postID: { type: GraphQLString },
            state: { type: GraphQLString }
        },
        resolve: function(root, args) {
            return new Promise((resolve, reject) => {
                Post.findOneAndUpdate({
                    _id: args.postID
                },
                {
                    $set: {
                        state: args.state
                    }
                }, {
                    new: true
                },function(err, post) {
                    if (err) reject(err);
                    else if (post != null) {
                        resolve({
                            data: post,
                            error: null
                        });

                    } else {
                        resolve({
                            data: null,
                            error: "No existe el post que deseas modificar."
                        });
                    }
                });
            });
        }
    }*/
  })
});

export default mutationType;
