import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/shared/ui/Card';

describe('Card', () => {
    it('renders with default styles', () => {
        render(<Card data-testid="card">Content</Card>);
        const card = screen.getByTestId('card');
        expect(card).toBeInTheDocument();
        expect(card).toHaveClass('bg-zinc-900', 'border-zinc-800', 'rounded-xl');
    });

    it('accepts custom className', () => {
        render(<Card className="custom-class">Content</Card>);
        expect(screen.getByText('Content')).toHaveClass('custom-class');
    });

    it('forwards ref', () => {
        const ref = { current: null };
        render(<Card ref={ref}>Content</Card>);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
});

describe('CardHeader', () => {
    it('renders with correct styles', () => {
        render(<CardHeader data-testid="header">Header</CardHeader>);
        expect(screen.getByTestId('header')).toHaveClass('flex', 'flex-col', 'p-6');
    });
});

describe('CardTitle', () => {
    it('renders as h3 element', () => {
        render(<CardTitle>Title</CardTitle>);
        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Title');
    });

    it('has correct text styles', () => {
        render(<CardTitle data-testid="title">Title</CardTitle>);
        expect(screen.getByTestId('title')).toHaveClass('text-lg', 'font-medium', 'text-zinc-100');
    });
});

describe('CardDescription', () => {
    it('renders with muted text style', () => {
        render(<CardDescription data-testid="desc">Description</CardDescription>);
        const desc = screen.getByTestId('desc');
        expect(desc).toHaveClass('text-sm', 'text-zinc-400');
    });
});

describe('CardContent', () => {
    it('renders with padding styles', () => {
        render(<CardContent data-testid="content">Content</CardContent>);
        expect(screen.getByTestId('content')).toHaveClass('p-6', 'pt-0');
    });
});

describe('CardFooter', () => {
    it('renders with flex layout', () => {
        render(<CardFooter data-testid="footer">Footer</CardFooter>);
        const footer = screen.getByTestId('footer');
        expect(footer).toHaveClass('flex', 'items-center', 'p-6');
    });
});

describe('Card composition', () => {
    it('renders full card with all sub-components', () => {
        render(
            <Card>
                <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                    <CardDescription>Card description</CardDescription>
                </CardHeader>
                <CardContent>Card content</CardContent>
                <CardFooter>Card footer</CardFooter>
            </Card>
        );

        expect(screen.getByRole('heading', { name: 'Card Title' })).toBeInTheDocument();
        expect(screen.getByText('Card description')).toBeInTheDocument();
        expect(screen.getByText('Card content')).toBeInTheDocument();
        expect(screen.getByText('Card footer')).toBeInTheDocument();
    });
});
