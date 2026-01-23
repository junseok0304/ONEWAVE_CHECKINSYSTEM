'use client';

import { Suspense } from 'react';
import SuccessStaffContent from './success-staff-content';

export default function SuccessStaffPage() {
    return (
        <Suspense fallback={<div style={{ padding: '20px' }}>로딩 중...</div>}>
            <SuccessStaffContent />
        </Suspense>
    );
}
