var jwt = require('jwt-simple');
var moment = require('moment');
var config = require('./config');

// Lo he ido mirando de aqu� y de uplan (es lo mismo)
//https://carlosazaustre.es/blog/autenticacion-con-token-en-node-js/

exports.ensureAuthorised = function(req, res, next) {
	if(!req.headers.authorization) {
		return res
		.status(403)
		.send({message: "Tu petición no tiene cabecera de autorización"});
	}

	var token = req.headers.authorization.split(" ")[1];
  var payload = jwt.decode(token, config.TOKEN_SECRET, true, 'HS512');

	if(payload.exp <= moment().unix()) {
     return res
         .status(401)
        .send({message: "El token ha expirado"});
	}

	req.user = payload.sub; //No se guarda na????
	next();
};
