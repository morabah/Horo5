"use client";

import { PolicyPageLayout } from '../components/PolicyPageLayout';
import { useDictionary } from '../i18n/ui-locale';

export function FAQ() {
  const copy = useDictionary();
  const page = copy.pages.faq;

  return (
    <PolicyPageLayout
      eyebrow={page.eyebrow}
      title={page.title}
      intro={page.intro}
      sections={page.sections.map((section) => ({
        title: section.title,
        body: section.body,
      }))}
    />
  );
}
