'use client';

import { ShieldCheck } from 'lucide-react';
import type { MaskingInfo } from '../model';

interface PrivacyBadgeProps {
  maskingInfo: MaskingInfo;
}

export function PrivacyBadge({ maskingInfo }: PrivacyBadgeProps) {
  if (!maskingInfo.piiDetected) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400 text-[10px] font-medium mt-1">
      <ShieldCheck size={10} />
      PII 보호 ({maskingInfo.maskedCount}건 비식별화)
    </div>
  );
}
