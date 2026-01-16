import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '@/shared/ui/Button';

describe('Button', () => {
    it('renders with default props', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('renders different variants', () => {
        const { rerender } = render(<Button variant="outline">Outline</Button>);
        expect(screen.getByRole('button')).toHaveClass('border-zinc-700');

        rerender(<Button variant="danger">Danger</Button>);
        expect(screen.getByRole('button')).toHaveClass('bg-red-950/20');

        rerender(<Button variant="success">Success</Button>);
        expect(screen.getByRole('button')).toHaveClass('bg-emerald-950/20');
    });

    it('renders different sizes', () => {
        const { rerender } = render(<Button size="sm">Small</Button>);
        expect(screen.getByRole('button')).toHaveClass('h-8');

        rerender(<Button size="lg">Large</Button>);
        expect(screen.getByRole('button')).toHaveClass('h-12');

        rerender(<Button size="icon">Icon</Button>);
        expect(screen.getByRole('button')).toHaveClass('h-9', 'w-9');
    });

    it('shows loading spinner when isLoading is true', () => {
        render(<Button isLoading>Loading</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('is disabled when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('calls onClick handler when clicked', async () => {
        const user = userEvent.setup();
        const handleClick = vi.fn();

        render(<Button onClick={handleClick}>Click me</Button>);
        await user.click(screen.getByRole('button'));

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
        const user = userEvent.setup();
        const handleClick = vi.fn();

        render(<Button onClick={handleClick} disabled>Click me</Button>);
        await user.click(screen.getByRole('button'));

        expect(handleClick).not.toHaveBeenCalled();
    });
});
