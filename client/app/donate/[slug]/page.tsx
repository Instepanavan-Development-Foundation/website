"use client";

import { Metadata } from "next";
import { Chip } from "@nextui-org/chip";
import Markdown from "react-markdown";

import getData from "@/src/helpers/getData";
import { IProject } from "@/src/models/project";
import { IParams } from "@/src/models/params";
import NotFound from "@/components/NotFound";
import getMediaSrc from "@/src/helpers/getMediaUrl";

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
          radius="sm"
          color="warning"
          variant="shadow"
          className="w-full mb-4 max-w-full text-lg p-4"
        >
          Այս նախագիծը արխիվում է և այլևս չի ընդունում նվիրատվություններ։
        </Chip>
        <div className="container mt-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Արխիվացված նախագիծ</h1>
          <p className="text-xl mb-8">
            Այս նախագիծն այլևս չի ընդունում նվիրատվություններ։ Խնդրում ենք ստուգել մեր այլ ակտիվ նախագծերը։
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col px-4">
      {/* Hero Section with Impact Message */}
      <div className="relative container mb-10">
        <div className="bg-gradient-to-r from-primary-900/90 to-primary-800/90 rounded-xl overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <img
              src={getMediaSrc(project.image)}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative p-8 text-white">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="w-full md:w-1/4 flex justify-center">
                <div className="rounded-full overflow-hidden border-4 border-white/30 shadow-xl w-32 h-32">
                  <img
                    src={getMediaSrc(project.image)}
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="w-full md:w-3/4 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold mb-3">{project.name}</h1>
                <p className="text-lg text-white/90 mb-4">{project.description}</p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <span className="text-sm">Ձեր աջակցությունը</span>
                    <p className="font-bold text-xl">Փոխում է կյանքեր</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <span className="text-sm">Միացեք մեզ</span>
                    <p className="font-bold text-xl">Ստեղծելու ապագա</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Donation Form */}
      <div className="container mb-16">
        <DonationFormClient project={project} />
      </div>

      {/* Impact Section */}
      <div className="container mb-16">
        <div className="bg-default-50 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">Ձեր նվիրատվության ազդեցությունը</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-lg shadow-sm text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Աջակցում եք համայնքին</h3>
              <p className="text-default-600">Ձեր նվիրատվությունը ուղղակիորեն օգնում է տեղական համայնքներին և նրանց կարիքներին:</p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Դառնում եք մեր թիմի մասը</h3>
              <p className="text-default-600">Միանալով մեր նախաձեռնությանը՝ դուք դառնում եք փոփոխության մի մասը:</p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Տեսնում եք արդյունքները</h3>
              <p className="text-default-600">Մենք թափանցիկ ենք և կիսվում ենք ձեր նվիրատվության ազդեցության մասին հաշվետվություններով:</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Client-side donation form component

import { useState, useEffect } from "react";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Card, CardBody, CardHeader, CardFooter } from "@nextui-org/card";
import { Divider } from "@nextui-org/divider";
import {Progress} from "@heroui/progress";
import { PlusCircle, CreditCard, Wallet, Heart, Users, Star } from "lucide-react";
import Link from "next/link";

// Mock payment methods data
const mockPaymentMethods = [
  { id: 1, name: "Visa քարտ՝ ավարտվող 4242", isDefault: true },
  { id: 2, name: "MasterCard քարտ՝ ավարտվող 5555" },
  { id: 3, name: "American Express քարտ՝ ավարտվող 0001" }
];

// Preset donation amounts
const presetAmounts = [1000, 5000, 10000, 20000, 50000];

function DonationFormClient({ project }: { project: IProject }) {
  const [amount, setAmount] = useState<number>(5000);
  const [customAmount, setCustomAmount] = useState<string>("5000");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [subscribeToNewsletter, setSubscribeToNewsletter] = useState<boolean>(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"card" | "bank">("card");
  const [donorCount, setDonorCount] = useState<number>(0);
  const [recentDonation, setRecentDonation] = useState<{name: string, amount: number} | null>(null);

  // Simulate donor count and recent donations
  useEffect(() => {
    // Random donor count between 50-200
    setDonorCount(Math.floor(Math.random() * 150) + 50);
    
    // Simulate recent donation
    const names = ["Անի", "Արամ", "Լիլիթ", "Դավիթ", "Մարիամ"];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomAmount = [1000, 2000, 5000, 10000][Math.floor(Math.random() * 4)];
    setRecentDonation({name: randomName, amount: randomAmount});
    
    // Update recent donation every 15 seconds
    const interval = setInterval(() => {
      const newName = names[Math.floor(Math.random() * names.length)];
      const newAmount = [1000, 2000, 5000, 10000][Math.floor(Math.random() * 4)];
      setRecentDonation({name: newName, amount: newAmount});
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
    
    // In a real application, this would process the donation
    console.log({
      project: project.name,
      amount,
      paymentMethodId: selectedPaymentMethod,
      isAnonymous,
      subscribeToNewsletter,
    });
    
    // For now, just show an alert
    alert(`Շնորհակալություն ${project.name} նախագծին ${amount.toLocaleString()} ՀՀ դրամ նվիրաբերելու համար!`);
  };

  // Calculate progress percentage
  const progressPercentage = project.requiredAmount 
    ? Math.min(100, Math.round((project.gatheredAmount / project.requiredAmount) * 100)) 
    : 0;

  return (
    <Card className="w-full shadow-lg border-none overflow-visible">
      <CardHeader className="flex flex-col items-start px-6 py-6 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-t-xl">
        <div className="flex items-center gap-2 mb-1">
          <Heart className="w-5 h-5" />
          <h2 className="text-2xl font-bold">Նվիրաբերել {project.name} նախագծին</h2>
        </div>
        <p className="text-white/80">Ձեր աջակցությունը կօգնի մեզ հասնել մեր նպատակին</p>
      </CardHeader>
      
      {/* Funding Progress */}
      {project.gatheredAmount && project.requiredAmount && (
        <div className="px-6 py-4 bg-default-50">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{donorCount} նվիրատուներ</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">Նպատակ՝ {project.requiredAmount.toLocaleString()} ֏</span>
            </div>
          </div>
          <Progress 
            value={progressPercentage} 
            color="primary" 
            className="h-2 mb-2"
            aria-label="Funding progress"
          />
          <div className="flex justify-between text-sm">
            <span className="font-medium text-primary">{project.gatheredAmount.toLocaleString()} ֏ հավաքված</span>
            <span className="text-default-500">{progressPercentage}%</span>
          </div>
          
          {/* Recent donation notification */}
          {recentDonation && (
            <div className="mt-3 bg-primary-50 p-2 rounded-lg border border-primary-100 text-sm animate-pulse">
              <span className="font-medium">{recentDonation.name}</span> նվիրաբերել է {recentDonation.amount.toLocaleString()} ֏ հենց նոր
            </div>
          )}
        </div>
      )}
      
      <Divider />
      <CardBody className="px-6 py-6">
        <form onSubmit={handleSubmit}>
          {/* Amount Input */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">Նվիրատվության գումար</h3>
            
            {/* Preset amount buttons */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-4">
              {presetAmounts.map((presetAmount) => (
                <button
                  key={presetAmount}
                  type="button"
                  className={`py-3 px-3 rounded-lg ${
                    amount === presetAmount
                      ? "bg-primary text-white font-medium shadow-md"
                      : "bg-default-100 hover:bg-default-200"
                  } transition-all duration-200`}
                  onClick={() => handlePresetAmountClick(presetAmount)}
                >
                  {presetAmount.toLocaleString()} ֏
                </button>
              ))}
            </div>
            
            {/* Custom amount input - always visible */}
            <div className="bg-default-50 p-4 rounded-lg">
              <label htmlFor="custom-amount" className="block text-sm font-medium mb-2">
                Մուտքագրեք ձեր նախընտրած գումարը
              </label>
              <Input
                id="custom-amount"
                type="number"
                placeholder="Մուտքագրեք գումարը"
                value={customAmount}
                onChange={handleAmountChange}
                startContent={
                  <div className="pointer-events-none flex items-center">
                    <span className="text-default-400 text-small">֏</span>
                  </div>
                }
                min={100}
                required
                size="lg"
                className="bg-white"
              />
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">Վճարման եղանակ</h3>
            
            <div className="mb-4">
              <div className="flex gap-2 border-b mb-4">
                <button 
                  type="button"
                  className={`px-4 py-3 flex items-center gap-2 transition-all ${
                    activeTab === "card" 
                      ? "border-b-2 border-primary text-primary font-medium" 
                      : "text-default-600 hover:text-primary"
                  }`}
                  onClick={() => setActiveTab("card")}
                >
                  <CreditCard size={18} />
                  <span>Քարտ</span>
                </button>
                <button 
                  type="button"
                  className={`px-4 py-3 flex items-center gap-2 transition-all ${
                    activeTab === "bank" 
                      ? "border-b-2 border-primary text-primary font-medium" 
                      : "text-default-600 hover:text-primary"
                  }`}
                  onClick={() => setActiveTab("bank")}
                >
                  <Wallet size={18} />
                  <span>Բանկային փոխանցում</span>
                </button>
              </div>
              
              {activeTab === "card" ? (
                <div className="py-2">
                  <div className="space-y-3 mb-4">
                    {mockPaymentMethods.map((method) => (
                      <div 
                        key={method.id} 
                        className={`p-4 border rounded-lg cursor-pointer flex items-center ${
                          selectedPaymentMethod === method.id 
                            ? 'border-primary bg-primary-50 shadow-sm' 
                            : 'border-default-200 hover:border-primary-200 hover:bg-default-50'
                        } transition-all duration-200`}
                        onClick={() => setSelectedPaymentMethod(method.id)}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{method.name}</p>
                          {method.isDefault && (
                            <p className="text-xs text-default-500">Հիմնական վճարման եղանակ</p>
                          )}
                        </div>
                        <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center">
                          {selectedPaymentMethod === method.id && (
                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Link href="#" className="flex items-center gap-2 text-primary hover:underline">
                    <PlusCircle size={18} />
                    <span>Ավելացնել նոր վճարման եղանակ</span>
                  </Link>
                </div>
              ) : (
                <div className="py-2">
                  <p className="text-default-700 mb-3">
                    Կատարեք ուղղակի բանկային փոխանցում մեր հաշվին՝
                  </p>
                  <div className="bg-default-50 p-5 rounded-lg border border-default-200">
                    <p className="mb-2"><strong className="text-primary">Բանկ:</strong> HSBC Հայաստան</p>
                    <p className="mb-2"><strong className="text-primary">Հաշվեհամար:</strong> 1234567890</p>
                    <p className="mb-2"><strong className="text-primary">Շահառու:</strong> In Step Anavan հիմնադրամ</p>
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded text-sm">
                      <p className="font-medium text-amber-800">Կարևոր է!</p>
                      <p className="text-amber-700">
                        Խնդրում ենք փոխանցման նկարագրության մեջ նշել նախագծի անունը՝ "{project.name}"։
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preferences */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Նախընտրություններ</h3>
            <div className="space-y-3 bg-default-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="anonymous" 
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-5 h-5 accent-primary rounded"
                />
                <label htmlFor="anonymous" className="text-default-700">Նվիրաբերել անանուն</label>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="newsletter" 
                  checked={subscribeToNewsletter}
                  onChange={(e) => setSubscribeToNewsletter(e.target.checked)}
                  className="w-5 h-5 accent-primary rounded"
                />
                <label htmlFor="newsletter" className="text-default-700">Բաժանորդագրվել այս նախագծի նորություններին</label>
              </div>
            </div>
          </div>
        </form>
      </CardBody>
      <Divider />
      <CardFooter className="px-6 py-6 bg-default-50">
        <div className="w-full">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg text-default-700">Ընդհանուր գումար</span>
            <span className="text-2xl font-bold text-primary">{amount.toLocaleString()} ֏</span>
          </div>
          <Button 
            color="primary" 
            size="lg" 
            onClick={handleSubmit}
            className="w-full py-6 text-lg font-medium shadow-lg"
          >
            Ավարտել նվիրատվությունը
          </Button>
          <p className="text-center text-sm text-default-500 mt-3">
            Սեղմելով այս կոճակը՝ դուք համաձայնում եք մեր <Link href="#" className="text-primary hover:underline">պայմաններին</Link>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
} 