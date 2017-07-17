import express from 'express';
var http = require('http');

import mongoose from 'mongoose';
import graphqlHTTP from 'express-graphql';
import bodyParser from 'body-parser';
import cors from 'cors';
import formidable from 'formidable';
import cloudinary from 'cloudinary';
cloudinary.config({
    cloud_name: 'tfg-lgbt-cloud',
    api_key: '479641643612759',
    api_secret: 'VAv1oL4JL36U8Fwe9Edix4wj4as'
});
import jwt from 'jwt-simple';
import moment from 'moment';
import middleware from './middleware';
import config from './config';
import Schema from './schema/schema';

import postController from './controllers/postController';
import userController from './controllers/userController';
import eventController from './controllers/eventController';
import channelController from './controllers/channelController';
import adminController from './controllers/adminController';

//Conectar con la bd
mongoose.connect('mongodb://admin:admin@ds145868.mlab.com:45868/lgbt-app');

const app = express();
var server = http.Server(app);
var io = require('socket.io')(server);

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());
app.use(cors());
app.use('/graphql', graphqlHTTP(async () => ({
  schema: Schema,
  graphiql: true,
})));

/******** RUTAS DE POSTS *******/

//Crear un post
app.post('/v1/create/post', middleware.ensureAuthorised, postController.createPost);
//Obtener todos los posts
app.get('/v1/posts', middleware.ensureAuthorised, postController.allPosts);
//Obtener un post concreto
app.get('/v1/posts/:id', middleware.ensureAuthorised, postController.onePost);
//Ver likes de un post
app.get('/v1/posts/:id/likes', middleware.ensureAuthorised, postController.getLikes);
//Modificar un post concreto
app.post('/v1/posts/:id/update',middleware.ensureAuthorised, postController.updatePost);
//Comentar en un post
app.post('/v1/posts/:id/comments', middleware.ensureAuthorised, postController.commentPost);
//Dar like a un post
app.post('/v1/posts/:id/likes', middleware.ensureAuthorised, postController.likePost);
//Buscar un post por titulo
app.get('/v1/search/post',middleware.ensureAuthorised, postController.searchPost);

/******* RUTAS DE CANALES ******/

//Crear un canal
app.post('/v1/create/channel', middleware.ensureAuthorised, channelController.createChannel);
//Obtener todos los canales
app.get('/v1/channels', middleware.ensureAuthorised, channelController.allChannels);
//Obtener los canales a los que estoy suscrito
app.get('/v1/me/channels', middleware.ensureAuthorised, channelController.myChannels);
//Obtener un canal concreto
app.get('/v1/channels/:id', middleware.ensureAuthorised, channelController.oneChannel);
//Enviar mensaje al canal
app.post('/v1/channels/:id/message', middleware.ensureAuthorised, channelController.sendMessage);
//Suscribirse a un canal
app.post('/v1/channels/:id/suscribe', middleware.ensureAuthorised, channelController.suscribeChannel);
//Silenciar notificaciones de un canal
app.post('/v1/channels/:id/notifications', middleware.ensureAuthorised, channelController.notifChannel);

/******* RUTAS DE EVENTOS ********/

//Crear un evento
app.post('/v1/create/event', middleware.ensureAuthorised, eventController.createEvent);
//Obtener los eventos de un mes
app.get('/v1/events', middleware.ensureAuthorised, eventController.allEvents);
//Obtener un evento
app.get('/v1/events/:id', middleware.ensureAuthorised, eventController.oneEvent);
//Ver asistentes de un evento
app.get('/v1/events/:id/assist', middleware.ensureAuthorised, eventController.assistantsEvent);
//Ver interesados de un evento
app.get('/v1/events/:id/interested', middleware.ensureAuthorised, eventController.interestedEvent);
//Asistir a un evento
app.post('/v1/events/:id/assist', middleware.ensureAuthorised, eventController.assistEvent);
//Me interesa un evento
app.post('/v1/events/:id/interested', middleware.ensureAuthorised, eventController.interestEvent);
//Comentar un evento
app.post('/v1/events/:id/comments', middleware.ensureAuthorised, eventController.commentEvent);

/******* RUTAS DE USUARIO ********/

//Loguear un usuario
app.post('/v1/users/login', userController.loginUser);
//Loguear/registrar con fb
app.post('/v1/users/login/facebook', userController.loginFB);
//Obtiene un usuario
app.get('/v1/users/:id', middleware.ensureAuthorised, userController.getUser);
//Crea un usuario
app.post('/v1/users', userController.createUser);
//Actualiza datos de un usuario
app.post('/v1/users/:id', middleware.ensureAuthorised, userController.editUser);
//Obtiene lista de follows de un usuario
app.get('/v1/users/:id/follows', middleware.ensureAuthorised, userController.getFollows);
//Obtiene lista de followed-by de un usuario
app.get('/v1/users/:id/followed-by', middleware.ensureAuthorised, userController.getFollowedby);
//Obtiene la relación entre el usuario y otro usuario
app.get('/v1/users/:id/relationship', middleware.ensureAuthorised, userController.getRelationship);
//Modifica la relación entre el usuario y otro usuario
app.post('/v1/users/:id/relationship', middleware.ensureAuthorised, userController.setRelationship);
//Cargar peticiones de seguimiento
app.get('/v1/requests', middleware.ensureAuthorised, userController.getRequests);
//Carga la actividad de los seguidos del usuario
app.get('/v1/activity', middleware.ensureAuthorised, userController.getActivity);
//Confirmar correo
app.post('/v1/users/confirm', userController.confirmAccount);
//Reportar usuario/comentario/canal
app.post('/v1/report', middleware.ensureAuthorised, userController.report);
//Solicitar rango de editor-request
app.post('/v1/editor', middleware.ensureAuthorised, function(req,res){
  var mutation = ` mutation { editRequest(userID, email, reason){ data { username }, error { code, message }} }`;

});
app.post('/v1/firebase', middleware.ensureAuthorised, userController.saveFirebase);

/******* RUTAS DE ADMINISTRACION ********/
//Obtener usuarios reportados
app.get('/v1/admin/users', middleware.ensureAuthorised, adminController.usersReported);


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });
  socket.on('disconnect', function(){
    console.log('user disconnected');
    io.emit('chat message', 'A user disconnected');
  });
  var rooms = [];
  socket.on('join', function(roomId){
    socket.join(roomId);
  });
});

/*var server = app.listen(process.env.PORT || 8080, function () {
  var port = server.address().port;
  console.log("App now running on port", port);
});*/
server.listen(process.env.PORT || 3000, function(){
  console.log('listening on *:3000');
});
