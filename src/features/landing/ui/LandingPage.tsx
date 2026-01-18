import { HeroSection } from './HeroSection';
import { MetaSection } from './MetaSection';
import { ArcadeSection } from './ArcadeSection';

export function LandingPage() {
    return (
        <main className="bg-zinc-950 min-h-screen relative">
            <HeroSection />
            <MetaSection />
            <ArcadeSection />
        </main>
    );
}
