import { graphql } from 'graphql';
import Schema from './../schema/schema';
import moment from 'moment';
import jwt from 'jwt-simple';
import config from './../config';
import middleware from './../middleware';
import nodemailer from 'nodemailer';

var createToken = function(user) {
  console.log(user);
  var payload = {
    sub: user.id,
    iat: moment().unix(),
    exp: moment().add(14, "days").unix()
  };

  return jwt.encode(payload, config.TOKEN_SECRET);
};

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'lgbtcast.tfg@gmail.com',
      pass: 'ayc1994tfgua'
    }
});

var userController = {
  loginUser: function(req,res) {
    var user = req.body.user_name;
  	var pswd = req.body.user_pswd;
    console.log(user);
    console.log(pswd);
  	var mutation = 'mutation { loginUser(username: \"' + user + '\", password: \"'+pswd +'\"){ user { id, username, bio }, error { code, message } } }';

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
  createUser: function(req,res) {
    var username = req.body.user_name;
  	var email = req.body.user_email;
  	var pswd = req.body.user_pswd;

  	var mutation = ' mutation { createUser(username:\"'+ username +'\", email: \"' + email + '\", pswd: \"'+ pswd +'\") { user{id, username, name}, error {code, message} } }';

  	graphql(Schema, mutation).then( function(result) {
  		//console.log(JSON.stringify(result,null," "));
  		if(result.data.createUser.user==null){
  			res.json({
  				success: false,
  				error: result.data.createUser.error
  			});
  		}else{
        let url = 'https://lgbt-api.herokuapp.com/users/confirm?id='+result.data.createUser.user.id;
        // setup email data with unicode symbols
        let mailOptions = {
            from: '"Admin" <lgbtcast.tfg@lgbtcast.com>', // sender address
            to: email, // list of receivers
            subject: '¡Bienvenidx a LGBTcast!', // Subject line
            text: 'Confirma tu correo electrónico para empezar a conocer las novedades del colectivo LGBT.', // plain text body
            html: '<p>Haz click en el enlace siguiente para confirmar tu correo electrónico: </p><p><a href=\"'+url+'\">Confirmar correo</a></p><p>Si no has sido tú no sé qué hay que hacer.</p>' // html body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message %s sent: %s', info.messageId, info.response);
        });
  			res.json({
  				success: true,
  				data: result.data.createUser.user
  			});
  		}
  	});
  },
  getUser: function(req,res) {
    var user = req.params.id;
    if(req.params.id == "me"){
      user = req.user; //En req.user está la id que coge del token de la cabecera
    }
  	var query = ' query { user(userID:\"' + user + '\") { id, username, name, bio, place, counts { followedby, following }, public, activity { action, target_id, created_time } } }';
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

    var mutation = ` mutation { editUser(userID: \"`+req.user+`\", ) {
      data { username, name, bio, email, gender },
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
  getFollows: function(req,res) {
    var query = ' query { user(userID:\"' + req.params.id + '\") { relationships { id, user_data { username, bio }, outgoing_status, incoming_status } } }';
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
    var query = ' query { user(userID:\"' + req.params.id + '\") { relationships { id, user_data {username, bio }, outgoing_status, incoming_status } } }';
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
    var query = ' query { user(userID:\"' + req.user + '\") { relationships { id, user_data {username, bio }, outgoing_status, incoming_status } } }';
  	graphql(Schema, query).then( function(result) {
  		//console.log(JSON.stringify(result,null," "));
      var relationships = [];
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
    var query = ` query { activity (userID: \"`+ req.user +`\"){
      origin_id, target_id, action, created_time
    } }`;
    graphql(Schema, query).then( function(result) {
      res.json({
        success: true,
        data: result.data.activity
      });
    });
  },
  confirmAccount: function(req,res) {
    var mutation = ' mutation { confirmAccount(userID: \"'+ req.query.id +'\") { data{ id, confirm }, error { code, message } } }';
    graphql(Schema, mutation).then( function(result) {
      if(result.data.confirmAccount.error == null){
        res.json({
          success: true,
          data: result.data.confirmAccount.data
        });
      }else{
        res.json({
          success: false,
          error: result.data.confirmAccount.error
        });
      }
    });
  },
  report: function(req,res) {
    var mutation = ` mutation {
      report(originID:\"`+req.user+`\", targetID: \"`+req.body.target_id+`\",
      targetType: `+req.body.target_type+` , reason: \"`+ req.body.reason+`\") {
      data, error { code, message } } }`;
    graphql(Schema, mutation).then( function(result) {
      res.json({
        success: result.data.report.data
      });
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
  }

};

export default userController;
