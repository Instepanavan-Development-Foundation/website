import { Link } from "@nextui-org/link";
import { Snippet } from "@nextui-org/snippet";
import { Code } from "@nextui-org/code";
import { button as buttonStyles } from "@nextui-org/theme";
import { Card, CardBody, CardFooter } from "@nextui-org/card";
import { Image } from "@nextui-org/image";

const aboutContent = {
  title: "Մեր մասին",
  description: "Մենք նվիրված ենք տեխնոլոգիական լուծումների միջոցով հայկական համայնքների զարգացմանը: Մեր թիմը միավորում է փորձառու մասնագետների, ովքեր աշխատում են ստեղծել նորարարական գործիքներ՝ հասանելի դարձնելով թվային տեխնոլոգիաները բոլորի համար:",
  image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop",
  stats: [
    { label: "Իրականացված ծրագրեր", value: "25+" },
    { label: "Համայնքներ", value: "40+" },
    { label: "Շահառուներ", value: "10,000+" },
    { label: "Կամավորներ", value: "150+" }
  ]
};

export default function Home() {
  const projects = [
    {
      title: "Խռողջապահական տեխնոլոգիաներ",
      description: "Արհեստական բանականությամբ աշխատող առողջապահական կառավարման լուծում",
      tech: "React Native • Node.js • MongoDB",
      link: "#",
      img: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&h=250&fit=crop",
      funding: {
        raised: 30000,
        goal: 50000,
        currency: "USD"
      }
    },
    {
      title: "ԿրթաԿապ հաբ",
      description: "Թվային ուսուցման և համագործակցության հարթակ",
      tech: "Vue.js • Django • PostgreSQL",
      link: "#",
      img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&h=250&fit=crop",
      funding: {
        raised: 12000,
        goal: 15000,
        currency: "USD"
      }
    }
  ];

  const blogPosts = [
    {
      title: "Կայուն ապագայի կառուցում",
      description: "Տեխնոլոգիաների միջոցով շրջակա մի��ավայրի պահպանման նորարարական մոտեցումների ուսումնասիրություն: Մենք խորանում ենք, թե ինչպես են ժամանակակից ծրագրային լուծումներն օգնում համայնքներին նվազեցնել իրենց ածխածնային հետքը՝ պահպանելով տնտեսական աճը...",
      img: "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=300&h=140&fit=crop",
      date: "Մարտի 15, 2024",
      tags: ["Կայունություն", "Տեխնոլոգիա", "Շրջակա միջավայր"],
      project: "Ծրագիր 1"
    },
    {
      title: "Համայնքային զարգացում",
      description: "Ինչպես ենք մենք հզորացրել տեղական համայնքները բաց կոդով տեխնոլոգիաների միջոցով: Այս դեպքի ուսումնասիրությունը քննում է մեր վերջին ծրագիրը, որն օգնեց կապել գյուղական ֆերմերներին քաղաքային շուկաների հետ՝ օգտագործելով պարզ բջջային հավելված...",
      img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=300&h=140&fit=crop",
      date: "Մարտի 10, 2024",
      tags: ["Համայնք", "Բաց կոդ", "Բջջային"],
      project: "Ծրագիր 2"
    },
    {
      title: "Արհեստական բանականության ապագան առողջապահության մեջ",
      description: "Ուսումնասիրում ենք արհեստական բանականության հեղափոխական ազդեցությունը ժամանակակից առողջապահական համակարգերի վրա: Ախտորոշիչ գործիքներից մինչև հիվանդների խնամքի կառավարում, մենք բացահայտում ենք, թե ինչպես է ԱԲ-ն փոխակերպում բժշկական ոլորտը...",
      img: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&h=140&fit=crop",
      date: "Մարտի 5, 2024",
      tags: ["ԱԲ", "Առողջապահություն", "Նորարարություն"],
      project: "Ծրագիր 3"
    },
    {
      title: "Մատչելի կրթության հարթակ",
      description: "Տեխնոլոգիաների միջոցով ներառական ուսումնական միջավայրի ստեղծում: Իմացեք մեր վերջին կրթական հարթակի մասին, որը հաղթահարում է խոչընդոտները և որակյալ կրթություն է տրամադրում աշխարհի ուսանողներին...",
      img: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=300&h=140&fit=crop",
      date: "Փետրվարի 28, 2024",
      tags: ["Կրթություն", "Մատչելիություն", "Վեբ"],
      project: "Ծրագիր 1"
    },
  ];

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <section className="flex flex-col px-4">

      {/* New Hero Section */}
      <div className="relative container h-[600px] mb-16">
        <Image
          alt="Hero Image"
          className="w-full h-full object-cover brightness-50"
          src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1920&h=600&fit=crop"
          width={1920}
          height={600}
          priority={true}
          loading="eager"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-center mb-6">
            Կառուցենք ավելի պայծառ ապագա միասին
          </h1>
          <p className="text-xl md:text-2xl text-center max-w-2xl mb-8">
            Մենք օգնում ենք համայնքներին զարգանալ թվային տեխնոլոգիաների միջոցով։ Միացեք մեր առաքելությանը:
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
            <span className="text-xl px-8 py-2">Նվիրաբերել հիմա</span>
          </Link>
        </div>
      </div>


      {/* Projects Section */}
      <div className="w-full container my-8">
        <h2 className="text-3xl font-bold mb-6">Ծրագրեր</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <Link 
              key={index}
              href={`/project/`}
              className="block"
            >
              <Card
                isPressable
                className="group bg-gradient-to-br from-background to-default-50"
              >
                <CardBody className="overflow-visible p-0">
                  <div className="relative">
                    <Image
                      alt={project.title}
                      className="w-full object-cover h-[150px] brightness-90 group-hover:brightness-100 transition-all duration-200"
                      src={project.img}
                      width="100%"
                      radius="none"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-background/0 p-4">
                      <h3 className="text-2xl font-bold text-foreground transition-transform duration-200 group-hover:scale-105">
                        {project.title}
                      </h3>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-lg text-default-600 transition-transform duration-200 group-hover:scale-105">
                      {project.description}
                    </p>
                   
                    {/* Funding Progress Section */}
                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-default-600">
                          {formatCurrency(project.funding.raised, project.funding.currency)} raised
                        </span>
                        <span className="text-default-500">
                          Goal: {formatCurrency(project.funding.goal, project.funding.currency)}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-default-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500 rounded-full"
                          style={{ 
                            width: `${Math.min(100, (project.funding.raised / project.funding.goal) * 100)}%`
                          }}
                        />
                      </div>
                      <div className="mt-2 text-sm text-default-500 text-right">
                        {Math.round((project.funding.raised / project.funding.goal) * 100)}% funded
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
        <div className="flex justify-center mt-8">
          <Link
            href="/projects"
            className={buttonStyles({
              variant: "flat",
              radius: "full",
              size: "lg",
            })}
          >
            Գնալ արխիվ
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


      <div className="w-full max-w-7xl my-12">
        <h2 className="text-3xl font-bold mb-6">Մեր աշխատանքը</h2>
        <div className="gap-6 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4">
          {blogPosts.map((post, index) => (
            <Card
              key={index}
              isPressable
              className="group"
            >
              <CardBody className="overflow-visible p-0">
                <Image
                  alt={post.title}
                  className="w-full object-cover h-[200px]"
                  src={post.img}
                  width="100%"
                  radius="none"
                />
                <div className="p-5">
                  <div className="mb-3">
                    <span className="text-default-400 text-sm">
                      {post.date}
                    </span>
                  </div>
                  <p className="text-default-500 mb-4">
                    {post.description.length > 150
                      ? `${post.description.slice(0, 150)}...`
                      : post.description}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {post.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 bg-default-100 rounded-full text-xs text-default-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
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

      {/* About Us Section */}
      <div className="w-full container my-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <Image
              alt="Our Team"
              className="rounded-xl shadow-lg"
              src={aboutContent.image}
              width={800}
              height={400}
            />
            <div className="absolute inset-0 bg-primary/10 rounded-xl" />
          </div>
          <div>
            <h2 className="text-4xl font-bold mb-6">{aboutContent.title}</h2>
            <p className="text-default-600 text-lg mb-8">
              {aboutContent.description}
            </p>
            <div className="grid grid-cols-2 gap-6">
              {aboutContent.stats.map((stat, index) => (
                <div
                  key={index}
                  className="p-4 bg-default-50 rounded-lg text-center"
                >
                  <div className="text-3xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-default-600">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Donation Section */}
      <div className="w-full container my-16 text-center">
        <h2 className="text-4xl font-bold mb-4">Աջակցեք մեր առաքելությանը</h2>
        <p className="text-default-500 text-xl mb-8 max-w-2xl mx-auto">
          Ձեր ներդրումն օգնում է մեզ շարունակել նորարարական լուծումների կառուցումը և աջակցել մեր համայնքին: Յուրաքանչյուր նվիրատվություն տարբերություն է ստեղծում:
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
          <span className="text-xl px-8 py-2">Նվիրաբերել հիմա</span>
        </Link>
      </div>

    </section>
  );
}
