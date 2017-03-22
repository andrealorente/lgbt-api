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

//Conectar con la bd
mongoose.connect('mongodb://admin:admin@ds145868.mlab.com:45868/lgbt-app');

//Definir min User type
var minuserType = new graphql.GraphQLObjectType({
    name: 'MinUser',
    fields: {
        id: { type: graphql.GraphQLString },
        name: { type: graphql.GraphQLString }
    }
});

//Definir User type
var userType = new graphql.GraphQLObjectType({
    name: 'User',
    fields: {
        id: { type: graphql.GraphQLString }, //Cada campo puede tener un resolve
        name: { type: graphql.GraphQLString },
        email: { type: graphql.GraphQLString },
        followers: { type: new graphql.GraphQLList(minuserType)}
    }
});

//Input type para User
var userInputType = new graphql.GraphQLInputObjectType({
  name: 'userInputType',
  fields: {
    name: { type: graphql.GraphQLString },
    email: { type: graphql.GraphQLString },
  }
});

//Post type
var postType = new graphql.GraphQLObjectType({
    name: 'postType',
    fields: {
        id: { type: graphql.GraphQLString },
        title: { type: graphql.GraphQLString },
        content: { type: graphql.GraphQLString },
        author: { type: graphql.GraphQLString },
        tags: { type: new graphql.GraphQLList(graphql.GraphQLString)}
    }
});

//Post type
var channelType = new graphql.GraphQLObjectType({
    name: 'channelType',
    fields: {
        id: { type: graphql.GraphQLString },
        title: { type: graphql.GraphQLString },
        description: { type: graphql.GraphQLString },
        author: { type: graphql.GraphQLString },
    }
});

//Definir mutation type
var mutationType = new graphql.GraphQLObjectType({
    name: 'Mutation',
    fields: ()=> ({
        createUser: { //Entry point
            type: userType,
            description: 'Crear un nuevo usuario',
            args: {
                user: { type: userInputType }
            },
            resolve: function(_, { user }) {
                return new Promise((resolve,reject) => {
                    
                    User.create({
                        'name' : user.name,
                        'email' : user.email
                    }, function(err, res){
                        if(err) reject(err);
                        else{ resolve(res); } 
                        
                    });
                });
            }
        },
    })
});

//Definir query type
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
		allChannels: {
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

app.post('/user', function(req, res) {
    //Recibe los datos del formulario
    var u = req.body;
    res.json({ name: u.name, email: u.email });
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
        res.json(result);
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
