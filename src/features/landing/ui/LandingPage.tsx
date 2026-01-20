import { HeroSection } from './HeroSection';
import { MetaSection } from './MetaSection';
import { ArcadeSection } from './ArcadeSection';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';
import { SocialProofSection } from './SocialProofSection';
import { BenefitsSection } from './BenefitsSection';
import { TestimonialsSection } from './TestimonialsSection';
import { FAQSection } from './FAQSection';
import { FinalCTASection } from './FinalCTASection';

export function LandingPage() {
    return (
        <main className="bg-zinc-950 min-h-screen relative flex flex-col">
            <LandingHeader />
            <div className="flex-1">
                <HeroSection />
                {/* <SocialProofSection /> */}
                <BenefitsSection />
                <MetaSection />
                {/* <TestimonialsSection /> */}
                <ArcadeSection />
                <FAQSection />
                <FinalCTASection />
            </div>
            <LandingFooter />
        </main>
    );
}
