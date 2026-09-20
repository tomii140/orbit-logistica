import React, { useState } from 'react';
import { supabase } from '../config/supabaseClient';

export default function UsuariosView({ usuarioActual, empleados, onReload, styles }) {
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoApellido, setNuevoApellido] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoRol, setNuevoRol] = useState('EMPLEADO');
  const [mensajeEstado, setMensajeEstado] = useState({ tipo: '', texto: '' });
  const [guardando, setGuardando] = useState(false);

  const esAdmin = usuarioActual?.rol === 'ADMIN';

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setMensajeEstado({ tipo: '', texto: '' });

    if (!nuevoNombre.trim() || !nuevoApellido.trim() || !nuevoEmail.trim()) {
      setMensajeEstado({ tipo: 'error', texto: 'Completá todos los campos obligatorios.' });
      return;
    }

    setGuardando(true);
    try {
      const emailLimpio = nuevoEmail.trim().toLowerCase();

      // Verificar si ya existe
      const { data: existente } = await supabase
        .from('empleados')
        .select('id')
        .eq('email', emailLimpio)
        .maybeSingle();

      if (existente) {
        setMensajeEstado({ tipo: 'error', texto: 'El correo electrónico ya está registrado.' });
        setGuardando(false);
        return;
      }

      // Insertar nuevo usuario
      const { error } = await supabase.from('empleados').insert([
        {
          nombre: nuevoNombre.trim(),
          apellido: nuevoApellido.trim(),
          email: emailLimpio,
          rol: nuevoRol
        }
      ]);

      if (error) throw error;

      setMensajeEstado({ tipo: 'exito', texto: 'Usuario dado de alta exitosamente.' });
      setNuevoNombre('');
      setNuevoApellido('');
      setNuevoEmail('');
      setNuevoRol('EMPLEADO');
      if (onReload) onReload();
    } catch (err) {
      console.error('Error al dar de alta:', err);
      setMensajeEstado({ tipo: 'error', texto: `Error: ${err.message}` });
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarUsuario = async (id, email) => {
    if (email.toLowerCase() === usuarioActual.email.toLowerCase()) {
      alert('No podés eliminar tu propia cuenta activa.');
      return;
    }

    if (!window.confirm(`¿Confirmás la eliminación del usuario ${email}?`)) return;

    try {
      const { error } = await supabase.from('empleados').delete().eq('id', id);
      if (error) throw error;
      if (onReload) onReload();
    } catch (err) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ margin: '0 0 4px 0' }}>👥 Alta y Gestión de Usuarios</h2>
        <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
          Módulo para registrar personal y asignar roles dentro del sistema.
        </p>
      </div>

      {/* Formulario de Alta */}
      <div style={styles.cardSection}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#38bdf8' }}>➕ Registrar Nuevo Usuario</h3>

        {mensajeEstado.texto && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '13px',
              backgroundColor: mensajeEstado.tipo === 'exito' ? '#065f46' : '#991b1b',
              color: mensajeEstado.tipo === 'exito' ? '#34d399' : '#fca5a5'
            }}
          >
            {mensajeEstado.texto}
          </div>
        )}

        <form onSubmit={handleCrearUsuario}>
          <div style={styles.formGrid}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Nombre</label>
              <input
                type="text"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Ej: Juan"
                style={{ ...styles.inputTable, width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Apellido</label>
              <input
                type="text"
                value={nuevoApellido}
                onChange={(e) => setNuevoApellido(e.target.value)}
                placeholder="Ej: Pérez"
                style={{ ...styles.inputTable, width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Email Institucional / Gmail</label>
              <input
                type="email"
                value={nuevoEmail}
                onChange={(e) => setNuevoEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                style={{ ...styles.inputTable, width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Rol Asignado</label>
              <select
                value={nuevoRol}
                onChange={(e) => setNuevoRol(e.target.value)}
                style={{ ...styles.inputTable, width: '100%', boxSizing: 'border-box' }}
              >
                <option value="EMPLEADO">EMPLEADO</option>
                <option value="SUPERVISOR">SUPERVISOR</option>
                {esAdmin && <option value="ADMIN">ADMINISTRADOR</option>}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={guardando}
            style={{ ...styles.btnSuccess, width: '100%', fontWeight: 'bold', cursor: guardando ? 'not-allowed' : 'pointer' }}
          >
            {guardando ? 'Guardando...' : 'Registrar Usuario'}
          </button>
        </form>
      </div>

      {/* Tabla de Usuarios Registrados */}
      <div style={styles.cardSection}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#38bdf8' }}>
          📋 Personal Registrado ({empleados.length})
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={{ ...styles.td, textAlign: 'left' }}>Nombre y Apellido</th>
                <th style={{ ...styles.td, textAlign: 'left' }}>Email</th>
                <th style={{ ...styles.td, textAlign: 'center' }}>Rol</th>
                {esAdmin && <th style={{ ...styles.td, textAlign: 'center' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {empleados.length === 0 ? (
                <tr>
                  <td colSpan={esAdmin ? 4 : 3} style={{ ...styles.td, textAlign: 'center', color: '#64748b' }}>
                    No hay usuarios registrados.
                  </td>
                </tr>
              ) : (
                empleados.map((emp) => (
                  <tr key={emp.id}>
                    <td style={styles.td}>{emp.nombre} {emp.apellido}</td>
                    <td style={{ ...styles.td, color: '#94a3b8' }}>{emp.email}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          backgroundColor:
                            emp.rol?.toUpperCase() === 'ADMIN'
                              ? '#854d0e'
                              : emp.rol?.toUpperCase() === 'SUPERVISOR'
                              ? '#1e40af'
                              : '#166534',
                          color: '#fff'
                        }}
                      >
                        {(emp.rol || 'EMPLEADO').toUpperCase()}
                      </span>
                    </td>
                    {esAdmin && (
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleEliminarUsuario(emp.id, emp.email)}
                          style={{
                            backgroundColor: '#991b1b',
                            color: '#fca5a5',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Eliminar
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}