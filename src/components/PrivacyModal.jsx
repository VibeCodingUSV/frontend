
import { useEffect, useState } from 'react';
import { errMsg, getMyData } from '../api/api.js';
import { saveBlob } from './ui.jsx';

export default function PrivacyModal({ onClose }) {
  const [err, setErr] = useState('');
  const exportData = async () => {
    try {
      setErr('');
      const data = await getMyData();
      saveBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), 'datele-mele-rrm.json');
    } catch (e) { setErr(errMsg(e)); }
  };
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="privacy-title" onMouseDown={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 id="privacy-title" className="text-lg font-bold text-slate-800"><i className="fa-solid fa-user-shield text-indigo-500 mr-2" aria-hidden="true"></i>Confidențialitate &amp; GDPR</h3>
          <button type="button" aria-label="Închide" onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8"><i className="fa-solid fa-xmark" aria-hidden="true"></i></button>
        </div>
        <ul className="space-y-3 text-sm text-slate-600">
          <li><b className="text-slate-800">Ce date prelucrăm.</b> Numele, rolul și adresa de e-mail instituțională (furnizate prin SSO), precum și rezervările făcute (resursă, interval, scop, proiect).</li>
          <li><b className="text-slate-800">De ce.</b> Exclusiv pentru administrarea resurselor de cercetare ale universității: rezervări, aprobări, notificări și rapoarte de utilizare.</li>
          <li><b className="text-slate-800">Cine vede datele.</b> Ceilalți utilizatori văd doar faptul că un interval este ocupat; numele și scopul rezervării sunt vizibile doar proprietarului și administratorilor.</li>
          <li><b className="text-slate-800">Trasabilitate.</b> Acțiunile importante sunt înregistrate în Audit Log, accesibil doar administratorilor.</li>
          <li><b className="text-slate-800">Drepturile tale.</b> Poți solicita acces, rectificare sau ștergerea datelor către responsabilul cu protecția datelor al universității.</li>
        </ul>
        {err && <div role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{err}</div>}
        <div className="flex justify-between gap-3">
          <button onClick={exportData} className="px-4 py-2.5 text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg"><i className="fa-solid fa-file-arrow-down mr-2" aria-hidden="true"></i>Descarcă datele mele</button>
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Am înțeles</button>
        </div>
      </div>
    </div>
  );
}
