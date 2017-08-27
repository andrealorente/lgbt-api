import { graphql } from 'graphql';
import Schema from './../schema/schema';
import middleware from './../middleware';
import formidable from 'formidable';

var cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: 'tfg-lgbt-cloud',
    api_key: '479641643612759',
    api_secret: 'VAv1oL4JL36U8Fwe9Edix4wj4as'
});

var channelController = {
  //Crear un canal
  createChannel: function(req,res){

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
                              var mutation = "mutation{createChannel(title:\""+ fields.title +"\",content:\""+ fields.content +"\",tags:"+ JSON.stringify(tagspost) +",image:\""+ result.version+"/"+result.public_id +"\",state:\""+ fields.state +"\",author_id:\""+ fields.author +"\"){channel{title,content,tags,image,state,author_id},error{code,message}}}";
  	                       graphql(Schema, mutation).then( function(result) {
  		                      if(result.data.createChannel == null){
  			                     res.json({
  				                    success: false,
  				                    error: "No se ha creado el post"
  			                     });
  		                      }else{
  			                     res.json({
  				                    success: true,
  				                    data: result.data.createChannel.data
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
              var mutation = "mutation{createPost(title:\""+ fields.title +"\",content:\""+ fields.content +"\",tags:"+ JSON.stringify(tagspost) +",image:\"1493935772/no-image_u8eu8r\",state:\""+ fields.state +"\",author_id:\""+ fields.author +"\"){channel{id,title,content,tags,image,state,author_id},error{code,message}}}";
              graphql(Schema, mutation).then( function(result) {
                   if(result.data.createChannel == null){
                       res.json({
                          success: false,
                          error: "No se ha encontrado ningún post con esa ID"
                       });
                    }else{
                       res.json({
                          success: true,
                          data: result.data.createChannel.data
                       });
                    }
              });
          }
      });
  },
  //Obtener todos los canales
  allChannels: function(req, res) {

      var query = 'query { allChannels(userSusc:"",after: \"'+ req.query.after +'\") { data{id, title, description, author, susc},error{code,message} } }';
      graphql(Schema, query).then( function(result) {
          if(result.data.allChannels == null || result.data.allPosts.data.length == 0){
  			res.json({
  				success: false,
  				error: "No se ha encontrado ningún canal con esa ID"
  			});
  		}else{
  			res.json({
  				success: true,
  				data: result.data.allChannels.data
  			});
  		}
      });

  },
  //Obtener un canal concreto
  oneChannel: function(req,res) {

  	var query = 'query { oneChannel(channelID:\"' + req.params.id + '\"){ data{title, description, author, susc, messages {content, created_time}},error{code,message} } }';
  	graphql(Schema, query).then( function(result) {
  		if(result.data.oneChannel.error != null){
  			res.json({
  				success: false,
  				error: result.data.oneChannel.error
  			});
  		}else{
  			res.json({
  				success: true,
  				data: result.data.oneChannel.data
  			});
  		}

      });
  },
  //Enviar mensaje al canal
  sendMessage: function(req,res) {
    var mutation = "mutation { sendMessage(content:\""+ req.body.content +"\", channelID:\""+ req.body.channelID +"\") { data{ content, created_time, channel}, error{code,message} } }";
    graphql(Schema, mutation).then( function(result) {
        console.log(result);
      if(result.data == null){
        res.json({
          success: false,
          error: result.data.sendMessage.error
        });
      }else{
          res.json({
            success: true,
            data: result.data.sendMessage.data
          });

      }
    });
  },
  //Suscribirme a un canal
  suscribeChannel: function(req,res) {
    var mutation = ' mutation { suscribeChannel(userID: \"'+ req.user +'\", channelID: \"'+ req.params.id +'\"){ channels { channel_id, notifications } } }';
    graphql(Schema, mutation).then( function(result) {
        res.json({
        	success: true,
        	data: result.data.suscribeChannel
        });
    });
  },
  //Silenciar canal
  notifChannel: function(req,res){
    var mutation = ' mutation { notifChannel(userID: \"'+ req.body.user_id +'\", channelID: \"'+ req.params.id +'\"){ channels {channel_id, notifications} } }';
    graphql(Schema, mutation).then( function(result) {
        res.json({
        	success: true,
        	data: result.data.notifChannel
        });
    });
  },
  //Obtener los canales a los que estoy suscrito
  myChannels: function(req,res){
    var query = 'query { allChannels(userSusc:\"'+ req.user +'\") { data { id, title, description, susc }, error { code, message } } }';
    graphql(Schema, query).then( function(result) {
        //console.log(JSON.stringify(result,null," "));
        res.json({
          success: true,
          data: result.data.allChannels.data
        });
    });
  },
  getSuscribers: function(req,res) {
    var query = 'query { getSuscribers(channelID:\"'+ req.params.id +'\"){ data { username, name, image, id, public }}}';
    graphql(Schema, query).then(function(result){
      res.json({
        success: true,
        data: result.data.getSuscribers.data
      });
    });
  },
  searchChannel: function(req,res) {
    var query = 'query { searchChannel(searched: \"'+ req.query.text +'\"){ data{ id, title, description, image }, error{code, message}} }';
    graphql(Schema, query).then(function(result) {
      res.json({
        success: true,
        data: result.data.searchChannel.data
      });
    }, function(error){
      console.log("Error: " + error);
      res.json({
        success: false
      });
    });
  }
};

export default channelController;
