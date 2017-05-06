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
var errorType = require('./types/errorType');

var queryType = require('./schema/queryType');
var mutationType = require('./schema/mutationType');

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
app.get('/posts/:id', middleware.ensureAuthorised, function(req,res) {

	var query = 'query { onePost(postID:\"' + req.params.id + '\") { title, author, content, tags, image, comments( targetID: \"' + req.params.id +'\") { content, author, created_time } } }';
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
				data: result.data.onePost
			});
		}

    });
});

//Comentar en un post
app.post('/posts/:id/comments', middleware.ensureAuthorised, function(req,res){
	var userid = req.body.user_id;
	var content = req.body.content;
	var targetid = req.body.target_id;

	var mutation = ' mutation { createComment() {} }';
});
//Dar like a un post
app.post('/posts/:id/likes',function(req,res){});

app.post('/posts/:id/update',middleware.ensureAuthorised,function(req,res){

    var form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.multiples = true;
    //console.log(form);

    form.parse(req, function(err, fields, files){
        var tagspost=[];
        if(fields.tags!="undefined" && fields.tags.split(", ")!=""){tagspost = fields.tags.split(', ');}

        var temp_path;
        if (files.images) {
            if (!files.images.length) {
                if (files.images.name != "") {
                    temp_path = files.images.path;
                    cloudinary.uploader.upload(
                        temp_path,
                        function (result) {
                            console.log("Actualizado con 1 foto");
                            var mutation = "mutation{updatePost(postID:\""+ fields.id +"\",title:\""+ fields.title +"\",content:\""+ fields.content +"\",tags:"+ JSON.stringify(tagspost) +",image:\""+ result.version+"/"+result.public_id +"\",state:\""+ fields.state +"\"){post{id,title,content,tags,image,state},error{code,message}}}";
	                       graphql.graphql(schema, mutation).then( function(result) {
		                      if(result.data.updatePost == null){
			                     res.json({
				                    success: false,
				                    error: "No se ha encontrado ningún post con esa ID"
			                     });
		                      }else{
			                     res.json({
				                    success: true,
				                    data: result.data.updatePost
			                     });
		                      }

                            });
                        },
                        {
                            crop: 'limit',
                            width: 300,
                            height: 300,
                            format: "png",
                            folder: "posts",
                            tags: ['posts', fields.id, fields.title/*, fields.author*/]
                        }
                    );
                } else {
                    console.log("Actualizado sin 1 foto");
                }
            }
        }
        else{
            console.log("Actualizado sin 1 foto");
            var mutation = "mutation{updatePost(postID:\""+ fields.id +"\",title:\""+ fields.title +"\",content:\""+ fields.content +"\",tags:"+ JSON.stringify(tagspost) +",image:\"1493935772/no-image_u8eu8r\",state:\""+ fields.state +"\"){post{id,title,content,tags,image,state},error{code,message}}}";
            graphql.graphql(schema, mutation).then( function(result) {
                 if(result.data.updatePost == null){
                     res.json({
                        success: false,
                        error: "No se ha encontrado ningún post con esa ID"
                     });
                  }else{
                     res.json({
                        success: true,
                        data: result.data.updatePost
                     });
                  }
            });
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

app.get('/events', middleware.ensureAuthorised, function(req, res) {

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

	var query = 'query { oneEvent(eventID:\"' + req.params.id + '\") { title, description, place, start_time, comments(targetID:\"' + req.params.id +'\") { author, content, created_time } } }';
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
				data: result.data.loginUser.user,
				token: createToken(result.data.loginUser.user)
			});
		}

	});
});

//Obtiene un usuario
app.get('/users/:id', function(req, res){ //para pasarle un parámetro
	var query = ' query { user(userID:\"' + req.params.id + '\") { id, username, name, bio, place, public } }';
	graphql.graphql(schema, query).then( function(result) {
		//console.log(JSON.stringify(result,null," "));
		res.json({
			success: true,
			data: result.data.user
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
				data: result.data.createUser.user
			});
		}

	});
});

//Actualiza datos de un usuario
app.put('/users/:id', function(req,res){

	var query = ' query { editUser(userID:\"' + ') }';

});

//Obtiene lista de follows de un usuario
app.get('/users/:id/follows', function(req,res){
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
app.get('/users/:id/followed-by', function(req,res){
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
app.get('/users/:id/relationship', function(req,res){
	
	var query = ' query { relationship(originID: ,targetID: ,) { } }';
  /*var variable = api+"/posts/search/search";
        $http({
            method: 'GET',
            url: variable,
            params: {searchparams:$scope.searchparams,type:'title'},
        }).then(function(response){*/
});

//Modifica la relación entre el usuario y otro usuario
app.post('/users/:id/relationship', function(req,res){
	//Necesario incluir parámetro de ACTION
	var mutation = 'mutation { relationship() {} }';

});


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
