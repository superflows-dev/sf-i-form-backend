import { CloudWatchLogsClient, GetLogEventsCommand, REGION, LOG_GROUP_NAME, ListObjectsV2Command, s3Client, S3_BUCKET_NAME, GetObjectCommand } from "./globals.mjs";
import { newUuidV4 } from './newuuid.mjs'

export const processGetLog = async (starttime, endtime) => {
    
    const startDate = new Date(parseInt(starttime));
    const endDate = new Date(parseInt(endtime));
    endDate.setDate(endDate.getDate() + 1);
    
    let fileList = []
    let endMonth = '' + (endDate.getMonth() + 1);
    let endDay = '' + endDate.getDate();
    let endYear = endDate.getFullYear();
    
    if (endMonth.length < 2) 
        endMonth = '0' + endMonth;
    if (endDay.length < 2) 
        endDay = '0' + endDay;
    let endTime = endDate.getTime()
    console.log(endDay, endMonth, endYear)
    
    let startMonth = '' + (startDate.getMonth() + 1);
    let startDay = '' + startDate.getDate();
    let startYear = startDate.getFullYear();
    
    if (startMonth.length < 2) 
        startMonth = '0' + startMonth;
    if (startDay.length < 2) 
        startDay = '0' + startDay;
    let startTime = startDate.getTime()
    console.log(startDay, startMonth, startYear)
    try {
        let totalLogs = []
        let responseLogs;
        
        for (var year = startYear; year <= endYear; year++) {
            console.log("year",year)
            for (var month = parseInt(startMonth); year == endYear ? (month <= parseInt(endMonth)) : (month <= 12); month++){
                console.log("month", month)
                do{
                    let monthStr = month + ''
                    if(monthStr.length < 2) monthStr = '0' + monthStr
                    console.log("checking folders", year, monthStr)
                    var compliancesCommand = new ListObjectsV2Command({
                        Bucket: S3_BUCKET_NAME,
                        Prefix: year + '/' + monthStr + '/',
                        Delimiter: '/',
                        ContinuationToken: responseLogs?.NextContinuationToken ?? null
                    })
                    responseLogs = await s3Client.send(compliancesCommand);
                    if(responseLogs.Contents != null){
                        totalLogs = totalLogs.concat(responseLogs.Contents)
                    }
                }while(responseLogs.IsTruncated)
            }
        }
        
        console.log("logs received", totalLogs)
        for (const file of totalLogs) {
            let filenameArr = file.Key.split("/")
            let filename = filenameArr[filenameArr.length - 1]
            let fileTime = filename.split("_")[0]
            console.log(fileTime, startTime, endTime)
            if(parseInt(fileTime) >= (startTime) && parseInt(fileTime) <= (endTime)){
                fileList.push(file)
            }
        }
    } catch (err) {
        console.log("list",err); 
    }
    var data = []
    for (const file of fileList) {
        var command = new GetObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: file.Key,
        });
        
        var jsonData = {};
        
        try {
            const response = await s3Client.send(command);
            const s3ResponseStream = response.Body;
            const chunks = []
            for await (const chunk of s3ResponseStream) {
                chunks.push(chunk)
            }
            const responseBuffer = Buffer.concat(chunks)
            const jsonContent = JSON.parse(responseBuffer.toString());
            
            let filenameArr = file.Key.split("/")
            let filename = filenameArr[filenameArr.length - 1]
            let fileTime = filename.split("_")[0]
            data.push({message:jsonContent, timestamp:parseInt(fileTime)});
        } catch (err) {
            console.log("log read",err); 
        } 

    }
    console.log("logs", data)
    return {statusCode: 200, body: {result: data}};

}