import { SEARCH_ENDPOINT, REGION, TABLE, AUTH_ENABLE, AUTH_REGION, AUTH_API, AUTH_STAGE, ddbClient, ScanCommand, PutItemCommand, CloudSearchDomainClient, SearchCommand } from "./globals.mjs";

export const processSearchName = async (searchString, cursor, size = 10) => {
  
  const client = new CloudSearchDomainClient({ 
        endpoint: SEARCH_ENDPOINT,
        region: REGION
    });
    
    console.log('searchString', searchString);
    
    var query = "";
    
    // if(searchString == "") {
      
    //   query += "(and '"+TABLE+"' ";
    //   query += ")";
      
    // } else {
    
    //   query += "(and '"+TABLE+"' ";
      
    //   const arrSearch = Array.isArray(searchString) ? searchString : searchString.split("&");
      
    //   for(var i = 0; i < arrSearch.length; i++) {
    //     if(arrSearch[i] != "Select" && arrSearch[i].length > 0) {
    //       query += "(or (prefix field=data '"+arrSearch[i].split(" ")[0].replace(/[^A-Za-z0-9]/g, "")+"') (phrase field=data '"+arrSearch[i].split(" ")[0].replace(/[^A-Za-z0-9]/g, "")+"')) "
    //     }
    //   }
      
    //   query += ")";
        
    // }
    
    if(searchString == "") {
      
      query += TABLE;
      
    } else {
    
      query += TABLE + "&";
      
      const arrSearch = Array.isArray(searchString) ? searchString : searchString.split("&");
      
      for(var i = 0; i < arrSearch.length; i++) {
        if(arrSearch[i] != "Select" && arrSearch[i].length > 0) {
          query += '(' + arrSearch[i] + ")&";
          //query += "(or (prefix field=data '"+arrSearch[i].split(" ")[0].replace(/[^A-Za-z0-9]/g, "")+"') (phrase field=data '"+arrSearch[i].split(" ")[0].replace(/[^A-Za-z0-9]/g, "")+"')) "
        }
      }
      
      //query += ")";
        
    }
    
    const params = {
      query: query,
      queryParser: "simple",
      cursor: cursor,
      size: size,
      sort: 'data asc'
    };
    
    console.log(params);
    
    const command = new SearchCommand(params);
    
    //console.log('command', command)
    
    var data;
    
    // async/await.
    try {
      data = await client.send(command);
      console.log('data', data);
      // process data.
    } catch (error) {
      // error handling.
      console.log(error);
    } finally {
      // finally. 
    }
    
    return data;
    
  
}