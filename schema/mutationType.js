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

//Custom types
var userType = require('./../types/userType');
var channelType = require('./../types/channelType');
var commentType = require('./../types/commentType');
var eventType = require('./../types/eventType');
var postType = require('./../types/postType');
var errorType = require('./../types/errorType');

var createToken = function(user) {
	console.log(user);
	var payload = {
		sub: user._id,
		iat: moment().unix(),
		exp: moment().add(14, "days").unix()
	};
	
	return jwt.encode(payload, config.TOKEN_SECRET);
};

//Definir mutation type
var mutationType = new graphql.GraphQLObjectType({
    name: 'Mutation',
    fields: ()=> ({
		
		loginUser: {
			type: new graphql.GraphQLObjectType({
				name: 'loginUserResult',
				fields: {
					user: { type: userType },
					error: { type: errorType }
				}
			}),
			description: 'Loguear usuario',
			args: {
				username: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
				password: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
			},
			resolve: function(_, args) {
				return new Promise((resolve,reject) => {
					//Comprobar que existe el nombre de usuario o email en la bd
					User.findOne({
						$or:[
							{ 'username': args.username },
							{ 'email': args.username }
						]
					}, function(err, user){
						if(err) reject(err);
						else if(user!=null){
							//Comprobar que la contraseña coincide con la que es
							if(user.pswd == args.password){
								resolve({
									user: user,
									error: null
								});
							}else{
								resolve({
									user: null,
									error: {
										code: 2,
										message: "La contraseña no es correcta."
									}
								});
							}
							
						}else{
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
            type: new graphql.GraphQLObjectType({
				name: 'createUserResult',
				fields: {
					user: { type: userType },
					error: { type: errorType }
				}
			}),
            description: 'Crear un nuevo usuario',
            args: {
                username: { type: graphql.GraphQLString },
				email: { type: graphql.GraphQLString },
				pswd: { type: graphql.GraphQLString }
            },
            resolve: function(_, args) {
                return new Promise((resolve,reject) => {
					
					User.findOne({username: args.username}, function(err, user){
						if(err) reject(err);
						else if(user!=null){ //Nombre de usuario ya utilizado
							console.log("Nombre de usuario ya utilizado.");
							resolve({
								user: null,
								error: {
									code: 1,
									message: "Nombre de usuario en uso."
								}
							});
						}else{
							
							User.findOne({email: args.email}, function(err, user){
								if(err) reject(err);
								else if(user!=null){//Correo ya en uso
									resolve({
										user: null,
										error: {
											code: 2,
											message: "Correo electrónico ya en uso."
										}
									});
								}else{
									User.create({
										username : args.username,
										name: args.username,
										email : args.email,
										pswd: args.pswd
									}, function(err, res){
										if(err) reject(err);
										else{ 
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
		
		editUser: {
			type: userType,
			description: 'Editar datos de un usuario existente',
			args: {
				userID: { type: graphql.GraphQLString },
				username: { type: graphql.GraphQLString },
				name: { type: graphql.GraphQLString },
				email: { type: graphql.GraphQLString },
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
			type: new graphql.GraphQLObjectType({
				name: 'relationshipResult',
				fields: {
					status: { type: graphql.GraphQLString },
					error: { type: errorType }
				}
			}),
			description: 'Modificar la relación con un usuario',
			args: {
				originID: { type: graphql.GraphQLString },
				targetID: { type: graphql.GraphQLString },
				action: { type: graphql.GraphQLString } //valores: follow || unfollow || approve || ignore
			},
			resolve: function(_,args) {

				return new Promise((resolve, reject) => {
			
					User.find({_id: { 
					$in: [args.originID, args.targetID ]}, 'relationships.id':{$in: [args.originID, args.targetID ]}},function(err, res){ //obtiene los dos usuarios
						
						console.log(res);
						
						//Según qué acción sea
						var outgoing_status = "";
						var incoming_status = "";
						var outgoing_status2 = "";
						var incoming_status2 = "";
												
						if(args.action == "follow"){
							outgoing_status = "follows"; 
							incoming_status2 = "followed-by";
						}else if(args.action == "unfollow"){
							outgoing_status = "none";
							incoming_status2 = "none";
						}else if(args.action == "approve"){
							incoming_status = "followed-by";
							outgoing_status2 = "follows";
						}else if(args.action == "ignore"){
							incoming_status = "none";
							outgoing_status = "none";
						} 
						
						if(res.length==0){ //No existe esa relación entre los usuarios
							
							User.find({_id: { 
								$in: [args.originID, args.targetID ]}}, //Busca a los dos usuarios origin y target (NO LOS DEVUELVE EN ORDEN JODER)
							function(err, users){
								if(err) reject(err);
								else{
									console.log(users);
									var user1 = {};
									var user2 = {};
									
									if(users[0]._id == args.targetID) {
										user1 = users[1];
										user2 = users[0];
									}else{
										user1 = users[0];
										user2 = users[1];
									}
									//ORIGIN
									user1.relationships.push({ 
										id: args.targetID,
										outgoing_status: "follows",
										incoming_status: "none"
									});
									
									user1.save(function(err){
										if(!err){
											//TARGET
											user2.relationships.push({ 
												id: args.originID,
												outgoing_status: "none",
												incoming_status: "followed-by"
											});
											
											user2.save(function(err){
												if(!err){
													resolve({
														status: "Following",
														error: null
													});													
												}else reject(err);												
											});											
										}else reject(err);
										
									});								
								}
							});
							
						}else{
							//Ya existe la relación, solo hay que actualizarla
							console.log("Existe la relación!!!!");
							console.log(res);
							
							var user1 = {};
							var user2 = {};
							
							if(res[0]._id == args.originID){
								user1 = res[0];
								user2 = res[1];
							}else{
								user1 = res[1];
								user2 = res[0];
							}
							
							//Buscar el doc en el usuario origin
							for(i in user1.relationships){
								
								if(user1.relationships[i].id == args.targetID){
									if(outgoing_status!='')
										user1.relationships[i].outgoing_status = outgoing_status;
									if(incoming_status!='')
										user1.relationships[i].incoming_status = incoming_status;
								}
							}
							
							user1.save(function(err){
								if(err) reject(err);
								else{
									//Buscar el doc en el usuario target
									for(j in user2.relationships){
										
										if(user2.relationships[j].id == args.originID){
											if(outgoing_status2!='')
												user2.relationships[j].outgoing_status = outgoing_status2;
											if(incoming_status2!='')
												user2.relationships[j].incoming_status = incoming_status2;
										}
									}
									
									user2.save(function(err){
										if(err) reject(err);
										else{
											resolve({
												status: "Following",
												error: null
											});
										}
									});
								}
							});
						}//Fin else res==null				
					});	
				});
			}
		},
		
        createPost: {
            type: postType,
            description: 'Crear un nuevo post',
            args: {
                title: {type: graphql.GraphQLString},
                content: {type: graphql.GraphQLString},
                author: {type: graphql.GraphQLString},
                
            },
            resolve: function(root,args){
                return new Promise((resolve, reject) => {
                    Post.create({
                        title: args.title,
                        content: args.content,
                        author: args.userid
                    },function(err, res){
                        if(err) reject(err);
                        else{ resolve(res); } 
                        
                        
                    });
                });
            }
        },
        
        updatePost: {
            type: new graphql.GraphQLObjectType({
				name: 'updatePostResult',
				fields: {
					post: { type: postType },
					error: { type: errorType }
				}
			}),
            description: 'Editar un post ya existente',
            args: {
                postID: {type: graphql.GraphQLString},
                title: {type: graphql.GraphQLString},
                content: {type: graphql.GraphQLString},
                tags: {type: new graphql.GraphQLList(graphql.GraphQLString)},
                image: {type: graphql.GraphQLString},
                state: {type: graphql.GraphQLString}
            },
            resolve: function(root,args){
            console.log(args.state);
                return new Promise((resolve, reject) => {
                    Post.findOneAndUpdate(
                        {_id: args.postID},//"58e7ca08a364171f3c3fe58d"},
                        {$set:{title: args.title, content: args.content, tags: args.tags, image: args.image, state: args.state}}, 
                        {new: true}
                    ,function(err, post){
                        if(err) reject(err);
						else if(post!=null){
                        //Comprobar que la contraseña coincide con la que es
							//if(post.author == args.password){
                            console.log("no es null");
                            //console.log(args.tags);
                            resolve({
                                post: post,
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
								post: null,
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
                postID: {type: graphql.GraphQLString}
            },
            resolve: function(root,args){
                return new Promise((resolve, reject) => {
                    Post.findOneAndDelete(
                        {_id: args.postID}
                    ,function(err, res){
                        if(err) reject(err);
                        else{resolve(res);}   
                    });
                });
            }
        },
        
        createChannel: {
            type: channelType,
            description: 'Crear un nuevo canal',
            args: {
                title: {type: graphql.GraphQLString},
                content: {type: graphql.GraphQLString},
                author: {type: graphql.GraphQLString},
                
            },
            resolve: function(root,args){
                return new Promise((resolve, reject) => {
                    Channel.create({
                        title: args.title,
                        content: args.content,
                        author: args.userid
                    },function(err, res){
                        if(err) reject(err);
                        else{ resolve(res); } 
                    });
                });
            }
        },
        
        updateChannel: {
            type: channelType,
            description: 'Editar un canal ya existente',
            args: {
                channelID: {type: graphql.GraphQLString},
                title: {type: graphql.GraphQLString}
            },
            resolve: function(root,args){
                return new Promise((resolve, reject) => {
                    Channel.findOneAndUpdate(
                        {_id: args.channelID},
                        {$set:{title: args.title}}, 
                        {new: true}
                    ,function(err, res){
                        if(err) reject(err);
                        else{resolve(res);}   
                    });
                });
            }
        },
        
        deleteChannel: {
            type: channelType,
            description: 'Eliminar un canal ya existente',
            args: {
                channelID: {type: graphql.GraphQLString}
            },
            resolve: function(root,args){
                return new Promise((resolve, reject) => {
                    Channel.findOneAndDelete(
                        {_id: args.channelID}
                    ,function(err, res){
                        if(err) reject(err);
                        else{resolve(res);}    
                    });
                });
            }
        },
        
    })
});

module.exports = mutationType;