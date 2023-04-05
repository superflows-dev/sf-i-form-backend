import { SEARCH_ENDPOINT, REGION, TABLE, AUTH_ENABLE, AUTH_REGION, AUTH_API, AUTH_STAGE, ddbClient, ScanCommand, PutItemCommand, CloudSearchDomainClient, SearchCommand, UploadDocumentsCommand } from "./globals.mjs";

export const processUploadSearch = async (id, name, values) => {
  
    const client = new CloudSearchDomainClient({  
        endpoint: SEARCH_ENDPOINT,
        region: REGION
    });
    
    const input = { 
      documents: JSON.stringify([{
        "type": "add",
        "id": id,
        "fields": {"name": name, "data": JSON.stringify(values)}
      }]),
      contentType: "application/json",
    };
    
    console.log('input', input);
    
    const command = new UploadDocumentsCommand(input);
    
    var response = "";
    
    // async/await.
    try {
      response = await client.send(command);
      // process data.
    } catch (error) {
      // error handling.
    } finally {
      // finally.
    }
    
    console.log('upload response', response);
    
    return response;
    
  
}