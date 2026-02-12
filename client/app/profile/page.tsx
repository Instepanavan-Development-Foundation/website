"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Image } from "@heroui/image";
import { User } from "@heroui/user";
import { Tabs, Tab } from "@heroui/tabs";
import { Skeleton } from "@heroui/skeleton";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Avatar as HeroAvatar } from "@heroui/avatar";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Listbox, ListboxItem } from "@heroui/listbox";
import Link from "next/link";
import { CreditCard, DollarSign, Calendar, TrendingUp, Mail, User as UserIcon, Trash2, Receipt, CheckCircle, XCircle } from "lucide-react";

import Contributor from "../contributor/[slug]/contributor";

import { getUserContributor } from "@/src/helpers/getUserContributor";
import { IContributor } from "@/src/models/contributor";
import { IProjectPayment, IPaymentLog } from "@/src/models/getData";
import getData from "@/src/helpers/getData";
import getMediaSrc from "@/src/helpers/getMediaUrl";
import { formatCurrency } from "@/components/home/ProjectCard";
import { IPaymentMethod } from "@/src/models/payment-method";
import { getUserPaymentMethods, getPaymentMethodDisplayName, getPaymentMethodDetails, deletePaymentMethod } from "@/src/helpers/paymentMethods";
import { getUserPaymentHistory } from "@/src/helpers/getUserPaymentHistory";
import { getUserSubscriptions } from "@/src/helpers/getUserSubscriptions";

// Helper function to get user avatar URL
const getUserAvatarUrl = (email: string) => {
  if (typeof window === 'undefined') {
    // Server-side: use a default avatar
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=random`;
  }
  // Client-side: use Gravatar with email hash
  const hash = email.trim().toLowerCase();
  return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`;
};

export default function MyProfile() {
  const { isLoading: authLoading } = useAuth("/login");
  const [user, setUser] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<IProjectPayment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<IPaymentMethod[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<IPaymentLog[]>([]);
  const [contributor, setContributor] = useState<IContributor | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancellingSubscription, setCancellingSubscription] = useState<
    number | null
  >(null);
  const [subscriptionToCancel, setSubscriptionToCancel] =
    useState<IProjectPayment | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // Payment method deletion states
  const [deletingPaymentMethodId, setDeletingPaymentMethodId] = useState<number | null>(null);
  const [methodToDelete, setMethodToDelete] = useState<IPaymentMethod | null>(null);
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onOpenChange: onDeleteModalOpenChange } = useDisclosure();
  const [paymentMethodError, setPaymentMethodError] = useState<string | null>(null);

  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    email: "",
    fullName: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    fullName?: string;
  }>({});

  useEffect(() => {
    if (authLoading) return;

    const fetchData = async () => {
      const { getCurrentUser } = await import("@/src/services/userService");
      const userData = await getCurrentUser();

      if (!userData) return;

      setUser(userData);

      // Initialize edit form data
      setEditFormData({
        email: userData.email || "",
        fullName: (userData as any).fullName || "",
      });

      // Check if user is a contributor
      if (userData.email) {
        const contributorData = await getUserContributor(userData.email);

        setContributor(contributorData);
      }

      // Fetch user's subscriptions using new helper
      try {
        const userDocumentId = (userData as any).documentId;
        if (userDocumentId) {
          const subs = await getUserSubscriptions(userDocumentId);
          setSubscriptions(subs);
        } else {
          setSubscriptions([]);
        }
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
        setSubscriptions([]);
      }

      // Load payment methods
      try {
        const methods = await getUserPaymentMethods();
        setPaymentMethods(methods);
      } catch (error) {
        console.error("Failed to load payment methods:", error);
      }

      setLoading(false);
    };

    fetchData();
  }, [authLoading]);

  // Fetch payment history when user data is loaded
  useEffect(() => {
    const fetchPaymentHistory = async () => {
      if (!user) {
        setPaymentHistory([]);
        return;
      }

      try {
        const userDocumentId = (user as any).documentId;
        if (userDocumentId) {
          const history = await getUserPaymentHistory(userDocumentId);
          setPaymentHistory(history);
        } else {
          setPaymentHistory([]);
        }
      } catch (error) {
        console.error("Error fetching payment history:", error);
        setPaymentHistory([]);
      }
    };

    fetchPaymentHistory();
  }, [user]);

  const validateForm = () => {
    const errors: { email?: string; fullName?: string } = {};

    if (!editFormData.email.trim()) {
      errors.email = "Էլ. հասցեն պարտադիր է";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
      errors.email = "Էլ. հասցեն վավեր չէ";
    }

    // Full name is optional but if provided, should have minimum length
    if (editFormData.fullName.trim() && editFormData.fullName.trim().length < 2) {
      errors.fullName = "Ամբողջ անունը պետք է լինի առնվազն 2 նիշ";
    }

    setValidationErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form data when cancelling edit
      setEditFormData({
        email: user.email || "",
        fullName: user.fullName || "",
      });
      setValidationErrors({});
      setUpdateError(null);
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field: "email" | "fullName", value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleUpdateProfile = async () => {
    if (!validateForm()) return;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const { getToken } = await import("@/src/services/userService");
      const jwt = getToken();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/me`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: editFormData.email.trim(),
            fullName: editFormData.fullName.trim(),
          }),
        },
      );

      if (response.ok) {
        const updatedUser = await response.json();

        setUser(updatedUser);
        setIsEditing(false);
        setUpdateError(null);
      } else {
        const errorData = await response.json();

        setUpdateError(errorData.error?.message || "Պրոֆիլը թարմացնելու սխալ");
      }
    } catch (error) {
      setUpdateError("Ցանցային սխալ");
      console.error("Profile update error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePaymentMethodClick = (paymentMethod: IPaymentMethod) => {
    setMethodToDelete(paymentMethod);
    onDeleteModalOpen();
  };

  const handleDeletePaymentMethod = async () => {
    if (!methodToDelete) return;

    setDeletingPaymentMethodId(methodToDelete.id);
    setPaymentMethodError(null);

    try {
      await deletePaymentMethod(methodToDelete.documentId);
      setPaymentMethods(prev => prev.filter(method => method.id !== methodToDelete.id));
      setMethodToDelete(null);
      onDeleteModalOpenChange();
    } catch (err) {
      setPaymentMethodError(err instanceof Error ? err.message : "Վճարման եղանակը ջնջելու սխալ");
    } finally {
      setDeletingPaymentMethodId(null);
    }
  };

  const handleCancelSubscriptionClick = (subscription: IProjectPayment) => {
    setSubscriptionToCancel(subscription);
    onOpen();
  };

  const handleCancelSubscription = async () => {
    if (!subscriptionToCancel) return;

    setCancellingSubscription(subscriptionToCancel.id);

    try {
      const { getToken } = await import("@/src/services/userService");
      const jwt = getToken();

      // Security implemented: Backend validates user owns this subscription
      // See: server/src/api/project-payment/controllers/project-payment.ts:53-83

      // TODO: Log cancellation for audit purposes
      // TODO: Handle refund logic if applicable
      // TODO: Send notification to user about cancellation

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/project-payments/${subscriptionToCancel.documentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        // Optimistic UI update - remove from local state
        setSubscriptions((prev) =>
          prev.filter((sub) => sub.id !== subscriptionToCancel.id),
        );

        // TODO: Show success notification
        // toast.success("Բաժանորդագրությունը հաջողությամբ չեղարկվեց");
      } else {
        // TODO: Show error notification
        // toast.error("Բաժանորդագրությունը չեղարկելու սխալ");
        console.error("Failed to cancel subscription");
      }
    } catch (error) {
      // TODO: Show error notification
      // toast.error("Ցանցային սխալ");
      console.error("Network error:", error);
    } finally {
      setCancellingSubscription(null);
      setSubscriptionToCancel(null);
      onOpenChange();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto flex flex-col gap-6">
        {/* Profile Header Skeleton */}
        <Card className="p-6">
          <CardBody>
            <div className="flex items-center gap-4">
              <Skeleton className="rounded-full w-16 h-16" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-48 rounded-lg" />
                <Skeleton className="h-4 w-64 rounded-lg" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <CardBody>
                <div className="flex items-center gap-3">
                  <Skeleton className="rounded-lg w-12 h-12" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-20 rounded-lg" />
                    <Skeleton className="h-6 w-16 rounded-lg" />
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <Card className="p-6">
          <CardBody>
            <Skeleton className="h-10 w-full rounded-lg mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Calculate stats
  const activeSubscriptionsCount = subscriptions.filter(s => s.type === "recurring").length;
  const totalDonations = subscriptions.reduce((sum, s) => sum + s.amount, 0);
  const displayName = user?.fullName || user?.username || "...";
  const avatarUrl = user?.email ? getUserAvatarUrl(user.email) : undefined;

  return (
    <div className="container mx-auto flex flex-col gap-6">
      {/* Profile Header with User Component */}
      <Card className="p-6">
        <CardBody>
          <User
            name={displayName}
            description={user?.email}
            avatarProps={{
              src: avatarUrl,
              size: "lg",
              isBordered: true,
              color: "primary",
              radius: "full",
              classNames: {
                base: "!rounded-full",
                img: "!rounded-full",
                icon: "!rounded-full",
              },
              style: {
                borderRadius: "9999px",
              },
            }}
            classNames={{
              name: "text-2xl font-bold",
              description: "text-default-500",
            }}
          />
        </CardBody>
      </Card>

      {/* Tabs for different sections */}
      <Card className="p-6">
        <CardBody>
          <Tabs
            aria-label="Profile sections"
            color="primary"
            variant="underlined"
            classNames={{
              base: "w-full",
              tabList: "gap-2 w-full relative rounded-none p-0 overflow-x-auto",
              cursor: "w-full",
              tab: "max-w-fit px-2 h-12",
              tabContent: "group-data-[selected=true]:text-primary text-xs sm:text-sm"
            }}
          >
            {/* Subscriptions Tab - FIRST */}
            <Tab
              key="subscriptions"
              title={
                <div className="flex items-center gap-1 sm:gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="whitespace-nowrap">Բաժանորդագրություններ</span>
                  {activeSubscriptionsCount > 0 && (
                    <Chip size="sm" color="primary" variant="flat">
                      {activeSubscriptionsCount}
                    </Chip>
                  )}
                </div>
              }
            >
              <div className="py-4">
                {subscriptions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subscriptions.map((subscription) => (
                      <Card key={subscription.id} className="overflow-hidden">
                        <CardBody className="p-0">
                          {/* Project Image */}
                          {subscription.project?.image && (
                            <Link href={`/project/${subscription.project.slug}`}>
                              <Image
                                alt={
                                  subscription.project.image.alternativeText ||
                                  subscription.project.name
                                }
                                className="w-full h-32 object-cover"
                                height={128}
                                src={getMediaSrc(subscription.project.image)}
                                width="100%"
                              />
                            </Link>
                          )}

                          {/* Card Content */}
                          <div className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <Link href={`/project/${subscription.project?.slug}`}>
                                <h3 className="text-lg font-semibold hover:text-primary transition-colors line-clamp-2">
                                  {subscription.project?.name}
                                </h3>
                              </Link>
                              <Chip
                                size="sm"
                                color={subscription.type === "recurring" ? "success" : "default"}
                                variant="flat"
                              >
                                {subscription.type === "recurring" ? "Ամսական" : "Միանգամյա"}
                              </Chip>
                            </div>

                            <Divider />

                            <div className="flex justify-between items-center">
                              <span className="text-sm text-default-600">Գումար</span>
                              <span className="text-lg font-bold text-primary">
                                {formatCurrency(subscription.amount)}
                              </span>
                            </div>

                            {subscription.type === "recurring" && (
                              <Button
                                className="w-full"
                                color="danger"
                                isLoading={cancellingSubscription === subscription.id}
                                size="sm"
                                variant="light"
                                onPress={() => handleCancelSubscriptionClick(subscription)}
                              >
                                Չեղարկել բաժանորդագրությունը
                              </Button>
                            )}
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 text-default-300" />
                    <h3 className="text-lg font-semibold mb-2">Բաժանորդագրություններ չկան</h3>
                    <p className="text-default-500 mb-4">
                      Դուք դեռ չունեք ակտիվ բաժանորդագրություններ
                    </p>
                    <Link href="/#projects">
                      <Button color="primary" variant="flat">
                        Տեսնել նախագծերը
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </Tab>

            {/* Payment History Tab - SECOND */}
            <Tab
              key="payment-history"
              title={
                <div className="flex items-center gap-1 sm:gap-2">
                  <Receipt className="w-4 h-4" />
                  <span className="whitespace-nowrap">Վճարումների պատմություն</span>
                </div>
              }
            >
              <div className="py-4">
                {paymentHistory.length > 0 ? (
                  <Card className="p-0">
                    <CardBody className="p-0">
                      <Listbox aria-label="Payment History" variant="flat">
                        {paymentHistory.map((log) => {
                          // Get project name from multiple sources (fallback chain)
                          const projectName =
                            log.project_payment?.project?.name || // First try: populated project relation
                            log.donation?.project?.name ||         // Second try: donation project relation
                            log.project_payment?.name ||           // Third try: project_payment.name field (stored at payment time)
                            "Վճարում";                             // Final fallback

                          return (
                            <ListboxItem
                              key={log.id}
                              textValue={projectName}
                              description={
                                <span className="text-small text-default-500">
                                  {new Date(log.createdAt).toLocaleDateString("hy-AM", {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              }
                              startContent={
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                  log.success ? 'bg-success-100' : 'bg-danger-100'
                                }`}>
                                  {log.success ? (
                                    <CheckCircle className="w-5 h-5 text-success-600" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-danger-600" />
                                  )}
                                </div>
                              }
                              endContent={
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  <span className="text-base font-bold text-primary whitespace-nowrap">
                                    {formatCurrency(log.amount, log.currency?.toUpperCase() === 'AMD' ? 'AMD' : 'AMD')}
                                  </span>
                                  <Chip
                                    size="sm"
                                    color={log.success ? "success" : "danger"}
                                    variant="flat"
                                  >
                                    {log.success ? "Հաջողված" : "Ձախողված"}
                                  </Chip>
                                </div>
                              }
                            >
                              <span className="font-semibold text-base">{projectName}</span>
                            </ListboxItem>
                          );
                        })}
                      </Listbox>
                    </CardBody>
                  </Card>
                ) : (
                  <div className="text-center py-12">
                    <Receipt className="w-16 h-16 mx-auto mb-4 text-default-300" />
                    <h3 className="text-lg font-semibold mb-2">Վճարումների պատմություն չկա</h3>
                    <p className="text-default-500 mb-4">
                      Դուք դեռ չեք կատարել որևէ վճարում
                    </p>
                    <Link href="/#projects">
                      <Button color="primary" variant="flat">
                        Տեսնել նախագծերը
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </Tab>

            {/* Overview Tab - THIRD */}
            <Tab
              key="overview"
              title={
                <div className="flex items-center gap-1 sm:gap-2">
                  <UserIcon className="w-4 h-4" />
                  <span className="whitespace-nowrap">Ընդհանուր</span>
                </div>
              }
            >
              <div className="py-4 space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Անձնական տվյալներ</h2>
                  <Button
                    color={isEditing ? "danger" : "primary"}
                    isDisabled={isUpdating}
                    size="sm"
                    variant={isEditing ? "ghost" : "solid"}
                    onPress={handleEditToggle}
                  >
                    {isEditing ? "Չեղարկել" : "Խմբագրել"}
                  </Button>
                </div>

                {updateError && (
                  <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-600">
                    {updateError}
                  </div>
                )}

                <div className="space-y-4">
                  {isEditing ? (
                    <>
                      <Input
                        label="Անուն Ազգանուն"
                        labelPlacement="outside"
                        errorMessage={validationErrors.fullName}
                        isInvalid={!!validationErrors.fullName}
                        placeholder="Մուտքագրեք ձեր անունը"
                        value={editFormData.fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                        startContent={<UserIcon className="w-4 h-4 text-default-400" />}
                      />
                      <Input
                        label="Էլ. հասցե"
                        labelPlacement="outside"
                        errorMessage={validationErrors.email}
                        isInvalid={!!validationErrors.email}
                        placeholder="your@email.com"
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        startContent={<Mail className="w-4 h-4 text-default-400" />}
                      />
                      <div className="flex gap-2 mt-6">
                        <Button
                          color="primary"
                          isDisabled={isUpdating}
                          isLoading={isUpdating}
                          onPress={handleUpdateProfile}
                        >
                          {isUpdating ? "Պահպանվում է..." : "Պահպանել"}
                        </Button>
                        <Button
                          color="default"
                          isDisabled={isUpdating}
                          variant="ghost"
                          onPress={handleEditToggle}
                        >
                          Չեղարկել
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
                        <UserIcon className="w-5 h-5 text-default-400" />
                        <div>
                          <p className="text-xs text-default-500">Անուն Ազգանուն</p>
                          <p className="text-sm font-medium">{user.fullName || "Նշված չէ"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
                        <Mail className="w-5 h-5 text-default-400" />
                        <div>
                          <p className="text-xs text-default-500">Էլ. հասցե</p>
                          <p className="text-sm font-medium">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Tab>

            {/* Payment Methods Tab - FOURTH */}
            <Tab
              key="payment-methods"
              title={
                <div className="flex items-center gap-1 sm:gap-2">
                  <CreditCard className="w-4 h-4" />
                  <span className="whitespace-nowrap">Վճարման եղանակներ</span>
                  {paymentMethods.length > 0 && (
                    <Chip size="sm" color="secondary" variant="flat">
                      {paymentMethods.length}
                    </Chip>
                  )}
                </div>
              }
            >
              <div className="py-4 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Պահպանված վճարման եղանակներ</h3>
                  <p className="text-sm text-default-500">
                    Կառավարեք ձեր պահպանված քարտերը և վճարման եղանակները։ Այս եղանակներն օգտագործվում են նախկինում կատարված վճարումների համար։
                  </p>
                </div>

                {paymentMethodError && (
                  <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-600">
                    {paymentMethodError}
                  </div>
                )}

                {paymentMethods.length > 0 ? (
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <Card key={method.id} className="p-4">
                        <CardBody>
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                                <CreditCard className="w-6 h-6 text-primary-600" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg">{getPaymentMethodDisplayName(method)}</h4>
                                <p className="text-sm text-default-500">
                                  {getPaymentMethodDetails(method)}
                                </p>
                                <p className="text-xs text-default-400 mt-1">
                                  Ավելացվել է՝ {new Date(method.createdAt).toLocaleDateString("hy-AM")}
                                </p>
                              </div>
                            </div>
                            <Button
                              color="danger"
                              variant="ghost"
                              size="sm"
                              fullWidth
                              isLoading={deletingPaymentMethodId === method.id}
                              onPress={() => handleDeletePaymentMethodClick(method)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Հեռացնել
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="w-16 h-16 mx-auto mb-4 text-default-300" />
                    <h3 className="text-lg font-semibold mb-2">Վճարման եղանակներ չկան</h3>
                    <p className="text-default-500 mb-4">
                      Դուք դեռ չունեք պահպանված վճարման եղանակներ։ Նրանք ավտոմատ կպահպանվեն, երբ կատարեք ձեր առաջին աջակցությունը։
                    </p>
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Confirmation Modal for Subscription Cancellation */}
      <Modal isOpen={isOpen} placement="center" onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Բաժանորդագրության չեղարկում
              </ModalHeader>
              <ModalBody>
                <p>
                  Դուք վստա՞հ եք, որ ցանկանում եք չեղարկել ձեր ամսական
                  բաժանորդագրությունը՝
                </p>
                <p className="font-semibold text-primary">
                  {subscriptionToCancel?.project?.name}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="default"
                  variant="light"
                  isDisabled={cancellingSubscription !== null}
                  onPress={onClose}
                >
                  Չեղարկել
                </Button>
                <Button
                  color="danger"
                  isLoading={cancellingSubscription !== null}
                  onPress={handleCancelSubscription}
                >
                  {cancellingSubscription !== null
                    ? "Չեղարկվում է..."
                    : "Հաստատել չեղարկումը"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Payment Method Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} placement="center" onOpenChange={onDeleteModalOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Վճարման եղանակի ջնջում
              </ModalHeader>
              <ModalBody>
                <p>
                  Դուք վստա՞հ եք, որ ցանկանում եք ջնջել այս վճարման եղանակը՝
                </p>
                <p className="font-semibold text-primary">
                  {methodToDelete && getPaymentMethodDisplayName(methodToDelete)}
                </p>
                <p className="text-sm text-default-500 mt-2">
                  Այս գործողությունը հնարավոր չէ չեղարկել։ Բոլոր հետագա վճարումները կպահանջեն նոր վճարման եղանակ։
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="default"
                  variant="light"
                  isDisabled={deletingPaymentMethodId !== null}
                  onPress={onClose}
                >
                  Չեղարկել
                </Button>
                <Button
                  color="danger"
                  isLoading={deletingPaymentMethodId !== null}
                  onPress={handleDeletePaymentMethod}
                >
                  {deletingPaymentMethodId !== null ? "Ջնջվում է..." : "Ջնջել"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
