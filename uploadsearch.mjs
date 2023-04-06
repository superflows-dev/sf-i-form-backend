import { SEARCH_ENDPOINT, REGION, TABLE, AUTH_ENABLE, AUTH_REGION, AUTH_API, AUTH_STAGE, ddbClient, ScanCommand, PutItemCommand, CloudSearchDomainClient, SearchCommand, UploadDocumentsCommand } from "./globals.mjs";

export const processUploadSearch = async (id, name, searchfields, values) => {
  
    const client = new CloudSearchDomainClient({  
        endpoint: SEARCH_ENDPOINT,
        region: REGION
    });
    
    var data = [];
    
    for(var i = 0; i < searchfields.length; i++) {
      
      data.push(values[searchfields[i]].text);
      
    }
    
    const input = { 
      documents: JSON.stringify([{
        "type": "add",
        "id": id,
        "fields": {"name": name, "data": JSON.stringify(data)}
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