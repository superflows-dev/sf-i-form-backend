import { SEARCH_ENDPOINT, REGION, TABLE, AUTH_ENABLE, AUTH_REGION, AUTH_API, AUTH_STAGE, ddbClient, ScanCommand, PutItemCommand, CloudSearchDomainClient, SearchCommand, UploadDocumentsCommand, FIELDS } from "./globals.mjs";

export const processDeleteSearch = async (id) => {
  
    const client = new CloudSearchDomainClient({  
        endpoint: SEARCH_ENDPOINT.replace('search-', 'doc-'),
        region: REGION
    });
    
    
    const input = { 
      documents: JSON.stringify([{
        "type": "delete",
        "id": id
      }]),
      contentType: "application/json",
    };
    
    const command = new UploadDocumentsCommand(input);
    
    var response = "";
    
    // async/await.
    try {
      response = await client.send(command);
      // process data.
    } catch (error) {
      // error handling.
      console.log(error);
    } finally {
      // finally.
    }
    
    return response;
  
}