import { SEARCH_ENDPOINT, REGION, TABLE, AUTH_ENABLE, AUTH_REGION, AUTH_API, AUTH_STAGE, SEARCH_INDEX } from "./globals.mjs";
import { processAuthenticate } from './authenticate.mjs';
import { processGetLogNotifications } from './getlognotifications.mjs';
import { processSearchName } from './searchname.mjs';

export const processGetLatestList = async (event) => {

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
    
    var starttime = null;
    var endtime = null;
    
    try {
        starttime = JSON.parse(event.body).starttime.trim();
        endtime = JSON.parse(event.body).endtime.trim();
    } catch (e) {
        console.log(e, event.body)
        const response = {statusCode: 400, body: { result: false, error: "Malformed body!"}};
        //processAddLog(userId, 'detail', event, response, response.statusCode)
        return response;
    }
    
    if(starttime == null || starttime == "" || starttime.length < 6) {
        const response = {statusCode: 400, body: {result: false, error: "Start Time is not valid!"}}
       // processAddLog(userId, 'detail', event, response, response.statusCode)
        return response;
    }
    if(endtime== null || endtime == "" || endtime.length < 6) {
        const response = {statusCode: 400, body: {result: false, error: "End Time is not valid!"}}
       // processAddLog(userId, 'detail', event, response, response.statusCode)
        return response;
    }

    const logs = await processGetLogNotifications(starttime, endtime);
    
    logs.body.result.sort(function(a, b) {
        var keyA = parseInt(a.timestamp),
          keyB = parseInt(b.timestamp);
        // Compare the 2 timestamps
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
    });
    let searchTerms = []
    for (let log of logs.body.result){
        console.log("log under consideration", log.message.op, log.timestamp)
        let logBody = JSON.parse(log.message.req.body)
        console.log('logBody', logBody.values, SEARCH_INDEX)
        let searchTerm = logBody.values[SEARCH_INDEX].text
        if(searchTerm == null){
            searchTerm = logBody.values[SEARCH_INDEX].value
        }
        if(searchTerm != null && searchTerms.indexOf(`"${searchTerm}"`) < 0){
            searchTerms.push(`"${searchTerm}"`)
        }
    }
    console.log('searchTerms', searchTerms.join('|'))
    const searchResult = await processSearchName(searchTerms.join('|'), "initial");
    const response = {statusCode: 200, body: {result: true, data: searchResult.hits.hit}};
    return response;
    
}
