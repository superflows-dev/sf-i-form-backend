import { SEARCH_ENDPOINT, REGION, TABLE, AUTH_ENABLE, AUTH_REGION, AUTH_API, AUTH_STAGE, ddbClient, ScanCommand, PutItemCommand, CloudSearchDomainClient, SearchCommand, ADMIN_METHODS, SEARCH_INDEX } from "./globals.mjs";
import { processAuthenticate } from './authenticate.mjs';
import { newUuidV4 } from './newuuid.mjs';
import { processAddLog } from './addlog.mjs';
import { processSearchName } from './searchname.mjs';
import { processUploadSearch } from './uploadsearch.mjs';

export const processCreate = async (event) => {
    
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
    
    if(ADMIN_METHODS.includes("create")) {
        if(!authResult.admin) {
            return {statusCode: 401, body: {result: false, error: "Unauthorized request!"}};
        }   
    }
    
    const userId = authResult.userId;
    
    // a client can be shared by different commands.
    
    var values = null;
    
    try {
        values = JSON.parse(event.body).values;
    } catch (e) {
        const response = {statusCode: 400, body: { result: false, error: "Malformed body!"}};
        processAddLog(userId, 'create', event, response, response.statusCode)
        return response;
    }
    
    if(values == null) {
        const response = {statusCode: 400, body: {result: false, error: "Values are not valid!"}}
        processAddLog(userId, 'create', event, response, response.statusCode)
        return response;
    }
    
    
    const searchResult = await processSearchName(values[SEARCH_INDEX].value);
    console.log('searchresult', searchResult.hits.found);
    
    if(searchResult.hits.found > 0) {
    
        const response = {statusCode: 409, body: {result: false, error: "Name already exists!"}}
        processAddLog(userId, 'create', event, response, response.statusCode)
        return response;
    
    }
    
    const id = newUuidV4();
    
    const item = {};
    for(var i = 0; i < Object.keys(values).length; i++) {
        item[Object.keys(values)[i]] = {"S": values[Object.keys(values)[i]]};
    }
    item["id"] = {"S": id};
    
    console.log('item', item);
    
    var setParams = {
        TableName: TABLE,
        Item: {
          item
        }
    };
    
    const ddbPut = async () => {
        try {
          const data = await ddbClient.send(new PutItemCommand(setParams));
          return data;
        } catch (err) {
          return err;
        }
    };
    
    const resultPut = await ddbPut();
    
    await processUploadSearch(id, values[searchindex].value, values)
    
    const response = {statusCode: 200, body: {result: true}};
    processAddLog(userId, 'create', event, response, response.statusCode)
    return response;
    

}