const express = require('express');
const router = express.Router();

var http = require('http');
const qs = require('querystring');

var common = require('./extras');
const fetch = require('node-fetch');

const wrap = fn => (...args) => fn(...args).catch(args[2])
const axios = require('axios').default;
var bodyParser =require('body-parser');

// create application/json parser
var jsonParser = bodyParser.json()


const math = require('mathjs')


// PARA ESTE MICROSERVICIO SE NECESITA INGRESAR LOS DATOS DE LA SIGUIENTE MANERA:
/* Ejemplo de Json del Body para el POST
    {
    "id_player": 2,
    "nameat": "Resistencia",
    "namecategory": "Físico",
    "data": 1,
    "data_type": "in.off",
    "input_source": "xlr8_podometer",
    "date_time": "2019-05-16 13:17:17"
    }
*/
/*
Input:  
  var dataChanges ={  
        "id_player": getJob.id_player,   
        "sensor_endpoint_id_online_sensor": getJob.sensor_endpoint_id_online_sensor,
        "id_sensor_endpoint": getJob.id_sensor_endpoint,
        "watch_parameters":getJob.watch_parameters,                                             
        "data_changes": arrayChanges
    }
Output: Void (stores the data in the db)
Description: Calls the b-Games-ApirestPostAtt service 
*/
router.post('/spend_attributes_apis', jsonParser, wrap(async(req,res,next) => { 
    var id_player = req.body.id_player
    var id_videogame = req.body.id_videogame
    // [2,20,4,0,0]
    var id_modifiable_mechanic = req.body.id_modifiable_mechanic
    // Ej: ['chess_blitz,records,win', 'elo','puzzle_challenge,record','puzzle_rush','chess_rapid,record,win']
    var data = req.body.data

    
    var conversions_data = await getConversion(id_videogame,id_modifiable_mechanic,data)

    //ids: Ej 2
    var id_conversion = conversions_data.id_conversion

    //id_subattributes: 1
    var id_attributes = conversions_data.id_attributes

    //operations: Ej 'x+2'
    var operations = conversions_data.operations

    console.log('conversions_data')
    console.log(conversions_data)
    //Ej [4,5,1]
    var result = conversionDataAttribute(operations,data)
    console.log('/n resultado del reemplazo')
    console.log(result)
    var expended_attributes ={  
        "id_player": id_player,   
        "id_videogame": id_videogame,      
        "id_modifiable_mechanic": id_modifiable_mechanic,
        "id_conversion": id_conversion,   
        "id_attributes":id_attributes,
        "new_data": result
    }

    var new_attribute_expense = {
        "id_player":id_player,
        "id_attributes": id_attributes,       
        "new_data":result
    }

    var new_attribute_level;
    var compareResult = await getAndCompareAttributeLevels(new_attribute_expense)
    if(compareResult != -1){
        new_attribute_level = {
            "id_player":id_player,
            "id_attributes": id_attributes,       
            "new_data":compareResult
        }
        spendAttributes(new_attribute_level)
        res.status(200).json({ message: true })

        postExpendedAttribute(expended_attributes)

    }
    else{
        //No se tienen atributo suficiente para gastar en mecanicas
        res.status(400).json({ message: false })

    }
    
    /*
    
     var actual_attributes_data ={  
        "id_attributes": Ej [1,1,2],        
        "new_data": Ej [4,5,1]
    }
    */

}))
/*
Input:  
 var expended_attributes ={  
        "id_player": id_player,        
        "id_videogame": id_videogame,        
        "id_modifiable_mechanic": id_modifiable_mechanic,
        "id_conversion": id_conversion,   
        "id_attributes":id_attributes,
        "new_data": result
    }
Output: Void (stores the data in the db)
Description: Calls the b-Games-ApirestPostAtt service 
*/
async function postExpendedAttribute(spend_attributes){
    
    var options = {
        host : 'bgames-apirestpostatt.herokuapp.com',
        path: ('/spent_attribute/')       
    };
    var url = "https://"+options.host + options.path;
    console.log("URL "+url);
    // construct the URL to post to a publication
    const MEDIUM_POST_URL = url;
    
    var headers = {
        'Content-Type': 'application/json;charset=UTF-8',
        'Access-Control-Allow-Origin': '*'
    };

    var options2 = {
        host : 'bgames-apirestget.herokuapp.com',
        path: ('/modifiable_conversion_attribute')     
    };
    var url2 = "https://"+options2.host + options2.path;
    console.log("URL "+url2);
    // construct the URL to post to a publication
    const MEDIUM_POST_URL2 = url2;

    var modifiedAdquired = {
        "id_videogame": spend_attributes.id_videogame,  
        "id_modifiable_mechanic":spend_attributes.id_modifiable_mechanic,
        "id_conversion":spend_attributes.id_conversion,
        "id_attributes":spend_attributes.id_attributes
    }
    console.log("Im going to send this")
    console.log(JSON.stringify(modifiedAdquired))
    var modifiable_conversion_attribute_relation;

    try {
        const response = await axios.get(MEDIUM_POST_URL2,{ headers:headers, data: modifiedAdquired})
        modifiable_conversion_attribute_relation = response.data.id_modifiable_conversion_attribute
        console.log("aqui va")
        console.log(modifiable_conversion_attribute_relation)

    } catch (error) {
        console.log(error)
        
    }
    const expended_attribute_final = {
        "id_player":spend_attributes.id_player,
        "id_videogame": spend_attributes.id_videogame,
        "id_modifiable_conversion_attribute":modifiable_conversion_attribute_relation,
        "new_data":spend_attributes.new_data
    }
    console.log("Im going to post this")
    console.log(JSON.stringify(expended_attribute_final))
    try {
       
        const response = axios.post(MEDIUM_POST_URL, expended_attribute_final);
        console.log(response)
        
    } 
    catch (error) {
        console.error(error);
    } 
}

/*
Input:  

var dataChanges ={  
    "id_player": new_attribute_expense.id_player,//[1]   
    "id_attributes": new_attribute_expense.id_attributes,//[1]
    "new_data": updatedAttributes //[19]
}
    
Output: Void (stores the data in the db)
Description: Calls the b-Games-ApirestPostAtt service 
*/
function spendAttributes(dataChanges){
   
    console.log('last changes:')
    console.log(dataChanges)
    var options = {
        host : 'bgames-apirestpostatt.herokuapp.com',
        path: ('/player_attributes_single')       
    };
    var url = "https://"+options.host + options.path;
    console.log("URL "+url);
    // construct the URL to post to a publication
    const MEDIUM_PUT_URL = url;
    try {
        const response = axios.put(MEDIUM_PUT_URL,dataChanges);
        console.log(response)
        
    } 
    catch (error) {
        console.error(error);
    } 
}

/*
Input:  

Ej:
var new_attribute_expense = {
        "id_player":id_player,
        "id_attributes": id_attributes,       
        "new_data":result
}
Output: Void (stores the data in the db)
Description: Calls the b-Games-ApirestPostAtt service 
*/
async function getAndCompareAttributeLevels(new_attribute_expense){

  var options = {
    host : 'bgames-apirestget.herokuapp.com',
    path: ('/player_attributes_single')       
    };
    var url = "https://"+options.host + options.path;
    const MEDIUM_GET_URL = url;

    var headers = {
        'Content-Type': 'application/json;charset=UTF-8',
        'Access-Control-Allow-Origin': '*'
    };
    var dataChanges = {
        "id_player": new_attribute_expense.id_player,
        "id_attributes": new_attribute_expense.id_attributes
    }
    console.log('dataChanges in updateAttributeLevels')
    console.log(dataChanges)

    try {
        const response = await axios.get(MEDIUM_GET_URL,{ headers:headers, data: dataChanges})
        console.log('response')
        console.log(response.data)
        // Ej: attributes: [18,20]
        // EJ: new_data = [9,1]
        var attribute = response.data.data
        var result = attribute-new_attribute_expense.new_data
        console.log(attribute)
        console.log(new_attribute_expense.new_data)

        if(result >= 0){
            return result
        }
        else{
            return -1
        }
        
    } 
    catch (error) {
        console.error(error);
    }
    
}

/*
Input:  Json of sensor data
Output: Void (stores the data in the db)
Description: Calls the b-Games-ApirestPostAtt service 
*/
async function getConversion(id_videogame,id_modifiable_mechanic,data){

    var options = {
        host : 'bgames-sensormanagement.herokuapp.com',
        path: ('/conversion_spend_attribute')       
    };
    var url = "https://"+options.host + options.path;
    console.log("URL "+url);
    // construct the URL to post to a publication
    const MEDIUM_POST_URL = url;
    
    var dataChanges ={  
        "id_videogame": id_videogame,
        "id_modifiable_mechanic": id_modifiable_mechanic               
    }
    var headers = {
        'Content-Type': 'application/json;charset=UTF-8',
        'Access-Control-Allow-Origin': '*'
    };

    try {
        const response = await axios.get(MEDIUM_POST_URL,{ headers:headers, data: dataChanges})
        console.log('233')
        console.log(response.data)
        const data = response.data
        //Procesamiento de los rows entregados

        /*
         var results ={  
                "id_conversion": 2,   
                "id_attribute": 1,
                "operations": 'x+2'
        } 
        */       
        
        //Procesar y result que se quiere: 
        var results = {

            "id_conversion":response.data.id_conversion,
            "id_attributes": response.data.id_attributes,
            "options":  response.data.options,
            "operations":  response.data.operations

        }
        
        
        return results

        
    } 
    catch (error) {
        console.error(error);
    }
}

function conversionDataAttribute(operation,data){
    // operation Ej: 'x+2'
    // data Ej: 2
    
    var result;   
    node = math.parse(operation)   // returns the root Node of an expression tree
    code = node.compile()        // returns {evaluate: function (scope) {...}}
    result = code.evaluate({x: data}) // returns result
    
    //Ej [4,5,1]
    return result
}



/*
Input:  Json of sensor data
Output: Void (stores the data in the db)
Description: Calls the b-Games-ApirestPostAtt service 
*/
router.post('/StandardAttributes/', (req,res,next)=>{

    try {
        var post_data = req.body;
        if(!req.body.id_player || !req.body.id_player|| !req.body.nameat|| !req.body.namecategory|| !req.body.data|| !req.body.data_type|| !req.body.input_source|| !req.body.date_time){
            return res.sendStatus(400).json({
                error: 'Missing data'
            })
        }
        console.log(post_data);
        var id_player = Number(post_data.id_player);
        var nameat = post_data.nameat;
        var namecategory = post_data.namecategory;
        var dat = Number(post_data.data);
        var data_type = post_data.data_type;
        var input_source = post_data.input_source;
        var date_time = post_data.date_time;

        
        const data2 = JSON.stringify({
            id_player: id_player,
            nameat:nameat,
            namecategory:namecategory,
            data:dat,
            data_type:data_type,
            input_source:input_source,
            date_time:date_time
        })

        console.log(data2);

        var options = {
            host : 'bgames-apirestpostatt.herokuapp.com',
            path: ('/attributes/'),
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data2),
            }
        };

        var data = 
        {
                id_player: Number(post_data.id_player),
                nameat: post_data.nameat,
                namecategory: post_data.namecategory,
                dat: Number(post_data.data),
                data_type: post_data.data_type,
                input_source: post_data.input_source,
                date_time:post_data.date_time
        };

        var url = "http://"+options.host + options.path;
        console.log("URL "+url);
        // construct the URL to post to a publication
        const MEDIUM_POST_URL = url;

        const response = fetch(MEDIUM_POST_URL, {
            method: "post",
            headers: {
                "Content-type": "application/json",
                "Accept": "application/json",
                "Accept-Charset": "utf-8"
                },
                body: JSON.stringify({
                    id_player: id_player,
                    nameat:nameat,
                    namecategory:namecategory,
                    data:dat,
                    data_type:data_type,
                    input_source:input_source,
                    date_time:date_time
                })
        })
        .then(res => res.json('Success'))
        .then(json => console.log("Response of API: "+json));

        const messageData = response;

        // the API frequently returns 201
        if ((response.status !== 200) && (response.status !== 201)) {
            console.error(`Invalid response status ${ response.status }.`);
            throw messageData;
        }else{

        }
    } catch (error) {
        next(error)
    }
    

})



module.exports = router;

