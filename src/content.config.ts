import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const link = z.object({ label: z.string(), href: z.string() });

const site = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/site' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    contactLabel: z.string(),
    hero: z.object({
      title: z.string(),
      notes: z.array(z.string()),
    }),
    stat: z.object({
      value: z.string(),
      label: z.string(),
    }),
    logos: z.array(z.string()),
    servicesLabel: z.string(),
    footer: z.object({
      columns: z.array(
        z.object({
          link,
          description: z.string(),
          email: z.string(),
        }),
      ),
      tagline: z.string(),
      newsletter: z.object({
        title: z.string(),
        consent: z.string(),
        placeholder: z.string(),
        submitLabel: z.string(),
        success: z.string(),
      }),
      links: z.array(link),
      social: z.array(link),
      legal: z.array(link),
      copyright: z.string(),
    }),
    form: z.object({
      title: z.string(),
      intro: z.string(),
      success: z.string(),
      submitLabel: z.string(),
    }),
  }),
});

const services = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    intro: z.string(),
    bullets: z.array(z.string()),
    note: z.string().optional(),
    order: z.number(),
    image: z.string(),
    imageAlt: z.string(),
    curve: z.string(),
  }),
});

export const collections = { site, services };
