"use client";
import { NewTaskModal } from "@/app/(app)/tareas/new-task-modal";

type User = { id: string; name: string };

export function AddTaskButton({
  clientId,
  clientName,
  users,
}: {
  clientId: string;
  clientName: string;
  users: User[];
}) {
  return (
    <NewTaskModal
      clients={[{ id: clientId, razonSocial: clientName }]}
      users={users}
      defaultClientId={clientId}
    />
  );
}