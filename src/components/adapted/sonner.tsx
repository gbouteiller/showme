import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      className="toaster group"
      icons={{
        success: <span className="icon-[tabler--circle-check] size-4" />,
        info: <span className="icon-[tabler--info-circle] size-4" />,
        warning: <span className="icon-[tabler--alert-triangle] size-4" />,
        error: <span className="icon-[tabler--alert-octagon] size-4" />,
        loading: <span className="icon-[tabler--loader] size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      theme={theme as ToasterProps["theme"]}
      toastOptions={{ classNames: { toast: "cn-toast" } }}
      {...props}
    />
  );
};
