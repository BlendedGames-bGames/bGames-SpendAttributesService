const express = require('express');
const spend_attributes = express.Router();
import { testEnvironmentVariable } from '../settings';
import {postHost,getHost,sensorHost} from '../urls'

const fetch = require('node-fetch');

const wrap = fn => (...args) => fn(...args).catch(args[2])
const axios = require('axios').default;
var bodyParser =require('body-parser');

// create application/json parser
var jsonParser = bodyParser.json()

const abc = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']

const math = require('mathjs')

spend_attributes.get("/", (req,res) =>{    
    res.status(200).json({ message: testEnvironmentVariable})
});

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
spend_attributes.post('/spend_attributes_apis', jsonParser, wrap(async(req,res,next) => { 
    let keys = Object.keys(req.body)
    console.log(keys)
    let properJSON = JSON.parse(keys[0])
    console.log(properJSON)
    var id_player = properJSON.id_player;
    var id_videogame = properJSON.id_videogame;
    var id_modifiable_mechanic = properJSON.id_modifiable_mechanic;
    var data = properJSON.data;

    /*
    var id_player = req.body.id_player
    var id_videogame = req.body.id_videogame
    // [2,20,4,0,0]
    var id_modifiable_mechanic = req.body.id_modifiable_mechanic
    // Ej: ['chess_blitz,records,win', 'elo','puzzle_challenge,record','puzzle_rush','chess_rapid,record,win']
    var data = req.body.data
    */
    
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
        "id_conversion": arrayToString(id_conversion),   
        "id_attributes":arrayToString(id_attributes),
        "new_data": arrayToString(result)
    }

    var new_attribute_expense = {
        "id_player":id_player,
        "id_attributes": arrayToString(id_attributes),       
        "new_data":arrayToString(result)
    }

    var new_attribute_level;
    var compareResult = await getAndCompareAttributeLevels(new_attribute_expense)
    var new_attribute_level_string;
    var expended_attributes_string;
    if(compareResult != -1){
        new_attribute_level = {
            "id_player":id_player,
            "id_attributes": arrayToString(id_attributes),       
            "new_data":arrayToString(compareResult)
        }
        new_attribute_level_string = JSON.stringify(new_attribute_level)
        expended_attributes_string = JSON.stringify(expended_attributes)
        res.status(200).json({ message: true, data:1, consumedAtt:new_attribute_level_string, expensedAtt:expended_attributes_string })


    }
    else{
        //No se tienen atributo suficiente para gastar en mecanicas
        res.status(400).json({ message: false, data:1})

    }
    
    /*
    
     var actual_attributes_data ={  
        "id_attributes": Ej [1,1,2],        
        "new_data": Ej [4,5,1]
    }
    */

}))


function arrayToString(arrays){
    var array_string = ''
    for (const element of arrays) {
        array_string+=element+','
    }
    array_string = array_string.substring(0,array_string.length-1)
    return array_string

}

function StringtoArray(string){

    var array_string = string.split(",")
    let array_aux = []
    for(const element of array_string){
        array_aux.push(parseInt(element))
    }

    return array_aux
}
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
        host : postHost,
        path: ('/spent_attribute_rt')       
    };
    var url = "http://"+options.host + options.path;
    console.log("URL "+url);
    // construct the URL to post to a publication
    const MEDIUM_POST_URL = url;
    
    var headers = {
        'Content-Type': 'application/json;charset=UTF-8',
        'Access-Control-Allow-Origin': '*'
    };

    var options2 = {
        host : getHost,
        path: ('/modifiable_conversion_attribute')     
    };
    var url2 = "http://"+options2.host + options2.path;
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
        const response = await axios.post(MEDIUM_POST_URL2,modifiedAdquired)
        modifiable_conversion_attribute_relation = response.data.id_modifiable_conversion_attribute
        console.log("aqui va")
        console.log(modifiable_conversion_attribute_relation)

    } catch (error) {
        console.log(error)
        
    }
      /*
        var id_player = spent_attribute.id_player
        var id_videogame = spent_attribute.id_videogame
        var id_modifiable_mechanic = spent_attribute.id_modifiable_mechanic
        var id_attributes = adquired_subattribute.id_attributes
        var id_modifiable_conversion_attribute = spent_attribute.id_modifiable_conversion_attribute
        var new_data = spent_attribute.new_data

    
    */
    const expended_attribute_final = {
        "id_player":spend_attributes.id_player,
        "id_videogame": spend_attributes.id_videogame,
        "id_modifiable_mechanic":spend_attributes.id_modifiable_mechanic,
        "id_attributes":spend_attributes.id_attributes,
        "id_modifiable_conversion_attribute":modifiable_conversion_attribute_relation,
        "new_data":spend_attributes.new_data
    }
    console.log("Im going to post this")
    console.log(JSON.stringify(expended_attribute_final))
    try {
       
        const response = await axios.post(MEDIUM_POST_URL, expended_attribute_final);
        console.log(response)
        
    } 
    catch (error) {
        console.error(error);
    } 
}

spend_attributes.post("/consume_attributes", jsonParser, wrap(async(req,res,next) => { 
    console.log("esto es lo que me entro!:")
    console.log(req.body)
    let keys = Object.keys(req.body)
    console.log(keys)
    let properJSON = JSON.parse(keys[0])
    console.log(properJSON)
    var consumedAtt = JSON.parse(properJSON.consumedAtt);
    var expensedAtt = JSON.parse(properJSON.expensedAtt);

    console.log(consumedAtt)
    console.log(expensedAtt)

    let consumeAttProper = {
        "id_player": consumedAtt.id_player,
        "id_attributes": StringtoArray(consumedAtt.id_attributes),
        "new_data": StringtoArray(consumedAtt.new_data),

    }
    let expensedAttProper = {

        "id_player": expensedAtt.id_player,
        "id_videogame": expensedAtt.id_videogame,      
        "id_modifiable_mechanic": expensedAtt.id_modifiable_mechanic,
        "id_conversion":StringtoArray(expensedAtt.id_conversion),
        "id_attributes": StringtoArray(expensedAtt.id_attributes),
        "new_data": StringtoArray(expensedAtt.new_data),

    }
    console.log('este es el consume att pero en arreglos con enteros')

    console.log(consumeAttProper)
    console.log('este es el expense att pero en arreglos con enteros')

    console.log(expensedAttProper)
    await spendAttributes(consumeAttProper)

    await postExpendedAttribute(expensedAttProper)
    res.status(200).json({ message: true, data:1 })


}))

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
async function spendAttributes(dataChanges){
   
    console.log('last changes:')
    console.log(dataChanges)
    var options = {
        host : postHost,
        path: ('/player_attributes_rt')       
    };
    var url = "http://"+options.host + options.path;
    console.log("URL "+url);
    // construct the URL to post to a publication
    const MEDIUM_PUT_URL = url;
    try {
        const response = await axios.put(MEDIUM_PUT_URL,dataChanges);
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
    host : getHost,
    path: ('/player_attributes')       
    };
    var url = "http://"+options.host + options.path;
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
        const response = await axios.post(MEDIUM_GET_URL, dataChanges)
        console.log('response')
        console.log(response.data)
        // Ej: attributes: [18,20]
        // EJ: new_data = [9,1]
        var attributes = response.data.attributes
        var single_result;
        var results = []

        for (let i = 0; i < attributes.length; i++) {
            single_result = attributes[i]-new_attribute_expense.new_data[i]
            if(single_result >= 0){
                results.push(single_result)
            }
            else{
                return -1;
            }
        }
        return results
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
        host : sensorHost,
        path: ('/conversion_spend_attribute/'+id_videogame.toString()+'/'+id_modifiable_mechanic.toString())       
    };
    var url = "http://"+options.host + options.path;
    console.log("URL "+url);
    // construct the URL to post to a publication
    const MEDIUM_POST_URL = url;
    
    
    var headers = {
        'Content-Type': 'application/json;charset=UTF-8',
        'Access-Control-Allow-Origin': '*'
    };

    try {
        const response = await axios.get(MEDIUM_POST_URL)
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

function conversionDataAttribute(operations,data_changes){
    // operations Ej: ['x+2','sqrt(x+5)','x/4']
    // data_changes Ej: [2,20,4]
    
    //REPUSH
    var operation,data,node,code, eval_data, single_result;
    var results = []
    operation = operations[0];
    data = data_changes;
    node = math.parse(operation)   // returns the root Node of an expression tree
    code = node.compile()        // returns {evaluate: function (scope) {...}}
    eval_data = {}
    eval_data['a'] = data
    
    single_result = code.evaluate(eval_data)

    results.push(single_result) // returns result
    
    //Ej [4,5,1]
    return results
}




export default spend_attributes;

