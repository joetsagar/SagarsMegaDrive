"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

export function InlineEdit({
  value,
  onSave,
  textClassName,
  inputClassName,
  iconClassName,
}: {
  value: string;
  onSave: (next: string) => void;
  textClassName: string;
  inputClassName: string;
  iconClassName: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function commit() {
    const trimmed = draft.trim();
    setEditing(false);
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    } else {
      setDraft(value);
    }
  }

  if (editing) {
    return (
      <input
        autoFocus
        spellCheck
        autoCorrect="on"
        autoCapitalize="sentences"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={inputClassName}
      />
    );
  }

  return (
    <span className="flex min-w-0 flex-1 items-center gap-1.5">
      <span className={textClassName}>{value}</span>
      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className={iconClassName}
      >
        <Pencil className="size-3.5" />
        <span className="sr-only">Edit</span>
      </button>
    </span>
  );
}
