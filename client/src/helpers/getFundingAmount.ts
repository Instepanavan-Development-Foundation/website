import { IProjectFunding } from "@/src/models/project-funding";

export default function getFundingAmount(
  funding: IProjectFunding,
  isArchived = false,
): number {
  if (funding.donationType === "recurring") {
    return isArchived
      ? funding.allTime.recurring.amount
      : funding.currentMonth.recurring.amount;
  }
  return funding.allTime.oneTime.amount;
}
