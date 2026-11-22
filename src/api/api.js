import axios from 'axios';

let currentUserId = null;
export const setCurrentUserId = (id) => { currentUserId = id; };

export const api = axios.create({ baseURL: '/api', headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use((config) => {
    if (currentUserId) config.headers['X-User-Id'] = currentUserId;
    return config;
});

export const errMsg = (e) =>
    e?.response?.data?.detail || (e?.response ? 'Cererea a fost respinsă de server.' : 'Serverul nu răspunde.');

export const getUsers = () => api.get('/users').then((r) => r.data);
export const getResources = () => api.get('/resources').then((r) => r.data);
export const getResourceTypes = () => api.get('/resource-types').then((r) => r.data);
export const createResource = (d) => api.post('/resources', d).then((r) => r.data);
export const updateResource = (id, d) => api.put(`/resources/${id}`, d).then((r) => r.data);
export const archiveResource = (id) => api.delete(`/resources/${id}`);
export const getReservations = (scope = 'all') => api.get('/reservations', { params: { scope } }).then((r) => r.data);
export const createReservation = (d) => api.post('/reservations', d).then((r) => r.data);
export const setReservationStatus = (id, status) =>
    api.patch(`/reservations/${id}/status`, { status }).then((r) => r.data);
export const getMyData = () => api.get('/users/me/export').then((r) => r.data);
export const getAuditLog = () => api.get('/audit-log').then((r) => r.data);
export const updateReservation = (id, d) => api.put(`/reservations/${id}`, d).then((r) => r.data);