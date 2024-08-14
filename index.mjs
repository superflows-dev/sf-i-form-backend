import { processCreate } from './create.mjs';
import { processDelete } from './delete.mjs';
import { processList } from './list.mjs';
import { processListLarge } from './listlarge.mjs';
import { processDetail } from './detail.mjs';
import { processUpdate } from './update.mjs';
import { processUpdateField } from './updatefield.mjs';
import { processScanByField } from './scanbyfield.mjs';
import { processScanByField1 } from './scanbyfield1.mjs';
import { processLogs } from './logs.mjs';
import { processGetLatestList } from './getlatestlist.mjs';
import { ENTITY_NAME } from './globals.mjs';

export const handler = async (event, context, callback) => {
    
    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin" : '*',
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "Authorization, Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers, Access-Control-Allow-Credentials, Content-Type, isBase64Encoded, x-requested-with",
        "Access-Control-Allow-Credentials" : true,
        'Content-Type': 'application/json',
        "isBase64Encoded": false
      },
    };
    
    if(event["httpMethod"] == "OPTIONS") {
      callback(null, response);
      return;
    }
    
    if(event["requestContext"] != null) {
      if(event["requestContext"]["http"] != null) {
        if(event["requestContext"]["http"]["method"] != null) {
          if(event["requestContext"]["http"]["method"] == "OPTIONS") {
            callback(null, response);
            return;
          }
        }
      }
    }
    
    var path = "";
    
    if(event["path"] != null) {
      path = event["path"];
    } else {
      path = event["rawPath"];
    }
    
    if(event["headers"] != null) {
      if(event["headers"]["authorization"] != null) {
        event["headers"]["Authorization"] = event["headers"]["authorization"]
      } else if(event["headers"]["Authorization"] != null) {
        event["headers"]["authorization"] = event["headers"]["Authorization"]
      }
    }
    
    switch(path) {
      
        case "/"+ENTITY_NAME+"/create":
        case "/create":
          const resultCreate = await processCreate(event);
          response.body = JSON.stringify(resultCreate.body);
          response.statusCode = resultCreate.statusCode;
        break;
        
        case "/"+ENTITY_NAME+"/list":
        case "/list":
          const resultList = await processList(event);
          response.body = JSON.stringify(resultList.body);
          response.statusCode = resultList.statusCode;
        break;
        
        case "/"+ENTITY_NAME+"/listlarge":
        case "/listlarge":
          const resultListLarge = await processListLarge(event);
          response.body = JSON.stringify(resultListLarge.body);
          response.statusCode = resultListLarge.statusCode;
        break;
        
        case "/"+ENTITY_NAME+"/detail":
        case "/detail":
          const resultDetail = await processDetail(event);
          response.body = JSON.stringify(resultDetail.body);
          response.statusCode = resultDetail.statusCode;
        break;
        
        case "/"+ENTITY_NAME+"/update":
        case "/update":
          const resultUpdate = await processUpdate(event);
          response.body = JSON.stringify(resultUpdate.body);
          response.statusCode = resultUpdate.statusCode;
        break;
        
        case "/"+ENTITY_NAME+"/updatefield":
        case "/updatefield":
          const resultUpdateField = await processUpdateField(event);
          response.body = JSON.stringify(resultUpdateField.body);
          response.statusCode = resultUpdateField.statusCode;
        break;
        
        case "/"+ENTITY_NAME+"/scanbyfield":
        case "/scanbyfield":
          const resultScanByField = await processScanByField(event);
          response.body = JSON.stringify(resultScanByField.body);
          response.statusCode = resultScanByField.statusCode;
        break;
        
        case "/"+ENTITY_NAME+"/delete":
        case "/delete":
          const resultDelete = await processDelete(event);
          response.body = JSON.stringify(resultDelete.body);
          response.statusCode = resultDelete.statusCode;
        break;
        
        case "/"+ENTITY_NAME+"/logs":
        case "/logs":
          const resultLogs = await processLogs(event);
          response.body = JSON.stringify(resultLogs.body);
          response.statusCode = resultLogs.statusCode;
        break;
        
        case "/"+ENTITY_NAME+"/getlatestlist":
        case "/getlatestlist":
          const resultLatestList = await processGetLatestList(event);
          response.body = JSON.stringify(resultLatestList.body);
          response.statusCode = resultLatestList.statusCode;
        break;
        
    }
    
    callback(null, response);
    
    return response;
};