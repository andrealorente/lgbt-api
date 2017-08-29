import { graphql } from 'graphql';
import Schema from './../schema/schema';
import formidable from 'formidable';
import cloudinary from 'cloudinary';
import middleware from './../middleware';

cloudinary.config({ //No sé si hace falta poner esto
    cloud_name: 'tfg-lgbt-cloud',
    api_key: '479641643612759',
    api_secret: 'VAv1oL4JL36U8Fwe9Edix4wj4as'
});

var postController = {
  //Crear un posts
  createPost: function(req,res){

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
                              format: "jpg",
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
  //Obtener todos los posts
  allPosts: function(req, res) {console.log(req);
      var query = 'query { allPosts(after: \"'+ req.query.after +'\") { data { id, title, content, image, author_id, author_data { username, image },tags, created_time, likes, comments_count },error{code,message}} }';
      graphql(Schema, query).then( function(result) {
          if(result.data.allPosts == null){
              res.json({
                  success: false,
                  error: "No se ha encontrado ningún post en la base de datos."
              });
          }else{
              if(result.data.allPosts.data.length == 0){
                  res.json({
                      success: false,
                      error: "No se ha encontrado ningún post en la base de datos."
                  });
              }else{
                  res.json({
                      success: true,
                      data: result.data.allPosts.data
                  });
              }
          }
      });
  },
  //Obtener un post
  onePost: function(req,res) {
  	var query = 'query { onePost(postID:\"' + req.params.id + '\") {data{ title, author_id, author_data { username, name, image }, content, created_time, tags, image, likes, comments( targetID: \"' + req.params.id +'\") { id, content, author_id, author_data { username, image }, created_time } },error{code,message}} }';
  	graphql(Schema, query).then( function(result) {
      //console.log(result);
  		if(result.data.onePost == null){
  			res.json({
  				success: false,
  				error: "No se ha encontrado ningún post con esa ID"
  			});
  		}else{
  			res.json({
  				success: true,
  				data: result.data.onePost.data
  			});
  		}

      });
  },
  //Actualizar un post
  updatePost: function(req,res){

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
  //Comentar en un post
  commentPost: function(req,res){
    var userid = req.user;
  	var content = req.body.content;
  	var targetid = req.body.target_id;

    console.log(userid);

  	var mutation = ' mutation { commentPost(userID:\"' + userid + '\", postID:\"'+ targetid +'\", content:\"'+ content +'\" ) { data { id, content, author_id, created_time }, error{ code, message } } }';
    graphql(Schema, mutation).then( function(result) {
      res.json({
       success: true,
       data: result.data.commentPost.data
      });
    });
  },
  //Dar like a un post
  likePost: function(req,res){
    var mutation = ' mutation { likePost(userID: \"' + req.user  + '\",postID: \"' + req.params.id + '\" ) { data, error{ code, message } } }';
    graphql(Schema, mutation).then( function(result) {
         res.json({
           success: true,
           count: result.data.likePost.data
         });
    });
  },
  //Buscar post
  searchPost: function(req,res){
      console.log(req);
      var query = 'query { searchPost(searchparams:\"' + req.query.searchparams + '\",type:\"' + req.query.type + '\") {data{title,content,author_id},error{code,message}}}';
      graphql(Schema, query).then( function(result) {
          console.log(result.data.searchPost.post);
  		if(result.data.searchPost == null){
  			res.json({
  				success: false,
  				error: "No se ha encontrado ningún post"
  			});
  		}else{
  			res.json({
  				success: true,
  				data: result.data.searchPost.data
  			});
  		}

      });
  },
  //Obtener los usuarios que han dado like a un post
  getLikes: function(req,res){

    var query = 'query { getUsersLikes(postID:\"'+req.params.id+'\", after: \"'+req.query.after+'\") { id, username, name, image, public } }';
    graphql(Schema, query).then( function(result) {
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
  }
};

export default postController;
