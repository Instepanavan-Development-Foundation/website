import { IProjectFunding } from "@/src/models/project-funding";

export default function getFundingAmount(
  funding: IProjectFunding,
  isArchived = false,
  fallback = 0,
): number {
  let amount: number;
  if (funding.donationType === "recurring") {
    amount = isArchived
      ? funding.allTime.recurring.amount
      : funding.currentMonth.recurring.amount;
  } else {
    amount = funding.allTime.oneTime.amount;
  }
  return amount > 0 ? amount : fallback;
}
