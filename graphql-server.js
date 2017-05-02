//Graphql API server

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
var middleware = require('./middleware');
var config = require('./config');

//Models
var User = require('./models/userModel');
var Post = require('./models/postModel');
var Channel = require('./models/channelModel');
var Event = require('./models/eventModel');
var Comment = require('./models/commentModel');

//Custom types
var userType = require('./types/userType');
var channelType = require('./types/channelType');
var commentType = require('./types/commentType');
var eventType = require('./types/eventType');
var postType = require('./types/postType');

//Conectar con la bd
mongoose.connect('mongodb://admin:admin@ds145868.mlab.com:45868/lgbt-app');

var createToken = function(user) {
	console.log(user);
	var payload = {
		sub: user._id,
		iat: moment().unix(),
		exp: moment().add(14, "days").unix()
	};
	
	return jwt.encode(payload, config.TOKEN_SECRET);
};

//Input type para User
var userInputType = new graphql.GraphQLInputObjectType({
  name: 'userInputType',
  fields: {
    name: { type: graphql.GraphQLString },
    email: { type: graphql.GraphQLString },
  }
});

//Error type (prueba)
var errorType = new graphql.GraphQLObjectType({
	name: 'errorType',
	fields: {
		code: { type: graphql.GraphQLInt },
		message: { type: graphql.GraphQLString }
	}
});

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
            type: postType,
            description: 'Editar un post ya existente',
            args: {
                postID: {type: graphql.GraphQLString},
                title: {type: graphql.GraphQLString},
                content: {type: graphql.GraphQLString},
                tags: {type: new graphql.GraphQLList(graphql.GraphQLString)},
                image: {type: graphql.GraphQLString}
            },
            resolve: function(root,args){
                return new Promise((resolve, reject) => {
                    Post.findOneAndUpdate(
                        {_id: args.postID},//"58e7ca08a364171f3c3fe58d"},
                        {$set:{title: args.title, content: args.content, tags: args.tags, image: args.image}}, 
                        {new: true}
                    ,function(err, res){
                        if(err) reject(err);
                        else{ 
                            resolve(res); 
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

/** QUERIES **/
var queryType = new graphql.GraphQLObjectType({
    name: 'Query',
    fields: {
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
                        if (err) 
							reject(err);
                        else resolve(res);
                    });
                }); //Fin Promise 
                
            } //Fin resolve
        }, //Fin consultar user
        allPosts: {
            type: new graphql.GraphQLList(postType),
            resolve: function(_){
                return new Promise((resolve,reject) => {
                    Post.find(function(err, res){
                        if(err) reject(err);
                        else resolve(res);
                    });
                });
            }
        },
		onePost: {
			type: postType,
			args: {
				postID: { type: graphql.GraphQLString }
			},
			resolve: function(_, {postID}) {
				return new Promise((resolve,reject) => {
					Post.findById(postID, function(err, res) {
						if (err) reject(err);
						else resolve(res);
					});
				});
			}
		},
		allChannels: { //Esto sería más bien para la página de Explorar canales (que muestra todos)
			type: new graphql.GraphQLList(channelType),
			resolve: function(_) {
				return new Promise((resolve, reject) => {
					Channel.find(function(err, res){
						if(err) reject(err);
						else resolve(res);
					});
				});
			}
		},
		oneChannel: {
			type: channelType,
			args: {
				channelID: { type: graphql.GraphQLString }
			},
			resolve: function(_, {channelID}) {
				return new Promise((resolve,reject) => {
					Channel.findById(channelID, function(err, res) {
						if (err) reject(err);
						else resolve(res);
					});
				});
			}
		},
		allEvents: { //En el futuro esto va por meses
			type: new graphql.GraphQLList(eventType),
			resolve: function(_) {
				return new Promise((resolve, reject) => {
					Event.find(function(err, res) {
						if(err) reject(err);
						else resolve(res);
					});
				});
			}
		},
		oneEvent: {
			type: eventType,
			args: {
				eventID: { type: graphql.GraphQLString }
			},
			resolve: function(_, { eventID }) {
				return new Promise((resolve, reject) => {
					
					Event.findById(eventID, function(err, event){
						if(err){
							reject(err);
						}else{
							resolve(event);
						} 
					});
				});
			}
		}
    }
});

var schema = new graphql.GraphQLSchema({query: queryType, mutation: mutationType});

//Inicializar el objeto de express
var app = express();

/* Así se usa ahora el bodyParser */
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());
/*********************************/
app.use(cors());

/*************************************************************************************/


app.use('/graphql', graphqlHTTP({
    schema: schema,
    graphiql: true, //Para usar la herramienta GraphiQL
}));

/******** RUTAS DE POSTS *******/

app.get('/posts', middleware.ensureAuthorised, function(req, res) {
    // This is just an internal test
    var query = 'query { allPosts { id, title, content, author, tags } }'; 
    graphql.graphql(schema, query).then( function(result) {  
        //console.log(JSON.stringify(result,null," "));
        res.json({
			success: true,
			data: result.data
		});
    });
 
});

//Obtener un post concreto
app.get('/posts/:id', function(req,res) {
	
	var query = 'query { onePost(postID:\"' + req.params.id + '\") { title, author, content } }'; 
	graphql.graphql(schema, query).then( function(result) {  
        
		console.log(result); // { data: oneEvent: null }
		if(result.data.onePost == null){ //No sé si esto está bien así o habría que mandar el error desde graphql
			res.json({
				success: false,
				error: "No se ha encontrado ningún post con esa ID"
			});	
		}else{
			res.json({
				success: true,
				data: result.data
			});	
		}
        
    });
});

//Comentar en un post
app.post('posts/:id/comments',function(req,res){});
//Dar like a un post
app.post('posts/:id/likes',function(req,res){});

app.post('posts/:id/update',middleware.ensureAuthorised,function(req,res){
    var form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.multiples = true;
    form.parse(reject, function(err, fields, files){
        var temp_path;
        console.log(files.images);
        if (files.images) {
            if (!files.images.length) {
                if (files.images.name != "") {
                    console.log(files.images.path);
                    temp_path = files.images.path;
                    cloudinary.uploader.upload(
                        temp_path,
                        function (result) {
                            console.log(result);
                            //plan.images.push(result.public_id);
                            console.log("Actualizado con 1 foto");
                            var query = "mutation{updatePost(postID:\""+ fields.id +"\",title:\""+ fields.title +"\",content:\""+ fields.content +"\",tags:\""+ fields.tags +"\",image:\""+ files.image.name +"){id,title,content,tags,image}}";
	                       graphql.graphql(schema, query).then( function(result) {  
        
		                      console.log(result); // { data: oneEvent: null }
		                      if(result.data.onePost == null){ //No sé si esto está bien así o habría que mandar el error desde graphql
			                     res.json({
				                    success: false,
				                    error: "No se ha encontrado ningún post con esa ID"
			                     });	
		                      }else{
			                     res.json({
				                    success: true,
				                    data: result.data
			                     });	
		                      }
        
                            });            
                        },
                        {
                            crop: 'limit',
                            width: 300,
                            height: 300,
                            format: "png",
                            folder: "posts"/*,
                            tags: ['posts', Post._id, Post.name, user.account.user]*/
                        }
                    );
                } else {
                    //updatePlan();
                    console.log("Actualizado sin 1 foto");
                }
            }
        }
    });
});

/******* RUTAS DE CANALES ******/

//Obtener todos los canales
app.get('/channels', function(req, res) {
	
    var query = 'query { allChannels { id, title, description } }'; 
    graphql.graphql(schema, query).then( function(result) {  
        //console.log(JSON.stringify(result,null," "));
        res.json({
			success: true,
			data: result.data
		});
    });
 
});

//Obtener un canal concreto
app.get('/channels/:id', function(req,res) {
	
	var query = 'query { oneChannel(channelID:\"' + req.params.id + '\") { title, description } }'; 
	graphql.graphql(schema, query).then( function(result) {  
        
		console.log(result); // { data: oneEvent: null }
		if(result.data.oneChannel == null){ //No sé si esto está bien así o habría que mandar el error desde graphql
			res.json({
				success: false,
				error: "No se ha encontrado ningún canal con esa ID"
			});	
		}else{
			res.json({
				success: true,
				data: result.data
			});	
		}
        
    });
});

/******* RUTAS DE EVENTOS ********/

app.get('/events', function(req, res) {

    var query = 'query { allEvents { id, title, description, place, start_time } }'; 
    graphql.graphql(schema, query).then( function(result) {  
        //console.log(JSON.stringify(result,null," "));
        res.json({
			success: true,
			data: result.data
		});
    });
 
});

app.get('/events/:id', function(req,res) {
	
	var query = 'query { oneEvent(eventID:\"' + req.params.id + '\") { title, description, place, start_time } }'; 
    graphql.graphql(schema, query).then( function(result) {  
        
		console.log(result); // { data: oneEvent: null }
		if(result.data.oneEvent == null){ //No sé si esto está bien así o habría que mandar el error desde graphql
			res.json({
				success: false,
				error: "No se ha encontrado ningún evento con esa ID"
			});	
		}else{
			res.json({
				success: true,
				data: result.data
			});	
		}
        
    });
});

//Asistir a un evento
app.post('/events/:id/assist',function(req,res){});
//Me interesa un evento
app.post('/events/:id/interested',function(req,res){});
//Comentar un evento
app.post('/events/:id/comments',function(req,res){});


/******* RUTAS DE USUARIO *******/

//Loguear un usuario
app.post('/users/login', function(req,res) {
	var user = req.body.user_name;
	var pswd = req.body.user_pswd;
	
	var mutation = 'mutation { loginUser(username: \"' + user + '\", password: \"'+pswd +'\"){ user { id, username, bio }, error { code, message } }}';
	
	graphql.graphql(schema, mutation).then( function(result) {  
		//console.log(JSON.stringify(result));
		console.log(result);
		if(result.data.loginUser.user==null){
			res.json({
				success: false,
				error: result.data.loginUser.error
			});
		}else{
			res.json({
				success: true,
				data: result.data,
				token: createToken(result.data.loginUser.user)
			});
		}
		
	});
});

//Obtiene un usuario 
app.get('/users/:id', function(req, res){ //para pasarle un parámetro
	
	var query = ' query { user(userID:\"' + req.params.id + '\") { id, username, bio, place } }';
	
	graphql.graphql(schema, query).then( function(result) {  
		//console.log(JSON.stringify(result,null," "));
		res.json({
			success: true,
			data: result.data
		});
	});

});

//Crea un usuario
app.post('/users', function(req,res) {
	
	var username = req.body.user_name;
	var email = req.body.user_email;
	var pswd = req.body.user_pswd;
	
	var mutation = ' mutation { createUser(username:\"'+ username +'\", email: \"' + email + '\", pswd: \"'+ pswd +'\") { user{id, username, name}, error {code, message} } }';
	
	graphql.graphql(schema, mutation).then( function(result) {  
		//console.log(JSON.stringify(result,null," "));
		if(result.data.createUser.user==null){
			res.json({
				success: false,
				error: result.data.createUser.error
			});
		}else{
			res.json({
				success: true,
				data: result.data
			});
		}
		
	});
});

//Actualiza datos de un usuario
app.put('/users/:user-id', function(req,res){
	
	var query = ' query { editUser(userID:\"' + ') }';
	
});

//Seguir a un usuario
app.post('/users/:id/follows',function(req,res){});

/*********************************************************************************************/

//app.listen(4000);
//console.log('Running a GraphQL API server at localhost:4000/graphql');
// Initialize the app.
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });

/*
    Atajos de teclado:
    -Copiar línea arriba o abajo: shift + alt + flecha arriba o abajo
    -Mover una línea arriba o abajo: alt + flecha arriba o abajo

*/
