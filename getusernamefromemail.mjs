import https from 'https';
import { USER_PROFILES_API, USER_PROFILES_SCANBYFIELD_PATH, AUTH_REGION } from "./globals.mjs";

export const processGetUserNameFromEmail = async (email, authorization) => {
    let myPromise = new Promise(function(resolve, reject) {
        var options = {
            host: USER_PROFILES_API + '.lambda-url.' + AUTH_REGION + '.on.aws',
            port: 443,
            method: 'POST',
            path: USER_PROFILES_SCANBYFIELD_PATH,
            headers: {
                'Authorization': authorization,
                'Content-Type': 'application/json'
            }
        };
        
        console.log(options);
        
        //this is the call
        var request = https.request(options, function(response){
          let data = '';
          response.on('data', (chunk) => {
              data = data + chunk.toString();
          });
        
          response.on('end', () => {
              const body = JSON.parse(data);
              console.log('success user', body);
              resolve(body)
          });
        })
        
        request.on('error', error => {
          console.log('error user', error)
          resolve(error);
        })
        
        request.write(JSON.stringify({"field":"userid","value":email}))
        request.end();
        
    });
  
  return myPromise;
}