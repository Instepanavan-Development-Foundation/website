"use client";

import { Chip } from "@heroui/chip";
import { RadioGroup, Radio } from "@heroui/radio";
import { Spacer } from "@heroui/spacer";
import { Skeleton } from "@heroui/skeleton";

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

export default function DonatePage({ params }: IParams) {
  const { isLoading: authLoading } = useAuth("/login");
  const [slug, setSlug] = useState<string>("");
  const [project, setProject] = useState<IProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const resolvedParams = await params;

      setSlug(resolvedParams.slug);

      const { data }: { data: IProject[] } = await getData({
        type: "projects",
        populate: {
          image: {
            fields: ["url", "alternativeText", "name"],
          },
        },
        filters: {
          slug: resolvedParams.slug,
        },
      });

      setProject(data[0] || null);
      setLoading(false);
    }

    if (!authLoading) {
      loadData();
    }
  }, [params, authLoading]);

  if (authLoading || loading) {
    return (
      <section className="flex flex-col px-4 max-w-5xl mx-auto py-16">
        <div className="text-center">Բեռնում...</div>
      </section>
    );
  }

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
          Այս նախագիծը արխիվում է և այլևս չի ընդունում աջակցություններ։
        </Chip>
        <div className="container mt-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Արխիվացված նախագիծ</h1>
          <p className="text-xl mb-8">
            Այս նախագիծն այլևս չի ընդունում աջակցություններ։ Խնդրում ենք ստուգել
            մեր այլ ակտիվ նախագծերը։
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col px-4 max-w-5xl mx-auto">
      {/* Hero Banner */}
      <div className="relative w-full h-64 md:h-40 mb-8 rounded-xl overflow-hidden">
        <Image
          alt={project.name}
          className="w-full h-full object-cover"
          height={400}
          src={getMediaSrc(project.image)}
          width={1200}
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

// Error/Success Message Component
import { useSearchParams } from "next/navigation";

function ErrorMessage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const success = searchParams.get("success");

  if (success) {
    return (
      <div className="px-6 mb-6">
        <div className="w-full bg-green-50 border border-green-300 text-green-700 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-1">✓ Հաջողություն</h3>
          <p>{decodeURIComponent(success)}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 mb-6">
        <div className="w-full bg-red-50 border border-red-300 text-red-700 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-1">Վճարման սխալ</h3>
          <p>{decodeURIComponent(error)}</p>
          <p className="mt-2 text-sm">
            Խնդրում ենք փորձել կրկին կամ ընտրել վճարման այլ եղանակ։
          </p>
        </div>
      </div>
    );
  }

  return null;
}

// Client-side donation form component
import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Progress } from "@heroui/progress";
import { PlusCircle, CreditCard, Heart, Users } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";

import { useAuth } from "@/src/hooks/useAuth";
import getMediaSrc from "@/src/helpers/getMediaUrl";
import NotFound from "@/components/NotFound";
import { IParams } from "@/src/models/params";
import { IProject } from "@/src/models/project";
import getData from "@/src/helpers/getData";
import getPaymentMethods, {
  IPaymentMethod,
} from "@/src/helpers/getPaymentMethods";
import { initPayment } from "@/src/helpers/initPayment";

// Preset donation amounts
const presetAmounts = [1000, 5000, 10000, 20000, 50000];
const MIN_DONATION_AMOUNT = 10;

function DonationFormClient({ project }: { project: IProject }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlAmount = searchParams.get("amount");
  const defaultAmount = urlAmount ? parseInt(urlAmount) : 10000;

  const [amount, setAmount] = useState<number>(defaultAmount);
  const [customAmount, setCustomAmount] = useState<string>(
    defaultAmount.toString(),
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("");
  const [donorCount, setDonorCount] = useState<number>(0);
  const [paymentMethods, setPaymentMethods] = useState<IPaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load payment methods
  useEffect(() => {
    async function loadPaymentMethods() {
      const methods = await getPaymentMethods();

      setPaymentMethods(methods);
      setLoadingPaymentMethods(false);

      // Select first option by default - existing card or "new" if no cards
      if (methods.length > 0) {
        setSelectedPaymentMethod(methods[0].documentId);
      } else {
        setSelectedPaymentMethod("new");
      }
    }

    async function loadDonorCount() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects/${project.documentId}/donor-count`,
        );

        if (response.ok) {
          const result = await response.json();

          setDonorCount(result.data);
        }
      } catch (error) {
        console.error("Failed to load donor count:", error);
        setDonorCount(0);
      }
    }

    loadPaymentMethods();
    loadDonorCount();
  }, [project.documentId]);

  const updateAmountInUrl = (newAmount: number) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("amount", newAmount.toString());
    params.delete("error");
    params.delete("success");
    window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    setCustomAmount(value);
    const numValue = parseInt(value);

    if (!isNaN(numValue) && numValue > 0) {
      setAmount(numValue);
      updateAmountInUrl(numValue);
    }
  };

  const handlePresetAmountClick = (presetAmount: number) => {
    setAmount(presetAmount);
    setCustomAmount(presetAmount.toString());
    updateAmountInUrl(presetAmount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate minimum amount
    if (amount < MIN_DONATION_AMOUNT) {
      router.push(
        `/donate/${project.slug}?error=${encodeURIComponent(`Նվազագույն գումարը պետք է լինի ${MIN_DONATION_AMOUNT} դրամ`)}&amount=${amount}`,
      );

      return;
    }

    setIsSubmitting(true);

    // If "new card" is selected, redirect to Ameriabank payment page
    if (selectedPaymentMethod === "new") {
      const jwt =
        typeof window !== "undefined" ? localStorage.getItem("jwt") : null;

      if (!jwt) {
        router.push("/login");

        return;
      }

      // Get user email
      const userResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/me`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        },
      );
      const user = await userResponse.json();

      // Initialize payment with Ameriabank
      const { url, errorMessage } = await initPayment({
        amount,
        projectDocumentId: project.documentId,
        projectSlug: project.slug,
        email: user.email,
      });

      if (errorMessage) {
        setIsSubmitting(false);
        router.push(
          `/donate/${project.slug}?error=${encodeURIComponent(errorMessage)}&amount=${amount}`,
        );

        return;
      }

      if (url) {
        // Keep loading state while redirecting
        window.location.href = url;

        return;
      }
    }

    // Existing card flow - pay with saved card
    const jwt =
      typeof window !== "undefined" ? localStorage.getItem("jwt") : null;

    if (!jwt) {
      setIsSubmitting(false);
      router.push("/login");

      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payment/pay-with-saved-card`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify({
            amount,
            projectDocumentId: project.documentId,
            paymentMethodId: selectedPaymentMethod,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();

        setIsSubmitting(false);
        router.push(
          `/donate/${project.slug}?error=${encodeURIComponent(errorData.error || errorData.details || "Վճարումը ձախողվեց")}&amount=${amount}`,
        );

        return;
      }

      const result = await response.json();

      // Keep loading state while redirecting to success page
      router.push(
        `/donate/success?amount=${result.amount}&project=${encodeURIComponent(project.name)}&slug=${project.slug}`,
      );
    } catch (error) {
      console.error("Payment error:", error);
      setIsSubmitting(false);
      router.push(
        `/donate/${project.slug}?error=${encodeURIComponent("Սերվերի հետ կապի սխալ")}&amount=${amount}`,
      );
    }
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
              <h2 className="text-2xl font-bold text-white">Աջակցել հիմա</h2>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
              <Users className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">
                {donorCount} աջակիցներ
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
      </CardHeader>

      <CardBody className="px-6 py-6">
        <form onSubmit={handleSubmit}>
          {/* Amount Input */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Ընտրեք գումարը</h3>

            {/* Preset amount buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              {presetAmounts.map((presetAmount) => (
                <Button
                  key={presetAmount}
                  className={amount === presetAmount ? "font-semibold" : ""}
                  color={amount === presetAmount ? "primary" : "default"}
                  size="lg"
                  variant={amount === presetAmount ? "solid" : "bordered"}
                  onPress={() => handlePresetAmountClick(presetAmount)}
                >
                  {presetAmount.toLocaleString()} ֏
                </Button>
              ))}
            </div>

            {/* Custom amount input */}
            <Input
              required
              id="custom-amount"
              min={MIN_DONATION_AMOUNT}
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

          <Spacer y={6} />

          <Divider />

          <Spacer y={6} />

          {/* Payment Method Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Վճարման եղանակ</h3>

            {loadingPaymentMethods ? (
              <div className="space-y-3">
                <Skeleton className="rounded-lg">
                  <div className="h-20 rounded-lg bg-default-200" />
                </Skeleton>
                <Skeleton className="rounded-lg">
                  <div className="h-20 rounded-lg bg-default-200" />
                </Skeleton>
              </div>
            ) : (
              <RadioGroup
                classNames={{
                  base: "w-full",
                  wrapper: "gap-3",
                }}
                label={
                  paymentMethods.length > 0
                    ? "Ընտրել վճարման եղանակ"
                    : undefined
                }
                value={selectedPaymentMethod}
                onValueChange={setSelectedPaymentMethod}
              >
                {paymentMethods.map((method, index) => {
                  const cardNumber =
                    method.params?.CardNumber ||
                    method.params?.cardNumber ||
                    "****";

                  // Detect card type from card number
                  const getCardType = (num: string) => {
                    const firstDigits = num.replace(/\*/g, "").substring(0, 6);

                    if (firstDigits.startsWith("4")) return "Visa";
                    if (
                      firstDigits.startsWith("5") ||
                      firstDigits.startsWith("2")
                    )
                      return "Mastercard";
                    if (
                      firstDigits.startsWith("34") ||
                      firstDigits.startsWith("37")
                    )
                      return "American Express";
                    if (firstDigits.startsWith("6")) return "Discover";

                    return "Քարտ";
                  };

                  const cardType = getCardType(cardNumber);

                  return (
                    <Radio
                      key={method.documentId}
                      classNames={{
                        base: "inline-flex m-0 items-center hover:bg-content2 max-w-full cursor-pointer rounded-lg gap-4 p-4 border-2 border-transparent data-[selected=true]:border-primary",
                        label: "w-full",
                        wrapper: "group-data-[selected=true]:border-primary",
                      }}
                      description={
                        index === 0 ? "Հիմնական վճարման եղանակ" : undefined
                      }
                      value={method.documentId}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <CreditCard className="w-8 h-8 text-default-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-default-600">
                            {cardType}
                          </p>
                          <p className="font-mono font-semibold text-base">
                            {cardNumber}
                          </p>
                        </div>
                      </div>
                    </Radio>
                  );
                })}

                <Radio
                  classNames={{
                    base: "inline-flex m-0 items-center hover:bg-content2 max-w-full cursor-pointer rounded-lg gap-4 p-4 border-2 border-transparent data-[selected=true]:border-primary",
                    wrapper: "group-data-[selected=true]:border-primary",
                  }}
                  value="new"
                >
                  <div className="flex items-center gap-2">
                    <PlusCircle className="text-primary" size={18} />
                    <p className="font-medium">Կապել նոր քարտ</p>
                  </div>
                </Radio>
              </RadioGroup>
            )}
          </div>
        </form>
      </CardBody>

      {/* Error Message */}
      <ErrorMessage />

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
            className="w-full py-7 text-lg font-medium shadow-lg"
            color="primary"
            isDisabled={isSubmitting}
            isLoading={isSubmitting}
            size="lg"
            onClick={handleSubmit}
          >
            {isSubmitting ? "Մշակվում է..." : "Աջակցել հիմա"}
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
