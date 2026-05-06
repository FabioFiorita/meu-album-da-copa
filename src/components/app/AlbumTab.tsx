import { useMutation, useQuery } from "convex/react";
import { CheckIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { AlbumSession } from "@/lib/albumSession";
import { errorMessage } from "@/lib/errors";
import { WC_2026_TEMPLATE } from "@convex/lib/templates";
import { cn } from "@/lib/utils";

type Props = { session: AlbumSession };

export function AlbumTab({ session }: Props) {
  const snapshot = useQuery(api.albums.getPrivateSnapshot, {
    code: session.code,
    writeKey: session.writeKey,
  });
  const addCopies = useMutation(api.stickers.addCopies);
  const [q, setQ] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);

  const countByKey = useMemo(() => {
    const m = new Map<string, number>();
    if (!snapshot) return m;
    for (const s of snapshot.stickers) {
      m.set(s.key, s.count);
    }
    return m;
  }, [snapshot]);

  const filteredSections = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return WC_2026_TEMPLATE.sections;
    return WC_2026_TEMPLATE.sections.filter(
      (s) =>
        s.id.toLowerCase().includes(qq) ||
        s.title.toLowerCase().includes(qq),
    );
  }, [q]);

  async function applyDelta(key: string, delta: number) {
    try {
      await addCopies({
        code: session.code,
        writeKey: session.writeKey,
        stickerKey: key,
        delta,
      });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  if (snapshot === undefined) {
    return (
      <div className="flex flex-col gap-4 py-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const { album } = snapshot;
  const openSticker =
    openKey == null
      ? null
      : WC_2026_TEMPLATE.sections
          .flatMap((s) => s.stickers)
          .find((x) => x.key === openKey) ?? null;
  const openCount = openKey ? countByKey.get(openKey) ?? 0 : 0;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 pb-28 pt-2">
      <Card>
        <CardHeader className="flex flex-col gap-2">
          <CardTitle>{album.name}</CardTitle>
          <CardDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>
              {album.ownedCount} de {album.total}
            </span>
            <span>{album.completionPercentage}%</span>
          </CardDescription>
          <Progress value={album.completionPercentage} />
        </CardHeader>
      </Card>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="search-sections">Buscar países</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <span className="text-muted-foreground">🔎</span>
            </InputGroupAddon>
            <InputGroupInput
              id="search-sections"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar países…"
            />
          </InputGroup>
        </Field>
      </FieldGroup>
      <Accordion className="flex flex-col gap-2">
        {filteredSections.map((sec) => (
          <AccordionItem key={sec.id} value={sec.id} className="border rounded-lg px-2">
            <AccordionTrigger className="text-sm hover:no-underline">
              <span className="flex flex-1 items-center gap-2 text-left">
                <span aria-hidden>{sec.emoji ?? "🏷️"}</span>
                <span className="font-medium">{sec.id}</span>
                <Badge variant="secondary" className="ml-auto">
                  {snapshot.sections.find((x) => x.id === sec.id)?.ownedCount ?? 0}
                  /{sec.total}
                </Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="mx-auto grid w-full max-w-[min(100%,26rem)] grid-cols-7 gap-2 pb-3 sm:max-w-md md:max-w-lg lg:max-w-xl">
                {sec.stickers.map((st) => {
                  const c = countByKey.get(st.key) ?? 0;
                  const owned = c >= 1;
                  const dup = c > 1;
                  return (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setOpenKey(st.key)}
                      className={cn(
                        "relative flex aspect-[2/3] w-full flex-col items-center rounded-md border-2 px-0.5 py-1 text-[0.65rem] font-semibold leading-none transition-colors sm:text-xs",
                        !owned &&
                          "border-dashed border-muted-foreground/50 bg-muted/30",
                        owned &&
                          !dup &&
                          "border-primary bg-primary text-primary-foreground",
                        dup &&
                          "border-primary bg-primary/90 text-primary-foreground",
                      )}
                    >
                      {owned && (
                        <CheckIcon className="absolute right-0.5 top-0.5 size-3 opacity-90" />
                      )}
                      <span className="flex min-h-0 w-full flex-1 flex-col items-center justify-center tabular-nums">
                        {st.displayNumber}
                      </span>
                      {dup && (
                        <Badge
                          variant="secondary"
                          className="shrink-0 text-[10px] px-1"
                        >
                          ×{c - 1}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <Sheet
        open={openKey !== null}
        onOpenChange={(o) => !o && setOpenKey(null)}
      >
        <SheetContent side="bottom" className="flex flex-col gap-4">
          <SheetHeader>
            <SheetTitle>
              {openSticker ? `${openSticker.sectionId}:${openSticker.displayNumber}` : ""}
            </SheetTitle>
          </SheetHeader>
          {openSticker && (
            <div className="flex flex-col gap-4">
              <p className="text-center text-sm text-muted-foreground">
                Quantidade no álbum:{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {openCount}
                </span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="h-14 text-2xl font-semibold"
                  disabled={openCount <= 0}
                  onClick={() => void applyDelta(openSticker.key, -1)}
                >
                  −1
                </Button>
                <Button
                  type="button"
                  size="lg"
                  className="h-14 text-2xl font-semibold"
                  onClick={() => void applyDelta(openSticker.key, 1)}
                >
                  +1
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
