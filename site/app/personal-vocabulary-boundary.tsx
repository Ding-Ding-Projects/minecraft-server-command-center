"use client";

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  type ReactNode,
} from "react";
import {
  applyPersonalVocabularyReplacements,
  type PersonalVocabularyTextBoundary,
} from "../../src/shared/personal-vocabulary";
import type { PersonalVocabularyEntryV1 } from "../../src/shared/universal-contracts";

const PersonalVocabularyContext = createContext<readonly PersonalVocabularyEntryV1[]>([]);
const PROTECTED_TAGS = new Set(["code", "pre", "kbd", "samp", "output", "script", "style"]);
const TRANSLATABLE_ATTRIBUTES = ["aria-label", "aria-description", "alt", "placeholder", "title"] as const;

type HostProps = Record<string, unknown> & {
  children?: ReactNode;
  "data-personal-vocabulary"?: "preserve" | "apply";
  "data-personal-vocabulary-boundary"?: PersonalVocabularyTextBoundary;
};

function transformNode(node: ReactNode, entries: readonly PersonalVocabularyEntryV1[], inheritedPreserve = false): ReactNode {
  if (typeof node === "string") {
    return inheritedPreserve ? node : applyPersonalVocabularyReplacements(node, entries);
  }
  if (!isValidElement(node)) return node;

  const props = node.props as HostProps;
  const tagName = typeof node.type === "string" ? node.type.toLowerCase() : "";
  const declaredBoundary = props["data-personal-vocabulary-boundary"] ?? "ui";
  const preserve = inheritedPreserve
    || PROTECTED_TAGS.has(tagName)
    || props["data-personal-vocabulary"] === "preserve"
    || declaredBoundary !== "ui";
  const nextProps: HostProps = { ...props };
  let changed = false;

  if (!preserve) {
    for (const attribute of TRANSLATABLE_ATTRIBUTES) {
      const value = props[attribute];
      if (typeof value !== "string") continue;
      const translated = applyPersonalVocabularyReplacements(value, entries, { boundary: declaredBoundary });
      if (translated !== value) {
        nextProps[attribute] = translated;
        changed = true;
      }
    }
  }

  const hasChildren = Object.prototype.hasOwnProperty.call(props, "children");
  if (hasChildren && !preserve) {
    const nextChildren = Children.map(props.children, (child) => transformNode(child, entries));
    if (nextChildren !== props.children) {
      nextProps.children = nextChildren;
      changed = true;
    }
  }

  if (!changed) return node;
  return cloneElement(node, nextProps, nextProps.children);
}

export function PersonalVocabularyBoundary({
  entries,
  children,
}: {
  readonly entries: readonly PersonalVocabularyEntryV1[];
  readonly children: ReactNode;
}) {
  return (
    <PersonalVocabularyContext.Provider value={entries}>
      {transformNode(children, entries)}
    </PersonalVocabularyContext.Provider>
  );
}

export function usePersonalVocabularyEntries(): readonly PersonalVocabularyEntryV1[] {
  return useContext(PersonalVocabularyContext);
}

export function PersonalVocabularyText({
  text,
  boundary = "ui",
}: {
  readonly text: string;
  readonly boundary?: PersonalVocabularyTextBoundary;
}) {
  const entries = usePersonalVocabularyEntries();
  return <>{applyPersonalVocabularyReplacements(text, entries, { boundary })}</>;
}
