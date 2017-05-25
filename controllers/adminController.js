import { graphql } from 'graphql';
import Schema from './../Schema/Schema';

var adminController = {
  //Obtener usuarios reportados
  usersReported: function(req,res) {
      var query = 'query { usersReported{ data { id, username, name },error{code,message}} }';
      graphql(Schema, query).then( function(result) {

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
  }
};

export default adminController;
