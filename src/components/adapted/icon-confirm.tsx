import type { VariantProps } from "class-variance-authority";
import { type BUTTON, Button } from "@/components/adapted/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IconButton, type IconButtonProps } from "./icon-button";

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function IconConfirm({ confirmVariant, description, onClick, title, ...rest }: IconConfirmProps) {
  return (
    <Dialog>
      <DialogTrigger render={<IconButton {...rest} />} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Annuler</DialogClose>
          <DialogClose render={<Button onClick={onClick} variant={confirmVariant} />}>Confirmer</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export type IconConfirmProps = IconButtonProps & {
  confirmVariant: VariantProps<typeof BUTTON>["variant"];
  description: string;
  onClick: () => void;
  title: string;
};
