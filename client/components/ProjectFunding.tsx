"use client";

import { Card, CardBody } from "@heroui/card";

import { IProjectFunding } from "@/src/models/project-funding";
import { formatMonthArmenian } from "@/src/helpers/armenianMonths";

interface ProjectFundingProps {
  funding: IProjectFunding;
}

export function ProjectFunding({ funding }: ProjectFundingProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("hy-AM").format(amount);
  };

  const currentMonthLabel = formatMonthArmenian(funding.currentMonth.month);
  const isRecurring = funding.donationType === "recurring";

  // Calculate progress percentage
  const gatheredAmount = isRecurring
    ? funding.currentMonth.recurring.amount
    : funding.allTime.oneTime.amount;
  const progressPercent =
    funding.requiredAmount > 0
      ? Math.min((gatheredAmount / funding.requiredAmount) * 100, 100)
      : 0;

  return (
    <div className="max-w-md">
      {isRecurring ? (
        // Current Month Recurring - for monthly subscription projects
        <Card>
          <CardBody className="p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Ամսական բաժանորդագրություններ
            </h3>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold text-primary">
                {formatCurrency(funding.currentMonth.recurring.amount)}
              </span>
              <span className="text-lg text-gray-600">AMD</span>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              {currentMonthLabel} ▪️ {funding.currentMonth.recurring.count}{" "}
              բաժանորդ
            </p>
            {funding.requiredAmount > 0 && (
              <>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Ամսական նպատակ՝ {formatCurrency(funding.requiredAmount)} AMD (
                  {progressPercent.toFixed(0)}%)
                </p>
              </>
            )}
          </CardBody>
        </Card>
      ) : (
        // All-Time One-Time - for one-time donation projects
        <Card>
          <CardBody className="p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Ընդհանուր հավաքված
            </h3>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold text-success">
                {formatCurrency(funding.allTime.oneTime.amount)}
              </span>
              <span className="text-lg text-gray-600">AMD</span>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Միանվագ աջակցություններ ▪️ {funding.allTime.oneTime.count} աջակից
            </p>
            {funding.requiredAmount > 0 && (
              <>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-success h-2 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Ընդհանուր նպատակ՝ {formatCurrency(funding.requiredAmount)} AMD
                  ({progressPercent.toFixed(0)}%)
                </p>
              </>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
