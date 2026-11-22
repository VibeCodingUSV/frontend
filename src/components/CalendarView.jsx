
import { useState } from 'react';
import { dayKey, fmtTime, isActive, STATUS } from './ui.jsx';

const DAYS = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];
const START_H = 7, END_H = 21, HOUR_PX = 44;
const HOURS = Array.from({ length: END_H - START_H }, (_, i) => START_H + i);

export default function CalendarView({
  resources,
  reservations,
  resourceId,
  setResourceId,
  onSlot,
  onOpen,
  userId
}) {
  const [offset, setOffset] = useState(0);

  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) + offset * 7);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });

  const today = dayKey(new Date());
  const rid = Number(resourceId) || resources[0]?.id;
  const items = reservations.filter(
    (r) => r.resourceId === rid && isActive(r)
  );
  const now = new Date();

  const title = `${days[0].toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short'
  })} – ${days[6].toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })}`;

  const btn =
    'w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-indigo-50';

  const px = (date) =>
    Math.min(
      Math.max(
        (date.getHours() + date.getMinutes() / 60 - START_H) * HOUR_PX,
        0
      ),
      (END_H - START_H) * HOUR_PX
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="cal-resource">
          Resursă
        </label>

        <select
          id="cal-resource"
          value={rid || ''}
          onChange={(e) => setResourceId(Number(e.target.value))}
          className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 max-w-full"
        >
          {resources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <i className="w-3 h-3 rounded bg-indigo-100 border border-indigo-500"></i>
            Confirmat
          </span>

          <span className="flex items-center gap-1.5">
            <i className="w-3 h-3 rounded bg-amber-100 border border-amber-400"></i>
            În așteptare
          </span>

          <span className="flex items-center gap-1.5">
            <i className="w-3 h-3 rounded bg-white border border-slate-300"></i>
            Liber
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            aria-label="Săptămâna anterioară"
            className={btn}
            onClick={() => setOffset(offset - 1)}
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
          </button>

          <span
            className="text-sm font-semibold text-slate-700 min-w-44 text-center"
            aria-live="polite"
          >
            {title}
          </span>

          <button
            aria-label="Săptămâna următoare"
            className={btn}
            onClick={() => setOffset(offset + 1)}
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
          </button>

          <button
            className="text-sm font-bold text-indigo-600 px-3 h-9 rounded-lg bg-indigo-50 hover:bg-indigo-100"
            onClick={() => setOffset(0)}
          >
            Azi
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-slate-200 bg-slate-50">
            <div></div>

            {days.map((d, i) => (
              <div
                key={i}
                className={`py-2 text-center border-l border-slate-200 ${
                  dayKey(d) === today ? 'bg-indigo-50' : ''
                }`}
              >
                <div className="text-[11px] font-bold text-slate-500 uppercase">
                  {DAYS[i]}
                </div>

                <div
                  className={`text-sm font-bold ${
                    dayKey(d) === today
                      ? 'text-indigo-600'
                      : 'text-slate-800'
                  }`}
                >
                  {d.getDate()}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[56px_repeat(7,1fr)]">
            <div>
              {HOURS.map((h, i) => (
                <div
                  key={h}
                  style={{ height: HOUR_PX }}
                  className={`text-[11px] text-slate-400 text-right pr-2 ${
                    i ? '-mt-2' : ''
                  }`}
                >
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {days.map((d) => {
              const key = dayKey(d);

              const dayStart = new Date(d);
              dayStart.setHours(0, 0, 0, 0);

              const dayEnd = new Date(d);
              dayEnd.setHours(23, 59, 59, 999);

              const list = items.filter(
                (r) =>
                  new Date(r.startTime) <= dayEnd &&
                  new Date(r.endTime) >= dayStart
              );

              return (
                <div
                  key={key}
                  className={`relative border-l border-slate-200 ${
                    key === today ? 'bg-indigo-50/30' : ''
                  }`}
                  style={{ height: HOURS.length * HOUR_PX }}
                >
                  {HOURS.map((h) => {
                    const slot = new Date(d);
                    slot.setHours(h, 0, 0, 0);

                    const past =
                      slot.getTime() + 3600000 < Date.now();

                    return (
                      <button
                        key={h}
                        disabled={past}
                        style={{ height: HOUR_PX }}
                        onClick={() => onSlot(rid, slot)}
                        aria-label={`Rezervă ${d.toLocaleDateString(
                          'ro-RO',
                          {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          }
                        )} la ${String(h).padStart(2, '0')}:00`}
                        className="block w-full border-t border-slate-100 hover:bg-indigo-50 disabled:bg-slate-50/70 disabled:cursor-not-allowed group"
                      >
                        <i
                          className="fa-solid fa-plus text-[10px] text-indigo-300 opacity-0 group-hover:opacity-100"
                          aria-hidden="true"
                        ></i>
                      </button>
                    );
                  })}

                  {list.map((r) => {
                    const s =
                      new Date(r.startTime) < dayStart
                        ? dayStart
                        : new Date(r.startTime);

                    const e =
                      new Date(r.endTime) > dayEnd
                        ? dayEnd
                        : new Date(r.endTime);

                    const top = px(s);
                    const height = Math.max(px(e) - top, 20);
                    const mine = r.userId === userId;

                    return (
                      <button
                        key={r.id}
                        onClick={() => mine && onOpen?.(r)}
                        style={{ top, height }}
                        title={r.purpose || ''}
                        className={`absolute left-1 right-1 rounded-md border-l-4 px-1.5 py-1 text-left overflow-hidden text-[11px] leading-tight ${
                          STATUS[r.status].block
                        } ${
                          mine
                            ? 'ring-1 ring-indigo-400 cursor-pointer'
                            : 'cursor-default'
                        }`}
                      >
                        <div className="font-bold">
                          {fmtTime(r.startTime)} – {fmtTime(r.endTime)}
                        </div>

                        <div className="truncate">
                          {mine ? 'Rezervarea mea' : r.userName || 'Rezervat'}
                        </div>
                      </button>
                    );
                  })}

                  {key === today &&
                    now.getHours() >= START_H &&
                    now.getHours() < END_H && (
                      <div
                        className="absolute left-0 right-0 border-t-2 border-rose-500 pointer-events-none"
                        style={{ top: px(now) }}
                      ></div>
                    )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        <i className="fa-solid fa-rotate mr-1" aria-hidden="true"></i>
        Disponibilitatea se actualizează automat la fiecare 30 de secunde.
      </p>
    </div>
  );
}
