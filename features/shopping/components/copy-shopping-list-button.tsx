"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyShoppingListButton({ items }: { items: { title: string; quantity: number }[] }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = items.map((i) => (i.quantity > 1 ? `${i.title} x${i.quantity}` : i.title)).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" onClick={copy} disabled={items.length === 0}>
      {copied ? <Check /> : <Copy />}
      {copied ? "Copied" : "Copy to clipboard"}
    </Button>
  );
}
