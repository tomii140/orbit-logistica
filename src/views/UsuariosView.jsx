import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';

export default function SoporteView({ usuarioActual }) {
  const [tickets, setTickets] = useState([]);
  const [asunto, setAsunto] = useState('');
  const [tipo, setTipo] = useState('Consulta');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);

  const esGestionador = ['ADMIN', 'SUPERVISOR'].includes(usuarioActual?.rol?.toUpperCase());

  const cargarTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('soporte_tickets')
        .select('*, empleados(nombre, apellido, email)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al cargar tickets:', error.message);
      } else {
        setTickets(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTickets();

    const channel = supabase
      .channel('tabla_soporte_tickets')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'soporte_tickets' },
        () => cargarTickets()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const crearTicket = async (e) => {
    e.preventDefault();
    if (!asunto.trim() || !mensaje.trim()) return;

    // Obtener ID del empleado
    const { data: emp } = await supabase
      .from('empleados')
      .select('id')
      .eq('email', usuarioActual.email)
      .single();

    if (!emp) return alert('Empleado no encontrado en el sistema.');

    const payload = {
      empleado_id: emp.id,
      tipo,
      asunto: asunto.trim(),
      mensaje: mensaje.trim(),
      estado: 'Pendiente'
    };

    const { error } = await supabase.from('soporte_tickets').insert([payload]);

    if (error) {
      alert(`Error al enviar ticket: ${error.message}`);
    } else {
      setAsunto('');
      setMensaje('');
      cargarTickets();
    }
  };

  const responderTicket = async (id, respuesta) => {
    if (!respuesta.trim()) return;
    const { error } = await supabase
      .from('soporte_tickets')
      .update({ respuesta_admin: respuesta, estado: 'Resuelto' })
      .eq('id', id);

    if (error) alert(`Error al responder: ${error.message}`);
    else cargarTickets();
  };

  return (
    <div style={{ padding: '20px', color: '#fff', maxWidth: '900px', margin: '0 auto' }}>
      <h2>📣 Soporte y Tickets</h2>
      <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>
        Plataforma de comunicación con administración para solicitudes, reclamos y soporte técnico.
      </p>

      {/* Formulario de Alta de Ticket */}
      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', color: '#38bdf8', marginTop: 0 }}>Crear Nuevo Ticket</h3>
        <form onSubmit={crearTicket} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select 
              value={tipo} 
              onChange={(e) => setTipo(e.target.value)}
              style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '4px' }}
            >
              <option value="Consulta">Consulta General</option>
              <option value="Inconveniente">Inconveniente Técnico</option>
              <option value="Reclamo">Reclamo / Horarios</option>
            </select>
            <input
              type="text"
              placeholder="Asunto"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              style={{ flex: 1, backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '4px' }}
              required
            />
          </div>
          <textarea
            placeholder="Escribe el detalle de tu solicitud..."
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '4px', minHeight: '70px', resize: 'vertical' }}
            required
          />
          <button type="submit" style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-end' }}>
            Enviar Ticket
          </button>
        </form>
      </div>

      {/* Lista de Tickets */}
      <div>
        <h3 style={{ fontSize: '16px', color: '#f8fafc' }}>Historial de Solicitudes</h3>
        {cargando ? (
          <p style={{ color: '#38bdf8' }}>Cargando registros...</p>
        ) : tickets.length === 0 ? (
          <p style={{ color: '#64748b' }}>No existen tickets registrados en este momento.</p>
        ) : (
          tickets.map((t) => (
            <div key={t.id} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '14px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>[{t.tipo}] {t.asunto}</span>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: t.estado === 'Resuelto' ? '#065f46' : '#854d0e', color: t.estado === 'Resuelto' ? '#34d399' : '#fef08a' }}>
                  {t.estado}
                </span>
              </div>
              <p style={{ fontSize: '13px', margin: '4px 0', color: '#cbd5e1' }}>{t.mensaje}</p>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                Enviado por: {t.empleados?.nombre} {t.empleados?.apellido} ({t.empleados?.email}) - {new Date(t.created_at).toLocaleString()}
              </div>

              {t.respuesta_admin && (
                <div style={{ marginTop: '10px', backgroundColor: '#0f172a', padding: '10px', borderRadius: '4px', borderLeft: '3px solid #16a34a' }}>
                  <b style={{ fontSize: '12px', color: '#4ade80' }}>Respuesta de Administración:</b>
                  <p style={{ fontSize: '13px', margin: '2px 0 0 0', color: '#e2e8f0' }}>{t.respuesta_admin}</p>
                </div>
              )}

              {esGestionador && !t.respuesta_admin && (
                <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Escribir respuesta administrativa..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        responderTicket(t.id, e.target.value);
                        e.target.value = '';
                      }
                    }}
                    style={{ flex: 1, backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '4px', fontSize: '12px' }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}