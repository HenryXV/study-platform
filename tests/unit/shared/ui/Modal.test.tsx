import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Modal } from '@/shared/ui/Modal';

describe('Modal', () => {
    beforeEach(() => {
        // Reset body overflow style
        document.body.style.overflow = '';
    });

    afterEach(() => {
        document.body.style.overflow = '';
    });

    it('renders nothing when closed', () => {
        render(
            <Modal isOpen={false} onClose={() => { }}>
                Content
            </Modal>
        );
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders content when open', async () => {
        render(
            <Modal isOpen={true} onClose={() => { }}>
                Modal Content
            </Modal>
        );

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByText('Modal Content')).toBeInTheDocument();
        });
    });

    it('has aria-modal attribute', async () => {
        render(
            <Modal isOpen={true} onClose={() => { }}>
                Content
            </Modal>
        );

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
        });
    });

    it('shows close button by default', async () => {
        render(
            <Modal isOpen={true} onClose={() => { }}>
                Content
            </Modal>
        );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /close modal/i })).toBeInTheDocument();
        });
    });

    it('hides close button when showCloseButton is false', async () => {
        render(
            <Modal isOpen={true} onClose={() => { }} showCloseButton={false}>
                Content
            </Modal>
        );

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        expect(screen.queryByRole('button', { name: /close modal/i })).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', async () => {
        const user = userEvent.setup();
        const handleClose = vi.fn();

        render(
            <Modal isOpen={true} onClose={handleClose}>
                Content
            </Modal>
        );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /close modal/i })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /close modal/i }));
        expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', async () => {
        const user = userEvent.setup();
        const handleClose = vi.fn();

        render(
            <Modal isOpen={true} onClose={handleClose}>
                <div data-testid="content">Content</div>
            </Modal>
        );

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        // Click on the backdrop (which has aria-hidden="true")
        const backdrop = document.querySelector('[aria-hidden="true"]');
        if (backdrop) {
            await user.click(backdrop);
            expect(handleClose).toHaveBeenCalledTimes(1);
        }
    });

    it('calls onClose when Escape key is pressed', async () => {
        const user = userEvent.setup();
        const handleClose = vi.fn();

        render(
            <Modal isOpen={true} onClose={handleClose}>
                Content
            </Modal>
        );

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        await user.keyboard('{Escape}');
        expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('applies custom className to modal content', async () => {
        render(
            <Modal isOpen={true} onClose={() => { }} className="custom-modal">
                Content
            </Modal>
        );

        await waitFor(() => {
            const modalContent = document.querySelector('.custom-modal');
            expect(modalContent).toBeInTheDocument();
        });
    });

    it('prevents body scroll when open', async () => {
        render(
            <Modal isOpen={true} onClose={() => { }}>
                Content
            </Modal>
        );

        await waitFor(() => {
            expect(document.body.style.overflow).toBe('hidden');
        });
    });
});
