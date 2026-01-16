import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
    it('merges class names', () => {
        expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('handles conditional classes', () => {
        expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible');
    });

    it('merges Tailwind classes correctly', () => {
        // tailwind-merge should resolve conflicts
        expect(cn('p-4', 'p-8')).toBe('p-8');
        expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('handles undefined and null values', () => {
        expect(cn('base', undefined, null, 'end')).toBe('base end');
    });

    it('handles arrays', () => {
        expect(cn(['foo', 'bar'])).toBe('foo bar');
    });

    it('handles objects', () => {
        expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
    });
});
