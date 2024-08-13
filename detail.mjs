import { SEARCH_ENDPOINT, REGION, TABLE, AUTH_ENABLE, AUTH_REGION, AUTH_API, AUTH_STAGE, ddbClient, GetItemCommand, DeleteItemCommand, ScanCommand, PutItemCommand, CloudSearchDomainClient, SearchCommand, ADMIN_METHODS, SEARCH_INDEX, SERVER_KEY, ENCRYPTED_FIELDS } from "./globals.mjs";
import { processAuthenticate } from './authenticate.mjs';
import { newUuidV4 } from './newuuid.mjs';
import { processAddLog } from './addlog.mjs';
import { processSearchName } from './searchname.mjs';
import { processDeleteSearch } from './deletesearch.mjs';
import { processDecryptData } from './decryptdata.mjs'
export const processDetail = async (event) => {

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
        
        if(ADMIN_METHODS.includes("detail")) {
            if(!authResult.admin) {
                return {statusCode: 401, body: {result: false, error: "Unauthorized request!"}};
            }   
        }

        userId = authResult.userId;

    }
    
    // userId = "1234";

    var id = null;
    var projectId = "";
    try {
        id = JSON.parse(event.body).id.trim();
        if(JSON.parse(event.body).projectid != null){
            projectId = JSON.parse(event.body).projectid.trim()
        }
    } catch (e) {
        const response = {statusCode: 400, body: { result: false, error: "Malformed body!"}};
        //processAddLog(userId, 'detail', event, response, response.statusCode)
        return response;
    }
    
    if(id == null || id == "" || id.length < 6) {
        const response = {statusCode: 400, body: {result: false, error: "Id is not valid!"}}
       // processAddLog(userId, 'detail', event, response, response.statusCode)
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
       // processAddLog(userId, 'detail', event, response, response.statusCode)
        return response;
    }
    for(var i = 0; i < Object.keys(resultGet.Item).length; i++){
        if(Object.keys(resultGet.Item)[i] == 'project'){
            projectId = JSON.parse(resultGet.Item[Object.keys(resultGet.Item)[i]].S)[0]
            console.log('project found', projectId)
        }
    }
    var unmarshalledItem = {};
    for(i = 0; i < Object.keys(resultGet.Item).length; i++) {
        if(ENCRYPTED_FIELDS.includes(Object.keys(resultGet.Item)[i]) && projectId != null && projectId != ""){
            unmarshalledItem[Object.keys(resultGet.Item)[i]] = await processDecryptData(projectId, resultGet.Item[Object.keys(resultGet.Item)[i]][Object.keys(resultGet.Item[Object.keys(resultGet.Item)[i]])[0]]);
        }else{
            unmarshalledItem[Object.keys(resultGet.Item)[i]] = resultGet.Item[Object.keys(resultGet.Item)[i]][Object.keys(resultGet.Item[Object.keys(resultGet.Item)[i]])[0]];
        }
    }
    
    const response = {statusCode: 200, body: {result: true, data: {value: unmarshalledItem}}};
    return response;
    
}