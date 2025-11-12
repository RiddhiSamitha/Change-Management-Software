import React from 'react';

export default function AuditDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
      <p className="mt-2 text-gray-600">
        All system and user actions will be displayed here in a read-only table.
      </p>
      {/* TODO: Fetch and display logs from /api/audit-logs */}
    </div>
  );
}