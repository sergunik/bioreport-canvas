import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, Shield, TrendingUp, FileSearch, Lock, Server, Code, Users, ArrowRight } from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
const features = [{
  icon: FileText,
  titleKey: 'landing.features.centralized.title',
  descriptionKey: 'landing.features.centralized.description'
}, {
  icon: TrendingUp,
  titleKey: 'landing.features.historical.title',
  descriptionKey: 'landing.features.historical.description'
}, {
  icon: FileSearch,
  titleKey: 'landing.features.pdf.title',
  descriptionKey: 'landing.features.pdf.description'
}, {
  icon: Shield,
  titleKey: 'landing.features.privacy.title',
  descriptionKey: 'landing.features.privacy.description'
}];
const trustIndicators = [{
  icon: Server,
  labelKey: 'landing.trust.selfHosted'
}, {
  icon: Code,
  labelKey: 'landing.trust.openSource'
}, {
  icon: Users,
  labelKey: 'landing.trust.noThirdParties'
}];
export default function Landing() {
  const {
    t
  } = useTranslation();
  return <MainLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-secondary/50 to-background pb-16 pt-12 md:pb-24 md:pt-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,hsl(var(--primary)/0.08),transparent)]" />
        
        <PageContainer size="lg" className="text-center">
          <h1 className="animate-fade-up text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {t('landing.hero.title')}
          </h1>
          
          <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-lg text-muted-foreground md:text-xl">
            {t('landing.hero.subtitle')}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 animate-fade-up sm:flex-row">
            <Link to="/register">
              <Button size="lg" className="gap-2 px-8">
                {t('landing.hero.cta')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="px-8">
                {t('landing.hero.login')}
              </Button>
            </Link>
          </div>
        </PageContainer>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <PageContainer size="lg">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t('landing.features.title')}
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:gap-8">
            {features.map((feature, index) => <Card key={index} className="group border-border/50 transition-all duration-300 hover:border-primary/20 hover:shadow-soft-lg">
                <CardContent className="flex gap-4 p-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {t(feature.titleKey)}
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      {t(feature.descriptionKey)}
                    </p>
                  </div>
                </CardContent>
              </Card>)}
          </div>
        </PageContainer>
      </section>

      {/* Trust Section */}
      <section className="border-t border-border bg-muted/30 py-16 md:py-20">
        <PageContainer size="lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {t('landing.trust.title')}
            </h2>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {trustIndicators.map((indicator, index) => <div key={index} className="flex items-center gap-3 text-muted-foreground">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <indicator.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-lg font-medium">{t(indicator.labelKey)}</span>
              </div>)}
          </div>
        </PageContainer>
      </section>

      {/* CTA Section */}
      
    </MainLayout>;
}