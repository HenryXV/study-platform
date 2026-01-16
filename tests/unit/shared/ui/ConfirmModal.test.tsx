import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';

describe('ConfirmModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
        title: 'Confirm Action',
        message: 'Are you sure you want to proceed?',
    };

    it('renders title and message', async () => {
        render(<ConfirmModal {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('Confirm Action')).toBeInTheDocument();
            expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
        });
    });

    it('renders default button text', async () => {
        render(<ConfirmModal {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
        });
    });

    it('renders custom button text', async () => {
        render(
            <ConfirmModal
                {...defaultProps}
                confirmText="Yes, delete"
                cancelText="No, keep it"
            />
        );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Yes, delete' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'No, keep it' })).toBeInTheDocument();
        });
    });

    it('calls onConfirm when confirm button is clicked', async () => {
        const user = userEvent.setup();
        const onConfirm = vi.fn();

        render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'Confirm' }));
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when cancel button is clicked', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        render(<ConfirmModal {...defaultProps} onClose={onClose} />);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('shows loading state', async () => {
        render(<ConfirmModal {...defaultProps} isLoading={true} />);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Processing...' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Processing...' })).toBeDisabled();
            expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
        });
    });

    it('renders danger variant by default', async () => {
        render(<ConfirmModal {...defaultProps} />);

        await waitFor(() => {
            const icon = document.querySelector('.text-red-500');
            expect(icon).toBeInTheDocument();
        });
    });

    it('renders warning variant', async () => {
        render(<ConfirmModal {...defaultProps} variant="warning" />);

        await waitFor(() => {
            const icon = document.querySelector('.text-amber-500');
            expect(icon).toBeInTheDocument();
        });
    });

    it('does not render when closed', () => {
        render(<ConfirmModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
    });
});
