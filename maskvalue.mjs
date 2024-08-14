export const processMaskValue = (valueStr) => {
    if(valueStr.indexOf('@') >= 0){
        const arrEmail = valueStr.split('@');
        if(arrEmail[0].length > 1) {
            arrEmail[0] = (arrEmail[0] + "").substring(0, 2) + "x".repeat(arrEmail[0].length - 3) + (arrEmail[0] + "").substring(arrEmail[0].length - 1, arrEmail[0].length);
        } 
        arrEmail[1] = (arrEmail[1] + "").substring(0, 1) + "x".repeat(arrEmail[1].length - 2) + (arrEmail[1] + "").substring(arrEmail[1].length - 1, arrEmail[1].length);
    
        return arrEmail[0] + '@' + arrEmail[1];
    }else{
        let maskStr = valueStr
        maskStr = (maskStr + "").substring(0, 2) + "x".repeat(maskStr.length - 3) + (maskStr + "").substring(maskStr.length - 1, maskStr.length);
        return maskStr
    }

}