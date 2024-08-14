import { SEARCH_ENDPOINT, REGION, TABLE, AUTH_ENABLE, AUTH_REGION, AUTH_API, AUTH_STAGE, ddbClient, GetItemCommand, DeleteItemCommand, ScanCommand, PutItemCommand, CloudSearchDomainClient, SearchCommand, ADMIN_METHODS, SEARCH_INDEX, SERVER_KEY, ENCRYPTED_FIELDS } from "./globals.mjs";
import { processAuthenticate } from './authenticate.mjs';
import { newUuidV4 } from './newuuid.mjs';
import { processAddLog } from './addlog.mjs';
import { processSearchName } from './searchname.mjs';
import { processDeleteSearch } from './deletesearch.mjs';
import { processDecryptData } from './decryptdata.mjs'

export const processListLarge = async (event) => {

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
        
        if(ADMIN_METHODS.includes("list")) {
            if(!authResult.admin) {
                return {statusCode: 401, body: {result: false, error: "Unauthorized request!"}};
            }   
        }

        userId = authResult.userId;
       
    }

    
    // userId = "1234";

    var searchstring = null;
    var cursor = null;
    
    try {
        searchstring = JSON.parse(event.body).searchstring.trim();
        cursor = JSON.parse(event.body).cursor.trim();
    } catch (e) {
        const response = {statusCode: 400, body: { result: false, error: "Malformed body!"}};
        // processAddLog(userId, 'list', event, response, response.statusCode)
        return response;
    }
    
    if(searchstring == null || searchstring == "" || searchstring.length < 0) {
        searchstring = ""
    }
    
    
    if(cursor == null || cursor == "" || cursor.length < 0) {
        cursor = "initial"
    }
    
    const searchResult = await processSearchName(searchstring, cursor, 100);
    
    // for(let [i, hit] of searchResult.hits.hit.entries()){
    //     let cols = JSON.parse(hit.fields.cols)
    //     let data = JSON.parse(hit.fields.data)
    //     let projectId = "";
    //     let flagFoundEncrypted = false
    //     if(cols.indexOf('project') >= 0){
    //         // projectId = data[cols.length + cols.indexOf('project')][0]
    //         // console.log('projectid data',data,cols.indexOf('project'),cols.length, data.length)
    //         // console.log('projectId found', projectId)
    //         for(let [j,col] of cols.entries()){
    //             if(ENCRYPTED_FIELDS.includes(col)){
                    
    //                 let decryptedData = await processDecryptData(JSON.stringify(data[j])) 
    //                 data[j] = JSON.parse(decryptedData)
    //                 flagFoundEncrypted = true;
                    
    //             }
    //         }
    //     }
        
    //     if(flagFoundEncrypted){
    //         console.log('decrypted', data.length)
    //         searchResult.hits.hit[i].fields.data = JSON.stringify(data)
    //     }
    // }
    
    const response = {statusCode: 200, body: {result: true, values: searchResult.hits.hit, cursor: searchResult.hits.cursor, found: searchResult.hits.found}};
    //processAddLog(userId, 'list', event, response, response.statusCode)
    return response;

}