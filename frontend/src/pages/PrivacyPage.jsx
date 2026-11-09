import { ArrowUpRight } from 'lucide-react';
import { V2Footer, V2Header } from '@/components/v2/site-chrome';
import { useDocumentMeta } from '@/hooks/use-document-meta';
import { useContent } from '@/hooks/use-site-data';

export function PrivacyPage() {
  const content = useContent();
  const privacy = content.privacy;
  useDocumentMeta(content.seo.privacy, content.site.url);

  return (
    <div className="v2-page flex min-h-dvh flex-col">
      <V2Header />

      <main id="main" className="mx-auto w-full max-w-[1000px] flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <p className="v2-kicker">{privacy.eyebrow}</p>
        <h1 className="v2-display mt-4 text-[clamp(2.4rem,5.4vw,4.6rem)]">{privacy.title}</h1>
        <p className="mt-5 max-w-[680px] text-[15px] leading-relaxed text-[var(--v2-muted)]">{privacy.intro}</p>

        <div className="mt-8 border border-[var(--v2-line)] bg-[var(--v2-paper-soft)] p-4 v2-offset-sm sm:p-5">
          <p className="v2-kicker">{privacy.principleTitle}</p>
          <p className="mt-2 max-w-[720px] text-[13px] leading-relaxed">{privacy.principleBody}</p>
        </div>

        <div className="mt-10">
          {privacy.sections.map((section, index) => (
            <section key={`${section.title}-${index}`} className="border-t border-[var(--v2-line)] py-6">
              <div className="grid gap-4 md:grid-cols-[190px_minmax(0,1fr)]">
                <div>
                  <p className="v2-mono text-[10px] font-bold">{String(index + 1).padStart(2, '0')}</p>
                  <h2 className="mt-1 text-[15px] font-bold leading-tight">{section.title}</h2>
                </div>
                <div className="space-y-3 text-[13px] leading-relaxed text-[var(--v2-muted)]">
                  {section.paragraphs.map((paragraph, paragraphIndex) => (
                    <p key={`${index}-${paragraphIndex}`}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="border-t border-[var(--v2-line)] pt-6">
          <h2 className="v2-section-title">{privacy.contact.title}</h2>
          <div className="mt-3 max-w-[720px] space-y-3 text-[13px] leading-relaxed text-[var(--v2-muted)]">
            <p>{privacy.contact.body}</p>
            {privacy.contact.sensitive ? <p>{privacy.contact.sensitive}</p> : null}
            <a href={content.site.issueUrl} target="_blank" rel="noopener noreferrer" className="v2-btn">
              {privacy.contact.ctaLabel} <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>

      <V2Footer content={content} />
    </div>
  );
}
