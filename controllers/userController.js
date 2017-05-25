import { graphql } from 'graphql';
import Schema from './../Schema/Schema';

var createToken = function(user) {
  console.log(user);
  var payload = {
    sub: user._id,
    iat: moment().unix(),
    exp: moment().add(14, "days").unix()
  };

  return jwt.encode(payload, config.TOKEN_SECRET);
};

var userController = {
  loginUser: function(req,res) {
    var user = req.body.user_name;
  	var pswd = req.body.user_pswd;

  	var mutation = 'mutation { loginUser(username: \"' + user + '\", password: \"'+pswd +'\"){ user { id, username, bio }, error { code, message } }}';

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
  	var query = ' query { user(userID:\"' + user + '\") { id, username, name, bio, place, public, activity { action, target_id, created_time } } }';
  	graphql(Schema, query).then( function(result) {
  		//console.log(JSON.stringify(result,null," "));
  		res.json({
  			success: true,
  			data: result.data.user,
  		});
  	});
  },
  getFollows: function(req,res) {
    var query = ' query { user(userID:\"' + req.params.id + '\") { relationships { id, user_data {username, bio }, outgoing_status, incoming_status } } }';
  	graphql(Schema, query).then( function(result) {
  		//console.log(JSON.stringify(result,null," "));
      var relationships = [];
      for(i in result.data.user.relationships ){
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
      for(i in result.data.user.relationships ){
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
      for(i in result.data.user.relationships ){
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
        data: result
      });
    });
  },
  confirmAccount: function(req,res) {
    var mutation = ' mutation { confirmAccount(userID: \"'+ req.user +'\") { data{ id, confirm }, error { code, message } } }';
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
  }


};

export default userController;