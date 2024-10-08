import { SEARCH_ENDPOINT, REGION, TABLE, AUTH_ENABLE, AUTH_REGION, AUTH_API, AUTH_STAGE, ddbClient, UpdateItemCommand, GetItemCommand, DeleteItemCommand, ScanCommand, PutItemCommand, CloudSearchDomainClient, SearchCommand, ADMIN_METHODS, SEARCH_INDEX, FIELDS, SERVER_KEY, ENTITY_NAME, ENCRYPTED_FIELDS } from "./globals.mjs";
import { processAuthenticate } from './authenticate.mjs';
import { newUuidV4 } from './newuuid.mjs';
import { processAddLog } from './addlog.mjs';
import { processSearchName } from './searchname.mjs';
import { processUploadSearch } from './uploadsearch.mjs';
import { processDeleteSearch } from './deletesearch.mjs';
import { processManageChange } from './managechange.mjs';
import { processEncryptData } from './encryptdata.mjs';
import { processGetUserNameFromEmail } from './getusernamefromemail.mjs'
export const processUpdate = async (event) => {

    var serverkey = "";
    var userId = "1234"
    let userName = ""
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

        let responseUser = await processGetUserNameFromEmail(email, event["headers"]["Authorization"])
        let user = responseUser.result[0]
        userName = JSON.parse(user.name.S)
        userId = user.id.S;
        console.log('userName', userName)

    }

    // userId = "1234";

    var id = null;
    var values = null;
    var disablechange = "";
    
    try {
        id = JSON.parse(event.body).id.trim();
        values = JSON.parse(event.body).values;
        disablechange = JSON.parse(event.body).disablechange;
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

    var disableChangeManagement = false;

    if(disablechange != null && disablechange) {
      disableChangeManagement = true;
    }
    let projectId = ""
    for(var i = 0; i < Object.keys(values).length; i++) {
        if(Object.keys(values)[i] == "project"){
            projectId = values[Object.keys(values)[i]].value[0]
        }
        if(!FIELDS.includes(Object.keys(values)[i])) {
            
            const response = {statusCode: 400, body: {result: false, error: "Values are not valid!"}}
            processAddLog(userId, 'update', event, response, response.statusCode, projectId)
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
        processAddLog(userId, 'update', event, response, response.statusCode, projectId)
        return response;
    }

    var oldName = resultGet.Item[SEARCH_INDEX];

    var shortId = "";
    if(resultGet.Item["shortid"] == null) {
        shortId = (new Date()).getTime().toString(36);
    } else {
        shortId = JSON.parse(resultGet.Item["shortid"].S)[0];
    }
    
    values["shortid"] = {};
    values["shortid"]["type"] = 'sf-i-input';
    values["shortid"]["value"] = [shortId];
    
    var shortNumId = "";
    if(resultGet.Item["shortnumid"] == null) {
        shortNumId = parseInt((new Date()).getTime()/1000);
    } else {
        shortNumId = JSON.parse(resultGet.Item["shortnumid"].S)[0];
    }
    
    values["shortnumid"] = {};
    values["shortnumid"]["type"] = 'sf-i-input';
    values["shortnumid"]["value"] = [shortNumId];
    
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
        if(ENCRYPTED_FIELDS.includes(Object.keys(values)[i])){
            let encryptedData = await processEncryptData(JSON.stringify(values[Object.keys(values)[i]].value))
            exprValues[':' + Object.keys(values)[i] + "1"] = {S: encryptedData};
        }else{
            exprValues[':' + Object.keys(values)[i] + "1"] = {S: JSON.stringify(values[Object.keys(values)[i]].value)};
        }
        
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
            if(oldKey !== JSON.stringify(values[Object.keys(values)[i]].value)){
                delta.push({'field':Object.keys(values)[i], "oldValue" : oldKey, "newValue" : JSON.stringify(values[Object.keys(values)[i]].value)})
            }
            
        }
        
    }
    
    await processUploadSearch(id, values[SEARCH_INDEX].value, values, projectId, userName, new Date().getTime())

    if(!disableChangeManagement) {
        await processManageChange(event["headers"]["Authorization"], 
            { 
                changedEntity: ENTITY_NAME,
                changedEntityId: id,
                changedEntityOldName: oldName.S,
                changedEntityNewName: values[SEARCH_INDEX].value,
                delta: delta
            }
        );
    }
    
    const response = {statusCode: 200, body: {result: true}};
    processAddLog(userId, 'update', event, response, response.statusCode, projectId, delta)
    return response;

}