import { Link } from "@nextui-org/link";
import { Image } from "@nextui-org/image";
import { IContribution } from "@/src/models/blog";

interface Contributor {
  name: string;
  avatar: string;
  role?: string;
  contribution?: string;
}

interface ContributorsListProps {
  contributors: IContribution[];
  maxDisplay?: number;
}

export function ContributorsList({ 
  contributors, 
  maxDisplay = 6 
}: ContributorsListProps) {
  const displayedContributors = contributors.slice(0, maxDisplay);
  const remainingCount = contributors.length - maxDisplay;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {displayedContributors.map((contributor, idx) => (
          <div
            key={idx}
            className="relative"
          >
            <Image
              src={"https://dummyimage.com/600x400/000000/ffffff"}
              alt={"contributor.name"}
              width={32}
              height={32}
              className="rounded-full border-2 border-background"
            />
          </div>
        ))}
      </div>
      {remainingCount > 0 && (
        <span className="text-default-500 text-sm ml-2">
          +{remainingCount} աջակիցներ
        </span>
      )}
    </div>
  );
} 