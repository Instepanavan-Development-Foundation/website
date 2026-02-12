/**
 * Ameriabank vPOS Error Code Parser
 * Based on vPOS API 3.1 Documentation - Table 1
 */

interface ErrorCodeMapping {
  code: string;
  messageEn: string;
  messageAm: string;
}

const ERROR_CODES: ErrorCodeMapping[] = [
  // Success
  { code: "00", messageEn: "Payment successfully completed", messageAm: "Վճարումը հաջողությամբ կատարվեց" },

  // Common errors
  { code: "0902", messageEn: "Transaction is not allowed. Please contact your bank.", messageAm: "Գործարքն արգելված է։ Խնդրում ենք կապվել ձեր բանկի հետ։" },
  { code: "0101", messageEn: "Card has expired", messageAm: "Քարտի վավերականության ժամկետը լրացել է" },
  { code: "0111", messageEn: "Invalid card number", messageAm: "Քարտի համարն անվավեր է" },
  { code: "0116", messageEn: "Insufficient funds", messageAm: "Անբավարար միջոցներ" },
  { code: "0100", messageEn: "Card is blocked for online transactions", messageAm: "Քարտը արգելափակված է օնլայն գործարքների համար" },
  { code: "0104", messageEn: "Card is blocked", messageAm: "Քարտն արգելափակված է" },
  { code: "0120", messageEn: "Transaction not allowed by issuer", messageAm: "Գործարքն արգելված է թողարկող բանկի կողմից" },
  { code: "0121", messageEn: "Daily limit exceeded", messageAm: "Օրական սահմանաչափը գերազանցված է" },
  { code: "0123", messageEn: "Transaction limit exceeded", messageAm: "Գործարքների քանակի սահմանաչափը գերազանցված է" },
  { code: "0208", messageEn: "Card is lost", messageAm: "Քարտը կորած է" },
  { code: "0103", messageEn: "Please contact your bank", messageAm: "Խնդրում ենք կապվել ձեր բանկի հետ" },
  { code: "0107", messageEn: "Please contact your bank", messageAm: "Խնդրում ենք կապվել ձեր բանկի հետ" },

  // Technical errors
  { code: "0-1", messageEn: "Connection timeout. Please try again.", messageAm: "Կապի ժամանակը սպառվել է։ Խնդրում ենք փորձել կրկին։" },
  { code: "0907", messageEn: "Bank is temporarily unavailable", messageAm: "Բանկը ժամանակավորապես հասանելի չէ" },
  { code: "0910", messageEn: "Bank is temporarily unavailable", messageAm: "Բանկը ժամանակավորապես հասանելի չէ" },
  { code: "0151018", messageEn: "Processing timeout", messageAm: "Մշակման ժամանակը սպառվել է" },
  { code: "0151019", messageEn: "Processing timeout", messageAm: "Մշակման ժամանակը սպառվել է" },

  // 3D Secure errors
  { code: "0-2006", messageEn: "Authentication failed", messageAm: "Նույնականացումը ձախողվեց" },
  { code: "0-2007", messageEn: "Payment timeout", messageAm: "Վճարման ժամանակը սպառվել է" },
  { code: "0151017", messageEn: "3D Secure connection error", messageAm: "3D Secure կապի սխալ" },

  // Limits and restrictions
  { code: "0-2002", messageEn: "Payment limit exceeded", messageAm: "Վճարման սահմանաչափը գերազանցված է" },
  { code: "0-20010", messageEn: "Transaction limit exceeded", messageAm: "Գործարքի սահմանաչափը գերազանցված է" },
  { code: "0110", messageEn: "Invalid amount", messageAm: "Անվավեր գումար" },

  // Fraud and security
  { code: "0-2000", messageEn: "Card is blacklisted", messageAm: "Քարտը սև ցուցակում է" },
  { code: "02001", messageEn: "Transaction declined due to fraud detection", messageAm: "Գործարքը մերժվել է խարդախության կասկածի պատճառով" },

  // System errors
  { code: "07", messageEn: "System error. Please try again.", messageAm: "Համակարգային սխալ։ Խնդրում ենք փորձել կրկին։" },
  { code: "550", messageEn: "System error", messageAm: "Համակարգային սխալ" },
  { code: "560", messageEn: "Operation failed", messageAm: "Գործողությունը ձախողվեց" },
  { code: "500", messageEn: "Unknown error", messageAm: "Անհայտ սխալ" },

  // Duplicate
  { code: "01", messageEn: "Order already exists", messageAm: "Պատվերն արդեն գոյություն ունի" },
  { code: "08204", messageEn: "Duplicate order", messageAm: "Կրկնօրինակ պատվեր" },
];

/**
 * Parse Ameriabank error code and return user-friendly message in Armenian
 */
export function parseAmeriabankError(
  responseCode: string | number,
  responseMessage?: string
): string {
  const code = String(responseCode);

  // Find exact match
  const error = ERROR_CODES.find(e => e.code === code);
  if (error) {
    return error.messageAm;
  }

  // If no exact match and we have a response message, use it
  if (responseMessage) {
    return `Վճարման սխալ: ${responseMessage} (կոդ: ${code})`;
  }

  // Generic error message
  return `Վճարումը ձախողվեց։ Սխալի կոդ: ${code}`;
}

/**
 * Check if error code indicates a successful transaction
 */
export function isSuccessCode(responseCode: string | number): boolean {
  return String(responseCode) === "00";
}

/**
 * Get error category for analytics/logging
 */
export function getErrorCategory(responseCode: string | number): string {
  const code = String(responseCode);

  if (code === "00") return "success";
  if (code.startsWith("01")) return "card_declined";
  if (code.startsWith("02")) return "fraud_security";
  if (code.startsWith("0-2")) return "limits_restrictions";
  if (code.startsWith("015")) return "technical_3ds";
  if (code.startsWith("09")) return "bank_unavailable";
  if (code.match(/^(550|560|500|07)$/)) return "system_error";

  return "unknown";
}
