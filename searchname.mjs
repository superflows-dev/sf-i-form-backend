import { SEARCH_ENDPOINT, REGION, TABLE, AUTH_ENABLE, AUTH_REGION, AUTH_API, AUTH_STAGE, ddbClient, ScanCommand, PutItemCommand, CloudSearchDomainClient, SearchCommand } from "./globals.mjs";

export const processSearchName = async (searchString) => {
  
  const client = new CloudSearchDomainClient({ 
        endpoint: SEARCH_ENDPOINT,
        region: REGION
    });
    
    const params = {
      query: searchString
    };
    
    const command = new SearchCommand(params);
    
    //console.log('command', command)
    
    var data;
    
    // async/await.
    try {
      data = await client.send(command);
      // process data.
    } catch (error) {
      // error handling.
      console.log(error);
    } finally {
      // finally. 
    }
    
    return data;
    
  
}