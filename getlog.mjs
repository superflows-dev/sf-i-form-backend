import { CloudWatchLogsClient, GetLogEventsCommand, REGION, LOG_GROUP_NAME } from "./globals.mjs";
import { newUuidV4 } from './newuuid.mjs'

export const processGetLog = async () => {
    
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    var nextBackwardToken = "";
    
    // a client can be shared by different commands.
    const client = new CloudWatchLogsClient({ region: REGION });
    const input = { // GetLogEventsRequest
      "logGroupName": LOG_GROUP_NAME,
      "logStreamName": "log",
      "startTime": lastWeek.getTime(),
      "startFromHead": false,
    };
    
    var command = new GetLogEventsCommand(input);
    
    var data;
    // async/await.
    try {
      data = await client.send(command);
      nextBackwardToken = data.nextBackwardToken;
      console.log('nextBackwardToken before while', nextBackwardToken, data.nextForwardToken);
      while(true) {
        
        input["nextToken"] = nextBackwardToken;
        console.log('input', input)
        command = new GetLogEventsCommand(input);
        
        var data1;
        data1 = await client.send(command);
        console.log('nextBackwardToken inside while', data1.nextBackwardToken, nextBackwardToken);  
        if(data1.nextBackwardToken == nextBackwardToken) {
          break;
        } else {
          const merged = [...data.events, ...data1.events]
          data.events = merged;
          nextBackwardToken = data1.nextBackwardToken;
        }
        
        
      }
      console.log('data length', data.events.length);
      // process data.
    } catch (error) {
      // error handling.
      console.log('error', error);
    } finally {
      // finally.
    }
    
    return {statusCode: 200, body: {result: data}};

}