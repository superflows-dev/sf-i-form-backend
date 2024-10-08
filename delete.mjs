import { DELETE_SEARCH_THRESHOLD, SEARCH_ENDPOINT, REGION, TABLE, AUTH_ENABLE, AUTH_REGION, AUTH_API, AUTH_STAGE, ddbClient, GetItemCommand, DeleteItemCommand, ScanCommand, PutItemCommand, CloudSearchDomainClient, SearchCommand, ADMIN_METHODS, SEARCH_INDEX, SERVER_KEY } from "./globals.mjs";
import { processAuthenticate } from './authenticate.mjs';
import { newUuidV4 } from './newuuid.mjs';
import { processAddLog } from './addlog.mjs';
import { processSearchAllName } from './searchallname.mjs';
import { processDeleteSearch } from './deletesearch.mjs';


export const processDelete = async (event) => {

    var serverkey = "";
    var userId = "1234"

    if(event["headers"]["x-server-key"] != null) {
        serverkey = event["headers"]["x-server-key"];

        if(serverkey != SERVER_KEY) {
            return {statusCode: 401, body: {result: false, error: "Unauthorized request!"}};
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
        
        if(email == "" || !email.match(/^[a-zA-Z0-9.!#$%&'+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)$/)) {
            return {statusCode: 400, body: {result: false, error: "Malformed headers!"}}
        }
        
        if(accessToken.length < 5) {
            return {statusCode: 400, body: {result: false, error: "Malformed headers!"}}
        }
        
        const authResult = await processAuthenticate(event["headers"]["Authorization"]);
        
        if(!authResult.result) {
            return {statusCode: 401, body: {result: false, error: "Unauthorized request!"}};
        }
        
        if(ADMIN_METHODS.includes("delete")) {
            if(!authResult.admin) {
                return {statusCode: 401, body: {result: false, error: "Unauthorized request!"}};
            }   
        }

        userId = authResult.userId;

    }
    
    // userId = "1234";

    var id = null;
    
    try {
        id = JSON.parse(event.body).id.trim();
    } catch (e) {
        const response = {statusCode: 400, body: { result: false, error: "Malformed body!"}};
        processAddLog(userId, 'delete', event, response, response.statusCode)
        return response;
    }
    
    if(id == null || id == "" || id.length < 6) {
        const response = {statusCode: 400, body: {result: false, error: "Id is not valid!"}}
        processAddLog(userId, 'delete', event, response, response.statusCode)
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
        processAddLog(userId, 'delete', event, response, response.statusCode)
        return response;
    }

    if(SEARCH_ENDPOINT.length > 1) {
        const searchResult = await processSearchAllName([resultGet.Item[SEARCH_INDEX].S.substring(0,1000).split('\\n')[0]]);
        
        if(searchResult.hits.found > parseInt(DELETE_SEARCH_THRESHOLD)) {
        
            const response = {statusCode: 409, body: {result: false, error: "Can't delete because this item is used elsewhere. Found " + searchResult.hits.found + " uses. "}}
            processAddLog(userId, 'delete', event, response, response.statusCode)
            return response;
        
        }

    }

    await processDeleteSearch(id);
    
    var deleteParams = {
        TableName: TABLE,
        Key: {
            id: { S: id },
        }
    };
    
    const ddbDelete = async () => {
        try {
            const data = await ddbClient.send(new DeleteItemCommand(deleteParams));
            return data;
        } catch (err) {
            console.log(err)
            return err;
        }
    };
    
    var resultDelete = await ddbDelete();
    
    const response = {statusCode: 200, body: {result: true}};
    processAddLog(userId, 'delete', event, response, response.statusCode)
    return response;

}