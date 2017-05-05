//var server = require ('./../graphql-server');
var express = require('express');
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
var middleware = require('./../middleware');
var config = require('./../config');
//Inicializar el objeto de express
var app = express();
//var schema = new graphql.GraphQLSchema({query: queryType, mutation: mutationType});


//Update Post
app.post('/posts/:id/update',middleware.ensureAuthorised,function(req,res){
    console.log("hola");
    //console.log(req);
    
    var form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.multiples = true;
    console.log(form);
    
    form.parse(req, function(err, fields, files){
        var temp_path;
        console.log(fields);
        if (files.images) {
            if (!files.images.length) {
                if (files.images.name != "") {
                    //console.log(files.images.path);
                    temp_path = files.images.path;
                    cloudinary.uploader.upload(
                        temp_path,
                        function (result) {
                            //console.log("RESULT"+result);
                            //plan.images.push(result.public_id);
                            console.log("Actualizado con 1 foto");
                            var query = "mutation{updatePost(postID:\""+ fields.id +"\",title:\""+ fields.title +"\",content:\""+ fields.content +"\",tags:\""+ fields.tags +"\",image:\""+ files.images.name +"\"){id,title,content,tags,image}}";
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
				                    data: result.data
			                     });	
		                      }
        
                            });            
                        },
                        {
                            crop: 'limit',
                            width: 300,
                            height: 300,
                            format: "png",
                            folder: "posts"//,
                            //tags: ['posts', Post._id, Post.name, user.account.user]
                        }
                    );
                } else {
                    //updatePlan();
                    console.log("Actualizado sin 1 foto");
                }
            }
        }
    });
});