import { CloudWatchLogsClient, PutLogEventsCommand, REGION, LOG_GROUP_NAME } from "./globals.mjs";
import { processClearLog } from './clearlog.mjs'
import { newUuidV4 } from './newuuid.mjs'

export const processAddLog = async (userId, op, req, resp, httpCode) => {
    
    // a client can be shared by different commands.
    const client = new CloudWatchLogsClient({ region: REGION });
    
    const params = {
       "logEvents": [ 
            { 
             "message": JSON.stringify({userId: userId, op: op, req: req, resp: resp, httpCode: httpCode}),
             "timestamp": new Date().getTime()
            }
        ],
        "logGroupName": LOG_GROUP_NAME,
        "logStreamName": "logs",
        "sequenceToken": newUuidV4()
    };
    const command = new PutLogEventsCommand(params);
    
    var data;
    // async/await.
    try {
      data = await client.send(command);
      // process data.
    } catch (error) {
      // error handling.
      console.log('error', error);
    } finally {
      // finally.
    }
    
    return {statusCode: 200, body: {result: true}};

}