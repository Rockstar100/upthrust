/* global CMS, h, createClass */
// Previews for /admin. Decap renders these in an iframe with preview.css, so editors see roughly what ships.

CMS.registerPreviewStyle('/admin/preview.css');

const data = (entry, path) => {
  const value = entry.getIn(['data', ...path]);
  return value && value.toJS ? value.toJS() : value;
};

const asset = (getAsset, path) => (path ? String(getAsset(path) || path) : '');

const ServicePreview = createClass({
  render() {
    const { entry, getAsset } = this.props;
    const bullets = data(entry, ['bullets']) || [];
    const curve = asset(getAsset, data(entry, ['curve']));
    const image = asset(getAsset, data(entry, ['image']));
    const note = data(entry, ['note']);

    return h('div', { className: 'pv pv-dark' },
      h('p', { className: 'pv-hint' }, `Service slide · position ${data(entry, ['order']) ?? '–'}`),
      h('article', { className: 'pv-slide', style: curve ? { backgroundImage: `url("${curve}")` } : undefined },
        h('p', { className: 'pv-eyebrow' }, 'What can we do for you'),
        h('h1', { className: 'pv-slide-title' }, data(entry, ['title']) || 'Untitled slide'),
        h('div', { className: 'pv-slide-body' },
          image
            ? h('img', { className: 'pv-slide-image', src: image, alt: data(entry, ['imageAlt']) || '' })
            : h('div', { className: 'pv-slide-image pv-empty' }, 'No card image'),
          h('div', null,
            h('p', { className: 'pv-slide-intro' }, data(entry, ['intro'])),
            h('ul', { className: 'pv-slide-list' }, bullets.map((item, i) => h('li', { key: i }, item))),
            note ? h('p', { className: 'pv-slide-note' }, note) : null,
            h('span', { className: 'pv-slide-contact' }, 'Contact'),
          ),
        ),
      ),
    );
  },
});

const HomePreview = createClass({
  render() {
    const { entry } = this.props;
    const hero = data(entry, ['hero']) || {};
    const stat = data(entry, ['stat']) || {};
    const footer = data(entry, ['footer']) || {};
    const newsletter = footer.newsletter || {};
    const form = data(entry, ['form']) || {};
    const logos = data(entry, ['logos']) || [];

    const section = (label, ...children) =>
      h('section', { className: 'pv-section' }, h('p', { className: 'pv-section-label' }, label), ...children);

    return h('div', { className: 'pv' },
      h('header', { className: 'pv-header' },
        h('img', { src: '/brand/logo.svg', alt: 'Upthrust', height: 28 }),
        h('span', { className: 'pv-header-cta' }, data(entry, ['contactLabel'])),
      ),

      section('Search result',
        h('div', { className: 'pv-serp' },
          h('p', { className: 'pv-serp-title' }, `${data(entry, ['title']) || ''} — Bold design that performs`),
          h('p', { className: 'pv-serp-desc' }, data(entry, ['description'])),
        ),
      ),

      section('Hero (read by search engines and screen readers)',
        h('h1', { className: 'pv-hero-title' }, hero.title),
        h('div', { className: 'pv-chips' }, (hero.notes || []).map((note, i) => h('span', { key: i }, note))),
      ),

      section('Clients',
        h('div', { className: 'pv-stat' }, h('strong', null, stat.value), h('span', null, stat.label)),
        h('div', { className: 'pv-chips pv-chips-plain' }, logos.map((logo, i) => h('span', { key: i }, logo))),
      ),

      section('Services',
        h('p', { className: 'pv-eyebrow pv-eyebrow-dark' }, data(entry, ['servicesLabel'])),
        h('p', { className: 'pv-muted' }, 'Slides are edited under Service slides.'),
      ),

      h('section', { className: 'pv-section pv-dark pv-footer' },
        h('p', { className: 'pv-section-label' }, 'Footer'),
        h('div', { className: 'pv-footer-grid' },
          h('div', { className: 'pv-footer-cols' },
            (footer.columns || []).map((col, i) =>
              h('div', { key: i },
                h('p', { className: 'pv-link' }, col.link && col.link.label, ' ↗'),
                h('p', null, col.description),
                h('p', { className: 'pv-muted' }, col.email),
              ),
            ),
            h('p', { className: 'pv-muted pv-tagline' }, footer.tagline),
          ),
          h('div', null,
            h('p', null, newsletter.title),
            h('p', { className: 'pv-small' }, '☐ ', newsletter.consent),
            h('p', { className: 'pv-input' }, newsletter.placeholder),
            h('p', null, newsletter.submitLabel),
            h('p', { className: 'pv-links' }, (footer.links || []).map((l, i) => h('span', { key: i, className: 'pv-link' }, l.label, ' ↗'))),
            h('p', null, (footer.social || []).map((l) => l.label).join(', ')),
            h('p', { className: 'pv-muted' }, (footer.legal || []).map((l) => l.label).join(' · ')),
            h('p', { className: 'pv-muted' }, footer.copyright),
          ),
        ),
      ),

      section('Contact dialog',
        h('div', { className: 'pv-dialogs' },
          h('div', { className: 'pv-dialog' },
            h('h2', null, form.title),
            h('p', { className: 'pv-muted' }, form.intro),
            h('span', { className: 'pv-button' }, form.submitLabel),
          ),
          h('div', { className: 'pv-dialog pv-dialog-success' },
            h('span', { className: 'pv-check', 'aria-hidden': 'true' }, '✓'),
            h('h2', null, form.successTitle),
            h('p', { className: 'pv-muted' }, form.success),
          ),
        ),
      ),
    );
  },
});

CMS.registerPreviewTemplate('services', ServicePreview);
CMS.registerPreviewTemplate('home', HomePreview);
