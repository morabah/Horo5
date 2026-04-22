"use client";

import { PolicyPageLayout } from '../components/PolicyPageLayout';
import { useUiLocale } from '../i18n/ui-locale';

export function FAQ() {
  const { copy } = useUiLocale();
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
