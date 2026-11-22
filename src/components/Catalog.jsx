import { AVAIL, gradientFor, iconForType } from './ui.jsx';

function Card({ r, onBook, onCalendar }) {
    const a = AVAIL[r.availability];
    const disabled = r.availability === 'MAINTENANCE';
    return (
        <article className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
            <div className={`relative h-44 bg-gradient-to-br ${gradientFor(r.id)}`}>
                <i className={`fa-solid ${iconForType(r.resourceTypeName)} absolute inset-0 flex items-center justify-center text-5xl text-white/30`} aria-hidden="true"></i>
                {r.imageUrl && <img src={r.imageUrl} alt={r.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />}
                <span className={`absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${a.cls}`}>
          <i className={`fa-solid ${a.icon}`} aria-hidden="true"></i>{a.label}
        </span>
                <span className="absolute bottom-3 left-3 text-[11px] font-semibold text-white bg-slate-900/70 px-2.5 py-1 rounded-md">
          <i className="fa-solid fa-location-dot mr-1.5" aria-hidden="true"></i>{r.location}
        </span>
            </div>
            <div className="p-5 flex flex-col flex-1">
                <div className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">{r.resourceTypeName}</div>
                <h3 className="font-bold text-slate-800 text-base mt-1 mb-3">{r.name}</h3>
                <ul className="space-y-1 text-xs text-slate-500 mb-5 flex-1">
                    {r.specs.map((s) => <li key={s}><i className="fa-solid fa-check text-indigo-400 mr-2" aria-hidden="true"></i>{s}</li>)}
                </ul>
                <div className="flex gap-2 pt-4 border-t border-slate-100">
                    <button disabled={disabled} onClick={() => onBook(r)}
                            className="flex-1 py-2.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors">
                        {r.requiresApproval ? <><i className="fa-solid fa-shield-halved mr-2" aria-hidden="true"></i>Solicită Acces</> : 'Rezervă Acum'}
                    </button>
                    <button title="Vezi calendarul" aria-label={`Vezi calendarul pentru ${r.name}`} onClick={() => onCalendar(r)}
                            className="w-11 rounded-lg border border-slate-200 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                        <i className="fa-regular fa-calendar" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        </article>
    );
}

export default function Catalog({ resources, types, filters, setFilters, onBook, onCalendar }) {
    const { search, type, location, onlyAvailable } = filters;
    const locations = [...new Set(resources.map((r) => r.location).filter(Boolean))].sort();
    const q = search.trim().toLowerCase();
    const shown = resources.filter((r) =>
        (!type || String(r.resourceTypeId) === type) &&
        (!location || r.location === location) &&
        (!onlyAvailable || r.availability === 'AVAILABLE') &&
        (!q || `${r.name} ${r.location} ${r.resourceTypeName} ${r.specs.join(' ')}`.toLowerCase().includes(q)));
    const reset = () => setFilters({ search: '', type: '', location: '', onlyAvailable: false });
    const sel = 'text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500';

    return (
        <div className="space-y-6">
            <section aria-label="Filtre și căutare" className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex flex-wrap items-center gap-3">
                <div className="relative w-full md:hidden">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" aria-hidden="true"></i>
                    <input aria-label="Căutare echipament sau sală" value={search} onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                           placeholder="Căutare echipament, sală..." className="w-full bg-slate-100 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <select aria-label="Categorie" className={sel} value={type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                    <option value="">Toate Categoriile</option>
                    {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <select aria-label="Locație" className={sel} value={location} onChange={(e) => setFilters({ ...filters, location: e.target.value })}>
                    <option value="">Toate Locațiile</option>
                    {locations.map((l) => <option key={l}>{l}</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 cursor-pointer">
                    <input type="checkbox" checked={onlyAvailable} onChange={(e) => setFilters({ ...filters, onlyAvailable: e.target.checked })} />
                    Afișează doar disponibile acum
                </label>
                <div className="ml-auto text-xs text-slate-500" aria-live="polite">
                    Se afișează {shown.length} resurse{' '}
                    <button onClick={reset} className="text-indigo-600 font-semibold ml-2 hover:underline">Resetează Filtre</button>
                </div>
            </section>
            {shown.length === 0 ? (
                <div className="text-center text-slate-500 py-16">Nicio resursă nu corespunde filtrelor.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {shown.map((r) => <Card key={r.id} r={r} onBook={onBook} onCalendar={onCalendar} />)}
                </div>
            )}
        </div>
    );
}