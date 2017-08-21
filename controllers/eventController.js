import { graphql } from 'graphql';
import Schema from './../schema/schema';
import middleware from './../middleware';
var formidable = require('formidable');
var cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: 'tfg-lgbt-cloud',
    api_key: '479641643612759',
    api_secret: 'VAv1oL4JL36U8Fwe9Edix4wj4as'
});

var eventController = {
  //Crear un evento
  createEvent: function(req,res){

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
                              var mutation = "mutation{createPost(title:\""+ fields.title +"\",content:\""+ fields.content +"\",tags:"+ JSON.stringify(tagspost) +",image:\""+ result.version+"/"+result.public_id +"\",state:\""+ fields.state +"\",author_id:\""+ fields.author +"\"){data{title,content,tags,image,state,author_id},error{code,message}}}";
  	                       graphql(Schema, mutation).then( function(result) {
  		                      if(result.data.createPost == null){
  			                     res.json({
  				                    success: false,
  				                    error: "No se ha creado el post"
  			                     });
  		                      }else{
  			                     res.json({
  				                    success: true,
  				                    data: result.data.createPost.data
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
              var mutation = "mutation{createPost(title:\""+ fields.title +"\",content:\""+ fields.content +"\",tags:"+ JSON.stringify(tagspost) +",image:\"1493935772/no-image_u8eu8r\",state:\""+ fields.state +"\",author_id:\""+ fields.author +"\"){post{id,title,content,tags,image,state,author_id},error{code,message}}}";
              graphql(Schema, mutation).then( function(result) {
                   if(result.data.createPost == null){
                       res.json({
                          success: false,
                          error: "No se ha encontrado ningún post con esa ID"
                       });
                    }else{
                       res.json({
                          success: true,
                          data: result.data.createPost
                       });
                    }
              });
          }
      });
  },
  //Obtener los eventos de un mes
  allEvents: function(req, res) {
      //Se le pasan los parámetros en la url -> /events?month=4&year=2017 en RESTClient
      var query = 'query { allEvents (month:'+ req.query.month + ', year:'+ req.query.year +') { data{ id, title, description, place, start_time, assistants, interested }, error { code, message } } }';
      graphql(Schema, query).then( function(result) {
          if(result.data.allEvents == null){
              res.json({
                  success: false,
                  error: "No se ha encontrado ningún evento en la base de datos."
              });
          }else{
              res.json({
                  success: true,
                  data: result.data.allEvents.data
              });
          }
      });
  },
  //Obtener un evento concreto
  oneEvent: function(req,res) {
    var query = 'query { oneEvent(eventID:\"' + req.params.id + '\") { data {title, description, place, created_time, start_time, end_time, author_id, author_data { username, image }, comments(targetID:\"' + req.params.id +'\") { author_data { id, username, image }, content, created_time }, assistants, interested }} }';
    graphql(Schema, query).then( function(result) {
		console.log(result); // { data: oneEvent: null }
		if(result.data.oneEvent == null){ //No sé si esto está bien así o habría que mandar el error desde graphql
			res.json({
				success: false,
				error: "No se ha encontrado ningún evento con esa ID"
			});
		}else{
			res.json({
				success: true,
				data: result.data.oneEvent.data
			});
		}

    });
  },
  //Modificar un evento concreto
  updateEvent: function(req,res){

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
                              var mutation = "mutation{updatePost(postID:\""+ fields.id +"\",title:\""+ fields.title +"\",content:\""+ fields.content +"\",tags:"+ JSON.stringify(tagspost) +",image:\""+ result.version+"/"+result.public_id +"\",state:\""+ fields.state +"\"){data{id,title,content,tags,image,state},error{code,message}}}";
  	                       graphql(Schema, mutation).then( function(result) {
  		                      if(result.data.updatePost == null){
  			                     res.json({
  				                    success: false,
  				                    error: "No se ha encontrado ningún post con esa ID"
  			                     });
  		                      }else{
  			                     res.json({
  				                    success: true,
  				                    data: result.data.updatePost.data
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
              graphql(Schema, mutation).then( function(result) {
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
  },
  //Ver asistentes de un evento
  assistantsEvent: function(req,res){
    var query = ' query { getInterestedOrAssistants(eventID:\"'+ req.params.id +'\", rel: 1){ data{ id, username, name, image, public}, error {code, message}} }';
    graphql(Schema, query).then(function(result) {
      res.json({
        success: true,
        data: result.data.getInterestedOrAssistants.data
      })
    });
  },
  //Ver interesados en un evento
  interestedEvent: function(req,res){
    var query = ' query { getInterestedOrAssistants(eventID:\"'+ req.params.id +'\", rel: 2){ data{ id, username, name, image, public}, error {code, message}} }';
    graphql(Schema, query).then(function(result) {
      
      res.json({
        success: true,
        data: result.data.getInterestedOrAssistants.data
      })
    });
  },
  //Asistir a un evento
  assistEvent: function(req,res){
      var mutation = 'mutation { assistEvent(userID: \"'+ req.body.user_id +'\", eventID: \"'+ req.params.id +'\") { assistants, interested } }';
      graphql(Schema, mutation).then( function(result) {
          if(result.data.assistEvent == null){
  			res.json({
  				success: false,
  				error: "No se ha podido realizar la petición."
  			});
  		}else{
  			res.json({
  				success: true,
  				data: result.data.assistEvent.data
  			});
  		}
    });
  },
  //Me interesa un evento
  interestEvent: function(req,res){
    var mutation = 'mutation { interestEvent(userID: \"'+ req.body.user_id +'\", eventID: \"'+ req.params.id +'\") { assistants, interested } }';
    graphql(Schema, mutation).then( function(result) {
      res.json({
      	success: true,
      	data: result.data.interestEvent
      });
    });
  },
  //Comentar un evento
  commentEvent: function(req,res){
    var userid = req.user;
    var content = req.body.content;
    var targetid = req.body.target_id;

    console.log(userid);

    var mutation = ' mutation { commentEvent(userID:\"' + userid + '\", eventID:\"'+ targetid +'\", content:\"'+ content +'\" ) { data { id, content, author_id, created_time }, error{ code, message } } }';
    graphql(Schema, mutation).then( function(result) {
      res.json({
       success: true,
       data: result.data.commentEvent.data
      });
    });
  },

  searchEvent: function(req, res) {
    var query = 'query { searchEvent(searched: \"'+ req.query.text +'\"){ data { id, title, description, image}, error { code, message}}}';
    graphql(Schema, query).then(function(result) {
      if(result.data.searchEvent.error)
        res.json({
          success: false,
          error: result.data.searchEvent.error
        });

      res.json({
        success: true,
        data: result.data.searchEvent.data
      })
    });
  }
};

export default eventController;
