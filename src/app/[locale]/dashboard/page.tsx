import { DashboardFeature } from '@/features/dashboard/components/DashboardFeature';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Dashboard | Study Platform',
};

export default function DashboardPage() {
    return <DashboardFeature />;
}
