import { SEARCH_ENDPOINT, REGION, TABLE, AUTH_ENABLE, AUTH_REGION, AUTH_API, AUTH_STAGE, ddbClient, GetItemCommand, DeleteItemCommand, ScanCommand, PutItemCommand, CloudSearchDomainClient, SearchCommand, ADMIN_METHODS, SEARCH_INDEX } from "./globals.mjs";
import { processAuthenticate } from './authenticate.mjs';
import { newUuidV4 } from './newuuid.mjs';
import { processAddLog } from './addlog.mjs';
import { processSearchName } from './searchname.mjs';
import { processDeleteSearch } from './deletesearch.mjs';

export const processList = async (event) => {

    // if((event["headers"]["Authorization"]) == null) {
    //     return {statusCode: 400, body: { result: false, error: "Malformed headers!"}};
    // }
    
    // if((event["headers"]["Authorization"].split(" ")[1]) == null) {
    //     return {statusCode: 400, body: { result: false, error: "Malformed headers!"}};
    // }
    
    // var hAscii = Buffer.from((event["headers"]["Authorization"].split(" ")[1] + ""), 'base64').toString('ascii');
    
    // if(hAscii.split(":")[1] == null) {
    //     return {statusCode: 400, body: { result: false, error: "Malformed headers!"}};
    // }
    
    // const email = hAscii.split(":")[0];
    // const accessToken = hAscii.split(":")[1];
    
    // if(email == "" || !email.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)) {
    //     return {statusCode: 400, body: {result: false, error: "Malformed headers!"}}
    // }
    
    // if(accessToken.length < 5) {
    //     return {statusCode: 400, body: {result: false, error: "Malformed headers!"}}
    // }
    
    // const authResult = await processAuthenticate(event["headers"]["Authorization"]);
    
    // if(!authResult.result) {
    //     return {statusCode: 401, body: {result: false, error: "Unauthorized request!"}};
    // }
    
    // if(ADMIN_METHODS.includes("list")) {
    //     if(!authResult.admin) {
    //         return {statusCode: 401, body: {result: false, error: "Unauthorized request!"}};
    //     }   
    // }
    
    // const userId = authResult.userId;

    const userId = "1234";

    var searchstring = null;
    var cursor = null;
    
    try {
        searchstring = JSON.parse(event.body).searchstring.trim();
        cursor = JSON.parse(event.body).cursor.trim();
    } catch (e) {
        const response = {statusCode: 400, body: { result: false, error: "Malformed body!"}};
        //processAddLog(userId, 'list', event, response, response.statusCode)
        return response;
    }
    
    if(searchstring == null || searchstring == "" || searchstring.length < 0) {
        searchstring = ""
    }
    
    
    if(cursor == null || cursor == "" || cursor.length < 0) {
        cursor = "initial"
    }
    
    const searchResult = await processSearchName(searchstring, cursor);
    
    const response = {statusCode: 200, body: {result: true, values: searchResult.hits.hit, cursor: searchResult.hits.cursor, found: searchResult.hits.found}};
    //processAddLog(userId, 'list', event, response, response.statusCode)
    return response;

}