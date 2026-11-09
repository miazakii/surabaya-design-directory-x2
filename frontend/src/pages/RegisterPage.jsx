import { useMemo, useState } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';
import { V2Footer, V2Header } from '@/components/v2/site-chrome';
import { useDocumentMeta } from '@/hooks/use-document-meta';
import { useSiteData } from '@/hooks/use-site-data';

const EMPTY = {
  name: '',
  address: '',
  region: '',
  categories: [],
  website: '',
  instagram: '',
  notes: '',
  contact: '',
};

function buildIssueUrl(base, type, form, categories, regions) {
  const categoryLabels = form.categories
    .map((key) => categories.find((category) => category.key === key)?.label || key)
    .join(', ');
  const region = regions.find((item) => item.code === form.region)?.label || form.region;
  const title = `[${type === 'baru' ? 'Daftar' : type === 'koreksi' ? 'Koreksi' : 'Hapus'} studio] ${form.name || '(nama studio)'}`;
  const body = [
    `Jenis pengajuan: ${type}`,
    `Nama studio: ${form.name}`,
    `Alamat: ${form.address}`,
    `Wilayah: ${region}`,
    `Kategori: ${categoryLabels}`,
    `Website: ${form.website}`,
    `Instagram: ${form.instagram}`,
    `Kontak pengaju: ${form.contact}`,
    '',
    'Catatan:',
    form.notes,
  ].join('\n');
  const url = new URL(base);
  url.searchParams.set('title', title);
  url.searchParams.set('body', body);
  return url.toString();
}

export function RegisterPage() {
  const { data, content } = useSiteData();
  const copy = content.v2?.register || {};
  const categories = data?.categories ?? [];
  const regions = data?.regions ?? [];
  useDocumentMeta(content.v2?.seo?.register || content.seo.home, content.site.url);

  const [tab, setTab] = useState('baru');
  const [form, setForm] = useState(EMPTY);
  const [submitted, setSubmitted] = useState('');

  const intro = copy.intro?.[tab] || {};
  const formUrl = copy.formUrl || content.site.issueUrl;

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const toggleCategory = (key) => {
    setForm((prev) => {
      const exists = prev.categories.includes(key);
      const next = exists ? prev.categories.filter((item) => item !== key) : [...prev.categories, key];
      return { ...prev, categories: next.slice(0, 3) };
    });
  };

  const issueUrl = useMemo(
    () => buildIssueUrl(formUrl, tab, form, categories, regions),
    [formUrl, tab, form, categories, regions],
  );

  const submit = (event) => {
    event.preventDefault();
    setSubmitted(issueUrl);
    window.open(issueUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="v2-page flex min-h-dvh flex-col">
      <V2Header active="register" />

      <main id="main" className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <p className="v2-kicker">{copy.eyebrow}</p>
        <h1 className="v2-display mt-4 max-w-[880px] text-[clamp(2.6rem,6vw,5rem)]">{copy.title}</h1>
        <p className="mt-5 max-w-[620px] text-[15px] leading-relaxed text-[var(--v2-muted)]">{copy.description}</p>

        <div className="mt-10 flex flex-wrap gap-0 border border-[var(--v2-line)] border-b-0">
          {(copy.tabs || []).map((item) => (
            <button
              key={item.key}
              type="button"
              className={`v2-mono border-r border-[var(--v2-line)] px-4 py-3 text-[10px] font-bold tracking-[0.06em] ${
                tab === item.key ? 'bg-[var(--v2-ink)] text-[var(--v2-paper)]' : 'bg-[var(--v2-paper-soft)] hover:bg-[#e8e5dc]'
              }`}
              onClick={() => {
                setTab(item.key);
                setSubmitted('');
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="border border-[var(--v2-line)] bg-[var(--v2-paper-soft)] p-5 v2-offset sm:p-7">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <h2 className="text-[clamp(1.4rem,2.6vw,2rem)] font-bold tracking-[-0.04em]">{intro.title}</h2>
              <p className="mt-2 max-w-[560px] text-[13px] leading-relaxed text-[var(--v2-muted)]">{intro.body}</p>

              <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
                <label className="grid gap-1.5 sm:col-span-2">
                  <span className="v2-kicker">Nama resmi studio</span>
                  <input className="v2-input" value={form.name} onChange={(event) => update('name', event.target.value)} required />
                </label>
                <label className="grid gap-1.5 sm:col-span-2">
                  <span className="v2-kicker">Alamat jalan</span>
                  <input className="v2-input" value={form.address} onChange={(event) => update('address', event.target.value)} required />
                </label>
                <label className="grid gap-1.5">
                  <span className="v2-kicker">Wilayah</span>
                  <select className="v2-select" value={form.region} onChange={(event) => update('region', event.target.value)} required>
                    <option value="">Pilih wilayah</option>
                    {regions.map((region) => (
                      <option key={region.code} value={region.code}>
                        {region.code} · {region.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5">
                  <span className="v2-kicker">Kontak pengaju</span>
                  <input className="v2-input" value={form.contact} onChange={(event) => update('contact', event.target.value)} placeholder="Email / WhatsApp" required />
                </label>
                <label className="grid gap-1.5">
                  <span className="v2-kicker">Website</span>
                  <input className="v2-input" value={form.website} onChange={(event) => update('website', event.target.value)} placeholder="https://" />
                </label>
                <label className="grid gap-1.5">
                  <span className="v2-kicker">Instagram</span>
                  <input className="v2-input" value={form.instagram} onChange={(event) => update('instagram', event.target.value)} placeholder="@studio" />
                </label>
                <div className="sm:col-span-2">
                  <p className="v2-kicker mb-2">Kategori (maksimal 3)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((category) => {
                      const active = form.categories.includes(category.key);
                      return (
                        <button
                          key={category.key}
                          type="button"
                          className="v2-chip"
                          data-active={active}
                          onClick={() => toggleCategory(category.key)}
                        >
                          <span className="v2-chip__code" style={!active ? { background: category.color } : undefined}>
                            {category.key}
                          </span>
                          {category.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <label className="grid gap-1.5 sm:col-span-2">
                  <span className="v2-kicker">Catatan / data yang perlu dikoreksi</span>
                  <textarea className="v2-input min-h-[100px]" value={form.notes} onChange={(event) => update('notes', event.target.value)} />
                </label>
                <div className="sm:col-span-2">
                  <button type="submit" className="v2-btn w-full sm:w-auto">
                    KIRIM PENGAJUAN <ArrowUpRight className="h-4 w-4" />
                  </button>
                  {submitted ? (
                    <p className="mt-3 text-[11px] leading-relaxed text-[var(--v2-muted)]">
                      Formulir eksternal dibuka di tab baru. Jika tidak terbuka,{' '}
                      <a href={submitted} target="_blank" rel="noopener noreferrer" className="v2-link-underline font-bold">
                        klik tautan ini
                      </a>
                      .
                    </p>
                  ) : null}
                </div>
              </form>
            </div>

            <aside className="border-t border-[var(--v2-line)] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <p className="v2-kicker">{copy.checklistTitle || 'SIAPKAN'}</p>
              <ul className="mt-3 grid gap-0 border-t border-[var(--v2-line)]">
                {(copy.checklist || []).map((item) => (
                  <li key={item} className="flex items-start gap-2 border-b border-[var(--v2-line)] py-2.5 text-[12px] leading-snug">
                    <span className="mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center border border-[var(--v2-line)]">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <a href={formUrl} target="_blank" rel="noopener noreferrer" className="v2-btn mt-4 w-full">
                {copy.formCta || 'BUKA FORMULIR'} <ArrowUpRight className="h-4 w-4" />
              </a>
              <p className="mt-2 text-[10px] leading-relaxed text-[var(--v2-muted)]">{copy.formNote}</p>
            </aside>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="border-b border-[var(--v2-line)] pb-3 text-[clamp(1.3rem,2.4vw,1.8rem)] font-bold tracking-[-0.04em]">
            {copy.stepsTitle}
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {(copy.steps || []).map((step) => (
              <div key={step.number} className="border border-[var(--v2-line)] bg-[var(--v2-paper-soft)] p-4">
                <p className="v2-mono text-[30px] font-bold leading-none tracking-[-0.08em]">{step.number}</p>
                <p className="mt-3 text-[13px] font-bold">{step.title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[var(--v2-muted)]">{step.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-[var(--v2-muted)]">{copy.note}</p>
        </section>
      </main>

      <V2Footer content={content} />
    </div>
  );
}
