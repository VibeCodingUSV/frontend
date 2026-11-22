import { useState } from 'react';
import { archiveResource, createResource, errMsg, setReservationStatus, updateResource } from '../api/api.js';
import Reports from './Reports.jsx';
import { AVAIL, FundedBadge, fmt, INPUT, LABEL } from './ui.jsx';

const EMPTY = { id: '', name: '', description: '', resourceTypeId: '', location: '', status: 'ACTIVE', requiresApproval: false, imageUrl: '', specs: '' };

export default function Admin({ resources, types, reservations, onChange, notify }) {
    const [form, setForm] = useState(EMPTY);
    const pending = reservations.filter((r) => r.status === 'PENDING')
        .sort((a, b) => (b.fundedProject - a.fundedProject) || (new Date(a.startTime) - new Date(b.startTime)));
    const run = async (fn, okMsg) => {
        try { await fn(); notify(okMsg); await onChange(); } catch (e) { notify(errMsg(e), true); }
    };
    const save = (e) => {
        e.preventDefault();
        const body = {
            name: form.name, description: form.description, resourceTypeId: Number(form.resourceTypeId || types[0]?.id),
            location: form.location, status: form.status, requiresApproval: form.requiresApproval,
            imageUrl: form.imageUrl, specs: form.specs.split('\n').map((s) => s.trim()).filter(Boolean).join('|'),
        };
        run(async () => { form.id ? await updateResource(form.id, body) : await createResource(body); setForm(EMPTY); },
            form.id ? 'Resursa a fost actualizată.' : 'Resursa a fost adăugată.');
    };
    const toggleMaintenance = (r) => run(() => updateResource(r.id, {
        name: r.name, description: r.description || '', resourceTypeId: r.resourceTypeId, location: r.location || '',
        status: r.status === 'MAINTENANCE' ? 'ACTIVE' : 'MAINTENANCE', requiresApproval: r.requiresApproval,
        imageUrl: r.imageUrl || '', specs: r.specs.join('|'),
    }), r.status === 'MAINTENANCE' ? 'Resursa a fost deblocată.' : 'Resursa a fost blocată pentru mentenanță.');
    const edit = (r) => { setForm({ ...EMPTY, ...r, description: r.description || '', location: r.location || '', imageUrl: r.imageUrl || '', specs: r.specs.join('\n') }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    const inp = INPUT;
    const lbl = LABEL;
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-sm">
                    <i className="fa-solid fa-hourglass-half text-amber-500 mr-2"></i>Cereri în așteptare ({pending.length}) <span className="ml-2 text-xs font-normal text-slate-400">proiectele finanțate sunt afișate primele</span>
                </div>
                {pending.length === 0 ? <div className="p-6 text-sm text-slate-500">Nicio cerere de aprobat.</div> : (
                    <div className="divide-y divide-slate-100">
                        {pending.map((r) => (
                            <div key={r.id} className="px-5 py-3 flex flex-wrap items-center gap-3 text-sm">
                                <div className="flex-1 min-w-60">
                                    <div className="font-semibold text-slate-800">{r.resourceName} {r.fundedProject && <FundedBadge name={r.projectName} />}</div>
                                    <div className="text-slate-500">{r.userName} · {fmt(r.startTime)} → {fmt(r.endTime)}</div>
                                    {r.purpose && <div className="text-xs text-slate-400">{r.purpose}</div>}
                                </div>
                                <button onClick={() => run(() => setReservationStatus(r.id, 'CONFIRMED'), 'Cererea a fost aprobată.')} className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">Aprobă</button>
                                <button onClick={() => run(() => setReservationStatus(r.id, 'REJECTED'), 'Cererea a fost respinsă.')} className="px-4 py-2 text-xs font-bold text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50">Respinge</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <form onSubmit={save} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h3 className="font-bold text-slate-800"><i className="fa-solid fa-plus-circle text-indigo-500 mr-2"></i>{form.id ? 'Editează resursa' : 'Adaugă resursă nouă'}</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div><label htmlFor="a-name" className={lbl}>Denumire</label><input id="a-name" required className={inp} value={form.name} onChange={set('name')} /></div>
                    <div><label htmlFor="a-loc" className={lbl}>Locație</label><input id="a-loc" className={inp} value={form.location} onChange={set('location')} placeholder="Ex: Corp A - Subsol" /></div>
                    <div><label htmlFor="a-cat" className={lbl}>Categorie</label>
                        <select id="a-cat" className={inp} value={form.resourceTypeId || types[0]?.id || ''} onChange={set('resourceTypeId')}>{types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                    <div><label htmlFor="a-status" className={lbl}>Status</label>
                        <select id="a-status" className={inp} value={form.status} onChange={set('status')}><option value="ACTIVE">Activă</option><option value="MAINTENANCE">Mentenanță</option></select></div>
                    <div className="md:col-span-2"><label htmlFor="a-img" className={lbl}>URL imagine (opțional)</label><input id="a-img" className={inp} value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://..." /></div>
                    <div className="md:col-span-2"><label htmlFor="a-desc" className={lbl}>Descriere</label><input id="a-desc" className={inp} value={form.description} onChange={set('description')} /></div>
                    <div className="md:col-span-2"><label htmlFor="a-specs" className={lbl}>Specificații (câte una pe linie)</label><textarea id="a-specs" rows="3" className={inp} value={form.specs} onChange={set('specs')} /></div>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.requiresApproval} onChange={set('requiresApproval')} />Necesită aprobare administrator</label>
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setForm(EMPTY)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Resetează</button>
                    <button className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Salvează</button>
                </div>
            </form>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase text-slate-400 border-b border-slate-200"><tr><th className="px-5 py-3">Resursă</th><th className="px-5 py-3">Locație</th><th className="px-5 py-3">Status</th><th className="px-5 py-3"></th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                    {resources.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                            <td className="px-5 py-3"><div className="font-semibold text-slate-800">{r.name}</div><div className="text-xs text-slate-400">{r.resourceTypeName}{r.requiresApproval && ' · cu aprobare'}</div></td>
                            <td className="px-5 py-3 text-slate-600">{r.location}</td>
                            <td className="px-5 py-3"><span className={`text-xs font-bold px-2.5 py-1 rounded-full ${AVAIL[r.availability].cls}`}>{AVAIL[r.availability].label}</span></td>
                            <td className="px-5 py-3 text-right space-x-2">
                                <button onClick={() => toggleMaintenance(r)} className="px-3 py-1.5 text-xs font-bold text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-50"><i className="fa-solid fa-wrench mr-1.5" aria-hidden="true"></i>{r.status === 'MAINTENANCE' ? 'Deblochează' : 'Blochează'}</button>
                                <button onClick={() => edit(r)} className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600">Editează</button>
                                <button onClick={() => window.confirm(`Arhivezi „${r.name}"?`) && run(() => archiveResource(r.id), 'Resursa a fost arhivată.')} className="px-3 py-1.5 text-xs font-bold text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50">Arhivează</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            <Reports reservations={reservations} resources={resources} />
        </div>
    );
}