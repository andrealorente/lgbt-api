import { graphql } from 'graphql';
import Schema from './../schema/schema';
import moment from 'moment';
import jwt from 'jwt-simple';
import config from './../config';
import middleware from './../middleware';
var path = require('path');

var createToken = function(user) {
  console.log(user);
  var payload = {
    sub: user.id,
    iat: moment().unix(),
    exp: moment().add(14, "days").unix()
  };

  return jwt.encode(payload, config.TOKEN_SECRET);
};

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('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');


var userController = {
  loginUser: function(req,res) {
    var user = req.body.user_name;
  	var pswd = req.body.user_pswd;
   
  	var mutation = 'mutation { loginUser(username: \"' + user + '\", password: \"'+pswd +'\"){ user { id, username, name, public, image, role }, error { code, message } } }';

  	graphql(Schema, mutation).then( function(result) {
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
  },

  loginFBGg: function(req,res) {
    var email = req.body.email;
    var name = req.body.name;

    var mutation = 'mutation { loginFBGg(email: \"' + email + '\", name: \"'+name +'\"){ user { id, username, name, public, image, role }, error { code, message } } }';

  	graphql(Schema, mutation).then( function(result) {
  		//console.log(JSON.stringify(result));
  		console.log(result);
  		if(result.data.loginFBGg.user==null){
  			res.json({
  				success: false,
  				error: result.data.loginFBGg.error
  			});
  		}else{
  			res.json({
  				success: true,
  				data: result.data.loginFBGg.user,
  				token: createToken(result.data.loginFBGg.user)
  			});
  		}
  	});
  },

  createUser: function(req,res) {
    
    var username = req.body.user_name;
  	var email = req.body.user_email;
  	var pswd = req.body.user_pswd;

    console.log(req.body);

  	var mutation = ' mutation { createUser(username:\"'+ username +'\", email: \"' + email + '\", pswd: \"'+ pswd +'\") { user{id, username, name}, error {code, message} } }';
    console.log(mutation);
  	graphql(Schema, mutation).then( function(result) {
  		//console.log(JSON.stringify(result,null," "));
  		if(result.data.createUser.user==null){
  			res.json({
  				success: false,
  				error: result.data.createUser.error
  			});
  		}else{
        let url = 'https://lgbt-api.herokuapp.com/v1/confirm?id='+result.data.createUser.user.id;
        
        const msg = {
          to: email,
          from: 'lgbtcast.tfg@gmail.com',
          subject: '¡Bienvenido a LGBTcast!',
          text: 'Confirma tu correo electrónico para empezar a conocer las novedades del colectivo LGBT.',
          html: '<p>Haz click en el enlace siguiente para confirmar tu correo electrónico: </p><p><a href=\"'+url+'\">Confirmar correo</a></p><p>Si no has sido tú ignora este correo.</p>',
        };
        sgMail.send(msg);

  			res.json({
  				success: true,
  				data: result.data.createUser.user
  			});
  		}
  	});
    
    

    /*res.send("hola");*/
    
  },
  getUser: function(req,res) {
    var user = req.params.id;
    if(req.params.id == "me"){
      user = req.user; //En req.user está la id que coge del token de la cabecera
    }
  
  	var query = ' query { user(userID:\"' + user + '\") { id, username, name, bio, image, place, counts { followedby, following }, public, activity { action, target_id, created_time, type } } }';
  	graphql(Schema, query).then( function(result) {
  		//console.log(JSON.stringify(result,null," "));
  		res.json({
  			success: true,
  			data: result.data.user,
  		});
  	});
  },
  editUser: function(req,res) { //Editar usuario
    var username = req.body.user_username;
    var name = req.body.user_name;
    var bio = req.body.user_bio;
    var gender = req.body.user_gender;
    var image = req.body.user_image;
    var place = req.body.user_place;

    var mutation = ` mutation { editUser(userID: \"`+req.user+`\", username: \"`+username+`\",
      name: \"`+name+`\", bio: \"`+bio+`\", gender: \"`+gender+`\", image: \"`+image+`\" ) {
      data { username, name, bio, email, gender, image },
      error{code, message} } }`;
    graphql(Schema,mutation).then(function(result){
      if(result.data.editUser.error==null) {
        res.json({
          success: true,
          data: result.data.editUser.data
        });
      }else{
        res.json({
          success: false,
          error: result.data.editUser.error
        });
      }
    });
  },
  changePrivacity: function(req,res){
    var mutation = 'mutation { privacity(userID: \"'+req.user+'\"){ data, error { code, message }}}';
    graphql(Schema, mutation).then(function(result){
      if(result.data.privacity.error)
        res.json({
          success: false,
          error: result.data.privacity.error
        });

      res.json({
        success: true,
        data: result.data.privacity.data
      });
    });
  },
  changePassword: function(req,res) {
      
      var jsonbody = JSON.stringify(req.body);
    if(jsonbody == "{}"){
        var mutation = 'mutation { changePswd(userID: \"'+ req.user +'\",oldPswd: \"'+ req.query.user_oldpswd +'\", newPswd: \"'+ req.query.user_newpswd +'\" ) { data, error { code, message } } }';
    }
    else{
        var mutation = 'mutation { changePswd(userID: \"'+ req.user +'\",oldPswd: \"'+ req.body.user_oldpswd +'\", newPswd: \"'+ req.body.user_newpswd +'\" ) { data, error { code, message } } }';
    }
    graphql(Schema, mutation).then(function(result) {
      console.log(result.data.changePswd);
      if(result.data.changePswd.error){
        res.json({
          success: false,
          error: result.data.changePswd.error
        });
      }else{
        res.json({
          success: true,
          data: result.data.changePswd.data
        });
      }
    });
  },
  getFollows: function(req,res) {

    var query = ' query { user(userID:\"' + req.params.id + '\") { relationships { id, user_data { username, name, public, image }, outgoing_status, incoming_status } } }';

    graphql(Schema, query).then( function(result) {
  		//console.log(JSON.stringify(result,null," "));
      var relationships = [];

      for(var i in result.data.user.relationships ){
          if(result.data.user.relationships[i].outgoing_status=="follows")
            relationships.push(result.data.user.relationships[i]);
      }
  		res.json({
  			success: true,
  			data: relationships
  		});
  	});
  },
  getFollowedby: function(req,res){
    var query = ' query { user(userID:\"' + req.params.id + '\") { relationships { id, user_data {username, name, public, image }, outgoing_status, incoming_status } } }';
  	graphql(Schema, query).then( function(result) {
  		//console.log(JSON.stringify(result,null," "));
      var relationships = [];
      for(var i in result.data.user.relationships ){
          if(result.data.user.relationships[i].incoming_status=="followed-by")
            relationships.push(result.data.user.relationships[i]);
      }
  		res.json({
  			success: true,
  			data: relationships
  		});
  	});
  },
  getRelationship: function(req,res){
    var query = ' query { relationship(originID:\"'+req.user+'\" ,targetID: \"'+req.params.id+'\") { status { outgoing, incoming }, error { code, message } } }';
    graphql(Schema, query).then( function(result) {
      console.log(result.data.relationship.status);
      if(result.data.relationship.error == null){
        res.json({
    			success: true,
    			data: result.data.relationship.status
    		});
      }else{
        res.json({
          success: false,
          data: result.data.relationship.error
        });
      }
  	});
  },
  setRelationship: function(req,res) {
    //Necesario incluir parámetro de ACTION
  	var mutation = 'mutation { relationship(originID:\"'+ req.user +'\", targetID:\"'+ req.params.id +'\", action:\"'+req.body.action+'\") { status , error { code, message } } }';
    graphql(Schema, mutation).then( function(result) {
  		//console.log(JSON.stringify(result,null," "));
  		res.json({
  			success: true,
  			data: result.data.relationship.status
  		});
  	});
  },
  getRequests: function(req,res) {
    var query = ' query { user(userID:\"' + req.user + '\") { relationships { id, user_data { username, name, public, image }, outgoing_status, incoming_status } } }';
  	graphql(Schema, query).then( function(result) {
  		//console.log(JSON.stringify(result,null," "));
      var relationships = [];
      console.log(result);
      for(var i in result.data.user.relationships ){
          if(result.data.user.relationships[i].incoming_status=="requested-by")
            relationships.push(result.data.user.relationships[i]);
      }
  		res.json({
  			success: true,
  			data: relationships
  		});
  	});
  },
  getActivity: function(req,res) {
    var query = ` query { activity (userID: \"`+ req.user +`\", after: \"`+req.query.after+`\"){
      origin_id, target_id, action, created_time, type, origin_data { username, image, public }
    } }`;
    graphql(Schema, query).then( function(result) {
      console.log(result);
      res.json({
        success: true,
        data: result.data.activity
      });
    });
  },
  confirmAccount: function(req,res) {
    var mutation = ' mutation { confirmAccount(userID: \"'+ req.query.id +'\") { data{ id, confirm }, error { code, message } } }';
    console.log(mutation);
    console.log(req.query.id);
    
    graphql(Schema, mutation).then( function(result) {
      if(result.data.confirmAccount.error == null){
        res.sendFile(path.join(__dirname, '../html', 'confirmed.html'));
      }else{
        res.send("Ha habido un error");
      }
    });
  },
  report: function(req,res) {
    console.log(req.body);
    var mutation = 'mutation {report(originID:\"'+req.user+'\", targetID: \"'+req.body.target_id+'\",targetType: '+req.body.target_type+' , reason: \"'+ req.body.reason +'\") {data, error { code, message } } }';

    graphql(Schema, mutation).then( function(result) {
      if(result.data.report.error) {
        res.json({
          success: false,
          error: result.data.report.error
        });
      }
      res.json({
        success: result.data.report.data
      });
    });
  },
  searchUser: function(req, res) {
    var query = 'query { searchUser(searched: \"'+ req.query.text +'\") { data {id, username, name, image, public }, error {code, message}} }';
    graphql(Schema, query).then(function(result) {
      if(result.data.searchUser.error){
        res.json({
          success: false,
          error: result.data.searchUser.error
        });
      }else{
        res.json({
          success: true,
          data: result.data.searchUser.data
        })
      }
    });
  },
  becomeEditor: function(req, res) {
    console.log(req.body);
    var mutation = 'mutation { editRequest(userID: \"'+req.user+'\", email: \"'+req.body.email+'\", name: \"'+req.body.name+'\", org: \"'+req.body.org +'\",reason: \"'+req.body.reason+'\" ) { data { username, name }, error { code, message }}}';
    console.log(mutation);
    graphql(Schema, mutation).then(function(result) {
      if(result.data.editRequest.error){
        res.json({
          success: false,
          error: result.data.editRequest.error
        });
      }else{
        res.json({
          success: true,
          data: result.data.editRequest.data
        });
      }
    });
  },
  becomeEditorCMS: function(req, res) {
    console.log(req);
    var mutation = 'mutation { editRequestCMS(email: \"'+req.body.email+'\", username: \"'+req.body.username+'\", pswd: \"'+req.body.pswd+'\", org: \"'+req.body.org +'\",reason: \"'+req.body.reason+'\" ) { data { username, name }, error { code, message }}}';
    console.log(mutation);
    graphql(Schema, mutation).then(function(result) {
      if(result.data.editRequestCMS.error){
        res.json({
          success: false,
          error: result.data.editRequestCMS.error
        });
      }else{
        res.json({
          success: true,
          data: result.data.editRequestCMS.data
        });
      }
    });
  },
  saveFirebase: function(req,res) {
    console.log(req.user);
      var mutation = ` mutation {
          saveFirebase(userID: \"`+req.user+`\", token: \"`+req.body.firebase_token+`\") {
          data, error { code, message } } }`;

      graphql(Schema,mutation).then(function(result) {
        console.log("Result: ");
        console.log(result);
        res.json({
          success: true,
          data: result.data.saveFirebase.data
        });
      });
  },
  recoverPassword: function(req,res) {
    var mutation = 'mutation { recoverPassword(username: \"'+ req.body.username +'\" ) { data {email,username}, error { code, message } } }';
    graphql(Schema, mutation).then(function(result) {
      console.log(result);
      if(result.data.recoverPassword.error){
        res.json({
          success: false,
          error: result.data.recoverPassword.error
        });
      }else{
        res.json({
          success: true,
          data: result.data.recoverPassword.data
        });
      }
    });
  },

};

export default userController;
