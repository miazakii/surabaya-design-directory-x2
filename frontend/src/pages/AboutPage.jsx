import { ArrowRight } from 'lucide-react';
import { V2Footer, V2Header } from '@/components/v2/site-chrome';
import { useDocumentMeta } from '@/hooks/use-document-meta';
import { useSiteData } from '@/hooks/use-site-data';

function SectionTitle({ number, children }) {
  return (
    <div className="mb-5 flex items-baseline gap-3 border-b border-[var(--v2-line)] pb-3">
      <span className="v2-mono text-[18px] font-bold tracking-[-0.06em]">{number}</span>
      <h2 className="v2-section-title">{children}</h2>
    </div>
  );
}

export function AboutPage() {
  const { data, content } = useSiteData();
  const about = content.v2?.about || {};
  const categories = data?.categories ?? [];
  const regions = data?.regions ?? [];
  useDocumentMeta(content.v2?.seo?.about || content.seo.home, content.site.url);

  return (
    <div className="v2-page flex min-h-dvh flex-col">
      <V2Header active="about" />

      <main id="main" className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <p className="v2-kicker">{about.eyebrow}</p>
        <h1 className="v2-display mt-4 max-w-[900px] text-[clamp(2.7rem,6.6vw,5.6rem)]">{about.title}</h1>
        <p className="mt-6 max-w-[640px] text-[15px] leading-relaxed text-[var(--v2-muted)] sm:text-[17px]">
          {about.description}
        </p>

        <div className="mt-12 grid border border-[var(--v2-line)] bg-[var(--v2-paper-soft)] v2-offset md:grid-cols-[260px_minmax(0,1fr)]">
          <div className="v2-hatch relative min-h-[210px] border-b border-[var(--v2-line)] md:border-b-0 md:border-r">
            <span className="v2-mono absolute bottom-3 left-3 border border-[var(--v2-line)] bg-[var(--v2-paper)] px-2 py-1 text-[8px] tracking-[0.06em]">
              {about.book?.coverLabel || 'SAMPUL BUKU · [gambar]'}
            </span>
          </div>
          <div className="p-5 sm:p-7">
            <p className="v2-kicker">{about.book?.eyebrow}</p>
            <h2 className="mt-2 text-[clamp(1.3rem,2.4vw,1.9rem)] font-bold leading-tight tracking-[-0.04em]">
              {about.book?.title}
            </h2>
            <p className="mt-3 max-w-[620px] text-[13px] leading-relaxed text-[var(--v2-muted)]">{about.book?.body}</p>
          </div>
        </div>

        <section className="mt-14">
          <SectionTitle number="01">{about.criteriaTitle}</SectionTitle>
          <div className="grid gap-3 md:grid-cols-3">
            {(about.criteria || []).map((item) => (
              <div key={item.code} className="border border-[var(--v2-line)] bg-[var(--v2-paper-soft)] p-4">
                <p className="v2-kicker">{item.code}</p>
                <p className="mt-2 text-[13px] leading-relaxed">{item.title}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 max-w-[760px] text-[11px] leading-relaxed text-[var(--v2-muted)]">{about.criteriaNote}</p>
        </section>

        <section className="mt-14">
          <SectionTitle number="02">{about.codeTitle}</SectionTitle>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-[13px] font-bold">{about.codeCategoryTitle}</h3>
              <div className="border border-[var(--v2-line)] bg-[var(--v2-paper-soft)]">
                {categories.map((category) => (
                  <div key={category.key} className="flex items-center gap-3 border-b border-[var(--v2-line)] px-3 py-2 last:border-b-0">
                    <span className="v2-mono grid h-6 w-8 place-items-center border border-[var(--v2-line)] text-[9px] font-bold" style={{ background: category.color }}>
                      {category.key}
                    </span>
                    <span className="text-[13px]">{category.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-[13px] font-bold">{about.codeRegionTitle}</h3>
              <div className="border border-[var(--v2-line)] bg-[var(--v2-paper-soft)]">
                {regions.map((region) => (
                  <div key={region.code} className="flex items-center gap-3 border-b border-[var(--v2-line)] px-3 py-2 last:border-b-0">
                    <span className="v2-mono w-14 text-[10px] font-bold">{region.code}</span>
                    <span className="text-[13px]">{region.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-4 max-w-[760px] text-[11px] leading-relaxed text-[var(--v2-muted)]">{about.codeNote}</p>
        </section>

        <section className="mt-14">
          <SectionTitle number="03">{about.registerTitle}</SectionTitle>
          <p className="max-w-[760px] text-[14px] leading-relaxed text-[var(--v2-muted)]">{about.registerBody}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="daftar.html" className="v2-btn">
              {about.registerPrimary} <ArrowRight className="h-4 w-4" />
            </a>
            <a href={content.site.issueUrl} target="_blank" rel="noopener noreferrer" className="v2-btn v2-btn--paper">
              {about.registerSecondary}
            </a>
          </div>
        </section>
      </main>

      <V2Footer content={content} />
    </div>
  );
}
