import { ALLOW_DUPLICATE, SEARCH_ENDPOINT, REGION, TABLE, AUTH_ENABLE, AUTH_REGION, AUTH_API, AUTH_STAGE, ddbClient, ScanCommand, PutItemCommand, CloudSearchDomainClient, SearchCommand, ADMIN_METHODS, SEARCH_INDEX, FIELDS, SERVER_KEY } from "./globals.mjs";
import { processAuthenticate } from './authenticate.mjs';
import { newUuidV4 } from './newuuid.mjs';
import { processAddLog } from './addlog.mjs';
import { processSearchName } from './searchname.mjs';
import { processUploadSearch } from './uploadsearch.mjs';

export const processCreate = async (event) => {

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

        userId = authResult.userId;

    }

    // userId = "1234";
    
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
    
    for(var i = 0; i < Object.keys(values).length; i++) {
        
        if(!FIELDS.includes(Object.keys(values)[i])) {
            
            const response = {statusCode: 400, body: {result: false, error: "Values are not valid!"}}
            processAddLog(userId, 'create', event, response, response.statusCode)
            return response;
            
        }
        
    }
    
    const valToBeSearched = values[SEARCH_INDEX].text != null ? (Array.isArray(values[SEARCH_INDEX].text) ? '"' + values[SEARCH_INDEX].text[0].replace(/'/g, '\\\'') + '"' :  '"' + values[SEARCH_INDEX].text.replace(/'/g, '\\\'')) + '"' : (Array.isArray(values[SEARCH_INDEX].value) ?  '"' + values[SEARCH_INDEX]["value"][0].replace(/'/g, '\\\'') + '"' : '"' + values[SEARCH_INDEX]["value"].replace(/'/g, '\\\'')) + '"';
    
    const searchResult = await processSearchName(valToBeSearched);

    var scanParams = {
        TableName: TABLE,
    }
    
    var resultItems = []
  
    async function ddbQuery () {
        try {
            const data = await ddbClient.send (new ScanCommand(scanParams));
            resultItems = resultItems.concat((data.Items))
            if(data.LastEvaluatedKey != null) {
                scanParams.ExclusiveStartKey = data.LastEvaluatedKey;
                await ddbQuery();
            }
        } catch (err) {
            console.log(err);
            return err;
        }
    };
    
    if(ALLOW_DUPLICATE === 0) {

        if(searchResult.hits.found > 0) {
        
            const resultQ = await ddbQuery();
  
            var unmarshalledItems = [];
          
            for(var i = 0; i < resultItems.length; i++) {
                var itemResult = {};
                for(var j = 0; j < Object.keys(resultItems[i]).length; j++) {
                    itemResult[Object.keys(resultItems[i])[j]] = resultItems[i][Object.keys(resultItems[i])[j]][Object.keys(resultItems[i][Object.keys(resultItems[i])[j]])[0]];
                }
                unmarshalledItems.push(itemResult);
            }
            
            for(i = 0; i < unmarshalledItems.length; i++) {
                
                console.log('comparing', unmarshalledItems[i][SEARCH_INDEX], valToBeSearched);
                if(unmarshalledItems[i][SEARCH_INDEX].replace(/"/g, "") == (Array.isArray(values[SEARCH_INDEX].value) ? values[SEARCH_INDEX]["value"][0] : values[SEARCH_INDEX]["value"])) {
                    const response = {statusCode: 409, body: {result: false, error: "Item already exists! (Possible Duplicate)"}}
                    processAddLog(userId, 'create', event, response, response.statusCode)
                    return response;        
                }
                
            }
            
        
        }

    }
    
    const id = newUuidV4();

    var shortId = "";
    shortId = (new Date()).getTime().toString(36);
    values["shortid"] = {};
    values["shortid"]["type"] = 'sf-i-input';
    values["shortid"]["value"] = [shortId];
    
    var shortNumId = "";
    shortNumId = parseInt((new Date()).getTime()/1000);
    values["shortnumid"] = {};
    values["shortnumid"]["type"] = 'sf-i-input';
    values["shortnumid"]["value"] = [shortNumId];
    
    const item = {};
    for(var i = 0; i < Object.keys(values).length; i++) {
        item[Object.keys(values)[i]] = {"S": JSON.stringify(values[Object.keys(values)[i]].value)};
    }
    item["id"] = {"S": id};
    
    var setParams = {
        TableName: TABLE,
        Item: item
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
    
    await processUploadSearch(id, values[SEARCH_INDEX].value, values)
    
    const response = {statusCode: 200, body: {result: true}};
    processAddLog(userId, 'create', event, response, response.statusCode)
    return response;

}