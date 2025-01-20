import { IContribution } from "@/src/models/blog";
import { Avatar } from "@/components/Avatar";

interface ContributorsListProps {
  contributors: IContribution[];
  maxDisplay?: number;
}

export function ContributorsList({
  contributors,
  maxDisplay = 6,
}: ContributorsListProps) {
  const displayedContributors = contributors.slice(0, maxDisplay);
  const remainingCount = contributors.length - maxDisplay;
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {displayedContributors.map((contributor, idx) => {
          return (
            <div key={idx} className="relative">
              <Avatar
                contributor={contributor.contributor}
                width={32}
                height={32}
              />
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
