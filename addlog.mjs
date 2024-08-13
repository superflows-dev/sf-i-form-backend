import { CloudWatchLogsClient, PutLogEventsCommand, REGION, LOG_GROUP_NAME, PutObjectCommand, s3Client, S3_BUCKET_NAME } from "./globals.mjs";
import { newUuidV4 } from './newuuid.mjs'
import { processEncryptData } from './encryptdata.mjs'
export const processAddLog = async (userId, op, req, resp, httpCode, projectid = "", delta = null) => {
    
    
    let logObject = {userId: userId, op: op, req: req, resp: resp, httpCode: httpCode, delta: delta}
    
    var d = new Date();
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    let year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;
    
    let logData = JSON.stringify(logObject)
    if(projectid != null && projectid != ""){
        logData = await processEncryptData(projectid, logData)
    }
    let command = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: year + '/' + month + '/' + d.getTime() + '_log.json',
        Body: logData,
        ContentType: 'application/json'
    });
    
    try {
        await s3Client.send(command);
    } catch (err) {
        console.log("log error",err);
    }
    
    return {statusCode: 200, body: {result: true}};

}