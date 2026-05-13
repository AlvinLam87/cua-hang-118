import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const toneMap = {
  success: {
    wrap: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  error: {
    wrap: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: <AlertCircle className="w-4 h-4" />,
  },
};

const AdminToast = ({ feedback, onClose }) => {
  if (!feedback?.message) return null;
  const tone = toneMap[feedback.type] || toneMap.error;

  return (
    <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-semibold border flex items-center justify-between gap-3 ${tone.wrap}`}>
      <span className="inline-flex items-center gap-2">
        {tone.icon}
        {feedback.message}
      </span>
      <button type="button" onClick={onClose} className="opacity-70 hover:opacity-100 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default AdminToast;
