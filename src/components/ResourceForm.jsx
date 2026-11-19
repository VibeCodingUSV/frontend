import { useState } from 'react';
import { createResource } from '../api/api';

export default function ResourceForm({ resourceTypes, onResourceAdded }) {
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        resourceTypeId: '',
        status: 'ACTIVE'
    });
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const payload = {
                ...formData,
                resourceTypeId: parseInt(formData.resourceTypeId)
            };

            await createResource(payload);
            setFormData({ name: '', location: '', resourceTypeId: '', status: 'ACTIVE' });
            onResourceAdded();
        } catch (err) {
            console.error(err);
            setError("Eroare la creare. Verifică datele introduse.");
        }
    };

    return (
        <div className="form-container">
            <h2>Adaugă o resursă nouă</h2>
            {error && <p className="error">{error}</p>}

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Nume (ex: Robot 1)"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <input
                    type="text"
                    placeholder="Locație (ex: Sala A1)"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
                <select
                    required
                    value={formData.resourceTypeId}
                    onChange={(e) => setFormData({ ...formData, resourceTypeId: e.target.value })}
                >
                    <option value="">Alege un tip...</option>
                    {resourceTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                </select>
                <button type="submit">Adaugă</button>
            </form>
        </div>
    );
}