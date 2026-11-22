
import { useCallback, useEffect, useMemo, useState } from 'react';
import './index.css';
import {
  errMsg, getAuditLog, getReservations, getResources, getResourceTypes, getUsers,
  setCurrentUserId, setReservationStatus,
} from './api/api.js';
import Admin from './components/Admin.jsx';
import AuditLog from './components/AuditLog.jsx';
import BookingModal from './components/BookingModal.jsx';
import CalendarView from './components/CalendarView.jsx';
import Catalog from './components/Catalog.jsx';
import MyReservations from './components/MyReservations.jsx';
import PrivacyModal from './components/PrivacyModal.jsx';
import { displayName, fmt, isActive, isAdmin, ROLE_LABEL, ROLE_SUB } from './components/ui.jsx';

const TITLES = {
  catalog: 'Catalog Resurse & Echipamente', calendar: 'Calendar Interactiv', mine: 'Rezervările Mele',
  admin: 'Panou Administrare', audit: 'Audit Log',
};
const NO_FILTERS = { search: '', type: '', location: '', onlyAvailable: false };
const POLL_MS = 30000;

export default function App() {
  const [view, setView] = useState('catalog');
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState(null);
  const [resources, setResources] = useState([]);
  const [types, setTypes] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [audit, setAudit] = useState([]);
  const [filters, setFilters] = useState(NO_FILTERS);
  const [calendarResource, setCalendarResource] = useState(null);
  const [booking, setBooking] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [seen, setSeen] = useState(() => new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [loadError, setLoadError] = useState('');

  const user = users.find((u) => u.id === userId);
  const admin = isAdmin(user);

  const notify = useCallback((text, error = false) => {
    setToast({ text, error });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [res, rev] = await Promise.all([getResources(), getReservations('all')]);
      setResources(res); setReservations(rev); setLoadError('');
      if (admin) setAudit(await getAuditLog());
    } catch (e) { setLoadError(errMsg(e)); }
  }, [admin]);

  useEffect(() => {
    (async () => {
      try {
        const [u, t] = await Promise.all([getUsers(), getResourceTypes()]);
        setUsers(u); setTypes(t);
        const def = u.find((x) => x.fullName === 'Popescu Ion') || u[0];
        setCurrentUserId(def?.id); setUserId(def?.id ?? null);
      } catch (e) { setLoadError(errMsg(e)); }
    })();
  }, []);

  useEffect(() => { if (userId) refresh(); }, [userId, refresh]);
  // Disponibilitate în timp real: reîncărcare periodică + la revenirea în tab
  useEffect(() => {
    if (!userId) return undefined;
    const tick = () => document.visibilityState === 'visible' && refresh();
    const id = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [userId, refresh]);

  const go = (v) => { setView(v); setMenuOpen(false); setNotifOpen(false); };
  const switchUser = (id) => {
    const next = users.find((u) => u.id === Number(id));
    setCurrentUserId(next.id); setUserId(next.id); setSeen(new Set());
    if (!isAdmin(next) && (view === 'admin' || view === 'audit')) setView('catalog');
  };

  const mine = useMemo(() => reservations.filter((r) => r.userId === userId), [reservations, userId]);
  const activeMine = mine.filter((r) => isActive(r) && new Date(r.endTime) > new Date());
  const notifications = useMemo(() => {
    const soon = Date.now() + 24 * 3600000;
    if (admin) return reservations.filter((r) => r.status === 'PENDING').map((r) => ({
      id: `p${r.id}`, icon: 'fa-hourglass-half', text: `${r.userName} solicită ${r.resourceName}${r.fundedProject ? ' (proiect finanțat — prioritar)' : ''}`, sub: fmt(r.startTime), go: 'admin' }));
    return mine.flatMap((r) => {
      if (r.status === 'PENDING') return [{ id: `p${r.id}`, icon: 'fa-hourglass-half', text: `${r.resourceName}: în așteptarea aprobării`, sub: fmt(r.startTime), go: 'mine' }];
      if (r.status === 'REJECTED') return [{ id: `r${r.id}`, icon: 'fa-circle-xmark', text: `${r.resourceName}: cerere respinsă`, sub: fmt(r.startTime), go: 'mine' }];
      if (r.status === 'CANCELLED' && new Date(r.endTime) > new Date()) return [{ id: `x${r.id}`, icon: 'fa-ban', text: `${r.resourceName}: rezervare anulată`, sub: fmt(r.startTime), go: 'mine' }];
      if (r.status === 'CONFIRMED' && new Date(r.endTime) > new Date()) {
        const t = new Date(r.startTime).getTime();
        if (t <= soon) return [{ id: `c${r.id}`, icon: 'fa-bell', text: `Reminder: ${r.resourceName} ${t <= Date.now() ? 'este în desfășurare' : 'începe curând'}`, sub: fmt(r.startTime), go: 'mine' }];
        return [{ id: `k${r.id}`, icon: 'fa-circle-check', text: `${r.resourceName}: rezervare confirmată`, sub: fmt(r.startTime), go: 'mine' }];
      }
      return [];
    });
  }, [admin, reservations, mine]);
  const unseen = notifications.some((n) => !seen.has(n.id));
  const toggleNotif = () => {
    if (!notifOpen) setSeen(new Set(notifications.map((n) => n.id)));
    setNotifOpen(!notifOpen);
  };

  const cancel = async (r) => {
    if (!window.confirm(`Anulezi rezervarea pentru „${r.resourceName}”?`)) return;
    try { await setReservationStatus(r.id, 'CANCELLED'); notify('Rezervarea a fost anulată.'); await refresh(); }
    catch (e) { notify(errMsg(e), true); }
  };
  const openCalendar = (r) => { setCalendarResource(r.id); go('calendar'); };
  const bookable = resources.filter((r) => r.status === 'ACTIVE');

  const nav = [
    { id: 'catalog', icon: 'fa-cubes', label: 'Catalog Resurse' },
    { id: 'calendar', icon: 'fa-calendar-days', label: 'Calendar Interactiv' },
    { id: 'mine', icon: 'fa-bookmark', label: 'Rezervările Mele', badge: activeMine.length },
    ...(admin ? [{ id: 'admin', icon: 'fa-sliders', label: 'Panou Administrare' }, { id: 'audit', icon: 'fa-clipboard-list', label: 'Audit Log' }] : []),
  ];

  return (
    <div className="flex w-full h-full bg-slate-100">
      <a href="#continut" className="skip-link">Sari la conținut</a>
      {menuOpen && <div className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden" onClick={() => setMenuOpen(false)} aria-hidden="true"></div>}

      <aside aria-label="Meniu principal"
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 transition-transform lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><i className="fa-solid fa-microscope" aria-hidden="true"></i></div>
          <div><h1 className="font-bold text-white">RRM Platform</h1><p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Cercetare Universitară</p></div>
        </div>
        <div className="p-6">
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
            <label htmlFor="role-sim" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2"><i className="fa-solid fa-user-shield mr-1.5" aria-hidden="true"></i>Simulator rol autentificat</label>
            <select id="role-sim" value={userId || ''} onChange={(e) => switchUser(e.target.value)} className="w-full bg-slate-900 text-slate-100 text-sm rounded-lg p-2 border border-slate-700 outline-none">
              {users.map((u) => <option key={u.id} value={u.id}>{ROLE_LABEL[u.role]} ({u.fullName})</option>)}
            </select>
          </div>
        </div>
        <nav aria-label="Navigare" className="px-3 space-y-1 flex-1 overflow-y-auto">
          {nav.map((n) => (
            <button key={n.id} onClick={() => go(n.id)} aria-current={view === n.id ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${view === n.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <i className={`fa-solid ${n.icon} w-5 text-center`} aria-hidden="true"></i>{n.label}
              {n.badge > 0 && <span className="ml-auto text-[11px] bg-indigo-500/30 text-indigo-200 rounded-full px-2" aria-label={`${n.badge} active`}>{n.badge}</span>}
            </button>
          ))}
        </nav>
        <button onClick={() => setPrivacyOpen(true)} className="mx-3 mb-2 px-4 py-2 text-left text-xs text-slate-500 hover:text-slate-200 rounded-lg hover:bg-slate-800">
          <i className="fa-solid fa-user-shield w-5 mr-3 text-center" aria-hidden="true"></i>Confidențialitate &amp; GDPR
        </button>
        {user && (
          <div className="p-4 border-t border-slate-800 flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">{user.fullName.split(' ').map((p) => p[0]).slice(0, 2).join('')}</div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" title="Conectat (SSO)"></span>
            </div>
            <div className="min-w-0 flex-1"><div className="text-sm font-bold text-white truncate">{displayName(user)}</div><div className="text-xs text-slate-400 truncate">{ROLE_SUB[user.role]}</div></div>
            <button title="Schimbă utilizatorul" aria-label="Schimbă utilizatorul" onClick={() => document.getElementById('role-sim')?.focus()} className="text-slate-500 hover:text-white"><i className="fa-solid fa-key text-xs" aria-hidden="true"></i></button>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center gap-3 flex-shrink-0">
          <button className="lg:hidden w-9 h-9 text-slate-600" aria-label="Deschide meniul" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><i className="fa-solid fa-bars text-lg" aria-hidden="true"></i></button>
          <h2 className="text-base sm:text-xl font-bold text-slate-800 truncate">{TITLES[view]}</h2>
          <span className="hidden sm:inline text-[11px] bg-slate-100 text-slate-600 border border-slate-200 rounded-md px-2 py-1 whitespace-nowrap">SSO Validated</span>
          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <div className="relative hidden md:block">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" aria-hidden="true"></i>
              <input aria-label="Căutare echipament sau sală" value={filters.search} onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setView('catalog'); }}
                placeholder="Căutare echipament, sală..." className="w-64 bg-slate-100 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="relative">
              <button onClick={toggleNotif} aria-label="Notificări" aria-expanded={notifOpen} className="relative w-9 h-9 text-slate-500 hover:text-indigo-600">
                <i className="fa-regular fa-bell text-lg" aria-hidden="true"></i>
                {unseen && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full"></span>}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 max-w-[85vw] bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? <div className="p-4 text-sm text-slate-500">Nicio notificare.</div> : notifications.map((n) => (
                    <button key={n.id} onClick={() => go(n.go)} className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex gap-3">
                      <i className={`fa-solid ${n.icon} text-indigo-500 mt-0.5`} aria-hidden="true"></i>
                      <span><span className="block text-sm text-slate-800">{n.text}</span><span className="block text-xs text-slate-400">{n.sub}</span></span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setBooking({})} disabled={!bookable.length} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold px-3 sm:px-4 py-2 rounded-lg whitespace-nowrap">
              <i className="fa-solid fa-plus sm:mr-2" aria-hidden="true"></i><span className="hidden sm:inline">Rezervare Rapidă</span><span className="sr-only sm:hidden">Rezervare Rapidă</span>
            </button>
          </div>
        </header>

        <div id="continut" tabIndex="-1" className="flex-1 overflow-y-auto p-4 sm:p-6 view-section" key={view}>
          {loadError && (
            <div role="alert" className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-3 flex items-center gap-3">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>{loadError}
              <button onClick={refresh} className="ml-auto font-bold underline">Reîncearcă</button>
            </div>
          )}
          <div>
            {view === 'catalog' && <Catalog resources={resources} types={types} filters={filters} setFilters={setFilters} onBook={(r) => setBooking({ resource: r })} onCalendar={openCalendar} />}
            {view === 'calendar' && <CalendarView resources={bookable} reservations={reservations} resourceId={calendarResource} setResourceId={setCalendarResource} userId={userId}
              onSlot={(rid, start) => setBooking({ resource: resources.find((r) => r.id === rid), start })} onOpen={(r) => setBooking({ reservation: r })} />}
            {view === 'mine' && <MyReservations mine={mine} all={reservations} resources={resources} admin={admin} onCancel={cancel} onEdit={(r) => setBooking({ reservation: r })} />}
            {view === 'admin' && admin && <Admin resources={resources} types={types} reservations={reservations} onChange={refresh} notify={notify} />}
            {view === 'audit' && admin && <AuditLog entries={audit} />}
          </div>
        </div>
      </main>

      {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
      {booking && (
        <BookingModal resources={resources} reservations={reservations} preset={booking} onClose={() => setBooking(null)}
          onDone={(msg) => { setBooking(null); notify(msg); refresh(); }} />
      )}
      <div aria-live="polite" role="status">
        {toast && <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${toast.error ? 'bg-rose-600' : 'bg-emerald-600'}`}>{toast.text}</div>}
      </div>
    </div>
  );
}
