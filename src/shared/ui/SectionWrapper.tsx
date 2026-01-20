import { ReactNode } from 'react';
import { cn } from '@/lib/utils'; // Assuming this exists, standard in ShadCN projects

interface SectionWrapperProps {
    children: ReactNode;
    className?: string;
    id?: string;
}

export function SectionWrapper({ children, className, id }: SectionWrapperProps) {
    return (
        <section id={id} className={cn('py-16 sm:py-24', className)}>
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                {children}
            </div>
        </section>
    );
}
