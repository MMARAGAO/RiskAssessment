// components/auth/ForgotPasswordModal.tsx
"use client";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import React, { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Alert } from "@heroui/alert";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const { forgotPassword, loading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return;

    try {
      await forgotPassword(email.trim());
      setEmailSent(true);
    } catch (error) {
      // Erro já tratado na store
    }
  };

  const handleClose = () => {
    setEmail("");
    setEmailSent(false);
    clearError();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} placement="center">
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader className="flex flex-col gap-1">
            {emailSent ? "Email Enviado!" : "Esqueci minha senha"}
          </ModalHeader>

          <ModalBody>
            {emailSent ? (
              <div className="text-center space-y-3">
                <Alert color="success">
                  Enviamos um link de recuperação para seu email!
                </Alert>
                <p className="text-sm text-gray-600">
                  Verifique sua caixa de entrada e spam. O link expira em 1
                  hora.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Digite seu email para receber um link de recuperação de senha.
                </p>

                <Input
                  label="Email"
                  placeholder="Digite seu email"
                  type="email"
                  variant="bordered"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  startContent={
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  }
                  isInvalid={!!error}
                  errorMessage={error}
                  isRequired
                />
              </>
            )}
          </ModalBody>

          <ModalFooter>
            {emailSent ? (
              <Button color="primary" onPress={handleClose}>
                Fechar
              </Button>
            ) : (
              <>
                <Button variant="flat" onPress={handleClose}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={loading}
                  isDisabled={!email.trim()}
                >
                  {loading ? "Enviando..." : "Enviar Link"}
                </Button>
              </>
            )}
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default ForgotPasswordModal;
