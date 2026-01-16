"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Trash2, CreditCard, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { IPaymentMethod } from "@/src/models/payment-method";
import {
  getUserPaymentMethods,
  deletePaymentMethod,
  getPaymentMethodDisplayName,
  getPaymentMethodDetails,
} from "@/src/helpers/paymentMethods";

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<IPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [methodToDelete, setMethodToDelete] = useState<IPaymentMethod | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const methods = await getUserPaymentMethods();
        setPaymentMethods(methods);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load payment methods");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  const handleDeleteClick = (paymentMethod: IPaymentMethod) => {
    setMethodToDelete(paymentMethod);
    onOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!methodToDelete) return;

    setDeletingId(methodToDelete.id);
    try {
      await deletePaymentMethod(methodToDelete.id);
      setPaymentMethods(prev => prev.filter(method => method.id !== methodToDelete.id));
      setMethodToDelete(null);
      onOpenChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete payment method");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/profile">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Վերադառնալ պրոֆիլին
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Վճարման եղանակներ</h1>
        </div>
        <div className="text-center py-8">Բեռնվում է...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/profile">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Վերադառնալ պրոֆիլին
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Վճարման եղանակներ</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-600">
          {error}
        </div>
      )}

      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          Կառավարեք ձեր պահպանված վճարման եղանակները։ Այս եղանակներն օգտագործվում են նախկինում կատարված վճարումների համար։
        </p>
        
        {paymentMethods.length === 0 ? (
          <Card className="p-8 text-center">
            <CardBody>
              <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Վճարման եղանակներ չկան</h3>
              <p className="text-gray-600 mb-4">
                Դուք դեռ չունեք պահպանված վճարման եղանակներ։ Նրանք ավտոմատ կպահպանվեն, երբ կատարեք ձեր առաջին նվիրատվությունը։
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4">
            {paymentMethods.map((method) => (
              <Card key={method.id} className="p-4">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {getPaymentMethodDisplayName(method)}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {getPaymentMethodDetails(method)}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          Ավելացվել է՝ {new Date(method.createdAt).toLocaleDateString("hy-AM")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        color="danger"
                        variant="ghost"
                        size="sm"
                        isLoading={deletingId === method.id}
                        onPress={() => handleDeleteClick(method)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Ջնջել
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} placement="center" onOpenChange={onOpenChange}>
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
                <p className="text-sm text-gray-600 mt-2">
                  Այս գործողությունը հնարավոր չէ չեղարկել։ Բոլոր հետագա վճարումները կպահանջեն նոր վճարման եղանակ։
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="success"
                  variant="ghost"
                  isDisabled={deletingId !== null}
                  onPress={onClose}
                >
                  Չեղարկել
                </Button>
                <Button
                  color="danger"
                  isLoading={deletingId !== null}
                  onPress={handleDeleteConfirm}
                >
                  {deletingId !== null ? "Ջնջվում է..." : "Ջնջել"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}