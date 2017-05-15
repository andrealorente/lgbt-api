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


var queryType = require('./../schema/queryType');
var mutationType = require('./../schema/mutationType');

var schema = new graphql.GraphQLSchema({query: queryType, mutation: mutationType});

//Crear un canal
module.exports.createChannel = function(req,res){

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
	                       graphql.graphql(schema, mutation).then( function(result) {
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
            graphql.graphql(schema, mutation).then( function(result) {
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
};
//Obtener todos los canales
module.exports.allChannels = function(req, res) {

    var query = 'query { allChannels(userSusc:"") { data{id, title, description},error{code,message} } }';
    graphql.graphql(schema, query).then( function(result) {
        if(result.data.allChannels == null){
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

};
//Obtener un canal concreto
module.exports.oneChannel = function(req,res) {

	var query = 'query { oneChannel(channelID:\"' + req.params.id + '\"){ data{title, description, author},error{code,message} } }';
	graphql.graphql(schema, query).then( function(result) {

		console.log(result); // { data: oneEvent: null }
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
};
//Enviar mensaje al canal
module.exports.sendMessage = function(req,res) {
    console.log(req.body);
    var mutation = "mutation { sendMessage(content:\""+ req.body.content +"\", channelID:\""+ req.body.channelID +"\") { message{ content, created_time, channel}, error{code,message} } }";
    graphql.graphql(schema, mutation).then( function(result) {
        if(result.data == null){
            console.log(result);
             res.json({
                success: false,
                error: "No se ha podido enviar ningún mensaje."
             });
          }else{
             res.json({
                success: true,
                data: result.data.sendMessage
             });
          }
    });
};
//Suscribirme a un canal
module.exports.suscribeChannel = function(req,res) {
  var mutation = ' mutation { suscribeChannel(userID: \"'+ req.user +'\", channelID: \"'+ req.params.id +'\"){ channels { channel_id, notifications } } }';
  graphql.graphql(schema, mutation).then( function(result) {
      res.json({
      	success: true,
      	data: result.data.suscribeChannel
      });
  });
};
//Silenciar canal
module.exports.notifChannel = function(req,res){
  var mutation = ' mutation { notifChannel(userID: \"'+ req.body.user_id +'\", channelID: \"'+ req.params.id +'\"){ channels {channel_id, notifications} } }';
  graphql.graphql(schema, mutation).then( function(result) {
      res.json({
      	success: true,
      	data: result.data.notifChannel
      });
  });
};
//Obtener los canales a los que estoy suscrito
module.exports.myChannels = function(req,res){
  var query = 'query { allChannels(userSusc:\"'+ req.user +'\") { id, title, description } }';
  graphql.graphql(schema, query).then( function(result) {
      //console.log(JSON.stringify(result,null," "));
      res.json({
        success: true,
        data: result.data
      });
  });
};
