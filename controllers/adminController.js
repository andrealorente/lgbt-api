import { graphql } from 'graphql';
import Schema from './../schema/schema';

var adminController = {
  //Obtener usuarios reportados
  usersReported: function(req,res) {
      var query = 'query { usersReported{ data { id, username, name, reports{comment, reason} },error{code,message}} }';
      graphql(Schema, query).then( function(result) {

  		console.log(result); // { data: oneEvent: null }
  		if(result.data.usersReported == null){ //No sé si esto está bien así o habría que mandar el error desde graphql
  			res.json({
  				success: false,
  				error: "No se ha encontrado ningún usuario reportado"
  			});
  		}else{
  			res.json({
  				success: true,
  				data: result.data.usersReported.data
  			});
  		}

      });
  },
  //Eliminar/No Eliminar Usuario
  deleteUser: function(req,res) {
      var mutation = 'mutation { deleteUser(userID:\"' + req.query.userID + '\", type:\"' + req.query.type + '\"){ data { id },error{code,message}} }';
      graphql(Schema, mutation).then( function(result) {
          console.log(result); 
        if(result.data.deleteUser == null){ 
              res.json({
                  success: false,
                  error: "No se ha podido eliminar el usuario"
              });
        }else{
              res.json({
                  success: true,
                  data: result.data.deleteUser.data
              });
        }

      });
  },
  //Buscar usuario
  searchUser: function(req,res) {
      var query = 'query { searchUser{ data { username, name },error{code,message}} }';
      graphql(Schema, query).then( function(result) {
          console.log(result); 
        if(result.data.searchUser == null){ 
              res.json({
                  success: false,
                  error: "No se ha encontrado ningún usuario"
              });
        }else{
              res.json({
                  success: true,
                  data: result.data.searchUser.data
              });
        }

      });
  },
  //Obtener solicitudes de editor
  requestEditor: function(req,res) {
      var query = 'query { requestEditor{ data { id, userID, username, name, image, email, org, reason, state },error{code,message}} }';
      graphql(Schema, query).then( function(result) {
  		if(result.data.requestEditor == null){
  			res.json({
  				success: false,
  				error: "No se ha encontrado ningún usuario reportado"
  			});
  		}else{
  			res.json({
  				success: true,
  				data: result.data.requestEditor.data
  			});
  		}

      });
  },
  //Admitir/Rechazar editor
  convertEditor: function(req,res) {
      var mutation = 'mutation { convertEditor(id:\"' + req.query.id + '\", userID:\"' + req.query.userID + '\", type:\"' + req.query.type + '\"){ data { id },error{code,message}} }';
      graphql(Schema, mutation).then( function(result) {
        if(result.data.convertEditor == null){ 
              res.json({
                  success: false,
                  error: "No se ha encontrado ningún usuario reportado"
              });
        }else{
              res.json({
                  success: true,
                  data: result.data.convertEditor.data
              });
        }

      });
  },
  //Obtener comentarios reportados
  commentsReported: function(req,res) {
      var query = 'query { commentsReported{ data { id, author_data{username, name}, content, reports{comment, reason}},error{code,message}} }';
      graphql(Schema, query).then( function(result) {
          console.log(result); 
        if(result.data.commentsReported == null){ 
              res.json({
                  success: false,
                  error: "No se ha encontrado ningún comentario reportado"
              });
        }else{
              res.json({
                  success: true,
                  data: result.data.commentsReported.data
              });
        }

      });
  },
  //Aprobar/Eliminar comentario
  deleteComment: function(req,res) {
      var mutation = 'mutation { deleteComment{ data { id, username, name },error{code,message}} }';
      graphql(Schema, mutation).then( function(result) {
          console.log(result); 
        if(result.data.deleteComment == null){ 
              res.json({
                  success: false,
                  error: "No se ha encontrado ningún usuario reportado"
              });
        }else{
              res.json({
                  success: true,
                  data: result.data.deleteComment.data
              });
        }

      });
  },
  //Obtener posts reportados
  postsReported: function(req,res) {
      var query = 'query { postsReported{ data { id, author_data{username, name}, title, reports{comment, reason} },error{code,message}} }';
      graphql(Schema, query).then( function(result) {
          console.log(result); 
        if(result.data.postsReported == null){ 
              res.json({
                  success: false,
                  error: "No se ha encontrado ningún post reportado"
              });
        }else{
              res.json({
                  success: true,
                  data: result.data.postsReported.data
              });
        }

      });
  }, 
  //Aprobar/Elimina posts
  deletePost: function(req,res) {
      var mutation = 'mutation { deletePost{ data { id },error{code,message}} }';
      graphql(Schema, mutation).then( function(result) {
          console.log(result); 
        if(result.data.deletePost == null){ 
              res.json({
                  success: false,
                  error: "No se ha encontrado ningún usuario reportado"
              });
        }else{
              res.json({
                  success: true,
                  data: result.data.deletePost.data
              });
        }

      });
  },
  //Obtener canales reportados
  channelsReported: function(req,res) {
      var query = 'query { channelsReported{ data { id, author_data{username, name}, title, reports{comment, reason} },error{code,message}} }';
      graphql(Schema, query).then( function(result) {
          console.log(result); 
        if(result.data.channelsReported == null){ 
              res.json({
                  success: false,
                  error: "No se ha encontrado ningún post reportado"
              });
        }else{
              res.json({
                  success: true,
                  data: result.data.channelsReported.data
              });
        }

      });
  }, 
  //Aprobar/Elimina canal
  deleteChannel: function(req,res) {
      var mutation = 'mutation { deleteChannel{ data { id },error{code,message}} }';
      graphql(Schema, mutation).then( function(result) {
          console.log(result); 
        if(result.data.deleteChannel == null){ 
              res.json({
                  success: false,
                  error: "No se ha encontrado ningún usuario reportado"
              });
        }else{
              res.json({
                  success: true,
                  data: result.data.deleteChannel.data
              });
        }

      });
  },
  //Obtener últimos comentarios
  lastComments: function(req,res) {
      var query = 'query { lastComments{ data { content, created_time },error{code,message}} }';
      graphql(Schema, query).then( function(result) {

        console.log(result); 
        if(result.data.lastComments == null){ 
              res.json({
                  success: false,
                  error: "No se ha encontrado ningún usuario reportado"
              });
          }else{
              res.json({
                  success: true,
                  data: result.data.lastComments.data
              });
          }

      });
  }
};

export default adminController;
