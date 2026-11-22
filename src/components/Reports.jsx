import { useMemo, useState } from 'react';
import { fmt, INPUT, LABEL, saveBlob, STATUS } from './ui.jsx';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const day = (d) => d.toISOString().slice(0, 10);

export default function Reports({ reservations, resources }) {
    const [from, setFrom] = useState(day(new Date(Date.now() - 30 * 86400000)));
    const [to, setTo] = useState(day(new Date(Date.now() + 30 * 86400000)));
    const [resourceId, setResourceId] = useState('');

    const rows = useMemo(() => {
        const a = new Date(`${from}T00:00:00`), b = new Date(`${to}T23:59:59`);
        return reservations.filter((r) => new Date(r.startTime) >= a && new Date(r.startTime) <= b && (!resourceId || String(r.resourceId) === resourceId));
    }, [reservations, from, to, resourceId]);

    const summary = useMemo(() => {
        const spanH = Math.max(1, (new Date(`${to}T23:59:59`) - new Date(`${from}T00:00:00`)) / 3600000) * (12 / 24);
        return resources.filter((r) => !resourceId || String(r.id) === resourceId).map((res) => {
            const own = rows.filter((r) => r.resourceId === res.id);
            const count = (s) => own.filter((r) => r.status === s).length;
            const hours = own.filter((r) => r.status === 'CONFIRMED').reduce((t, r) => t + (new Date(r.endTime) - new Date(r.startTime)) / 3600000, 0);
            return { name: res.name, total: own.length, confirmed: count('CONFIRMED'), pending: count('PENDING'), rejected: count('REJECTED'), cancelled: count('CANCELLED'), hours, util: Math.min(100, (hours / spanH) * 100) };
        });
    }, [rows, resources, from, to, resourceId]);

    const exportCsv = () => {
        const head = ['ID', 'Resursă', 'Utilizator', 'Început', 'Sfârșit', 'Scop', 'Status'];
        const line = (a) => a.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';');
        const body = rows.map((r) => line([r.id, r.resourceName, r.userName, fmt(r.startTime), fmt(r.endTime), r.purpose, STATUS[r.status]?.label]));
        saveBlob(new Blob(['\uFEFF' + [line(head), ...body].join('\r\n')], { type: 'text/csv;charset=utf-8' }), `raport-utilizare_${from}_${to}.csv`);
    };
    const exportPdf = () => {
        const w = window.open('', '_blank');
        if (!w) return;
        const th = (a) => `<tr>${a.map((x) => `<th>${esc(x)}</th>`).join('')}</tr>`;
        const td = (a) => `<tr>${a.map((x) => `<td>${esc(x)}</td>`).join('')}</tr>`;
        w.document.write(`<!doctype html><html lang="ro"><head><meta charset="utf-8"><title>Raport utilizare RRM</title>
<style>body{font-family:Arial,sans-serif;padding:24px;color:#1e293b}h1{font-size:20px}h2{font-size:15px;margin-top:24px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:left}th{background:#f1f5f9}</style></head><body>
<h1>Raport de utilizare — RRM Platform</h1><p>Perioadă: ${esc(from)} – ${esc(to)} · generat la ${esc(fmt(new Date()))}</p>
<h2>Sumar pe resurse</h2><table>${th(['Resursă', 'Total', 'Confirmate', 'În așteptare', 'Respinse', 'Anulate', 'Ore confirmate', 'Grad utilizare'])}
${summary.map((s) => td([s.name, s.total, s.confirmed, s.pending, s.rejected, s.cancelled, s.hours.toFixed(1), `${s.util.toFixed(0)}%`])).join('')}</table>
<h2>Detalii rezervări</h2><table>${th(['Resursă', 'Utilizator', 'Început', 'Sfârșit', 'Scop', 'Status'])}
${rows.map((r) => td([r.resourceName, r.userName, fmt(r.startTime), fmt(r.endTime), r.purpose, STATUS[r.status]?.label])).join('')}</table>
<script>window.onload=()=>window.print()</script></body></html>`);
        w.document.close();
    };

    return (
        <section aria-label="Rapoarte de utilizare" className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex flex-wrap items-end gap-4">
                <h3 className="font-bold text-slate-800 mr-auto"><i className="fa-solid fa-chart-column text-indigo-500 mr-2" aria-hidden="true"></i>Rapoarte de utilizare</h3>
                <div><label htmlFor="r-from" className={LABEL}>De la</label><input id="r-from" type="date" className={INPUT} value={from} onChange={(e) => setFrom(e.target.value)} /></div>
                <div><label htmlFor="r-to" className={LABEL}>Până la</label><input id="r-to" type="date" className={INPUT} value={to} onChange={(e) => setTo(e.target.value)} /></div>
                <div><label htmlFor="r-res" className={LABEL}>Resursă</label>
                    <select id="r-res" className={INPUT} value={resourceId} onChange={(e) => setResourceId(e.target.value)}><option value="">Toate</option>{resources.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
                <button onClick={exportCsv} className="px-4 py-2.5 text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg"><i className="fa-solid fa-file-csv mr-2" aria-hidden="true"></i>Export CSV</button>
                <button onClick={exportPdf} className="px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"><i className="fa-solid fa-file-pdf mr-2" aria-hidden="true"></i>Export PDF</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase text-slate-400 border-b border-slate-200"><tr>
                        <th className="px-3 py-2">Resursă</th><th className="px-3 py-2">Total</th><th className="px-3 py-2">Confirmate</th><th className="px-3 py-2">În așteptare</th><th className="px-3 py-2">Ore confirmate</th><th className="px-3 py-2">Grad utilizare</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                    {summary.map((s) => (
                        <tr key={s.name}><td className="px-3 py-2 font-semibold text-slate-800">{s.name}</td><td className="px-3 py-2">{s.total}</td><td className="px-3 py-2">{s.confirmed}</td><td className="px-3 py-2">{s.pending}</td><td className="px-3 py-2">{s.hours.toFixed(1)} h</td>
                            <td className="px-3 py-2 min-w-36"><div className="flex items-center gap-2"><div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${s.util}%` }}></div></div><span className="text-xs text-slate-500 w-9">{s.util.toFixed(0)}%</span></div></td></tr>
                    ))}
                    </tbody>
                </table>
            </div>
            <p className="text-xs text-slate-400">Gradul de utilizare se calculează față de un program de 12 ore pe zi.</p>
        </section>
    );
}