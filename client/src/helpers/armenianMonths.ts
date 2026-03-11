export const ARMENIAN_MONTHS = [
  "Հունվար",
  "Փետրվար",
  "Մարտ",
  "Ապրիլ",
  "Մայիս",
  "Հունիս",
  "Հուլիս",
  "Օգոստոս",
  "Սեպտեմբեր",
  "Հոկտեմբեր",
  "Նոյեմբեր",
  "Դեկտեմբեր",
];

export function formatMonthArmenian(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const monthIndex = parseInt(month) - 1;

  return `${ARMENIAN_MONTHS[monthIndex]} ${year}`;
}
