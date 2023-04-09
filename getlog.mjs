import { CloudWatchLogsClient, GetLogEventsCommand, REGION, LOG_GROUP_NAME } from "./globals.mjs";
import { newUuidV4 } from './newuuid.mjs'

export const processGetLog = async () => {
    
    // a client can be shared by different commands.
    const client = new CloudWatchLogsClient({ region: REGION });
    const input = { // GetLogEventsRequest
      "logGroupName": LOG_GROUP_NAME,
      "logStreamName": "log",
    };
    
    const command = new GetLogEventsCommand(input);
    
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
    
    return {statusCode: 200, body: {result: data}};

}