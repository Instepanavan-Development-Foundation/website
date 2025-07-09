"use client";

import { Chip } from "@nextui-org/chip";

// TODO: Add metadata
// export async function generateMetadata({ params }: IParams): Promise<Metadata> {
//   const { slug } = await params;
//   const { data }: { data: IProject[] } = await getData({
//     type: "projects",
//     filters: {
//       slug,
//     },
//     fields: ["name", "description"],
//     populate: {
//       image: {
//         fields: ["url"],
//       },
//     },
//   });

//   const [project] = data;
//   if (!project) {
//     return {};
//   }

//   return {
//     title: `Donate to ${project.name}`,
//     description: project.description,
//     openGraph: {
//       type: "website",
//       images: { url: getMediaSrc(project.image) },
//     },
//   };
// }

export default async function DonatePage({ params }: IParams) {
  const { slug } = await params;
  const { data }: { data: IProject[] } = await getData({
    type: "projects",
    populate: {
      image: {
        fields: ["url", "alternativeText", "name"],
      },
    },
    filters: {
      slug,
    },
  });

  const project = data[0];

  if (!project) {
    return <NotFound />;
  }

  if (project.isArchived) {
    return (
      <section className="flex flex-col px-4">
        <Chip
          className="w-full mb-4 max-w-full text-lg p-4"
          color="warning"
          radius="sm"
          variant="shadow"
        >
          Այս նախագիծը արխիվում է և այլևս չի ընդունում նվիրատվություններ։
        </Chip>
        <div className="container mt-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Արխիվացված նախագիծ</h1>
          <p className="text-xl mb-8">
            Այս նախագիծն այլևս չի ընդունում նվիրատվություններ։ Խնդրում ենք
            ստուգել մեր այլ ակտիվ նախագծերը։
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col px-4 max-w-5xl mx-auto">
      {/* Error Message Component */}
      <ErrorMessage />

      {/* Hero Banner */}
      <div className="relative w-full h-64 md:h-40 mb-8 rounded-xl overflow-hidden">
        <Image
          alt={project.name}
          className="w-full h-full object-cover"
          src={getMediaSrc(project.image)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {project.name}
          </h1>
          <p className="text-white/90 text-lg max-w-2xl line-clamp-2">
            {project.description}
          </p>
        </div>
      </div>

      {/* Donation Form */}
      <DonationFormClient project={project} />
    </section>
  );
}

// Error Message Component
import { useSearchParams } from "next/navigation";

function ErrorMessage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (!error) return null;

  return (
    <div className="w-full mb-6 bg-red-50 border border-red-300 text-red-700 p-4 rounded-lg">
      <h3 className="font-bold text-lg mb-1">Վճարման սխալ</h3>
      <p>{decodeURIComponent(error)}</p>
      <p className="mt-2 text-sm">
        Խնդրում ենք փորձել կրկին կամ ընտրել վճարման այլ եղանակ։
      </p>
    </div>
  );
}

// Client-side donation form component
import { useState, useEffect } from "react";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Card, CardBody, CardHeader, CardFooter } from "@nextui-org/card";
import { Divider } from "@nextui-org/divider";
import { Progress } from "@heroui/progress";
import { PlusCircle, CreditCard, Wallet, Heart, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

import getMediaSrc from "@/src/helpers/getMediaUrl";
import NotFound from "@/components/NotFound";
import { IParams } from "@/src/models/params";
import { IProject } from "@/src/models/project";
import getData from "@/src/helpers/getData";

// Mock payment methods data
const mockPaymentMethods = [
  { id: 1, name: "Visa քարտ՝ ավարտվող 4242", isDefault: true },
  { id: 2, name: "MasterCard քարտ՝ ավարտվող 5555" },
  { id: 3, name: "American Express քարտ՝ ավարտվող 0001" },
];

// Preset donation amounts
const presetAmounts = [1000, 5000, 10000, 20000, 50000];

function DonationFormClient({ project }: { project: IProject }) {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(5000);
  const [customAmount, setCustomAmount] = useState<string>("5000");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [subscribeToNewsletter, setSubscribeToNewsletter] =
    useState<boolean>(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"card" | "bank">("card");
  const [donorCount, setDonorCount] = useState<number>(0);
  const [recentDonation, setRecentDonation] = useState<{
    name: string;
    amount: number;
  } | null>(null);

  // Simulate donor count and recent donations
  useEffect(() => {
    setDonorCount(Math.floor(Math.random() * 150) + 50);

    const names = ["Անի", "Արամ", "Լիլիթ", "Դավիթ", "Մարիամ"];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomAmount = [1000, 2000, 5000, 10000][
      Math.floor(Math.random() * 4)
    ];

    setRecentDonation({ name: randomName, amount: randomAmount });

    const interval = setInterval(() => {
      const newName = names[Math.floor(Math.random() * names.length)];
      const newAmount = [1000, 2000, 5000, 10000][
        Math.floor(Math.random() * 4)
      ];

      setRecentDonation({ name: newName, amount: newAmount });
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    setCustomAmount(value);
    const numValue = parseInt(value);

    if (!isNaN(numValue) && numValue > 0) {
      setAmount(numValue);
    }
  };

  const handlePresetAmountClick = (presetAmount: number) => {
    setAmount(presetAmount);
    setCustomAmount(presetAmount.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Simulate random payment errors (for demonstration)
    if (Math.random() < 0.3) {
      // 30% chance of error for demo purposes
      const errorMessages = [
        "Վճարման ընթացքում սխալ է տեղի ունեցել։ Խնդրում ենք փորձել կրկին։",
        "Ձեր քարտը մերժվել է։ Խնդրում ենք օգտագործել այլ քարտ։",
        "Անբավարար միջոցներ։ Խնդրում ենք ստուգել ձեր հաշվեկշիռը և փորձել կրկին։",
      ];

      const randomError =
        errorMessages[Math.floor(Math.random() * errorMessages.length)];

      router.push(
        `/donate/${project.slug}?error=${encodeURIComponent(randomError)}`,
      );

      return;
    }

    console.log({
      project: project.name,
      amount,
      paymentMethodId: selectedPaymentMethod,
      isAnonymous,
      subscribeToNewsletter,
    });

    // Navigate to success page
    router.push(`/donate/success`);
  };

  // Calculate progress percentage
  const progressPercentage = project.requiredAmount
    ? Math.min(
        100,
        Math.round((project.gatheredAmount / project.requiredAmount) * 100),
      )
    : 0;

  return (
    <Card className="w-full shadow-xl border-none overflow-visible mb-16">
      {/* Header with progress */}
      <CardHeader className="flex flex-col p-0">
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 p-6 rounded-t-xl w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-white" />
              <h2 className="text-2xl font-bold text-white">Նվիրաբերել հիմա</h2>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
              <Users className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">
                {donorCount}+ նվիրատուներ
              </span>
            </div>
          </div>

          {project.gatheredAmount && project.requiredAmount && (
            <div className="text-white">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-white/90">
                  Հավաքված է {project.gatheredAmount.toLocaleString()} ֏
                </span>
                <span className="text-sm font-medium text-white/90">
                  Նպատակ՝ {project.requiredAmount.toLocaleString()} ֏
                </span>
              </div>
              <Progress
                aria-label="Funding progress"
                className="h-2 mb-1"
                color="default"
                value={progressPercentage}
              />
              <div className="flex justify-end">
                <span className="text-sm font-medium bg-white/30 px-2 py-0.5 rounded-full">
                  {progressPercentage}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Recent donation notification */}
        {recentDonation && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 text-sm flex items-center">
            <span className="font-medium text-amber-800 mr-1">
              {recentDonation.name}
            </span>
            <span className="text-amber-700">
              նվիրաբերել է {recentDonation.amount.toLocaleString()} ֏ հենց նոր
            </span>
            <div className="ml-auto px-2 py-0.5 bg-amber-100 rounded-full text-xs text-amber-800 animate-pulse">
              Նոր
            </div>
          </div>
        )}
      </CardHeader>

      <CardBody className="px-6 py-6">
        <form onSubmit={handleSubmit}>
          {/* Amount Input */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Ընտրեք գումարը</h3>

            {/* Preset amount buttons */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-4">
              {presetAmounts.map((presetAmount) => (
                <button
                  key={presetAmount}
                  className={`py-3 px-3 rounded-lg ${
                    amount === presetAmount
                      ? "bg-primary text-white font-medium shadow-md scale-105 transform"
                      : "bg-default-100 hover:bg-default-200"
                  } transition-all duration-200`}
                  type="button"
                  onClick={() => handlePresetAmountClick(presetAmount)}
                >
                  {presetAmount.toLocaleString()} ֏
                </button>
              ))}
            </div>

            {/* Custom amount input */}
            <Input
              required
              className="bg-white"
              id="custom-amount"
              min={100}
              placeholder="Կամ մուտքագրեք ձեր գումարը"
              size="lg"
              startContent={
                <div className="pointer-events-none flex items-center">
                  <span className="text-default-400 text-small">֏</span>
                </div>
              }
              type="number"
              value={customAmount}
              onChange={handleAmountChange}
            />
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <div className="flex gap-2 border-b mb-4">
              <button
                className={`px-4 py-3 flex items-center gap-2 transition-all ${
                  activeTab === "card"
                    ? "border-b-2 border-primary text-primary font-medium"
                    : "text-default-600 hover:text-primary"
                }`}
                type="button"
                onClick={() => setActiveTab("card")}
              >
                <CreditCard size={18} />
                <span>Քարտ</span>
              </button>
              <button
                className={`px-4 py-3 flex items-center gap-2 transition-all ${
                  activeTab === "bank"
                    ? "border-b-2 border-primary text-primary font-medium"
                    : "text-default-600 hover:text-primary"
                }`}
                type="button"
                onClick={() => setActiveTab("bank")}
              >
                <Wallet size={18} />
                <span>Բանկային փոխանցում</span>
              </button>
            </div>

            {activeTab === "card" ? (
              <div>
                <div className="space-y-3 mb-4">
                  {mockPaymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`p-4 border rounded-lg cursor-pointer flex items-center ${
                        selectedPaymentMethod === method.id
                          ? "border-primary bg-primary-50 shadow-sm"
                          : "border-default-200 hover:border-primary-200 hover:bg-default-50"
                      } transition-all duration-200`}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{method.name}</p>
                        {method.isDefault && (
                          <p className="text-xs text-default-500">
                            Հիմնական վճարման եղանակ
                          </p>
                        )}
                      </div>
                      <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center">
                        {selectedPaymentMethod === method.id && (
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  className="flex items-center gap-2 text-primary hover:underline"
                  href="#"
                >
                  <PlusCircle size={18} />
                  <span>Ավելացնել նոր վճարման եղանակ</span>
                </Link>
              </div>
            ) : (
              <div>
                <div className="bg-default-50 p-5 rounded-lg border border-default-200">
                  <p className="mb-2">
                    <strong className="text-primary">Բանկ:</strong> HSBC
                    Հայաստան
                  </p>
                  <p className="mb-2">
                    <strong className="text-primary">Հաշվեհամար:</strong>{" "}
                    1234567890
                  </p>
                  <p className="mb-2">
                    <strong className="text-primary">Շահառու:</strong> In Step
                    Anavan հիմնադրամ
                  </p>
                  <p className="mb-2">
                    <strong className="text-primary">SWIFT:</strong> HSBCYUHBXXX
                  </p>
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded text-sm">
                    <p className="font-medium text-amber-800">Կարևոր է!</p>
                    <p className="text-amber-700">
                      Խնդրում ենք փոխանցման նկարագրության մեջ նշել նախագծի
                      անունը՝ "Հանգանակություն {project.name}"։
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preferences */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <input
                checked={isAnonymous}
                className="w-4 h-4 accent-primary rounded"
                id="anonymous"
                type="checkbox"
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <label className="text-default-700" htmlFor="anonymous">
                Նվիրաբերել անանուն
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                checked={subscribeToNewsletter}
                className="w-4 h-4 accent-primary rounded"
                id="newsletter"
                type="checkbox"
                onChange={(e) => setSubscribeToNewsletter(e.target.checked)}
              />
              <label className="text-default-700" htmlFor="newsletter">
                Բաժանորդագրվել նորություններին
              </label>
            </div>
          </div>
        </form>
      </CardBody>

      <Divider />

      <CardFooter className="px-6 py-6 bg-gradient-to-r from-primary-50 to-primary-100">
        <div className="w-full">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg text-default-700">Ընդհանուր գումար</span>
            <span className="text-2xl font-bold text-primary">
              {amount.toLocaleString()} ֏
            </span>
          </div>
          <Button
            className="w-full py-7 text-lg font-medium shadow-lg hover:scale-[1.02] transition-transform"
            color="primary"
            size="lg"
            onClick={handleSubmit}
          >
            Նվիրաբերել հիմա
          </Button>
          <p className="text-center text-xs text-default-500 mt-3">
            {/* TODO: Add terms and conditions link */}
            Սեղմելով այս կոճակը՝ դուք համաձայնում եք մեր{" "}
            <Link className="text-primary hover:underline" href="#">
              պայմաններին
            </Link>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
