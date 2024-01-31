import { SEARCH_ENDPOINT, REGION, TABLE, AUTH_ENABLE, AUTH_REGION, AUTH_API, AUTH_STAGE, ddbClient, UpdateItemCommand, GetItemCommand, DeleteItemCommand, ScanCommand, PutItemCommand, CloudSearchDomainClient, SearchCommand, ADMIN_METHODS, SEARCH_INDEX, FIELDS, SERVER_KEY } from "./globals.mjs";
import { processAuthenticate } from './authenticate.mjs';
import { newUuidV4 } from './newuuid.mjs';
import { processAddLog } from './addlog.mjs';
import { processSearchName } from './searchname.mjs';
import { processUploadSearch } from './uploadsearch.mjs';
import { processDeleteSearch } from './deletesearch.mjs';

export const processUpdateField = async (event) => {

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
    var field = null;
    var value = null;
    
    try {
        id = JSON.parse(event.body).id.trim();
        field = JSON.parse(event.body).field;
        value = JSON.parse(event.body).value;
    } catch (e) {
        const response = {statusCode: 400, body: { result: false, error: "Malformed body!"}};
        processAddLog(userId, 'updatefield', event, response, response.statusCode)
        return response;
    }
    
    if(id == null || id == "" || id.length < 6) {
        const response = {statusCode: 400, body: {result: false, error: "Id is not valid!"}}
        processAddLog(userId, 'updatefield', event, response, response.statusCode)
        return response;
    }
    
    if(field == null || field == "" || field.length < 0) {
        const response = {statusCode: 400, body: {result: false, error: "Field is not valid!"}}
        processAddLog(userId, 'updatefield', event, response, response.statusCode)
        return response;
    }
    
    if(value == null || value == "" || value.length < 0) {
        const response = {statusCode: 400, body: {result: false, error: "Value is not valid!"}}
        processAddLog(userId, 'updatefield', event, response, response.statusCode)
        return response;
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
        processAddLog(userId, 'updatefield', event, response, response.statusCode)
        return response;
    }

    
    var exprSet = "set #" + field + '1 = :' + field + '1';
    
    var exprNames = {};
    exprNames['#' + field + "1"] = field;

    var exprValues = {};
    exprValues[':' + field + "1"] = {S: value};
    
    var updateParams = {
        TableName: TABLE,
        Key: {
          id: { S: id },
        },
        UpdateExpression: exprSet,
        ExpressionAttributeValues: exprValues,
        ExpressionAttributeNames: exprNames
    };
      
    console.log(updateParams);
    
    const ddbUpdate = async () => {
        try {
            const data = await ddbClient.send(new UpdateItemCommand(updateParams));
            return data;
        } catch (err) {
            return err;
        }
    };
  
    var resultUpdate = await ddbUpdate();
    
    
    
    const response = {statusCode: 200, body: {result: true}};
    processAddLog(userId, 'updatefield', event, response, response.statusCode);
    return response;

}