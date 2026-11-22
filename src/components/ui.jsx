
export const ROLE_LABEL = {
    RESEARCHER: 'Cercetător', PROFESSOR: 'Profesor', LAB_ADMIN: 'Admin Laborator', SYSTEM_ADMIN: 'Admin Sistem',
};
export const ROLE_SUB = {
    RESEARCHER: 'Cercetător Postdoc', PROFESSOR: 'Profesor Universitar', LAB_ADMIN: 'Administrator Laborator', SYSTEM_ADMIN: 'Administrator Sistem',
};
export const isAdmin = (u) => u && (u.role === 'LAB_ADMIN' || u.role === 'SYSTEM_ADMIN');
export const displayName = (u) => (u ? `${u.role === 'RESEARCHER' || u.role === 'PROFESSOR' ? 'Dr. ' : ''}${u.fullName}` : '');

export const fmt = (s) =>
    s ? new Date(s).toLocaleString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
export const fmtTime = (s) => new Date(s).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
const p2 = (n) => String(n).padStart(2, '0');
export const toInput = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
export const dayKey = (d) => toInput(new Date(d)).slice(0, 10);

export const ACTIVE = ['PENDING', 'CONFIRMED'];
export const isActive = (r) => ACTIVE.includes(r.status);
export const overlaps = (aStart, aEnd, bStart, bEnd) => new Date(aStart) < new Date(bEnd) && new Date(aEnd) > new Date(bStart);

/** Rezervarea (activă) care se suprapune cu intervalul cerut, excluzând rezervarea editată. */
export const findConflict = (reservations, resourceId, start, end, ignoreId) =>
    reservations.find((r) => r.resourceId === resourceId && r.id !== ignoreId && isActive(r) && overlaps(start, end, r.startTime, r.endTime));

/** Sugestii inteligente: următoarele sloturi libere (08:00–20:00) de aceeași durată. */
export function freeSlots(reservations, resourceId, durationMs, from, ignoreId, count = 3) {
    const out = [];
    const busy = reservations.filter((r) => r.resourceId === resourceId && r.id !== ignoreId && isActive(r));
    const c = new Date(Math.max(from.getTime(), Date.now()));
    if (c.getMinutes() || c.getSeconds() || c.getMilliseconds()) { c.setMinutes(0, 0, 0); c.setHours(c.getHours() + 1); }
    for (let i = 0; i < 24 * 21 && out.length < count; i++, c.setHours(c.getHours() + 1)) {
        const end = new Date(c.getTime() + durationMs);
        const inHours = c.getHours() >= 8 && dayKey(end) === dayKey(c) && (end.getHours() < 20 || (end.getHours() === 20 && end.getMinutes() === 0));
        if (inHours && !busy.some((r) => overlaps(c, end, r.startTime, r.endTime))) out.push({ start: new Date(c), end });
    }
    return out;
}

const icsDate = (d) => { const x = new Date(d); return `${x.getFullYear()}${p2(x.getMonth() + 1)}${p2(x.getDate())}T${p2(x.getHours())}${p2(x.getMinutes())}00`; };
export const googleCalUrl = (r, location = '') =>
    `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(r.resourceName)}&dates=${icsDate(r.startTime)}/${icsDate(r.endTime)}&details=${encodeURIComponent(r.purpose || 'Rezervare RRM')}&location=${encodeURIComponent(location)}`;
export function downloadICS(r, location = '') {
    const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//RRM Platform//RO', 'BEGIN:VEVENT', `UID:rrm-${r.id}@usv.ro`,
        `DTSTAMP:${icsDate(new Date())}`, `DTSTART:${icsDate(r.startTime)}`, `DTEND:${icsDate(r.endTime)}`,
        `SUMMARY:${r.resourceName}`, `DESCRIPTION:${(r.purpose || 'Rezervare RRM').replace(/\n/g, ' ')}`, `LOCATION:${location}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    saveBlob(new Blob([body], { type: 'text/calendar' }), `rezervare-${r.id}.ics`);
}
export function saveBlob(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export const STATUS = {
    PENDING: { label: 'În așteptare', cls: 'bg-amber-100 text-amber-700', block: 'bg-amber-100 border-amber-400 text-amber-800' },
    CONFIRMED: { label: 'Confirmată', cls: 'bg-emerald-100 text-emerald-700', block: 'bg-indigo-100 border-indigo-500 text-indigo-800' },
    REJECTED: { label: 'Respinsă', cls: 'bg-rose-100 text-rose-700' },
    CANCELLED: { label: 'Anulată', cls: 'bg-slate-200 text-slate-600' },
};
export const StatusChip = ({ status }) => (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS[status]?.cls}`}>{STATUS[status]?.label || status}</span>
);

const GRADIENTS = ['from-indigo-500 to-violet-600', 'from-sky-500 to-indigo-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-rose-500', 'from-fuchsia-500 to-purple-600'];
export const gradientFor = (id) => GRADIENTS[id % GRADIENTS.length];
export const iconForType = (name = '') => {
    const n = name.toLowerCase();
    if (n.includes('robo')) return 'fa-robot';
    if (n.includes('săli') || n.includes('sali')) return 'fa-building-columns';
    if (n.includes('proto')) return 'fa-cube';
    return 'fa-microscope';
};

export const AVAIL = {
    AVAILABLE: { label: 'Disponibil', cls: 'bg-emerald-100 text-emerald-700', icon: 'fa-circle-check' },
    BUSY: { label: 'Ocupat', cls: 'bg-rose-100 text-rose-700', icon: 'fa-circle-xmark' },
    MAINTENANCE: { label: 'Mentenanță', cls: 'bg-amber-100 text-amber-700', icon: 'fa-wrench' },
};

export const INPUT = 'w-full bg-slate-50 border border-slate-300 text-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500';
export const LABEL = 'block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5';

export const FundedBadge = ({ name }) => (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 whitespace-nowrap" title="Proiect finanțat — prioritate la aprobare">
    <i className="fa-solid fa-star" aria-hidden="true"></i>{name || 'Proiect finanțat'}
  </span>
);

export const Empty = ({ icon = 'fa-inbox', text }) => (
    <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
        <i className={`fa-solid ${icon} text-4xl text-slate-300 mb-3`} aria-hidden="true"></i>
        <p>{text}</p>
    </div>
);