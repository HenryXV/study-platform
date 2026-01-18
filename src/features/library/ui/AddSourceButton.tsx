'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/ui/Button';
import { Plus } from 'lucide-react';
import { QuickAddForm } from '@/features/library/components/QuickAddForm';
import { Modal } from '@/shared/ui/Modal';

export function AddSourceButton() {
    const [isOpen, setIsOpen] = useState(false);
    const t = useTranslations('library');

    return (
        <>
            <Button onClick={() => setIsOpen(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                {t('addSource')}
            </Button>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                className="max-w-2xl"
            >
                <div className="bg-zinc-900">
                    <QuickAddForm onSuccess={() => setIsOpen(false)} />
                </div>
            </Modal>
        </>
    );
}
