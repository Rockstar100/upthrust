import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const site = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/site' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    contactLabel: z.string(),
    hero: z.object({
      line1: z.string(),
      line2: z.string(),
      line3: z.string(),
      kicker: z.string(),
      points: z.array(z.string()),
      aside: z.string(),
    }),
    stat: z.object({
      value: z.string(),
      label: z.string(),
    }),
    logos: z.array(z.string()),
    strategy: z.object({
      title: z.string(),
      body: z.string(),
      contactLabel: z.string(),
    }),
    footer: z.object({
      wordLeft: z.string(),
      wordRight: z.string(),
      blurb: z.string(),
      columns: z.array(
        z.object({
          title: z.string(),
          links: z.array(z.object({ label: z.string(), href: z.string() })),
        }),
      ),
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
    summary: z.string(),
    order: z.number(),
    visual: z.enum(['dashboard', 'identity', 'product', 'campaign']),
  }),
});

export const collections = { site, services };
