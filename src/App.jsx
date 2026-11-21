import React, { useState, useEffect } from 'react';
import './index.css';

const API_BASE_URL = '/api';

export default function App() {
  const [currentView, setCurrentView] = useState('admin-resources');
  const [apiStatus, setApiStatus] = useState({ text: 'Verificare status...', type: 'warning' });
  const [resources, setResources] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [formData, setFormData] = useState({ id: '', name: '', location: '' });

  const fakeUserData = [
    { id: 101, name: "Imprimantă 3D ProMaker", location: "Laborator B2", status: "AVAILABLE" },
    { id: 102, name: "Kit Robotică Avansat", location: "Sala 104", status: "MAINTENANCE" },
    { id: 103, name: "Osciloscop Digital Fluke", location: "Laborator A1", status: "AVAILABLE" },
    { id: 104, name: "Sală Prezentări VR", location: "Corp C - Parter", status: "AVAILABLE" }
  ];

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setApiStatus({ text: 'Se conectează...', type: 'warning' });
    try {
      const resResponse = await fetch(`${API_BASE_URL}/resources`);
      if (resResponse.ok) setResources(await resResponse.json());

      try {
        const revResponse = await fetch(`${API_BASE_URL}/reservations`);
        if (revResponse.ok) setReservations(await revResponse.json());
      } catch (e) {}

      setApiStatus({ text: 'Conectat (API Online)', type: 'success' });
    } catch (error) {
      setApiStatus({ text: 'Eroare Conexiune', type: 'error' });
      setResources([]);
      setReservations([]);
    }
  };

  const handleResourceSubmit = async (e) => {
    e.preventDefault();
    const isUpdate = formData.id !== '';
    const method = isUpdate ? 'PUT' : 'POST';
    const endpoint = isUpdate ? `${API_BASE_URL}/resources/${formData.id}` : `${API_BASE_URL}/resources`;

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          location: formData.location,
          resourceTypeId: 1,
          status: 'ACTIVE'
        })
      });

      if (response.ok) {
        setFormData({ id: '', name: '', location: '' });
        fetchAdminData();
      } else {
        alert('Eroare la salvare. Backend-ul a respins datele.');
      }
    } catch (err) {
      alert('Backend-ul nu răspunde.');
    }
  };

  const statusColors = {
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    error: 'bg-rose-100 text-rose-700 border-rose-200'
  };

  return (
      <div className="flex w-full h-full bg-slate-100">

        {/* SIDEBAR */}
        <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 shadow-xl z-10">
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <i className="fa-solid fa-cubes text-lg"></i>
            </div>
            <div>
              <h1 className="font-bold text-white text-lg tracking-wide">Platforma RRM</h1>
              <p className="text-[11px] text-indigo-400 font-semibold uppercase tracking-wider">Admin Dashboard</p>
            </div>
          </div>

          <nav className="p-4 space-y-2 flex-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-3">Administrare</div>

            <button onClick={() => setCurrentView('admin-resources')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${currentView === 'admin-resources' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <i className="fa-solid fa-server w-5 text-center"></i> Gestiune Resurse
            </button>

            <button onClick={() => setCurrentView('admin-reservations')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${currentView === 'admin-reservations' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <i className="fa-solid fa-calendar-check w-5 text-center"></i> Rezervări
            </button>

            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 mt-8 px-3">Utilizatori</div>

            <button onClick={() => setCurrentView('user-catalog')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${currentView === 'user-catalog' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <i className="fa-solid fa-compass w-5 text-center"></i> Catalog Resurse
            </button>
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">

          {/* HEADER */}
          <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between flex-shrink-0 shadow-sm z-0">
            <h2 className="text-2xl font-bold text-slate-800">
              {currentView === 'admin-resources' && 'Panou Resurse'}
              {currentView === 'admin-reservations' && 'Management Rezervări'}
              {currentView === 'user-catalog' && 'Catalog Utilizator'}
            </h2>
            <div className="flex items-center gap-4">
            <span className={`text-xs px-3 py-1.5 rounded-full font-bold border ${statusColors[apiStatus.type]}`}>
              <i className="fa-solid fa-circle text-[8px] mr-2"></i>{apiStatus.text}
            </span>
              <button onClick={fetchAdminData} className="text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-bold px-4 py-2 rounded-lg transition-colors">
                <i className="fa-solid fa-rotate mr-2"></i>Reîncarcă
              </button>
            </div>
          </header>

          {/* CONTINUT PAGINI */}
          <div className="flex-1 overflow-y-auto p-8 view-section">

            {/* ADMIN RESURSE */}
            {currentView === 'admin-resources' && (
                <div className="max-w-6xl mx-auto space-y-8">

                  {/* FORMULAR */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                      <h3 className="font-bold text-lg text-slate-800">
                        <i className="fa-solid fa-plus-circle text-indigo-500 mr-2"></i>
                        {formData.id ? 'Editează Resursa' : 'Adaugă Resursă Nouă'}
                      </h3>
                    </div>

                    <form onSubmit={handleResourceSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Denumire Echipament</label>
                          <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required placeholder="Ex: Robot industrial UR5e" className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Locație</label>
                          <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} required placeholder="Ex: Laborator Robotică" className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                        </div>
                      </div>
                      <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={() => setFormData({id: '', name: '', location: ''})} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Anulează</button>
                        <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all">Salvează în Baza de Date</button>
                      </div>
                    </form>
                  </div>

                  {/* TABEL RESURSE */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                      <h3 className="font-bold text-slate-700 text-sm"><i className="fa-solid fa-database text-indigo-400 mr-2"></i>Resurse Existente</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-white text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 w-20">ID</th>
                          <th className="px-6 py-4">Nume Resursă</th>
                          <th className="px-6 py-4">Locație</th>
                          <th className="px-6 py-4 text-right">Acțiuni</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {resources.length === 0 ? (
                            <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">Nu există resurse / Backend Offline.</td></tr>
                        ) : (
                            resources.map(res => (
                                <tr key={res.id} className="hover:bg-slate-50 transition-colors group">
                                  <td className="px-6 py-4 font-mono text-slate-400 text-xs">#{res.id}</td>
                                  <td className="px-6 py-4 font-semibold text-slate-800">{res.name}</td>
                                  <td className="px-6 py-4 text-slate-600"><i className="fa-solid fa-location-dot text-slate-300 mr-2"></i>{res.location}</td>
                                  <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => setFormData({id: res.id, name: res.name || '', location: res.location || ''})} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 rounded-lg text-xs font-bold transition-all shadow-sm">
                                      <i className="fa-solid fa-pen mr-1"></i> Editează
                                    </button>
                                  </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
            )}

            {/* ALTE PAGINI (Rezervări & User) - Am păstrat logica */}
            {currentView === 'admin-reservations' && (
                <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center text-slate-500">
                  <i className="fa-solid fa-calendar-xmark text-4xl text-slate-300 mb-3"></i>
                  <p>Endpoint-ul de rezervări nu este încă implementat în backend.</p>
                </div>
            )}

            {currentView === 'user-catalog' && (
                <div className="max-w-6xl mx-auto space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {fakeUserData.map(item => (
                        <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                          <div>
                            <h4 className="font-bold text-slate-800 text-lg mb-1">{item.name}</h4>
                            <p className="text-sm text-slate-500 mb-4"><i className="fa-solid fa-location-dot mr-2 text-indigo-400"></i>{item.location}</p>
                          </div>
                          <button className="w-full py-2.5 rounded-xl text-sm font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
                            Rezervă acum
                          </button>
                        </div>
                    ))}
                  </div>
                </div>
            )}

          </div>
        </main>
      </div>
  );
}