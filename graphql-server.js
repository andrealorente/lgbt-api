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

var queryType = require('./schema/queryType');
var mutationType = require('./schema/mutationType');

//Conectar con la bd
mongoose.connect('mongodb://admin:admin@ds145868.mlab.com:45868/lgbt-app');

/***Controllers**/
var postController = require('./controllers/postController');
var channelController = require('./controllers/channelController');

/****/
var createToken = function(user) {
	console.log(user);
	var payload = {
		sub: user.id,
		iat: moment().unix(),
		exp: moment().add(14, "days").unix()
	};

	return jwt.encode(payload, config.TOKEN_SECRET);
};

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

//Crear un post
app.post('/create/post', middleware.ensureAuthorised, postController.createPost);
//Obtener todos los posts
app.get('/posts', middleware.ensureAuthorised, postController.allPosts);
//Obtener un post concreto
app.get('/posts/:id', middleware.ensureAuthorised, postController.onePost);
//Ver likes de un post
app.get('/posts/:id/likes', middleware.ensureAuthorised, postController.getLikes);
//Modificar un post concreto
app.post('/posts/:id/update',middleware.ensureAuthorised, postController.updatePost);
//Comentar en un post
app.post('/posts/:id/comments', middleware.ensureAuthorised, postController.commentPost);
//Dar like a un post
app.post('/posts/:id/likes', middleware.ensureAuthorised, postController.likePost);
//Buscar un post por titulo
app.get('/search/post',middleware.ensureAuthorised, postController.searchPost);

/******* RUTAS DE CANALES ******/

//Crear un canal
app.post('/create/channel', middleware.ensureAuthorised, channelController.createChannel);
//Obtener todos los canales
app.get('/channels', middleware.ensureAuthorised, channelController.allChannels);
//Obtener los canales a los que estoy suscrito
//app.get('/channels/me', middleware.ensureAuthorised, channelController.allChannels);
//Obtener un canal concreto
app.get('/channels/:id', middleware.ensureAuthorised, channelController.oneChannel);
//Enviar mensaje al canal
app.post('/channels/:id/message', middleware.ensureAuthorised, channelController.sendMessage);
//Suscribirse a un canal
app.post('/channels/:id/suscribe', middleware.ensureAuthorised, channelController.suscribeChannel);
//Silenciar notificaciones de un canal
app.post('/channels/:id/notifications', middleware.ensureAuthorised, channelController.notifChannel);

/******* RUTAS DE EVENTOS ********/

//Obtener los eventos de un mes
app.get('/events', middleware.ensureAuthorised, function(req, res) {
  //Se le pasan los parámetros en la url -> /events?month=4&year=2017 en RESTClient
  var query = 'query { allEvents (month:'+ req.query.month + ', year:'+ req.query.year +') { data{ id, title, description, place, start_time, assistants, interested }, error { code, message } } }';
  graphql.graphql(schema, query).then( function(result) {
      //console.log(JSON.stringify(result,null," "));
      res.json({
      	success: true,
      	data: result.data.allEvents.data
      });
  });
});
//Obtener un evento
app.get('/events/:id', middleware.ensureAuthorised, function(req,res) {

	var query = 'query { oneEvent(eventID:\"' + req.params.id + '\") { title, description, place, start_time, author, comments(targetID:\"' + req.params.id +'\") { author_data { id, username, name }, content, created_time }, assistants, interested } }';
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
//Ver asistentes de un evento
app.get('/events/:id/assist', middleware.ensureAuthorised, function(req,res){});
//Ver interesados de un evento
app.get('/events/:id/interested', middleware.ensureAuthorised, function(req,res){});
//Asistir a un evento
app.post('/events/:id/assist', middleware.ensureAuthorised, function(req,res){
  var mutation = 'mutation { assistEvent(userID: \"'+ req.body.user_id +'\", eventID: \"'+ req.params.id +'\") { assistants, interested } }';
  graphql.graphql(schema, mutation).then( function(result) {
      //console.log(JSON.stringify(result,null," "));
      res.json({
      	success: true,
      	data: result.data.assistEvent
      });
  });
});
//Me interesa un evento
app.post('/events/:id/interested', middleware.ensureAuthorised,function(req,res){
  var mutation = 'mutation { interestEvent(userID: \"'+ req.body.user_id +'\", eventID: \"'+ req.params.id +'\") { assistants, interested } }';
  graphql.graphql(schema, mutation).then( function(result) {
      //console.log(JSON.stringify(result,null," "));
      res.json({
      	success: true,
      	data: result.data.interestEvent
      });
  });
});
//Comentar un evento
app.post('/events/:id/comments', middleware.ensureAuthorised, function(req,res){});


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
				data: result.data.loginUser.user,
				token: createToken(result.data.loginUser.user)
			});
		}

	});
});
//Cerrar sesión
app.post('/users/logout', function(req,res) {});
//Obtiene un usuario
app.get('/users/:id', middleware.ensureAuthorised, function(req, res){ //para pasarle un parámetro
  var user = req.params.id;

  if(req.params.id == "me"){
    user = req.user; //En req.user está la id que coge del token de la cabecera
  }

	var query = ' query { user(userID:\"' + user + '\") { id, username, name, bio, place, public } }';
	graphql.graphql(schema, query).then( function(result) {
		//console.log(JSON.stringify(result,null," "));
		res.json({
			success: true,
			data: result.data.user,
		});
	});

});
//Crea un usuario
app.post('/users', middleware.ensureAuthorised, function(req,res) {

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
				data: result.data.createUser.user
			});
		}

	});
});
//Actualiza datos de un usuario
app.put('/users/:id', middleware.ensureAuthorised, function(req,res){

	var query = ' query { editUser(userID:\"' + ') }';

});
//Obtiene lista de follows de un usuario
app.get('/users/:id/follows', middleware.ensureAuthorised, function(req,res){
	var query = ' query { user(userID:\"' + req.params.id + '\") { relationships { id, user_data {username, bio }, outgoing_status, incoming_status } } }';
	graphql.graphql(schema, query).then( function(result) {
		//console.log(JSON.stringify(result,null," "));
    var relationships = [];
    for(i in result.data.user.relationships ){
        if(result.data.user.relationships[i].outgoing_status=="follows")
          relationships.push(result.data.user.relationships[i]);
    }
		res.json({
			success: true,
			data: relationships
		});
	});
});
//Obtiene lista de followed-by de un usuario
app.get('/users/:id/followed-by', middleware.ensureAuthorised, function(req,res){
  var query = ' query { user(userID:\"' + req.params.id + '\") { relationships { id, user_data {username, bio }, outgoing_status, incoming_status } } }';
	graphql.graphql(schema, query).then( function(result) {
		//console.log(JSON.stringify(result,null," "));
    var relationships = [];
    for(i in result.data.user.relationships ){
        if(result.data.user.relationships[i].incoming_status=="followed-by")
          relationships.push(result.data.user.relationships[i]);
    }
		res.json({
			success: true,
			data: relationships
		});
	});
});
//Obtiene la relación entre el usuario y otro usuario
app.get('/users/:id/relationship', middleware.ensureAuthorised, function(req,res){
	var query = ' query { relationship(originID:"" ,targetID: "",) { } }';
  /*var variable = api+"/posts/search/search";
        $http({
            method: 'GET',
            url: variable,
            params: {searchparams:$scope.searchparams,type:'title'},
        }).then(function(response){*/
});
//Modifica la relación entre el usuario y otro usuario
app.post('/users/:id/relationship', middleware.ensureAuthorised, function(req,res){
	//Necesario incluir parámetro de ACTION
	var mutation = 'mutation { relationship(originID:\"\", targetID:\"'+ req.params.id +'\", action:\"\") { status, error { code, message } } }';
  graphql.graphql(schema, mutation).then( function(result) {
		//console.log(JSON.stringify(result,null," "));
		res.json({
			success: true,
			data: result.data
		});
	});
});
//Cargar peticiones de seguimiento
app.get('/requests', middleware.ensureAuthorised, function(req,res){
  var query = ' query { user(userID:\"' + req.params.id + '\") { relationships { id, user_data {username, bio }, outgoing_status, incoming_status } } }';
	graphql.graphql(schema, query).then( function(result) {
		//console.log(JSON.stringify(result,null," "));
    var relationships = [];
    for(i in result.data.user.relationships ){
        if(result.data.user.relationships[i].incoming_status=="requested-by")
          relationships.push(result.data.user.relationships[i]);
    }
		res.json({
			success: true,
			data: relationships
		});
	});
});
//Carga la actividad de los seguidos del usuario
app.get('/activity', middleware.ensureAuthorised, function(req,res){});
//Reportar usuario
app.post('/report', middleware.ensureAuthorised, function(req,res){});
//Solicitar rango de editor-request
app.post('/editor', middleware.ensureAuthorised, function(req,res){});

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
