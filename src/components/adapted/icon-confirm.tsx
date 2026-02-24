import { Button } from "@/components/adapted/button";
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
export function IconConfirm({ description, onClick, title, ...rest }: IconConfirmProps) {
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
          <DialogClose render={<Button onClick={onClick} />}>Confirmer</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export type IconConfirmProps = IconButtonProps & {
  description: string;
  onClick: () => void;
  title: string;
};
