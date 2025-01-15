import { Link } from "@nextui-org/link";
import { Image } from "@nextui-org/image";
import { IContribution } from "@/src/models/blog";
import { IContributor } from "@/src/models/contributor";
import getMediaUrl from "@/src/helpers/getMediaUrl";

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
  console.log(contributors);
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {displayedContributors.map((contributor, idx) => {
          return <div
            key={idx}
            className="relative"
          >
            <Image
              src={
                // TODO: implement gravatar if no avatar is provided
                contributor.contributor.avatar?.url
                  ? getMediaUrl(contributor.contributor.avatar)
                  : "http://www.gravatar.com/avatar/" + contributor.contributor.email
              }
              alt={"contributor.name"}
              width={32}
              height={32}
              className="rounded-full border-2 border-background"
            />
          </div>
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