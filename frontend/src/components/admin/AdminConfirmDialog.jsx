import React from 'react';

const AdminConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/45 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white w-full max-w-md rounded-2xl border border-gray-100 shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-2">{message}</p>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminConfirmDialog;
