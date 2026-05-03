"use client";

import { PolicyPageLayout } from '../components/PolicyPageLayout';
import {  useUiLocale, useDictionary  } from '../i18n/ui-locale';

export function FAQ() {
  const copy = useDictionary();
  const page = copy.pages.faq;

  return (
    <PolicyPageLayout
      eyebrow={page.eyebrow}
      title={page.title}
      intro={page.intro}
      sections={page.sections.map((section: any) => ({
        title: section.title,
        body: section.body,
      }))}
    />
  );
}
