import { CopyIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";
import { errorMessage } from "@/lib/errors";

type Props = {
  value: string;
  title: string;
  description: string;
  copyLabel?: string;
  rawLabel?: string;
  rawValue?: string;
};

export function ShareQrPanel({
  value,
  title,
  description,
  copyLabel = "Copiar link",
  rawLabel,
  rawValue,
}: Props) {
  async function copyLink() {
    try {
      await copyText(value);
      toast.success("Link copiado.");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="rounded-[1.1rem] border border-[var(--app-border-soft)] bg-white p-3 shadow-[0_14px_32px_rgba(0,0,0,0.2)]">
        <QRCodeSVG
          value={value}
          size={184}
          level="M"
          bgColor="#ffffff"
          fgColor="#111111"
          marginSize={1}
        />
      </div>
      <div className="flex max-w-[19rem] flex-col gap-1">
        <h3 className="text-base font-black leading-tight text-[var(--app-dialog-text)]">
          {title}
        </h3>
        <p className="text-sm font-semibold leading-relaxed text-[var(--app-muted-text)]">
          {description}
        </p>
      </div>
      {rawLabel && rawValue && (
        <div className="w-full rounded-2xl border border-[var(--app-border-soft)] bg-[var(--app-field-bg)] p-3 text-left">
          <p className="text-xs font-black uppercase leading-none tracking-normal text-[var(--app-muted-text)]">
            {rawLabel}
          </p>
          <p className="mt-2 break-all font-mono text-xs font-bold leading-relaxed text-[var(--app-dialog-text)]">
            {rawValue}
          </p>
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full rounded-2xl border-[var(--app-border)] bg-[var(--app-button-muted)] text-sm font-black text-[var(--app-gold)] hover:bg-[var(--app-button-muted-hover)] hover:text-[var(--app-gold-strong)]"
        onClick={() => void copyLink()}
      >
        <CopyIcon data-icon="inline-start" />
        {copyLabel}
      </Button>
    </div>
  );
}
