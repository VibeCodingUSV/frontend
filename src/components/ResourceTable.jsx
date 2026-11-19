import { updateResource } from '../api/api';

export default function ResourceTable({ resources, onResourceUpdated }) {

    const handleMaintenance = async (resource) => {
        const newStatus = resource.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE';

        try {
            const payload = {
                name: resource.name,
                location: resource.location,
                resourceTypeId: resource.resourceType ? resource.resourceType.id : 1,
                status: newStatus
            };

            await updateResource(resource.id, payload);
            onResourceUpdated();
        } catch (err) {
            alert("Eroare la actualizare. Verifică consola.");
            console.error(err);
        }
    };

    return (
        <div className="table-container">
            <h2>Lista Resurselor</h2>
            <table>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Nume</th>
                    <th>Locație</th>
                    <th>Tip</th>
                    <th>Status</th>
                    <th>Acțiuni</th>
                </tr>
                </thead>
                <tbody>
                {resources.length === 0 ? (
                    <tr><td colSpan="6" className="empty">Nu există resurse.</td></tr>
                ) : (
                    resources.map(res => (
                        <tr key={res.id}>
                            <td>{res.id}</td>
                            <td>{res.name}</td>
                            <td>{res.location}</td>
                            <td>{res.resourceType ? res.resourceType.name : 'Nespecificat'}</td>
                            <td>
                  <span className={`status ${res.status === 'ACTIVE' ? 'active' : 'maintenance'}`}>
                    {res.status}
                  </span>
                            </td>
                            <td>
                                <button onClick={() => handleMaintenance(res)}>
                                    {res.status === 'ACTIVE' ? 'Trimite în Mentenanță' : 'Readu în Uz'}
                                </button>
                            </td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>
    );
}