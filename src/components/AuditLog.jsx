
import { Empty, fmt } from './ui.jsx';

export default function AuditLog({ entries }) {
  if (!entries.length) return <Empty icon="fa-clipboard-list" text="Nu există înregistrări în jurnal." />;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase text-slate-400 border-b border-slate-200"><tr><th className="px-5 py-3">Data</th><th className="px-5 py-3">Utilizator</th><th className="px-5 py-3">Acțiune</th><th className="px-5 py-3">Detalii</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {entries.map((a) => (
            <tr key={a.id} className="hover:bg-slate-50">
              <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{fmt(a.createdAt)}</td>
              <td className="px-5 py-3 font-semibold text-slate-800">{a.userName || '—'}</td>
              <td className="px-5 py-3"><span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{a.action}</span></td>
              <td className="px-5 py-3 text-slate-600">{a.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
