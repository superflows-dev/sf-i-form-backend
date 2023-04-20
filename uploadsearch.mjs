import { SEARCH_ENDPOINT, REGION, TABLE, AUTH_ENABLE, AUTH_REGION, AUTH_API, AUTH_STAGE, ddbClient, ScanCommand, PutItemCommand, CloudSearchDomainClient, SearchCommand, UploadDocumentsCommand, FIELDS } from "./globals.mjs";

export const processUploadSearch = async (id, name, values) => {
  
    const client = new CloudSearchDomainClient({  
        endpoint: SEARCH_ENDPOINT.replace('search-', 'doc-'),
        region: REGION
    });
    
    var data = [];
    var cols = [];
    
    console.log(FIELDS, values);
    
    for(var i = 0; i < FIELDS.length; i++) {
      
      if(values[FIELDS[i]].text != null) {
      
        data.push(values[FIELDS[i]].text);
        
      } else {
        
        data.push(values[FIELDS[i]].value);
      
      }
      
      cols.push(FIELDS[i]);
      
    }
    
    const nameUpload = Array.isArray(name) ? name[0] : name;
    
    const input = { 
      documents: JSON.stringify([{
        "type": "add",
        "id": id,
        "fields": {"name": TABLE, "data": JSON.stringify(data), "cols": JSON.stringify(cols)}
      }]),
      contentType: "application/json",
    };
    
    console.log(input);
    
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