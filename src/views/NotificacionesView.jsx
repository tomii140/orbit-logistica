import React, { useState } from 'react';
import { supabase } from '../config/supabaseClient';
import { playNotificationSound } from '../utils/soundNotifier';

export function NotificacionesView({ usuarioActual, empleados, notificaciones, cargarNotificaciones, styles }) {
  const [nuevaNotif, setNuevaNotif] = useState({ empleado_id: '', asunto_titulo: '', mensaje: '', categoria: 'Turno' });

  const responderNotificacion = async (id, respuesta) => {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leido: true, fecha_lectura: new Date().toISOString(), disponibilidad: respuesta })
      .eq('id', id);

    if (!error) {
      playNotificationSound('info');
      cargarNotificaciones();
    }
  };

  const enviarNotificacion = async (e) => {
    e.preventDefault();
    if (!nuevaNotif.empleado_id || !nuevaNotif.asunto_titulo) return alert('Completá los campos obligatorios');

    const { error } = await supabase.from('notificaciones').insert([{
      empleado_id: nuevaNotif.empleado_id,
      asunto_titulo: nuevaNotif.asunto_titulo,
      mensaje: nuevaNotif.mensaje,
      categoria: nuevaNotif.categoria,
      fecha_envio: new Date().toISOString()
    }]);

    if (!error) {
      playNotificationSound(nuevaNotif.categoria);
      alert('Notificación enviada con éxito');
      setNuevaNotif({ empleado_id: '', asunto_titulo: '', mensaje: '', categoria: 'Turno' });
      cargarNotificaciones();
    } else {
      alert(`Error: ${error.message}`);
    }
  };

  const eliminarNotificacion = async (id) => {
    if (!confirm('¿Eliminar esta notificación enviada por error?')) return;
    const { error } = await supabase.from('notificaciones').delete().eq('id', id);
    if (!error) cargarNotificaciones();
  };

  if (usuarioActual.rol === 'empleado') {
    return (
      <div style={styles.cardSection}>
        <h3 style={{ color: '#38bdf8', marginTop: 0 }}>📍 Mis Notificaciones y Turnos Asignados</h3>
        {notificaciones.length === 0 ? <p style={{ color: '#94a3b8' }}>No tenés notificaciones pendientes.</p> : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {notificaciones.map(n => (
              <div key={n.id} style={styles.cardInner}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '14px' }}>[{n.categoria}] {n.asunto_titulo}</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>📅 Enviado: {new Date(n.fecha_envio).toLocaleString()}</span>
                </div>
                <p style={{ margin: '0 0 12px 0', fontSize: '13px' }}>{n.mensaje}</p>
                {n.leido ? (
                  <div style={{ fontSize: '12px', color: '#4ade80', backgroundColor: '#022c22', padding: '8px', borderRadius: '4px' }}>
                    ✅ Confirmado | Respuesta: <b>{n.disponibilidad}</b>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => responderNotificacion(n.id, 'Disponible')} style={{ ...styles.btnPrimary, flex: 1 }}>🟢 Confirmar Asistencia</button>
                    <button onClick={() => responderNotificacion(n.id, 'No Disponible')} style={{ ...styles.btnDanger, flex: 1 }}>🔴 No Puedo Asistir</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={styles.cardSection}>
      <h3 style={{ marginTop: 0, color: '#38bdf8' }}>🔔 Enviar Avisos y Confirmaciones</h3>
      <form onSubmit={enviarNotificacion} style={styles.formGrid}>
        <select value={nuevaNotif.empleado_id} onChange={e => setNuevaNotif({...nuevaNotif, empleado_id: e.target.value})} required style={styles.inputTable}>
          <option value="">-- Seleccionar Empleado --</option>
          {empleados.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre} {emp.apellido}</option>)}
        </select>
        <select value={nuevaNotif.categoria} onChange={e => setNuevaNotif({...nuevaNotif, categoria: e.target.value})} style={styles.inputTable}>
          <option value="Turno">Turno / Citación</option>
          <option value="Informativa">Informativa</option>
          <option value="Urgente">Urgente</option>
        </select>
        <input type="text" required placeholder="Asunto" value={nuevaNotif.asunto_titulo} onChange={e => setNuevaNotif({...nuevaNotif, asunto_titulo: e.target.value})} style={styles.inputTable} />
        <input type="text" placeholder="Mensaje" value={nuevaNotif.mensaje} onChange={e => setNuevaNotif({...nuevaNotif, mensaje: e.target.value})} style={styles.inputTable} />
        <button type="submit" style={styles.btnSuccess}>Enviar Notificación</button>
      </form>

      <h4 style={{ color: '#fbbf24', marginTop: '20px' }}>Historial y Corrección de Envíos</h4>
      <table style={styles.table}>
        <thead>
          <tr style={styles.thRow}>
            <th style={styles.td}>Empleado</th>
            <th style={styles.td}>Asunto</th>
            <th style={styles.td}>Fecha Envió</th>
            <th style={styles.td}>Estado Lectura</th>
            <th style={styles.td}>Respuesta</th>
            <th style={styles.td}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {notificaciones.map(n => (
            <tr key={n.id} style={{ borderTop: '1px solid #334155' }}>
              <td style={styles.td}>👤 {n.empleados?.nombre} {n.empleados?.apellido}</td>
              <td style={{ ...styles.td, color: '#38bdf8', fontWeight: 'bold' }}>{n.asunto_titulo}</td>
              <td style={styles.td}>{n.fecha_envio ? new Date(n.fecha_envio).toLocaleString() : '-'}</td>
              <td style={{ ...styles.td, color: n.leido ? '#4ade80' : '#fbbf24' }}>{n.leido ? '👁️ Visto' : '⏳ Pendiente'}</td>
              <td style={styles.td}>{n.disponibilidad || '-'}</td>
              <td style={styles.td}>
                <button onClick={() => eliminarNotificacion(n.id)} style={{ ...styles.btnDanger, padding: '4px 8px', fontSize: '11px', width: 'auto' }}>🗑️ Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default NotificacionesView;