import { SEARCH_ENDPOINT, REGION, TABLE, AUTH_ENABLE, AUTH_REGION, AUTH_API, AUTH_STAGE, ddbClient, UpdateItemCommand, GetItemCommand, DeleteItemCommand, ScanCommand, PutItemCommand, CloudSearchDomainClient, SearchCommand, ADMIN_METHODS, SEARCH_INDEX, FIELDS, SERVER_KEY, QueryCommand } from "./globals.mjs";
import { processAuthenticate } from './authenticate.mjs';
import { newUuidV4 } from './newuuid.mjs';
import { processAddLog } from './addlog.mjs';
import { processSearchName } from './searchname.mjs';
import { processUploadSearch } from './uploadsearch.mjs';
import { processDeleteSearch } from './deletesearch.mjs';

export const processScanByField = async (event) => {

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
        
        userId = authResult.userId;

    }

    // userId = "1234";

    var field = null;
    var value = null;
    
    try {
        field = JSON.parse(event.body).field.trim();
        value = JSON.parse(event.body).value.trim();
    } catch (e) {
        const response = {statusCode: 400, body: { result: false, error: "Malformed body!"}};
        processAddLog(userId, 'scanbyfield', event, response, response.statusCode)
        return response;
    }
    
    if(value == null || value == "" || value.length < 0) {
        const response = {statusCode: 400, body: {result: false, error: "Value is not valid!"}}
        processAddLog(userId, 'scanbyfield', event, response, response.statusCode)
        return response;
    }
    
    if(field == null || field == "" || field.length < 0) {
        const response = {statusCode: 400, body: {result: false, error: "Field is not valid!"}}
        processAddLog(userId, 'scanbyfield', event, response, response.statusCode)
        return response;
    }
    
    var exprNames = {};
    exprNames["#"+field+"1"] = field;
    
    var exprValues = {};
    exprValues[":"+field+"1"] = {S: value};
    
    var scanParams = {
        FilterExpression: "#"+field+"1 = :"+field+"1",
        ExpressionAttributeValues: exprValues,
        ExpressionAttributeNames:  exprNames,
        TableName: TABLE
    };
    
    console.log('scanParams', scanParams);
    
    const arrRecords = [];
    const ddbScanRecords = async (queryParams, exclusiveStartKey = null) => {
        console.log('inside scan');
        try {
            if(exclusiveStartKey != null) {
                queryParams['ExclusiveStartKey'] = exclusiveStartKey;
            }
            const data = await ddbClient.send(new ScanCommand(queryParams));
            console.log('data', data);
            for(var m = 0; m < data.Items.length; m++) {
                arrRecords.push(data.Items[m])
            }
            if(data.LastEvaluatedKey != null) {
                await ddbScanRecords(queryParams, data.ExclusiveStartKey);
            }
            return;
        } catch (err) {
            console.log('inside scan', err);
            return err;
        }
    };
    await ddbScanRecords(scanParams);
    
    const response = {statusCode: 200, body: {result: arrRecords}};
    processAddLog(userId, 'scanbyfield', event, response, response.statusCode);
    return response;

}