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

//Crear un post
module.exports.createPost = function(req,res){

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
                            var mutation = "mutation{createPost(title:\""+ fields.title +"\",content:\""+ fields.content +"\",tags:"+ JSON.stringify(tagspost) +",image:\""+ result.version+"/"+result.public_id +"\",state:\""+ fields.state +"\",author_id:\""+ fields.author +"\"){post{title,content,tags,image,state,author_id},error{code,message}}}";
	                       graphql.graphql(schema, mutation).then( function(result) {
		                      if(result.data.createPost == null){
			                     res.json({
				                    success: false,
				                    error: "No se ha creado el post"
			                     });
		                      }else{
			                     res.json({
				                    success: true,
				                    data: result.data.createPost
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
            graphql.graphql(schema, mutation).then( function(result) {
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
};
//Obtener todos los posts
module.exports.allPosts = function(req, res) {

    var query = 'query { allPosts { post { id, title, content, author_id, author_data { username, name },tags },error{code,message}} }';
    graphql.graphql(schema, query).then( function(result) {
        //console.log(JSON.stringify(result,null," "));
        if(result.data.allPosts == null){
    			res.json({
    				success: false,
    				error: "No se ha encontrado ningún post en la base de datos."
    			});
    		}else{
    			res.json({
    				success: true,
    				data: result.data.allPosts
    			});
		     }
    });

};
//Obtener un post concreto
module.exports.onePost = function(req,res) {

	var query = 'query { onePost(postID:\"' + req.params.id + '\") {post{ title, author_id, author_data { username, name }, content, tags, image, likes, comments( targetID: \"' + req.params.id +'\") { content, author_id, author_data { username, name }, created_time } },error{code,message}} }';
	graphql.graphql(schema, query).then( function(result) {
        console.log(result);
		if(result.data.onePost == null){
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
};
//Modificar un post concreto
module.exports.updatePost = function(req,res){

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
};
//Comentar en un post
module.exports.commentPost = function(req,res){
  var userid = req.body.user_id;
	var content = req.body.content;
	var targetid = req.body.target_id;

	var mutation = ' mutation { commentPost(userID:\"' + userid + '\", postID:\"'+ targetid +'\", content:\"'+ content +'\" ) { comment { id, content }, error{ code, message } } }';
  graphql.graphql(schema, mutation).then( function(result) {
    res.json({
     success: true,
     data: result
    });
  });
};
//Dar like a un post
module.exports.likePost = function(req,res){
  var mutation = ' mutation { likePost(userID: \"' + req.user  + '\",postID: \"' + req.params.id + '\" ) { data, error{ code, message } } }';
  graphql.graphql(schema, mutation).then( function(result) {
       res.json({
         success: true,
         count: result.data.likePost.data
       });
  });
};
//Buscar post
module.exports.searchPost = function(req,res){
    var query = 'query { searchPost(searchparams:\"' + req.query.searchparams + '\",type:\"' + req.query.type + '\") {post{title,content,author_id},error{code,message}}}';
    graphql.graphql(schema, query).then( function(result) {
        console.log(result.data.searchPost.post);
		if(result.data.searchPost == null){
			res.json({
				success: false,
				error: "No se ha encontrado ningún post"
			});
		}else{
			res.json({
				success: true,
				data: result.data.searchPost
			});
		}

    });
};
//Obtener los usuarios que han dado like a un post
module.exports.getLikes = function(req,res){

  var query = 'query { getUsersLikes(postID:\"'+req.params.id+'\") { id, username, name, bio, public } }';
  graphql.graphql(schema, query).then( function(result) {
        console.log(result);
		if(result.data.getUsersLikes == null){
			res.json({
				success: false,
				error: "No se ha encontrado ningún usuario en los likes."
			});
		}else{
			res.json({
				success: true,
				data: result.data.getUsersLikes
			});
		}
    });
};
