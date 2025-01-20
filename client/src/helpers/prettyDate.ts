import dayjs from "dayjs";

export const prettyDate = (date: string) => {
  return dayjs(date).format("DD.MM.YYYY HH:mm");
};
