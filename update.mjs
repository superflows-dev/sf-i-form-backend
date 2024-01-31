import { SEARCH_ENDPOINT, REGION, TABLE, AUTH_ENABLE, AUTH_REGION, AUTH_API, AUTH_STAGE, ddbClient, UpdateItemCommand, GetItemCommand, DeleteItemCommand, ScanCommand, PutItemCommand, CloudSearchDomainClient, SearchCommand, ADMIN_METHODS, SEARCH_INDEX, FIELDS, SERVER_KEY } from "./globals.mjs";
import { processAuthenticate } from './authenticate.mjs';
import { newUuidV4 } from './newuuid.mjs';
import { processAddLog } from './addlog.mjs';
import { processSearchName } from './searchname.mjs';
import { processUploadSearch } from './uploadsearch.mjs';
import { processDeleteSearch } from './deletesearch.mjs';

export const processUpdate = async (event) => {

    var serverkey = "";
    var userId = "1234"

    if((event["headers"]["x-server-key"]) != null) {
        
        if((event["headers"]["x-server-key"]) != SERVER_KEY) {
            
            return {statusCode: 401, body: {result: false, error: "Unauthorized request!", headers: event["headers"]["x-server-key"], key: SERVER_KEY}}; 
        
        } 
        
    } else if ((event["headers"]["X-Server-Key"]) != null) {
        
        if((event["headers"]["X-Server-Key"]) != SERVER_KEY) {
            
            return {statusCode: 401, body: {result: false, error: "Unauthorized request!", headers: event["headers"]["X-Server-Key"], key: SERVER_KEY}}; 
        
        } 
        
    } else {

        if((event["headers"]["Authorization"]) == null) {
            return {statusCode: 400, body: { result: false, error: "Malformed headers!"}};
        }
        
        if((event["headers"]["Authorization"].split(" ")[1]) == null) {
            return {statusCode: 400, body: { result: false, error: "Malformed headers!"}};
        }
        
        var hAscii = Buffer.from((event["headers"]["Authorization"].split(" ")[1] + ""), 'base64').toString('ascii');
        
        if(hAscii.split(":")[1] == null) {
            return {statusCode: 400, body: { result: false, error: "Malformed headers!"}};
        }
        
        const email = hAscii.split(":")[0];
        const accessToken = hAscii.split(":")[1];
        
        if(email == "" || !email.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)) {
            return {statusCode: 400, body: {result: false, error: "Malformed headers!"}}
        }
        
        if(accessToken.length < 5) {
            return {statusCode: 400, body: {result: false, error: "Malformed headers!"}}
        }
        
        const authResult = await processAuthenticate(event["headers"]["Authorization"]);
        
        if(!authResult.result) {
            return {statusCode: 401, body: {result: false, error: "Unauthorized request!"}};
        }
        
        if(ADMIN_METHODS.includes("update")) {
            if(!authResult.admin) {
                return {statusCode: 401, body: {result: false, error: "Unauthorized request!"}};
            }   
        }

        userId = authResult.userId;

    }

    // userId = "1234";

    var id = null;
    var values = null;
    
    try {
        id = JSON.parse(event.body).id.trim();
        values = JSON.parse(event.body).values;
    } catch (e) {
        const response = {statusCode: 400, body: { result: false, error: "Malformed body!"}};
        processAddLog(userId, 'update', event, response, response.statusCode)
        return response;
    }
    
    if(id == null || id == "" || id.length < 6) {
        const response = {statusCode: 400, body: {result: false, error: "Id is not valid!"}}
        processAddLog(userId, 'update', event, response, response.statusCode)
        return response;
    }
    
    if(values == null) {
        const response = {statusCode: 400, body: {result: false, error: "Values are not valid!"}}
        processAddLog(userId, 'update', event, response, response.statusCode)
        return response;
    }
    
    for(var i = 0; i < Object.keys(values).length; i++) {
        
        if(!FIELDS.includes(Object.keys(values)[i])) {
            
            const response = {statusCode: 400, body: {result: false, error: "Values are not valid!"}}
            processAddLog(userId, 'update', event, response, response.statusCode)
            return response;
            
        }
        
    }
    
    var getParams = {
        TableName: TABLE,
        Key: {
          id: { S: id },
        },
    };
    
    async function ddbGet () {
        try {
          const data = await ddbClient.send(new GetItemCommand(getParams));
          return data;
        } catch (err) {
          return err;
        }
    };
    
    var resultGet = await ddbGet();
    
    if(resultGet.Item == null) {
        const response = {statusCode: 404, body: {result: false, error: "Record does not exist!"}}
        processAddLog(userId, 'update', event, response, response.statusCode)
        return response;
    }

    var shortId = "";
    if(resultGet.Item["shortid"] == null) {
        shortId = (new Date()).getTime().toString(36);
    } else {
        shortId = JSON.parse(resultGet.Item["shortid"].S)[0];
    }
    
    values["shortid"] = {};
    values["shortid"]["type"] = 'sf-i-input';
    values["shortid"]["value"] = [shortId];
    
    var exprSet = "set ";
    
    for(var i = 0; i < Object.keys(values).length; i++) {
        
        exprSet += ("#" + Object.keys(values)[i] + "1 = :" + Object.keys(values)[i] + "1");
        if(i < (Object.keys(values).length - 1)) {
            exprSet += ", ";
        }
        
    }
    
    var exprNames = {};
    
    for(var i = 0; i < Object.keys(values).length; i++) {
        
        exprNames['#' + Object.keys(values)[i] + "1"] = Object.keys(values)[i];
        
    }
    
    var exprValues = {};
    
    for(var i = 0; i < Object.keys(values).length; i++) {
        
        exprValues[':' + Object.keys(values)[i] + "1"] = {S: JSON.stringify(values[Object.keys(values)[i]].value)};
        
    }
    
    var updateParams = {
        TableName: TABLE,
        Key: {
          id: { S: id },
        },
        UpdateExpression: exprSet,
        ExpressionAttributeValues: exprValues,
        ExpressionAttributeNames: exprNames
    };
      
    const ddbUpdate = async () => {
        try {
            const data = await ddbClient.send(new UpdateItemCommand(updateParams));
            return data;
        } catch (err) {
            return err;
        }
    };
  
    var resultUpdate = await ddbUpdate();
    
    var delta = [];
    
    for(i = 0; i < Object.keys(values).length; i++) {
        
        if(values[Object.keys(values)[i]] != "id") {
            
            const oldKey = (resultGet.Item[Object.keys(values)[i]] != null) ? (resultGet.Item[Object.keys(values)[i]]["S"]) : "";
            delta.push(Object.keys(values)[i] + ":" + oldKey + ":" + JSON.stringify(values[Object.keys(values)[i]].value))
            
        }
        
    }
    
    await processUploadSearch(id, values[SEARCH_INDEX].value, values)
    
    const response = {statusCode: 200, body: {result: true}};
    processAddLog(userId, 'update', event, response, response.statusCode, delta)
    return response;

}