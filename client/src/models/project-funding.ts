export interface FundingBreakdown {
  amount: number;
  count: number;
}

export interface IProjectFunding {
  donationType: "recurring" | "one time";
  requiredAmount: number | null; // For recurring: monthly goal, For one-time: total goal
  currentMonth: {
    month: string; // "2026-01"
    recurring: FundingBreakdown;
  };
  allTime: {
    oneTime: FundingBreakdown;
  };
}
