"use client";

import { useEffect, useState } from "react";
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
import Link from "next/link";
import { CreditCard } from "lucide-react";

import Contributor from "../contributor/[slug]/contributor";

import { getUserContributor } from "@/src/helpers/getUserContributor";
import { IContributor } from "@/src/models/contributor";
import { IProjectPayment } from "@/src/models/getData";
import getData from "@/src/helpers/getData";
import getMediaSrc from "@/src/helpers/getMediaUrl";
import { formatCurrency } from "@/components/home/ProjectCard";

export default function MyProfile() {
  const [user, setUser] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<IProjectPayment[]>([]);
  const [contributor, setContributor] = useState<IContributor | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancellingSubscription, setCancellingSubscription] = useState<
    number | null
  >(null);
  const [subscriptionToCancel, setSubscriptionToCancel] =
    useState<IProjectPayment | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

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
    const fetchData = async () => {
      const jwt =
        typeof window !== "undefined" ? localStorage.getItem("jwt") : null;

      if (!jwt) {
        window.location.replace("/");

        return;
      }
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/me?populate=*`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        },
      );

      const data = await res.json();

      setUser(data);

      // Initialize edit form data
      setEditFormData({
        email: data.email || "",
        fullName: data.fullName || "",
      });

      // Check if user is a contributor
      if (data.email) {
        const contributorData = await getUserContributor(data.email);

        setContributor(contributorData);
      }

      //TODO: IMPORTANT: Restrict this to only fetch user's subscriptions
      const { data: subscriptionsData } = await getData({
        type: "project-payments",
        fields: ["amount", "currency", "type"],
        populate: {
          project: {
            fields: ["name", "slug"],
            populate: {
              image: {
                fields: ["url"],
              },
            },
          },
        },
        limit: 10000,
        // filters: {
        //     type: "recurring",
        //     payment_method: {
        //         users_permissions_user: {
        //             $contains:{

        //             id: data.id,
        //             }
        //         }
        //     },
        // },
      });

      setSubscriptions(subscriptionsData);
      setLoading(false);
    };

    fetchData();
  }, []);

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
      const jwt =
        typeof window !== "undefined" ? localStorage.getItem("jwt") : null;

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

  const handleCancelSubscriptionClick = (subscription: IProjectPayment) => {
    setSubscriptionToCancel(subscription);
    onOpen();
  };

  const handleCancelSubscription = async () => {
    if (!subscriptionToCancel) return;

    setCancellingSubscription(subscriptionToCancel.id);

    try {
      const jwt =
        typeof window !== "undefined" ? localStorage.getItem("jwt") : null;

      // TODO: IMPORTANT SECURITY: Validate user permissions on backend
      // TODO: Ensure user can only cancel their own subscriptions
      // TODO: Add proper authentication and authorization checks
      // TODO: Log cancellation for audit purposes
      // TODO: Handle refund logic if applicable
      // TODO: Send notification to user about cancellation

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/project-payments/${subscriptionToCancel.id}`,
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

  if (loading) {
    return <div>Բեռնվում է...</div>;
  }

  return (
    <div className="container mx-auto flex flex-col gap-6">
      <Card className="p-6">
        <CardBody>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Իմ պրոֆիլը</h1>
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
          {/* TODO: make sure it saves properly */}
          <div className="flex flex-col gap-4">
            <div>
              <b>Անուն Ազգանուն:</b>
              {isEditing ? (
                <Input
                  className="mt-2"
                  errorMessage={validationErrors.fullName}
                  isInvalid={!!validationErrors.fullName}
                  placeholder="Ամբողջ անուն"
                  value={editFormData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                />
              ) : (
                <span className="ml-2">{user.fullName || "Նշված չէ"}</span>
              )}
            </div>
            <div>
              <b>Էլ. հասցե:</b>
              {isEditing ? (
                <Input
                  className="mt-2"
                  errorMessage={validationErrors.email}
                  isInvalid={!!validationErrors.email}
                  placeholder="Էլ. հասցե"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              ) : (
                <span className="ml-2">{user.email}</span>
              )}
            </div>
          </div>

          {isEditing && (
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
          )}
        </CardBody>
      </Card>

      {/* Payment Methods Section */}
      <Card className="p-6">
        <CardBody>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Վճարման եղանակներ</h2>
            <Link href="/profile/payment-methods">
              <Button color="primary" size="sm" variant="ghost">
                <CreditCard className="w-4 h-4 mr-2" />
                Կառավարել
              </Button>
            </Link>
          </div>
          <p className="text-gray-600">
            Տեսնել և կառավարել ձեր պահպանված վճարման եղանակները
          </p>
        </CardBody>
      </Card>

      <div className="flex flex-col gap-6">
        <h2 className="text-3xl">Ամսական բաժանորդագրությունները</h2>
        {subscriptions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <Link href={`/project/${subscription.project?.slug}`}>
                        <h3 className="text-lg font-semibold hover:text-primary transition-colors">
                          {subscription.project?.name}
                        </h3>
                      </Link>
                    </div>
                    <p className="mb-2">
                      <b>Գումար:</b> {formatCurrency(subscription.amount)}
                    </p>
                    <p className="text-sm text-default-500">
                      <b>Տեսակ:</b>{" "}
                      {subscription.type === "recurring"
                        ? "Ամսական բաժանորդագրություն"
                        : "Միանգամյա վճարում"}
                    </p>

                    {subscription.type === "recurring" && (
                      <Button
                        className="mt-8"
                        color="danger"
                        isLoading={cancellingSubscription === subscription.id}
                        size="sm"
                        variant="ghost"
                        onPress={() =>
                          handleCancelSubscriptionClick(subscription)
                        }
                      >
                        Չեղարկել
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <p>Առայժմ չունեք բաժանորդագրություններ</p>
        )}
      </div>

      {contributor && (
        <>
          <h3 className="text-3xl">Ձեր Աջակցությունը</h3>
          <div className="border rounded-lg p-6 shadow-md">
            <Contributor contributorId={contributor.id} showCopyLink={true} />
          </div>
        </>
      )}

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
                  color="success"
                  isDisabled={cancellingSubscription !== null}
                  onPress={onClose}
                >
                  Դեռ վստահ չեմ
                </Button>
                <Button
                  color="danger"
                  isLoading={cancellingSubscription !== null}
                  onPress={handleCancelSubscription}
                >
                  {cancellingSubscription !== null
                    ? "Չեղարկվում է..."
                    : "Համոզված եմ, չեղարկել"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
