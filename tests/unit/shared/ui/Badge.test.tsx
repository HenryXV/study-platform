import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from '@/shared/ui/Badge';

describe('Badge', () => {
    it('renders with default variant', () => {
        render(<Badge>Default</Badge>);
        const badge = screen.getByText('Default');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass('bg-zinc-100', 'text-zinc-900');
    });

    it('renders secondary variant', () => {
        render(<Badge variant="secondary">Secondary</Badge>);
        expect(screen.getByText('Secondary')).toHaveClass('bg-zinc-800', 'text-zinc-100');
    });

    it('renders destructive variant', () => {
        render(<Badge variant="destructive">Destructive</Badge>);
        expect(screen.getByText('Destructive')).toHaveClass('bg-red-900/50', 'text-red-200');
    });

    it('renders success variant', () => {
        render(<Badge variant="success">Success</Badge>);
        expect(screen.getByText('Success')).toHaveClass('bg-emerald-900/40', 'text-emerald-200');
    });

    it('renders warning variant', () => {
        render(<Badge variant="warning">Warning</Badge>);
        expect(screen.getByText('Warning')).toHaveClass('bg-amber-900/40', 'text-amber-200');
    });

    it('renders outline variant', () => {
        render(<Badge variant="outline">Outline</Badge>);
        expect(screen.getByText('Outline')).toHaveClass('text-zinc-100', 'border-zinc-700');
    });

    it('renders ghost variant', () => {
        render(<Badge variant="ghost">Ghost</Badge>);
        expect(screen.getByText('Ghost')).toHaveClass('bg-transparent', 'text-zinc-100');
    });

    it('renders small size', () => {
        render(<Badge size="sm">Small</Badge>);
        expect(screen.getByText('Small')).toHaveClass('text-[10px]', 'px-2');
    });

    it('renders medium size (default)', () => {
        render(<Badge size="md">Medium</Badge>);
        expect(screen.getByText('Medium')).toHaveClass('text-xs', 'px-2.5');
    });

    it('accepts custom className', () => {
        render(<Badge className="custom-class">Custom</Badge>);
        expect(screen.getByText('Custom')).toHaveClass('custom-class');
    });

    it('has base badge styles', () => {
        render(<Badge data-testid="badge">Base</Badge>);
        const badge = screen.getByTestId('badge');
        expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full', 'font-semibold');
    });
});
