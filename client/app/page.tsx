import { Link } from "@nextui-org/link";
import { button as buttonStyles } from "@nextui-org/theme";
import { Image } from "@nextui-org/image";

import { ProjectCard } from "../components/home/ProjectCard";
import { BlogPost } from "../components/BlogPost";
import { blogPosts } from "./data/blog-posts";
import { HeroSection } from "../components/home/HeroSection";

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
      link: "/project",
      img: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&h=250&fit=crop",
      funding: {
        raised: 30000,
        goal: 50000,
        currency: "USD"
      },
      contributors: [
        { name: "John Doe", avatar: "https://i.pravatar.cc/150?u=1" },
        { name: "Jane Smith", avatar: "https://i.pravatar.cc/150?u=2" }
      ]
    },
    {
      title: "ԿրթաԿապ հաբ",
      description: "Թվային ուսուցման և համագործակցության հարթակ",
      tech: "Vue.js • Django • PostgreSQL",
      link: "/project",
      img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&h=250&fit=crop",
      funding: {
        raised: 12000,
        goal: 15000,
        currency: "USD"
      },
      contributors: [
        { name: "John Doe", avatar: "https://i.pravatar.cc/150?u=1" },
        { name: "Jane Smith", avatar: "https://i.pravatar.cc/150?u=2" }
      ]
    }
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
      <HeroSection
        title="Մենք նվիրված ենք տեխնոլոգիական լուծումների միջոցով հայկական համայնքների զարգացմանը:"
        description="Մենք նվիրված ենք տեխնոլոգիական լուծումների միջոցով հայկական համայնքների զարգացմանը:"
        ctaText="Գնալ արխիվ"
        ctaLink="/blog"
        imageUrl="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop"
      />


      {/* Projects Section */}
      <div className="w-full container my-8">
        <h2 className="text-3xl font-bold mb-6">Ակտիվ նախագծեր</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <ProjectCard key={index} {...project} />
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
            <BlogPost key={index} {...post} />
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
