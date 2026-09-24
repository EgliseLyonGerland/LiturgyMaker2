import { endOfWeek, format } from "date-fns";

function isLiturgyId(value: number) {
  return /^\d{8}$/.test(`${value}`);
}

function getClosestAboveSundayDate(date = new Date()) {
  return endOfWeek(date, { weekStartsOn: 1 });
}

export function convertToId(date: Date) {
  return format(date, "yMMdd");
}

export function converToDate(id: number | string) {
  const year = `${id}`.slice(0, 4);
  const month = `${id}`.slice(4, 6);
  const day = `${id}`.slice(6, 8);

  return new Date(`${year}-${month}-${day}T10:00:00+02:00`);
}

export function getNextLiturgyId(idOrDate: Date | number = Date.now()) {
  let date: Date;

  if (idOrDate instanceof Date) {
    date = idOrDate;
  } else if (isLiturgyId(idOrDate)) {
    date = converToDate(idOrDate);
  } else {
    date = new Date(idOrDate);
  }

  return convertToId(getClosestAboveSundayDate(date));
}
