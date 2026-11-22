
import { useEffect, useMemo, useRef, useState } from 'react';
import { createReservation, errMsg, updateReservation } from '../api/api.js';
import { findConflict, fmt, freeSlots, INPUT, LABEL, toInput } from './ui.jsx';

export default function BookingModal({ resources, reservations, preset, onClose, onDone }) {
  const editing = preset?.reservation || null;
  const bookable = resources.filter((r) => r.status === 'ACTIVE');
  const next = new Date();
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);

  const start0 = editing ? new Date(editing.startTime) : preset?.start || next;
  const end0 = editing ? new Date(editing.endTime) : new Date(start0.getTime() + 3600000);

  const [resourceId, setResourceId] = useState(editing?.resourceId || preset?.resource?.id || bookable[0]?.id || '');
  const [start, setStart] = useState(toInput(start0));
  const [end, setEnd] = useState(toInput(end0));
  const [purpose, setPurpose] = useState(editing?.purpose || '');
  const [funded, setFunded] = useState(!!editing?.fundedProject);
  const [projectName, setProjectName] = useState(editing?.projectName || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const firstRef = useRef(null);

  const resource = resources.find((r) => r.id === Number(resourceId));

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const s = new Date(start);
  const e = new Date(end);
  const validRange = !isNaN(s) && !isNaN(e) && e > s;
  const inPast = validRange && editing == null && s.getTime() < Date.now() - 5 * 60000;

  const conflict = useMemo(
    () => (validRange ? findConflict(reservations, Number(resourceId), s, e, editing?.id) : null),
    [reservations, resourceId, start, end, editing, validRange],
  );

  const suggestions = useMemo(
    () => (conflict && validRange ? freeSlots(reservations, Number(resourceId), e - s, s, editing?.id) : []),
    [conflict, reservations, resourceId, start, end, editing, validRange],
  );

  const problem = !validRange
    ? 'Ora de sfârșit trebuie să fie după ora de început.'
    : inPast
      ? 'Nu se pot face rezervări în trecut.'
      : conflict
        ? 'Intervalul ales se suprapune cu o altă rezervare.'
        : '';

  const submit = async (ev) => {
    ev.preventDefault();
    if (problem) return;

    setError('');
    setBusy(true);

    const body = {
      resourceId: Number(resourceId),
      startTime: `${start}:00`,
      endTime: `${end}:00`,
      purpose,
      fundedProject: funded,
      projectName: funded ? projectName.trim() : null,
    };

    try {
      const res = editing
        ? await updateReservation(editing.id, body)
        : await createReservation(body);

      onDone(
        editing
          ? 'Rezervarea a fost modificată.'
          : res.status === 'PENDING'
            ? 'Cererea a fost trimisă spre aprobare.'
            : 'Rezervarea a fost confirmată.',
      );
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4" onMouseDown={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        onSubmit={submit}
        onMouseDown={(ev) => ev.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[95vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h3 id="booking-title" className="text-lg font-bold text-slate-800">
            {editing ? 'Modifică rezervarea' : resource?.requiresApproval ? 'Solicită acces' : 'Rezervare nouă'}
          </h3>
          <button type="button" aria-label="Închide" onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8">
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>

        <div>
          <label htmlFor="b-res" className={LABEL}>Resursă</label>
          <select id="b-res" ref={firstRef} className={INPUT} value={resourceId} onChange={(ev) => setResourceId(ev.target.value)} required>
            {bookable.map((r) => <option key={r.id} value={r.id}>{r.name} — {r.location}</option>)}
          </select>
          {resource?.requiresApproval && (
            <p className="text-xs text-amber-600 mt-1.5">
              <i className="fa-solid fa-shield-halved mr-1" aria-hidden="true"></i>
              Această resursă necesită aprobarea unui administrator.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="b-start" className={LABEL}>Început</label>
            <input id="b-start" type="datetime-local" className={INPUT} value={start} onChange={(ev) => setStart(ev.target.value)} required />
          </div>
          <div>
            <label htmlFor="b-end" className={LABEL}>Sfârșit</label>
            <input id="b-end" type="datetime-local" className={INPUT} value={end} onChange={(ev) => setEnd(ev.target.value)} required />
          </div>
        </div>

        <div aria-live="polite">
          {problem && (
            <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              <i className="fa-solid fa-triangle-exclamation mr-2" aria-hidden="true"></i>
              {problem}
              {conflict && (
                <div className="text-xs mt-1 text-rose-600">
                  Ocupat: {fmt(conflict.startTime)} → {fmt(conflict.endTime)}
                </div>
              )}
            </div>
          )}
          {!problem && (
            <div className="text-xs text-emerald-600">
              <i className="fa-solid fa-circle-check mr-1.5" aria-hidden="true"></i>
              Interval liber — nu există suprapuneri.
            </div>
          )}
        </div>

        {suggestions.length > 0 && (
          <div>
            <div className={LABEL}>
              <i className="fa-solid fa-wand-magic-sparkles mr-1.5 text-indigo-500" aria-hidden="true"></i>
              Sloturi libere sugerate
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((sg) => (
                <button
                  type="button"
                  key={sg.start.getTime()}
                  onClick={() => {
                    setStart(toInput(sg.start));
                    setEnd(toInput(sg.end));
                  }}
                  className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg px-3 py-1.5"
                >
                  {fmt(sg.start)} – {sg.end.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="b-purpose" className={LABEL}>Scop</label>
          <textarea
            id="b-purpose"
            rows="2"
            maxLength="500"
            className={INPUT}
            value={purpose}
            onChange={(ev) => setPurpose(ev.target.value)}
            placeholder="Ex: Teste de navigare autonomă"
          />
        </div>

        <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-3 space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-violet-800 cursor-pointer">
            <input type="checkbox" checked={funded} onChange={(ev) => setFunded(ev.target.checked)} />
            <i className="fa-solid fa-star text-violet-500" aria-hidden="true"></i>
            Proiect finanțat (prioritate la aprobare)
          </label>
          {funded && (
            <div>
              <label htmlFor="b-project" className={LABEL}>Denumire proiect</label>
              <input
                id="b-project"
                maxLength="150"
                className={INPUT}
                value={projectName}
                onChange={(ev) => setProjectName(ev.target.value)}
                placeholder="Ex: Horizon Europe — AquaBot"
              />
            </div>
          )}
        </div>

        {error && (
          <div role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">
            Renunță
          </button>
          <button disabled={busy || !!problem} className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {busy ? 'Se trimite...' : editing ? 'Salvează modificarea' : resource?.requiresApproval ? 'Trimite cererea' : 'Confirmă rezervarea'}
          </button>
        </div>
      </form>
    </div>
  );
}
