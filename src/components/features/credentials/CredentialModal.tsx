import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { useCredentialStore, useUIStore } from "@store";
import { CredentialForm } from "./CredentialModalForm";
import type { Credential } from "@lib/types";

interface CredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  editCredential?: Credential | null;
}

export function CredentialModal({ isOpen, onClose, editCredential }: CredentialModalProps) {
  const { addCredential, updateCredential } = useCredentialStore();
  const { addToast } = useUIStore();

  const handleSubmit = (data: { name: string; username: string; password: string; website: string; tags: string[]; folderId?: string }) => {
    if (editCredential) {
      updateCredential(editCredential.id, data);
      addToast("Credential updated successfully", "success");
    } else {
      addCredential({ ...data, favorite: false });
      addToast("Credential created successfully", "success");
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editCredential ? "Edit Credential" : "New Credential"}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="cred-form" variant="primary">
            {editCredential ? "Save Changes" : "Create"}
          </Button>
        </>
      }
    >
      <CredentialForm initial={editCredential} onSubmit={handleSubmit} />
    </Modal>
  );
}