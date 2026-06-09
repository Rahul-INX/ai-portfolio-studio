"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { Check, Pencil, X } from "lucide-react";

type EditModeContextValue = {
  authenticated: boolean;
  editMode: boolean;
  setEditMode: (value: boolean) => void;
};

const EditModeContext = createContext<EditModeContextValue | null>(null);

export function EditModeProvider({
  authenticated,
  children
}: {
  authenticated: boolean;
  children: React.ReactNode;
}) {
  const [editMode, setEditMode] = useState(false);
  const value = useMemo(
    () => ({ authenticated, editMode: authenticated && editMode, setEditMode }),
    [authenticated, editMode]
  );

  return (
    <EditModeContext.Provider value={value}>
      {children}
      {authenticated ? (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
          <button
            type="button"
            aria-pressed={editMode}
            onClick={() => setEditMode(!editMode)}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--panel-strong)] px-4 text-sm font-semibold shadow-[var(--shadow-raised)] transition hover:border-[var(--accent)]"
          >
            {editMode ? <X aria-hidden className="h-4 w-4" /> : <Pencil aria-hidden className="h-4 w-4" />}
            {editMode ? "Exit edit mode" : "Edit page sections"}
            {editMode ? <Check aria-hidden className="h-4 w-4 text-[var(--accent)]" /> : null}
          </button>
        </div>
      ) : null}
    </EditModeContext.Provider>
  );
}

export function useEditMode() {
  const context = useContext(EditModeContext);
  if (!context) throw new Error("useEditMode must be used within EditModeProvider.");
  return context;
}
