import { IContribution } from "@/src/models/blog";
import { Avatar } from "@/components/Avatar";
import { Tooltip } from "@heroui/tooltip";

interface ContributorsListProps {
  contributions: IContribution[];
  maxDisplay?: number;
}

export function ContributorsList({
  contributions,
  maxDisplay = 6,
}: ContributorsListProps) {
  if (!contributions) return null;
  
  const displayedContributors = contributions.slice(0, maxDisplay);
  const remainingCount = contributions.length - maxDisplay;
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {displayedContributors.map((contribution, idx) => {
          return (
            <div key={idx} className="relative">
              <Tooltip content={contribution.text}>
                <Avatar
                  contributor={contribution.contributor}
                  width={32}
                  height={32}
                />
              </Tooltip>
            </div>
          );
        })}
      </div>
      {remainingCount > 0 && (
        <span className="text-default-500 text-sm ml-2">
          +{remainingCount} աջակիցներ
        </span>
      )}
    </div>
  );
}
