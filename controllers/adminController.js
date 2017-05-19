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

//Obtener usuarios reportados
module.exports.usersReported = function(req,res) {
    var query = 'query { usersReported{ data { id, username, name },error{code,message}} }';
    graphql.graphql(schema, query).then( function(result) {

		console.log(result); // { data: oneEvent: null }
		if(result.data.usersReported == null){ //No sé si esto está bien así o habría que mandar el error desde graphql
			res.json({
				success: false,
				error: "No se ha encontrado ningún usuario reportado"
			});
		}else{
			res.json({
				success: true,
				data: result.data.usresReported.data
			});
		}

    });
};