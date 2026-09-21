import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../config/supabaseClient';
import { playNotificationSound } from '../utils/soundNotifier';

export default function SoporteView({ usuarioActual }) {
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [cargando, setCargando] = useState(true);
  const chatEndRef = useRef(null);

  const cargarMensajes = async () => {
    try {
      const { data, error } = await supabase
        .from('soporte_mensajes')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error al cargar mensajes de soporte:', error.message);
      } else {
        setMensajes(data || []);
      }
    } catch (err) {
      console.error('Error inesperado:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMensajes();

    const channel = supabase
      .channel('tabla_soporte_mensajes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'soporte_mensajes' },
        (payload) => {
          setMensajes((prev) => [...prev, payload.new]);
          
          // Reproducir sonido si el mensaje es de otro usuario
          if (payload.new.remitente_email?.toLowerCase() !== usuarioActual?.email?.toLowerCase()) {
            playNotificationSound('support');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [usuarioActual]);

  useEffect(() => {
    if (!cargando) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajes, cargando]);

  const enviarMensaje = async (e) => {
    e.preventDefault();
    const textoLimpio = nuevoMensaje.trim();
    if (!textoLimpio || !usuarioActual) return;

    const nombreCompleto = [usuarioActual.nombre, usuarioActual.apellido]
      .filter(Boolean)
      .join(' ') || usuarioActual.email || 'Usuario';

    const mensajeData = {
      remitente_email: usuarioActual.email,
      remitente_nombre: nombreCompleto,
      rol: usuarioActual.rol || 'EMPLEADO',
      mensaje: textoLimpio,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('soporte_mensajes').insert([mensajeData]);

    if (error) {
      alert(`Error al enviar mensaje: ${error.message}`);
    } else {
      setNuevoMensaje('');
    }
  };

  return (
    <div style={{ padding: '20px', color: '#fff', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      <h2>📣 Avisos y Soporte</h2>
      <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>
        Canal directo de comunicación con la administración y soporte técnico.
      </p>

      {/* Contenedor del Chat */}
      <div style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        {cargando ? (
          <p style={{ color: '#38bdf8', textAlign: 'center' }}>Cargando mensajes...</p>
        ) : mensajes.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', marginTop: '40px' }}>No hay mensajes en este canal todavía. Escribe el primero.</p>
        ) : (
          mensajes.map((m, index) => {
            const esMio = m.remitente_email?.toLowerCase() === usuarioActual?.email?.toLowerCase();
            return (
              <div 
                key={m.id || index} 
                style={{ 
                  alignSelf: esMio ? 'flex-end' : 'flex-start', 
                  maxWidth: '75%', 
                  backgroundColor: esMio ? '#2563eb' : '#334155', 
                  padding: '10px 14px', 
                  borderRadius: '8px' 
                }}
              >
                <div style={{ fontSize: '11px', color: '#cbd5e1', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <b>{m.remitente_nombre} ({m.rol})</b>
                  <span>{m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                </div>
                <div style={{ fontSize: '14px', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{m.mensaje}</div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Formulario de Envío */}
      <form onSubmit={enviarMensaje} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder="Escribe tu mensaje o reporte de soporte..."
          value={nuevoMensaje}
          onChange={(e) => setNuevoMensaje(e.target.value)}
          style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', outline: 'none' }}
        />
        <button type="submit" style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
          Enviar
        </button>
      </form>
    </div>
  );
}