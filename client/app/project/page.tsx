import { Link } from "@nextui-org/link";
import { Card, CardBody } from "@nextui-org/card";
import { Image } from "@nextui-org/image";
import { button as buttonStyles } from "@nextui-org/theme";
import { Download, Paperclip, MoveRight } from "lucide-react";

// Mock data for the project (in real app, this would come from an API/database)
const projectData = {
  title: "Խռողջապահական տեխնոլոգիաներ",
  description:
    "Արհեստական բանականությամբ աշխատող առողջապահական կառավարման համակարգ, որը նպատակ ունի բարելավել բուժօգնության որակը և հասանելիությունը Հայաստանի հեռավոր շրջաններում: Մեր լուծումը միավորում է բջջային հավելվածները, տվյալների վերլուծությունը և հեռաբժշկության գործիքները:",
  coverImage:
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1920&h=600&fit=crop",
  tech: ["React Native", "Node.js", "MongoDB", "TensorFlow"],
  funding: {
    raised: 30000,
    goal: 50000,
    currency: "USD",
  },
  details: [
    "Մեր նախագիծը նպատակ ունի հեղափոխել առողջապահական ծառայությունների մատուցումը Հայաստանի հեռավոր շրջաններում՝ օգտագործելով արհեստական բանականության և հեռաբ��շկության նորարարական լուծումներ:",
    "Մենք համատեղում ենք տեխնոլոգիական նորարարությունը տեղական համայնքների կարիքների հետ՝ ստեղծելով կայուն և մատչելի լուծումներ:",
    "Մեր թիմը սերտորեն համագործակցում է բժիշկների, տեխնոլոգների և համայնքի առաջնորդների հետ՝ ապահովելով լավագույն արդյունքները:",
  ],
  contributors: [
    {
      name: "Անի Սարգսյան",
      role: "Ծրագրի ղեկավար",
      contribution: "Առաջնորդել է ծրագրի զարգացումը",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    {
      name: "Դավիթ Հակոբյան",
      role: "Ավագ ծրագրավորող",
      contribution: "Իրականացրել է հիմնական ծրագրավորումը",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
    {
      name: "Մարիամ Պետրոսյան",
      role: "UI/UX դիզայներ",
      contribution: "Ստեղծել է օգտագործողի ինտերֆեյսը",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    {
      name: "Արամ Մկրտչյան",
      role: "Տվյալների վերլուծաբան",
      contribution: "Իրականացրել է տվյալների վերլուծությունը",
      avatar: "https://i.pravatar.cc/150?img=4",
    },
  ],
};
const blogPosts = [
  {
    title: "Կայուն ապագայի կառուցում",
    description:
      "Տեխնոլոգիաների միջոցով շրջակա միջավայրի պահպանման նորարարական մոտեցումների ուսումնասիրություն: Մենք խորանում ենք, թե ինչպես են ժամանակակից ծրագրային լուծումներն օգնում համայնքներին նվազեցնել իրենց ածխածնային հետքը՝ պահպանելով տնտեսական աճը...",
    img: "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=300&h=140&fit=crop",
    date: "Մարտի 15, 2024",
    tags: ["Կայունություն", "Տեխնոլոգիա", "Շրջակա միջավայր"],
    project: "Ծրագիր 1",
    contributors: [
      { name: "Անի Սարգսյան", avatar: "https://i.pravatar.cc/150?img=1" },
      { name: "Դավիթ Հակոբյան", avatar: "https://i.pravatar.cc/150?img=2" },
    ],
    featured: true,
    attachments: [
      { name: "Attachment 1", url: "https://example.com/attachment1.pdf" },
      { name: "Attachment 2", url: "https://example.com/attachment2.pdf" },
    ],
  },
  {
    title: "Համայնքային զարգացում",
    description:
      "Ինչպես ենք մենք հզորացրել տեղական համայնքները բաց կոդով տեխնոլոգիաների միջոցով: Այս դեպքի ուսումնասիրությունը քննում է մեր վերջին ծրագիրը, որն օգնեց կապել գյուղական ֆերմերներին քաղաքային ուկաների հետ՝ օգտագործելով պարզ բջջային հավելվածները...",
    img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=300&h=140&fit=crop",
    date: "Մարտի 10, 2024",
    tags: ["Համայնք", "Բաց կոդ", "Բջջային"],
    project: "Ծրագիր 2",
    contributors: [
      { name: "Անի Սարգսյան", avatar: "https://i.pravatar.cc/150?img=1" },
      { name: "Դավիթ Հակոբյան", avatar: "https://i.pravatar.cc/150?img=2" },
    ],
    featured: false,
    attachments: [
      {
        name: "Community Development Report",
        url: "https://example.com/community-development-report.pdf",
      },
    ],
  },
  {
    title: "Արհեստական բանականության ապագան առողջապահության մեջ",
    description:
      "Ուսումնասիրում ենք արհեստական բանականության հեղափոխական ազդեցությունը ժամանակակից առողջապահական համակարգերի վրա: Ախտորոշիչ գործիքներից մինչև հիվանդների խնամքի կառավարում, մենք բացահայտում ենք, թե ինչպես է ԱԲ-ն փոխակերպում բժշկական ոլորտը...",
    img: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&h=140&fit=crop",
    date: "Մարտի 5, 2024",
    tags: ["ԱԲ", "Առողջապահություն", "Նորարարություն"],
    project: "Ծրագիր 3",
    contributors: [
      { name: "Անի Սարգսյան", avatar: "https://i.pravatar.cc/150?img=1" },
      { name: "Դավիթ Հակոբյան", avatar: "https://i.pravatar.cc/150?img=2" },
    ],
    featured: false,
    attachments: [],
  },
  {
    title: "Մատչելի կրթության հարթակ",
    description:
      "Տեխնոլոգիաների միջոցով ներառական ուսումնական միջավայրի ստեղծում: Իմացեք մեր վերջին կրթական հարթակի մասին, որը հաղթահարում է խոչընդոտները և որակյալ կրթություն է տրամադրում աշխարհի ուսանողներին...",
    img: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=300&h=140&fit=crop",
    date: "Փետրվարի 28, 2024",
    tags: ["Կրթություն", "Մատչելիություն", "Վեբ"],
    project: "Ծրագիր 1",
    contributors: [
      { name: "Անի Սարգսյան", avatar: "https://i.pravatar.cc/150?img=1" },
      { name: "Դավիթ Հակոբյան", avatar: "https://i.pravatar.cc/150?img=2" },
    ],
    featured: false,
    attachments: [],
  },
];

export default function ProjectPage() {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <section className="flex flex-col px-4">
      {/* Hero Section */}
      <div className="relative container h-[600px] mb-16">
        <Image
          alt="Project Cover"
          className="w-full h-full object-cover brightness-50"
          src={projectData.coverImage}
          width={1920}
          height={600}
          priority={true}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-center mb-6">
            {projectData.title}
          </h1>
          <p className="text-xl md:text-2xl text-center max-w-3xl mb-8">
            {projectData.description}
          </p>
          <Link
            href="#"
            className={buttonStyles({
              color: "success",
              radius: "full",
              variant: "shadow",
              size: "lg",
            })}
          >
            <span className="text-xl px-8 py-2">Աջակցել նախագծին</span>
          </Link>
        </div>
      </div>

      {/* Project Details */}
      <div className="container mb-16">
        {/* Funding Progress */}
        <div className="bg-default-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4">Ֆինանսավորում</h2>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xl text-default-600">
              {formatCurrency(
                projectData.funding.raised,
                projectData.funding.currency
              )}{" "}
              raised
            </span>
            <span className="text-lg text-default-500">
              Goal:{" "}
              {formatCurrency(
                projectData.funding.goal,
                projectData.funding.currency
              )}
            </span>
          </div>
          <div className="w-full h-3 bg-default-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{
                width: `${Math.min(100, (projectData.funding.raised / projectData.funding.goal) * 100)}%`,
              }}
            />
          </div>
          <div className="mt-2 text-right text-default-500">
            {Math.round(
              (projectData.funding.raised / projectData.funding.goal) * 100
            )}
            % funded
          </div>
        </div>
      </div>

      {/* Related Blog Posts */}
      <div className="container mb-16">
        <h2 className="text-3xl font-bold mb-6">Մեր աշխատանքը</h2>
        <div className="gap-6 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4">
          {blogPosts.map((post, index) => (
            <Card key={index} isPressable className="group relative">
              {post.featured && (
                <div className="absolute top-2 right-2 z-20 bg-warning-400 text-white rounded-full p-2">
                  <Download className="w-5 h-5" />
                </div>
              )}
              <CardBody className="overflow-visible p-0">
                <Image
                  alt={post.title}
                  className="w-full object-cover h-[200px]"
                  src={post.img}
                  width="100%"
                  radius="none"
                />
                <div className="p-5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-default-400 text-sm">
                      {post.date}
                    </span>
                  </div>
                  <p className="text-default-500 mb-4">
                    {post.description.length > 150
                      ? `${post.description.slice(0, 150)}...`
                      : post.description}
                  </p>
                  <div className="flex gap-2 flex-wrap mb-4">
                    {post.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 bg-default-100 rounded-full text-xs text-default-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex -space-x-2">
                    {post.contributors.map((contributor, idx) => (
                      <div
                        key={idx}
                        className="relative"
                        title={contributor.name}
                      >
                        <Image
                          src={contributor.avatar}
                          alt={contributor.name}
                          width={32}
                          height={32}
                          className="rounded-full border-2 border-background"
                        />
                      </div>
                    ))}
                  </div>
                  {post.attachments.length > 0 && (
                    <div className="mt-4">
                      <ul className="list-disc list-inside">
                        {post.attachments.map((attachment, attIndex) => (
                          <li key={attIndex} className="flex items-center">
                            <Paperclip className="mr-2 w-4 h-4 text-gray-500" />
                            <a
                              href={attachment.url}
                              className="text-blue-500 hover:underline"
                              download
                            >
                              {attachment.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
        <div className="col-span-full flex justify-center mt-8">
          <Link
            href="/blog"
            className={buttonStyles({
              variant: "flat",
              radius: "full",
              size: "lg",
            })}
          >
            Դիտել բոլոր հոդվածները
            <MoveRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>

      <div className="container mb-16">
        <h2 className="text-3xl font-bold mb-8">Միջոցառումներ</h2>
        <Image
          src="https://dummyimage.com/600x400/000000/ffffff"
          alt="Dummy Calendar Image"
          width={600}
          height={400}
          className="w-full"
        />
      </div>
      {/* Project Details Section */}
      <div className="container mb-16">
        <h2 className="text-3xl font-bold mb-8">Ծրագրի մանրամասներ</h2>
        <div className="prose prose-lg max-w-none">
          {projectData.details.map((paragraph, index) => (
            <p key={index} className="text-default-600 mb-6">
              {paragraph}
            </p>
          ))}
        </div>
        <div className="flex justify-center mt-8">
          <Link
            href="#"
            className={buttonStyles({
              color: "success",
              radius: "full",
              variant: "shadow",
              size: "lg",
            })}
          >
            <span className="text-xl px-8 py-2">Աջակցել նախագծին</span>
          </Link>
        </div>
      </div>

      {/* Contributors Section */}
      <div className="container mb-16">
        <h2 className="text-3xl font-bold mb-8">Աջակիցներ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {projectData.contributors.map((contributor, index) => (
            <div
              key={index}
              className="flex items-center p-3 bg-default-50 rounded-xl hover:bg-default-100 transition-colors relative"
            >
              {contributor.featured && (
                <div className="absolute -top-2 -right-2 bg-warning-400 text-white rounded-full p-1">
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              )}
              <div className="relative min-w-[50px]">
                <Image
                  src={contributor.avatar}
                  alt={contributor.name}
                  width={50}
                  height={50}
                  className="rounded-full object-cover"
                />
                <div className="absolute inset-0 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-background" />
              </div>
              <div className="">
                <p className="p-3">
                  {contributor.name}՝ {contributor.contribution}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="col-span-full flex justify-center mt-8">
          <Link
            href="/blog"
            className={buttonStyles({
              variant: "flat",
              radius: "full",
              size: "lg",
            })}
          >
            Բեռնել ավել
            <svg
              className="ml-2 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
