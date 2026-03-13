import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon, ArrowLeft, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CyberIcon } from '@/components/ui/cyber-icon';
import { cn } from '@/lib/utils';
import sixLogo from '@/assets/six-logo-hero.png';

export interface LegalSection {
  id: string;
  title: string;
  icon: LucideIcon;
  content: React.ReactNode;
}

interface LegalPageLayoutProps {
  title: string;
  icon: LucideIcon;
  lastUpdated: string;
  sections: LegalSection[];
}

export default function LegalPageLayout({ title, icon, lastUpdated, sections }: LegalPageLayoutProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );
    sections.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <img src={sixLogo} alt="SIX AI" className="h-8" />
            </Link>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
              </Link>
            </Button>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login"><LogIn className="h-4 w-4 mr-1" /> Login</Link>
          </Button>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-12 text-center px-4">
        <div className="flex justify-center mb-6">
          <CyberIcon icon={icon} variant="cyan" size="lg" />
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gradient-brand mb-3">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground font-mono">
          Última atualização: {lastUpdated}
        </p>
      </section>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 flex gap-10">
        {/* Sidebar Index — sticky, hidden on mobile */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">Índice</p>
            <nav className="flex flex-col gap-1">
              {sections.map((s, i) => {
                const Icon = s.icon;
                const active = activeId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className={cn(
                      'flex items-center gap-2 text-left text-sm px-3 py-2 rounded-lg transition-colors',
                      active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{`${i + 1}. ${s.title}`}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 space-y-12">
          {sections.map((s, i) => {
            const Icon = s.icon;
            return (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    {i + 1}. {s.title}
                  </h2>
                </div>
                <div className="text-muted-foreground leading-relaxed space-y-3 pl-11">
                  {s.content}
                </div>
              </section>
            );
          })}
        </main>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-border py-8 px-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} SIX AI — Desenvolvido por <span className="text-foreground font-medium">X-Company Tech AI</span>
        </p>
      </footer>
    </div>
  );
}
