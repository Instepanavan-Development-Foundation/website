/**
 * Ameriabank vPOS Error Code Parser (Client-side)
 * Based on vPOS API 3.1 Documentation - Table 1
 */

interface ErrorCodeMapping {
  code: string;
  messageAm: string;
}

const ERROR_CODES: ErrorCodeMapping[] = [
  // Success
  { code: "00", messageAm: "Վճարումը հաջողությամբ կատարվեց" },

  // Common errors
  {
    code: "0902",
    messageAm: "Գործարքն արգելված է։ Խնդրում ենք կապվել ձեր բանկի հետ։",
  },
  { code: "0101", messageAm: "Քարտի վավերականության ժամկետը լրացել է" },
  { code: "0111", messageAm: "Քարտի համարն անվավեր է" },
  { code: "0116", messageAm: "Անբավարար միջոցներ" },
  { code: "0100", messageAm: "Քարտը արգելափակված է օնլայն գործարքների համար" },
  { code: "0104", messageAm: "Քարտն արգելափակված է" },
  { code: "0120", messageAm: "Գործարքն արգելված է թողարկող բանկի կողմից" },
  { code: "0121", messageAm: "Օրական սահմանաչափը գերազանցված է" },
  { code: "0123", messageAm: "Գործարքների քանակի սահմանաչափը գերազանցված է" },
  { code: "0208", messageAm: "Քարտը կորած է" },
  { code: "0103", messageAm: "Խնդրում ենք կապվել ձեր բանկի հետ" },
  { code: "0107", messageAm: "Խնդրում ենք կապվել ձեր բանկի հետ" },

  // Technical errors
  {
    code: "0-1",
    messageAm: "Կապի ժամանակը սպառվել է։ Խնդրում ենք փորձել կրկին։",
  },
  { code: "0907", messageAm: "Բանկը ժամանակավորապես հասանելի չէ" },
  { code: "0910", messageAm: "Բանկը ժամանակավորապես հասանելի չէ" },
  { code: "0151018", messageAm: "Մշակման ժամանակը սպառվել է" },
  { code: "0151019", messageAm: "Մշակման ժամանակը սպառվել է" },

  // 3D Secure errors
  { code: "0-2006", messageAm: "Նույնականացումը ձախողվեց" },
  { code: "0-2007", messageAm: "Վճարման ժամանակը սպառվել է" },
  { code: "0151017", messageAm: "3D Secure կապի սխալ" },

  // Limits and restrictions
  { code: "0-2002", messageAm: "Վճարման սահմանաչափը գերազանցված է" },
  { code: "0-20010", messageAm: "Գործարքի սահմանաչափը գերազանցված է" },
  { code: "0110", messageAm: "Անվավեր գումար" },

  // Fraud and security
  { code: "0-2000", messageAm: "Քարտը սև ցուցակում է" },
  {
    code: "02001",
    messageAm: "Գործարքը մերժվել է խարդախության կասկածի պատճառով",
  },

  // System errors
  { code: "07", messageAm: "Համակարգային սխալ։ Խնդրում ենք փորձել կրկին։" },
  { code: "550", messageAm: "Համակարգային սխալ" },
  { code: "560", messageAm: "Գործողությունը ձախողվեց" },
  { code: "500", messageAm: "Անհայտ սխալ" },

  // Duplicate
  { code: "01", messageAm: "Պատվերն արդեն գոյություն ունի" },
  { code: "08204", messageAm: "Կրկնօրինակ պատվեր" },
];

/**
 * Parse Ameriabank error code and return user-friendly message in Armenian
 */
export function parseAmeriabankError(responseCode: string): string {
  const code = String(responseCode);

  // Find exact match
  const error = ERROR_CODES.find((e) => e.code === code);

  if (error) {
    return `${error.messageAm} (կոդ: ${code})`;
  }

  // Generic error message with code
  return `Վճարումը ձախողվեց։ Սխալի կոդ: ${code}`;
}
