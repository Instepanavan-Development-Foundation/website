// Using the 'axios' library to make HTTP requests
const axios = require('axios');
const xml2js = require('xml2js');

/**
 * Function to get transaction list from AmeriaBank vPOS system
 * @param {string} clientID - Merchant ID
 * @param {string} username - Merchant username
 * @param {string} password - Merchant password
 * @param {string} startDate - Start date in format: yyyy/MM/dd HH:mm
 * @param {string} endDate - End date in format: yyyy/MM/dd HH:mm
 * @returns {Promise} - Promise resolving with transaction data or error
 */
async function getTransactionList(clientID, username, password, startDate, endDate) {
    // SOAP API endpoint
    const url = 'https://testpayments.ameriabank.am/Admin/webservice/TransactionsInformationService.svc';
    
    // Create SOAP envelope
    // const soapRequest = `
    //     <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
    //         <s:Header>
    //             <Action s:mustUnderstand="1" 
    //                 xmlns="http://schemas.microsoft.com/ws/2005/05/addressing/none">
    //                 http://payments.ameriabank.am/ITransactionsInformationService/ITransactionsInformationService/GetTransactionList
    //             </Action>
    //         </s:Header>
    //         <s:Body>
    //             <GetTransactionList xmlns="http://payments.ameriabank.am/ITransactionsInformationService">
    //                 <transclient xmlns:d4p1="payments.ameriabank.am/TransactionClient"
    //                     xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
    //                     <d4p1:ClientID>${clientID}</d4p1:ClientID>
    //                     <d4p1:EndDate>${endDate}</d4p1:EndDate>
    //                     <d4p1:Password>${password}</d4p1:Password>
    //                     <d4p1:StartDate>${startDate}</d4p1:StartDate>
    //                     <d4p1:Username>${username}</d4p1:Username>
    //                 </transclient>
    //             </GetTransactionList>
    //         </s:Body>
    //     </s:Envelope>
    // `;

    const soapRequest='<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Header><Action s:mustUnderstand="1" xmlns="http://schemas.microsoft.com/ws/2005/05/addressing/none">http://payments.ameriabank.am/ITransactionsInformationService/ITransactionsInformationService/GetTransactionList</Action></s:Header><s:Body><GetTransactionList xmlns="http://payments.ameriabank.am/ITransactionsInformationService"><transclient xmlns:d4p1="http://payments.ameriabank.am/TransactionClient" xmlns:i="http://www.w3.org/2001/XMLSchema-instance"><d4p1:ClientID>83D64FD0-594E-456F-BAF9-3E3135E37639</d4p1:ClientID><d4p1:EndDate>2025/04/06 14:30</d4p1:EndDate>        <d4p1:Password>lazY2k</d4p1:Password><d4p1:StartDate>2025/04/01 14:18</d4p1:StartDate><d4p1:Username>3d19541048</d4p1:Username></transclient></GetTransactionList></s:Body></s:Envelope>'
    console.log({soapRequest});
    
    try {
        // Make the SOAP request
        const response = await axios({
            method: 'post',
            url: url,
            headers: {
                'Content-Type': 'text/xml;charset=UTF-8',
                'SOAPAction': 'http://payments.ameriabank.am/ITransactionsInformationService/ITransactionsInformationService/GetTransactionList'
            },
            data: soapRequest
        });
        
        // Parse the XML response
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(response.data);
        
        // Extract the relevant transaction data from the SOAP response
        const transactionListResult = result['s:Envelope']['s:Body']
            .GetTransactionListResponse.GetTransactionListResult;
        
        // Process to extract OrderIDs and other relevant data
        const transactions = Array.isArray(transactionListResult['a:PaymentFields']) 
            ? transactionListResult['a:PaymentFields'] 
            : [transactionListResult['a:PaymentFields']];
        
        // Extract OrderIDs from transactions
        const orderIDs = transactions.map(transaction => transaction['a:OrderID']);
        
        return {
            orderIDs,
            transactions
        };
    } catch (error) {
        console.error('Error getting transaction list:', error);
        throw error;
    }
}

// Example usage
async function main() {
    const clientID = "13d576c9-bddc-444c-9d6a-dbcaf943f762";      // Merchant ID
    const username ="3d19541048";       // Merchant username
    const password = "lazY2k";       // Merchant password
    const startDate = '2025/04/01 00:00';   // Start date
    const endDate = '2025/04/07 09:59';     // End date
    
    try {
        const result = await getTransactionList(clientID, username, password, startDate, endDate);
        console.log('Order IDs:', result.orderIDs);
        console.log('Transaction details:', result.transactions);
    } catch (error) {
        console.error('Failed to get transaction list:', error.message);
    }
}

main();