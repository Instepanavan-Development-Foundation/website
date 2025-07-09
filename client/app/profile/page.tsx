"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Image } from "@heroui/image";
import Link from "next/link";

import { getUserContributor } from "@/src/helpers/getUserContributor";
import { IContributor } from "@/src/models/contributor";
import Contributor from "../contributor/[slug]/contributor";
import { IProjectPayment } from "@/src/models/getData";
import getData from "@/src/helpers/getData";
import getMediaSrc from "@/src/helpers/getMediaUrl";
import { form } from "@nextui-org/theme";
import { formatCurrency } from "@/components/home/ProjectCard";

export default function MyProfile() {
    const [user, setUser] = useState<any>(null);
    const [subscriptions, setSubscriptions] = useState<IProjectPayment[]>([]);
    const [contributor, setContributor] = useState<IContributor | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancellingSubscription, setCancellingSubscription] = useState<number | null>(null);
    const [subscriptionToCancel, setSubscriptionToCancel] = useState<IProjectPayment | null>(null);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

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
                    "project": {
                        fields: ["name", "slug"],
                        populate: {
                            image: {
                                fields: ["url"],
                            },
                        },
                    }
                },
                limit: 10000
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

    const handleCancelSubscriptionClick = (subscription: IProjectPayment) => {
        setSubscriptionToCancel(subscription);
        onOpen();
    };

    const handleCancelSubscription = async () => {
        if (!subscriptionToCancel) return;

        setCancellingSubscription(subscriptionToCancel.id);

        try {
            const jwt = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;

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
                }
            );

            if (response.ok) {
                // Optimistic UI update - remove from local state
                setSubscriptions(prev =>
                    prev.filter(sub => sub.id !== subscriptionToCancel.id)
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
                    <h1 className="text-2xl font-bold mb-4">Իմ պրոֆիլը</h1>
                    <div className="flex flex-col gap-4">
                        <div>
                            <b>Էլ. հասցե:</b> {user.email}
                        </div>
                        <div>
                            <b>Օգտանուն:</b> {user.username}
                        </div>
                    </div>
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
                                                src={getMediaSrc(subscription.project.image)}
                                                alt={subscription.project.image.alternativeText || subscription.project.name}
                                                className="w-full h-32 object-cover"
                                                width="100%"
                                                height={128}
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
                                            <b>Տեսակ:</b> {subscription.type === 'recurring' ? 'Ամսական բաժանորդագրություն' : 'Միանգամյա վճարում'}
                                        </p>

                                        {subscription.type === 'recurring' && (
                                            <Button
                                                className="mt-8"
                                                color="danger"
                                                variant="ghost"
                                                size="sm"
                                                isLoading={cancellingSubscription === subscription.id}
                                                onPress={() => handleCancelSubscriptionClick(subscription)}
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
                    <div className="border rounded-lg p-6 bg-white shadow-md">
                        <Contributor contributorId={contributor.id} showCopyLink={true} />
                    </div></>
            )}

            {/* Confirmation Modal for Subscription Cancellation */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                Բաժանորդագրության չեղարկում
                            </ModalHeader>
                            <ModalBody>
                                <p>
                                    Դուք վստա՞հ եք, որ ցանկանում եք չեղարկել ձեր ամսական բաժանորդագրությունը՝
                                </p>
                                <p className="font-semibold text-primary">
                                    {subscriptionToCancel?.project?.name}
                                </p>
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    color="success"
                                    onPress={onClose}
                                    isDisabled={cancellingSubscription !== null}
                                >
                                    Դեռ վստահ չեմ
                                </Button>
                                <Button
                                    color="danger"
                                    onPress={handleCancelSubscription}
                                    isLoading={cancellingSubscription !== null}
                                >
                                    {cancellingSubscription !== null ? "Չեղարկվում է..." : "Համոզված եմ, չեղարկել"}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
