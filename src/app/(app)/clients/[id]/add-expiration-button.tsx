"use client";
import { NewExpirationModal } from "@/app/(app)/vencimientos/new-expiration-modal";

export function AddExpirationButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  return (
    <NewExpirationModal
      clients={[{ id: clientId, razonSocial: clientName }]}
      defaultClientId={clientId}
    />
  );
}