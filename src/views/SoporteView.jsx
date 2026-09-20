import React, { useState, useEffect, useCallback } from 'react';
import { soporteService } from '../services/soporteService';

// Helper para alertas sonoras sintetizadas (Web Audio API)
const playNotificationSound = (type = 'info') => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'support') {
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
    } else {
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
    }

    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.3);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    console.error("Audio API error:", e);
  }
};

// Helper para exportar/compartir un ticket por WhatsApp
const enviarTicketWhatsApp = (ticket) => {
  const remitente = ticket.empleados 
    ? `${ticket.empleados.nombre || ''} ${ticket.empleados.apellido || ''}`.trim() 
    : 'Empleado';

  const texto = 
    `📣 *ORBIT Logística - Ticket de Soporte*\n\n` +
    `• *Tipo:* ${ticket.tipo}\n` +
    `• *Asunto:* ${ticket.asunto}\n` +
    `• *De:* ${remitente}\n` +
    `• *Estado:* ${ticket.estado}\n` +
    `• *Mensaje:* ${ticket.mensaje}\n` +
    (ticket.respuesta_admin ? `• *Respuesta Admin:* ${ticket.respuesta_admin}\n` : '') +
    `\n_Gestionado desde ORBIT Logística_`;

  const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
  window.open(url, '_blank');
};

export function SoporteView({ usuarioActual }) {
  const [tipo, setTipo] = useState('Consulta');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [respuestaAdmin, setRespuestaAdmin] = useState({});

  const esAdmin = usuarioActual?.rol === 'ADMIN';

  const cargarTickets = useCallback(async () => {
    if (!usuarioActual?.id) return;
    setCargando(true);
    try {
      if (esAdmin) {
        const data = await soporteService.obtenerTodosLosTickets();
        setTickets(data || []);
      } else {
        const data = await soporteService.obtenerMisTickets(usuarioActual.id);
        setTickets(data || []);
      }
    } catch (err) {
      console.error("Error al cargar tickets:", err.message);
    } finally {
      setCargando(false);
    }
  }, [usuarioActual, esAdmin]);

  useEffect(() => {
    cargarTickets();
  }, [cargarTickets]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!asunto.trim() || !mensaje.trim()) {
      return alert('Completa todos los campos obligatorios.');
    }

    try {
      await soporteService.crearTicket({
        empleadoId: usuarioActual.id,
        tipo,
        asunto,
        mensaje
      });
      playNotificationSound('support'); // Reproduce sonido al enviar
      alert('Ticket enviado con éxito al Administrador.');
      setAsunto('');
      setMensaje('');
      cargarTickets();
    } catch (err) {
      alert('Error al enviar ticket: ' + err.message);
    }
  };

  const handleResponder = async (ticketId) => {
    const resp = respuestaAdmin[ticketId];
    if (!resp || !resp.trim()) return alert('Escribe una respuesta válida.');

    try {
      await soporteService.responderTicket(ticketId, 'Resuelto', resp);
      playNotificationSound('info'); // Reproduce sonido al responder
      alert('Respuesta enviada.');
      setRespuestaAdmin(prev => ({ ...prev, [ticketId]: '' }));
      cargarTickets();
    } catch (err) {
      alert('Error al responder ticket: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '20px', color: '#fff' }}>
      <h2>📣 Avisos y Soporte Técnico</h2>

      {!esAdmin && (
        <form onSubmit={handleSubmit} style={{ background: '#1b2234', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>Enviar Petición o Consulta al Admin</h3>
          
          <div style={{ marginBottom: '10px' }}>
            <label>Tipo: </label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ padding: '5px', borderRadius: '4px' }}>
              <option value="Consulta">Consulta</option>
              <option value="Petición">Petición</option>
              <option value="Queja">Queja</option>
            </select>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Asunto"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <textarea
              placeholder="Detalla tu mensaje..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows="4"
              style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
            />
          </div>

          <button type="submit" style={{ background: '#059669', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Enviar al Admin
          </button>
        </form>
      )}

      <h3>{esAdmin ? '📥 Peticiones Recibidas' : '📋 Mis Envíos'}</h3>

      {cargando ? (
        <p>Cargando tickets...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tickets.length === 0 && <p>No hay mensajes registrados.</p>}
          {tickets.map((t) => (
            <div key={t.id} style={{ background: '#121824', padding: '15px', borderRadius: '8px', borderLeft: `4px solid ${t.estado === 'Resuelto' ? '#059669' : '#f59e0b'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>[{t.tipo}] {t.asunto}</strong>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', background: t.estado === 'Resuelto' ? '#059669' : '#f59e0b', padding: '2px 8px', borderRadius: '4px' }}>
                    {t.estado}
                  </span>
                  <button 
                    onClick={() => enviarTicketWhatsApp(t)} 
                    style={{ background: '#25D366', color: 'white', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                    title="Compartir por WhatsApp"
                  >
                    📲 WhatsApp
                  </button>
                </div>
              </div>

              {esAdmin && (
                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                  Por: {t.empleados ? `${t.empleados.nombre || ''} ${t.empleados.apellido || ''}`.trim() : 'Desconocido'} ({t.empleados?.email || 'Sin email'})
                </p>
              )}

              <p style={{ marginTop: '8px' }}>{t.mensaje}</p>

              {t.respuesta_admin && (
                <div style={{ background: '#1b2234', padding: '8px', marginTop: '10px', borderRadius: '4px', borderLeft: '3px solid #2563eb' }}>
                  <strong>Respuesta Admin:</strong> {t.respuesta_admin}
                </div>
              )}

              {esAdmin && t.estado !== 'Resuelto' && (
                <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Escribir respuesta..."
                    value={respuestaAdmin[t.id] || ''}
                    onChange={(e) => setRespuestaAdmin({ ...respuestaAdmin, [t.id]: e.target.value })}
                    style={{ flex: 1, padding: '5px', borderRadius: '4px' }}
                  />
                  <button onClick={() => handleResponder(t.id)} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                    Responder y Resolver
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SoporteView;