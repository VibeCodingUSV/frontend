
import { useState } from 'react';
import {
  downloadICS, Empty, FundedBadge, fmt, googleCalUrl,
  INPUT, isActive, StatusChip, STATUS
} from './ui.jsx';

const Stat = ({ icon, tone, label, value, sub }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tone}`}>
      <i className={`fa-solid ${icon}`} aria-hidden="true"></i>
    </div>
    <div className="min-w-0">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-xl font-bold text-slate-800 truncate">{value}</div>
      {sub && <div className="text-xs text-slate-500 truncate">{sub}</div>}
    </div>
  </div>
);

export default function MyReservations({ mine, all, resources, admin, onCancel, onEdit }) {
  const [scope, setScope] = useState('mine');
  const [status, setStatus] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [person, setPerson] = useState('');

  const upcoming = mine
    .filter((r) => isActive(r) && new Date(r.endTime) > new Date())
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  const pending = mine.filter((r) => r.status === 'PENDING').length;
  const base = admin && scope === 'all' ? all : mine;
  const people = [...new Set(all.map((r) => r.userName).filter(Boolean))].sort();

  const rows = base.filter(
    (r) =>
      (!status || r.status === status) &&
      (!resourceId || String(r.resourceId) === resourceId) &&
      (!person || r.userName === person)
  );

  const locOf = (r) => resources.find((x) => x.id === r.resourceId)?.location || '';
  const canAct = (r) =>
    isActive(r) &&
    new Date(r.endTime) > new Date() &&
    (r.userId === mine[0]?.userId || admin);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat icon="fa-calendar-check" tone="bg-indigo-100 text-indigo-600" label="Rezervări active" value={upcoming.length} />
        <Stat icon="fa-hourglass-half" tone="bg-amber-100 text-amber-600" label="În așteptare" value={pending} />
        <Stat
          icon="fa-clock"
          tone="bg-emerald-100 text-emerald-600"
          label="Următoarea"
          value={upcoming[0] ? upcoming[0].resourceName : '—'}
          sub={upcoming[0] && fmt(upcoming[0].startTime)}
        />
      </div>

      <section aria-label="Istoric rezervări" className="space-y-3">
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex flex-wrap items-center gap-3">
          <h3 className="font-bold text-slate-700 text-sm mr-2">
            <i className="fa-solid fa-clock-rotate-left text-indigo-500 mr-2" aria-hidden="true"></i>
            Istoric rezervări
          </h3>

          {admin && (
            <select aria-label="Domeniu" className={`${INPUT} !w-auto`} value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="mine">Doar ale mele</option>
              <option value="all">Toate (echipă / laborator)</option>
            </select>
          )}

          <select aria-label="Filtrează după status" className={`${INPUT} !w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Toate statusurile</option>
            {Object.entries(STATUS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <select aria-label="Filtrează după resursă" className={`${INPUT} !w-auto`} value={resourceId} onChange={(e) => setResourceId(e.target.value)}>
            <option value="">Toate resursele</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>

          {admin && scope === 'all' && (
            <select aria-label="Filtrează după utilizator" className={`${INPUT} !w-auto`} value={person} onChange={(e) => setPerson(e.target.value)}>
              <option value="">Toți utilizatorii</option>
              {people.map((p) => <option key={p}>{p}</option>)}
            </select>
          )}
        </div>

        {rows.length === 0 ? (
          <Empty icon="fa-calendar-xmark" text="Nu există rezervări pentru filtrele alese." />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Resursă</th>
                  {admin && scope === 'all' && <th className="px-5 py-3">Utilizator</th>}
                  <th className="px-5 py-3">Interval</th>
                  <th className="px-5 py-3">Scop</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3"><span className="sr-only">Acțiuni</span></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold text-slate-800">{r.resourceName}</td>
                    {admin && scope === 'all' && (
                      <td className="px-5 py-3 text-slate-600">{r.userName || '—'}</td>
                    )}
                    <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                      {fmt(r.startTime)} → {fmt(r.endTime)}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {r.purpose || '—'}
                      {r.fundedProject && (
                        <div className="mt-1"><FundedBadge name={r.projectName} /></div>
                      )}
                    </td>
                    <td className="px-5 py-3"><StatusChip status={r.status} /></td>
                    <td className="px-5 py-3 text-right whitespace-nowrap space-x-2">
                      {r.status === 'CONFIRMED' && (
                        <>
                          <a
                            href={googleCalUrl(r, locOf(r))}
                            target="_blank"
                            rel="noreferrer"
                            title="Adaugă în Google Calendar"
                            aria-label="Adaugă în Google Calendar"
                            className="inline-block px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <i className="fa-brands fa-google" aria-hidden="true"></i>
                          </a>
                          <button
                            title="Descarcă .ics (Outlook / Teams)"
                            aria-label="Descarcă fișier calendar .ics"
                            onClick={() => downloadICS(r, locOf(r))}
                            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <i className="fa-solid fa-file-arrow-down" aria-hidden="true"></i>
                          </button>
                        </>
                      )}

                      {canAct(r) && (
                        <>
                          <button onClick={() => onEdit(r)} className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600">
                            Modifică
                          </button>
                          <button onClick={() => onCancel(r)} className="px-3 py-1.5 text-xs font-bold text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50">
                            Anulează
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
