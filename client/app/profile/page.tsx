"use client";

import { useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Description,
  FieldError,
  InputGroup,
  Label,
  ListBox,
  Modal,
  Separator,
  Skeleton,
  Spinner,
  Tabs,
  TextField,
  useOverlayState,
} from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import Link from "next/link";
import {
  CreditCard,
  TrendingUp,
  Mail,
  User as UserIcon,
  Trash2,
  Receipt,
  CheckCircle,
  XCircle,
  LogOut,
} from "lucide-react";

import { Image } from "@/components/ui/Image";
import { useAuth } from "@/src/hooks/useAuth";
import { logout } from "@/src/services/userService";
import { getUserContributor } from "@/src/helpers/getUserContributor";
import { IContributor } from "@/src/models/contributor";
import { IProjectPayment, IPaymentLog } from "@/src/models/getData";
import getThumbUrl from "@/src/helpers/getThumbUrl";
import { formatCurrency } from "@/components/home/ProjectCard";
import { IPaymentMethod } from "@/src/models/payment-method";
import {
  getUserPaymentMethods,
  getPaymentMethodDisplayName,
  getPaymentMethodDetails,
  deletePaymentMethod,
} from "@/src/helpers/paymentMethods";
import { getUserPaymentHistory } from "@/src/helpers/getUserPaymentHistory";
import { getUserSubscriptions } from "@/src/helpers/getUserSubscriptions";
import { getGravatarUrl } from "@/src/services/userService";

export default function MyProfile() {
  const { isLoading: authLoading } = useAuth("/login");
  const [user, setUser] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<IProjectPayment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<IPaymentMethod[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<IPaymentLog[]>([]);
  const [contributor, setContributor] = useState<IContributor | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [cancellingSubscription, setCancellingSubscription] = useState<
    number | null
  >(null);
  const [subscriptionToCancel, setSubscriptionToCancel] =
    useState<IProjectPayment | null>(null);
  const cancelModal = useOverlayState();

  // Payment method deletion states
  const [deletingPaymentMethodId, setDeletingPaymentMethodId] = useState<
    number | null
  >(null);
  const [methodToDelete, setMethodToDelete] = useState<IPaymentMethod | null>(
    null,
  );
  const deleteModal = useOverlayState();
  const [paymentMethodError, setPaymentMethodError] = useState<string | null>(
    null,
  );

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

      // Compute avatar URL
      if (userData.email) {
        const url = await getGravatarUrl(userData.email);

        setAvatarUrl(url);
      }

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
    if (
      editFormData.fullName.trim() &&
      editFormData.fullName.trim().length < 2
    ) {
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
    deleteModal.open();
  };

  const handleDeletePaymentMethod = async () => {
    if (!methodToDelete) return;

    setDeletingPaymentMethodId(methodToDelete.id);
    setPaymentMethodError(null);

    try {
      await deletePaymentMethod(methodToDelete.documentId);
      setPaymentMethods((prev) =>
        prev.filter((method) => method.id !== methodToDelete.id),
      );
      setMethodToDelete(null);
      deleteModal.toggle();
    } catch (err) {
      setPaymentMethodError(
        err instanceof Error ? err.message : "Վճարման եղանակը ջնջելու սխալ",
      );
    } finally {
      setDeletingPaymentMethodId(null);
    }
  };

  const handleCancelSubscriptionClick = (subscription: IProjectPayment) => {
    setSubscriptionToCancel(subscription);
    cancelModal.open();
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
      cancelModal.toggle();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto flex flex-col gap-6">
        {/* Profile Header Skeleton */}
        <Card className="p-6">
          <Card.Content>
            <div className="flex items-center gap-4">
              <Skeleton className="rounded-full w-16 h-16" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-48 rounded-lg" />
                <Skeleton className="h-4 w-64 rounded-lg" />
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <Card.Content>
                <div className="flex items-center gap-3">
                  <Skeleton className="rounded-lg w-12 h-12" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-20 rounded-lg" />
                    <Skeleton className="h-6 w-16 rounded-lg" />
                  </div>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <Card className="p-6">
          <Card.Content>
            <Skeleton className="h-10 w-full rounded-lg mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          </Card.Content>
        </Card>
      </div>
    );
  }

  // Calculate stats
  const activeSubscriptionsCount = subscriptions.filter(
    (s) => s.type === "recurring",
  ).length;
  const totalDonated = paymentHistory
    .filter((log) => log.success)
    .reduce((sum, log) => sum + (log.amount || 0), 0);
  const successfulPaymentsCount = paymentHistory.filter(
    (log) => log.success,
  ).length;
  const displayName = user?.fullName || user?.username || "...";

  return (
    <div className="container mx-auto flex flex-col gap-6">
      {/* Profile Header with User Component */}
      <Card className="p-6">
        <Card.Content>
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2">
              <Avatar
                className="w-14 h-14 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-background"
                color="accent"
                size="lg"
              >
                <Avatar.Image alt={displayName} src={avatarUrl} />
                <Avatar.Fallback>
                  <UserIcon className="w-7 h-7" />
                </Avatar.Fallback>
              </Avatar>
              <div className="inline-flex flex-col items-start">
                <span className="text-2xl font-bold">{displayName}</span>
                <span className="text-xs text-default-500">{user?.email}</span>
              </div>
            </div>
            <Button
              variant="secondary"
              onPress={() => {
                logout();
                window.dispatchEvent(new CustomEvent("loginStateChanged"));
              }}
            >
              <LogOut size={18} />
              Դուրս գալ
            </Button>
          </div>
        </Card.Content>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <Card.Content>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-default-500">
                  Ակտիվ բաժանորդագրություններ
                </p>
                <p className="text-2xl font-bold text-primary">
                  {activeSubscriptionsCount}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card className="p-4">
          <Card.Content>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center shrink-0">
                <Receipt className="w-6 h-6 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-default-500">
                  Ընդհանուր նվիրատվություն
                </p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(totalDonated)}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card className="p-4">
          <Card.Content>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-default-500">Հաջողված վճարումներ</p>
                <p className="text-2xl font-bold text-primary">
                  {successfulPaymentsCount}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Card className="p-6">
        <Card.Content>
          <Tabs className="w-full" variant="secondary">
            <Tabs.ListContainer>
              <Tabs.List
                aria-label="Profile sections"
                className="gap-2 w-full overflow-x-auto"
              >
                <Tabs.Tab
                  className="max-w-fit px-2 h-12 text-xs sm:text-sm data-[selected=true]:text-primary"
                  id="subscriptions"
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="whitespace-nowrap">
                      Բաժանորդագրություններ
                    </span>
                    {activeSubscriptionsCount > 0 && (
                      <Chip color="accent" size="sm" variant="soft">
                        {activeSubscriptionsCount}
                      </Chip>
                    )}
                  </div>
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab
                  className="max-w-fit px-2 h-12 text-xs sm:text-sm data-[selected=true]:text-primary"
                  id="payment-history"
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Receipt className="w-4 h-4" />
                    <span className="whitespace-nowrap">
                      Վճարումների պատմություն
                    </span>
                  </div>
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab
                  className="max-w-fit px-2 h-12 text-xs sm:text-sm data-[selected=true]:text-primary"
                  id="overview"
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <UserIcon className="w-4 h-4" />
                    <span className="whitespace-nowrap">Ընդհանուր</span>
                  </div>
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab
                  className="max-w-fit px-2 h-12 text-xs sm:text-sm data-[selected=true]:text-primary"
                  id="payment-methods"
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="whitespace-nowrap">Վճարման եղանակներ</span>
                    {paymentMethods.length > 0 && (
                      <Chip color="accent" size="sm" variant="soft">
                        {paymentMethods.length}
                      </Chip>
                    )}
                  </div>
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>

            {/* Subscriptions Tab - FIRST */}
            <Tabs.Panel id="subscriptions">
              <div className="py-4">
                {subscriptions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subscriptions.map((subscription) => (
                      <Card key={subscription.id} className="overflow-hidden">
                        <Card.Content className="p-0">
                          {/* Project Image */}
                          {subscription.project?.image && (
                            <Link
                              href={`/project/${subscription.project.slug}`}
                            >
                              <Image
                                alt={
                                  subscription.project.image.alternativeText ||
                                  subscription.project.name
                                }
                                className="w-full h-32 object-cover"
                                height={128}
                                src={getThumbUrl(
                                  subscription.project.image,
                                  400,
                                )}
                                width="100%"
                              />
                            </Link>
                          )}

                          {/* Card Content */}
                          <div className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <Link
                                href={`/project/${subscription.project?.slug}`}
                              >
                                <h3 className="text-lg font-semibold hover:text-primary transition-colors line-clamp-2">
                                  {subscription.project?.name}
                                </h3>
                              </Link>
                              <Chip
                                color={
                                  subscription.type === "recurring"
                                    ? "success"
                                    : "default"
                                }
                                size="sm"
                                variant="soft"
                              >
                                {subscription.type === "recurring"
                                  ? "Ամսական"
                                  : "Միանգամյա"}
                              </Chip>
                            </div>

                            <Separator />

                            <div className="flex justify-between items-center">
                              <span className="text-sm text-default-600">
                                Գումար
                              </span>
                              <span className="text-lg font-bold text-primary">
                                {formatCurrency(subscription.amount)}
                              </span>
                            </div>

                            {subscription.type === "recurring" && (
                              <Button
                                fullWidth
                                className="text-danger"
                                isPending={
                                  cancellingSubscription === subscription.id
                                }
                                size="sm"
                                variant="ghost"
                                onPress={() =>
                                  handleCancelSubscriptionClick(subscription)
                                }
                              >
                                {cancellingSubscription === subscription.id && (
                                  <Spinner color="current" size="sm" />
                                )}
                                Չեղարկել բաժանորդագրությունը
                              </Button>
                            )}
                          </div>
                        </Card.Content>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 text-default-300" />
                    <h3 className="text-lg font-semibold mb-2">
                      Բաժանորդագրություններ չկան
                    </h3>
                    <p className="text-default-500 mb-4">
                      Դուք դեռ չունեք ակտիվ բաժանորդագրություններ
                    </p>
                    <Link
                      className={buttonVariants({ variant: "secondary" })}
                      href="/#projects"
                    >
                      Տեսնել նախագծերը
                    </Link>
                  </div>
                )}
              </div>
            </Tabs.Panel>

            {/* Payment History Tab - SECOND */}
            <Tabs.Panel id="payment-history">
              <div className="py-4">
                {paymentHistory.length > 0 ? (
                  <Card className="p-0">
                    <Card.Content className="p-0">
                      <ListBox aria-label="Payment History">
                        {paymentHistory.map((log) => {
                          // Get project name from multiple sources (fallback chain)
                          const projectName =
                            log.project_payment?.project?.name ||
                            log.donation?.project?.name ||
                            log.project_payment?.name ||
                            log.projectName ||
                            "Վճարում";

                          return (
                            <ListBox.Item
                              key={log.id}
                              className="flex items-center gap-2"
                              id={log.id}
                              textValue={projectName}
                            >
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                  log.success
                                    ? "bg-success-100"
                                    : "bg-danger-100"
                                }`}
                              >
                                {log.success ? (
                                  <CheckCircle className="w-5 h-5 text-success-600" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-danger-600" />
                                )}
                              </div>
                              <div className="flex flex-1 flex-col min-w-0">
                                <Label className="font-semibold text-base">
                                  {projectName}
                                </Label>
                                <Description className="text-sm text-default-500">
                                  {new Date(log.createdAt).toLocaleDateString(
                                    "hy-AM",
                                    {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </Description>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span className="text-base font-bold text-primary whitespace-nowrap">
                                  {formatCurrency(
                                    log.amount,
                                    log.currency?.toUpperCase() === "AMD"
                                      ? "AMD"
                                      : "AMD",
                                  )}
                                </span>
                                <Chip
                                  color={log.success ? "success" : "danger"}
                                  size="sm"
                                  variant="soft"
                                >
                                  {log.success ? "Հաջողված" : "Ձախողված"}
                                </Chip>
                              </div>
                            </ListBox.Item>
                          );
                        })}
                      </ListBox>
                    </Card.Content>
                  </Card>
                ) : (
                  <div className="text-center py-12">
                    <Receipt className="w-16 h-16 mx-auto mb-4 text-default-300" />
                    <h3 className="text-lg font-semibold mb-2">
                      Վճարումների պատմություն չկա
                    </h3>
                    <p className="text-default-500 mb-4">
                      Դուք դեռ չեք կատարել որևէ վճարում
                    </p>
                    <Link
                      className={buttonVariants({ variant: "secondary" })}
                      href="/#projects"
                    >
                      Տեսնել նախագծերը
                    </Link>
                  </div>
                )}
              </div>
            </Tabs.Panel>

            {/* Overview Tab - THIRD */}
            <Tabs.Panel id="overview">
              <div className="py-4 space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Անձնական տվյալներ</h2>
                  <Button
                    className={
                      isEditing
                        ? "border-danger text-danger hover:bg-danger hover:text-danger-foreground"
                        : undefined
                    }
                    isDisabled={isUpdating}
                    size="sm"
                    variant={isEditing ? "outline" : "primary"}
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
                      <TextField
                        fullWidth
                        isInvalid={!!validationErrors.fullName}
                        value={editFormData.fullName}
                        onChange={(value) =>
                          handleInputChange("fullName", value)
                        }
                      >
                        <Label>Անուն Ազգանուն</Label>
                        <InputGroup fullWidth>
                          <InputGroup.Prefix>
                            <UserIcon className="w-4 h-4 text-default-400" />
                          </InputGroup.Prefix>
                          <InputGroup.Input placeholder="Մուտքագրեք ձեր անունը" />
                        </InputGroup>
                        <FieldError>{validationErrors.fullName}</FieldError>
                      </TextField>
                      <TextField
                        fullWidth
                        isInvalid={!!validationErrors.email}
                        type="email"
                        value={editFormData.email}
                        onChange={(value) => handleInputChange("email", value)}
                      >
                        <Label>Էլ. հասցե</Label>
                        <InputGroup fullWidth>
                          <InputGroup.Prefix>
                            <Mail className="w-4 h-4 text-default-400" />
                          </InputGroup.Prefix>
                          <InputGroup.Input placeholder="your@email.com" />
                        </InputGroup>
                        <FieldError>{validationErrors.email}</FieldError>
                      </TextField>
                      <div className="flex gap-2 mt-6">
                        <Button
                          isDisabled={isUpdating}
                          isPending={isUpdating}
                          variant="primary"
                          onPress={handleUpdateProfile}
                        >
                          {isUpdating && <Spinner color="current" size="sm" />}
                          {isUpdating ? "Պահպանվում է..." : "Պահպանել"}
                        </Button>
                        <Button
                          isDisabled={isUpdating}
                          variant="outline"
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
                          <p className="text-xs text-default-500">
                            Անուն Ազգանուն
                          </p>
                          <p className="text-sm font-medium">
                            {user.fullName || "Նշված չէ"}
                          </p>
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
            </Tabs.Panel>

            {/* Payment Methods Tab - FOURTH */}
            <Tabs.Panel id="payment-methods">
              <div className="py-4 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Պահպանված վճարման եղանակներ
                  </h3>
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
                        <Card.Content>
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                                <CreditCard className="w-6 h-6 text-primary-600" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg">
                                  {getPaymentMethodDisplayName(method)}
                                </h4>
                                <p className="text-sm text-default-500">
                                  {getPaymentMethodDetails(method)}
                                </p>
                                <p className="text-xs text-default-400 mt-1">
                                  Ավելացվել է՝{" "}
                                  {new Date(
                                    method.createdAt,
                                  ).toLocaleDateString("hy-AM")}
                                </p>
                              </div>
                            </div>
                            <Button
                              fullWidth
                              className="border-danger text-danger hover:bg-danger hover:text-danger-foreground"
                              isPending={deletingPaymentMethodId === method.id}
                              size="sm"
                              variant="outline"
                              onPress={() =>
                                handleDeletePaymentMethodClick(method)
                              }
                            >
                              {deletingPaymentMethodId === method.id ? (
                                <Spinner color="current" size="sm" />
                              ) : (
                                <Trash2 className="w-4 h-4 mr-2" />
                              )}
                              Հեռացնել
                            </Button>
                          </div>
                        </Card.Content>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="w-16 h-16 mx-auto mb-4 text-default-300" />
                    <h3 className="text-lg font-semibold mb-2">
                      Վճարման եղանակներ չկան
                    </h3>
                  </div>
                )}
              </div>
            </Tabs.Panel>
          </Tabs>
        </Card.Content>
      </Card>

      {/* Confirmation Modal for Subscription Cancellation */}
      <Modal state={cancelModal}>
        <Modal.Backdrop>
          <Modal.Container placement="center">
            <Modal.Dialog>
              {({ close }) => (
                <>
                  <Modal.CloseTrigger />
                  <Modal.Header>
                    <Modal.Heading>Բաժանորդագրության չեղարկում</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body className="flex flex-col gap-3 text-foreground">
                    <p>
                      Դուք վստա՞հ եք, որ ցանկանում եք չեղարկել ձեր ամսական
                      բաժանորդագրությունը՝
                    </p>
                    <p className="font-semibold text-primary">
                      {subscriptionToCancel?.project?.name}
                    </p>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button
                      isDisabled={cancellingSubscription !== null}
                      variant="ghost"
                      onPress={close}
                    >
                      Չեղարկել
                    </Button>
                    <Button
                      isPending={cancellingSubscription !== null}
                      variant="danger"
                      onPress={handleCancelSubscription}
                    >
                      {cancellingSubscription !== null && (
                        <Spinner color="current" size="sm" />
                      )}
                      {cancellingSubscription !== null
                        ? "Չեղարկվում է..."
                        : "Հաստատել չեղարկումը"}
                    </Button>
                  </Modal.Footer>
                </>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Delete Payment Method Confirmation Modal */}
      <Modal state={deleteModal}>
        <Modal.Backdrop>
          <Modal.Container placement="center">
            <Modal.Dialog>
              {({ close }) => (
                <>
                  <Modal.CloseTrigger />
                  <Modal.Header>
                    <Modal.Heading>Վճարման եղանակի ջնջում</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body className="flex flex-col gap-3 text-foreground">
                    <p>
                      Դուք վստա՞հ եք, որ ցանկանում եք ջնջել այս վճարման եղանակը՝
                    </p>
                    <p className="font-semibold text-primary">
                      {methodToDelete &&
                        getPaymentMethodDisplayName(methodToDelete)}
                    </p>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button
                      isDisabled={deletingPaymentMethodId !== null}
                      variant="ghost"
                      onPress={close}
                    >
                      Չեղարկել
                    </Button>
                    <Button
                      isPending={deletingPaymentMethodId !== null}
                      variant="danger"
                      onPress={handleDeletePaymentMethod}
                    >
                      {deletingPaymentMethodId !== null && (
                        <Spinner color="current" size="sm" />
                      )}
                      {deletingPaymentMethodId !== null
                        ? "Ջնջվում է..."
                        : "Ջնջել"}
                    </Button>
                  </Modal.Footer>
                </>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
