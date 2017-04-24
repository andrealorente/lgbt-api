//Graphql API server

var express = require('express');
var mongoose = require('mongoose');
var graphqlHTTP = require('express-graphql');
var graphql = require('graphql');
var bodyParser = require('body-parser');
var cors = require('cors');

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

//Input type para User
var userInputType = new graphql.GraphQLInputObjectType({
  name: 'userInputType',
  fields: {
    name: { type: graphql.GraphQLString },
    email: { type: graphql.GraphQLString },
  }
});

//Definir mutation type
var mutationType = new graphql.GraphQLObjectType({
    name: 'Mutation',
    fields: ()=> ({
		createToken: {
			type: graphql.GraphQLString,
			description: 'Crear un token de usuario',
			args: {
				username: { type: graphql.GraphQLString },
				password: { type: graphql.GraphQLString }
			},
			resolve: function(_, args) {
				//No sé bien en qué consiste esto o cómo se crea un token
			}
		},
		
		loginUser: {
			type: userType,
			description: 'Loguear usuario',
			args: {
				username: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
				password: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
			},
			resolve: function(_, args) {
				return new Promise((resolve,reject) => {
					//Comprobar que existe el nombre de usuario o email en la bd
					User.findOne({ name: args.name }, function(err, user){
						if(err) reject(err);
						
					});
					//Si existe, comprobar que coincide la contraseña
					
					//Si coincide crear y devolver un object con los campos: success, token, user
					//El token que devuelva lo tendrá que usar el usuario en cada cabecera de la petición get/post al servidor
					//Se almacena en el cliente, en localStorage y es el middleware el que se encarga de generar y descifrar el token
				});
			}
		},
		
        createUser: { //Entry point
            type: userType,
            description: 'Crear un nuevo usuario',
            args: {
                name: { type: graphql.GraphQLString },
				email: {type: graphql.GraphQLString }
            },
            resolve: function(_, args) {
                return new Promise((resolve,reject) => {
                    
                    User.create({
                        'name' : args.name,
                        'email' : args.email
                    }, function(err, res){
                        if(err) reject(err);
                        else{ resolve(res); } 
                        
                    });
                });
            }
        },
		
		editUser: {
			type: userType,
			description: 'Editar datos de un usuario existente',
			args: {
				name: { type: graphql.GraphQLString },
				email: { type: graphql.GraphQLString },
			},
			resolve: function(_, args) {
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
                title: {type: graphql.GraphQLString}
            },
            resolve: function(root,args){
                return new Promise((resolve, reject) => {
                    Post.create({
                        title: args.title
                    },function(err, res){
                        if(err) reject(err);
                        else{ resolve(res); } 
                        
                        
                    });
                });
            }
        }
    })
});

/** QUERIES **/
var queryType = new graphql.GraphQLObjectType({
    name: 'Query',
    fields: {
        user: {
            type: new graphql.GraphQLList(userType),
            //args son los argumentos que acepta la query User
            args: {
                name: { type: graphql.GraphQLString }
            },
            resolve: function( _, {name} ) {

                return new Promise((resolve,reject) => {
                    //Aquí se recuperan los datos de la bd
                    User.find({ name: name }, function(err, user) { 
                        if (err) reject(err);
                        else resolve(user);
                        
                        console.log(user);
                        
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
					//Aquí iría algo pa buscar por id
					Event.findById(eventID, function(err, event){
						if(err) reject(err);
						else resolve(event);
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

app.get('/user', function(req, res) {
    //Recibe los datos del formulario
    //var u = req.body;
	var query ='mutation { createUser( user: { name: "cons", email: "cons" }) { name }}';
    //res.json({ name: u.name, email: u.email });
	graphql.graphql(schema, query).then( function(result) {  
        //console.log(JSON.stringify(result,null," "));
        res.json(result);
    });
});

app.use('/graphql', graphqlHTTP({
    schema: schema,
    graphiql: true, //Para usar la herramienta GraphiQL
}));


app.get('/posts', function(req, res) {
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

app.get('/channels', function(req, res) {
    // This is just an internal test
    var query = 'query { allChannels { id, title, description, author } }'; 
    graphql.graphql(schema, query).then( function(result) {  
        //console.log(JSON.stringify(result,null," "));
        res.json(result);
    });
 
});

app.get('/events', function(req, res) {
    // This is just an internal test
    var query = 'query { allEvents { id, title, description, place, start_time } }'; 
    graphql.graphql(schema, query).then( function(result) {  
        //console.log(JSON.stringify(result,null," "));
        res.json(result);
    });
 
});

app.get('/users/:id', function(req, res){ //para pasarle un parámetro

  User.findOne({ _id: req.params.id}, function(err, user) {
    if (err) throw err;
    
    //res.json({_id: user[0]._id, name: user[0].name, email: user[0].email});
    res.json({users: req.params.id});
    
  });

});

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
