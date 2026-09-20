import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';

const styles = {
  container: { padding: '24px', maxWidth: '1000px' },
  title: { color: '#f8fafc', marginBottom: '16px', fontSize: '20px' },
  subtitle: { color: '#38bdf8', marginTop: '24px', marginBottom: '12px', fontSize: '16px' },
  formCard: { backgroundColor: '#1e293b', padding: '16px', borderRadius: '6px', border: '1px solid #334155', marginBottom: '24px' },
  formGrid: { display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' },
  input: { backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '8px 12px', borderRadius: '4px', flex: '1', minWidth: '150px' },
  select: { backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', padding: '8px 12px', borderRadius: '4px' },
  btnSubmit: { backgroundColor: '#16a34a', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', color: '#f8fafc', backgroundColor: '#1e293b', borderRadius: '6px', overflow: 'hidden' },
  th: { backgroundColor: '#0f172a', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '13px' },
  td: { padding: '10px 12px', borderBottom: '1px solid #334155', fontSize: '14px' },
  badgeAlert: (tipo) => ({
    padding: '10px 12px',
    marginBottom: '16px',
    borderRadius: '4px',
    backgroundColor: tipo === 'exito' ? '#065f46' : '#991b1b',
    color: tipo === 'exito' ? '#34d399' : '#fca5a5',
    border: `1px solid ${tipo === 'exito' ? '#059669' : '#dc2626'}`
  })
};

export default function UsuariosView() {
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [rol, setRol] = useState('SUPERVISOR');
  const [usuarios, setUsuarios] = useState([]);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    const { data, error } = await supabase
      .from('empleados')
      .select('*')
      .order('id', { ascending: false });

    if (!error) {
      setUsuarios(data || []);
    }
  };

  const handleAltaUsuario = async (e) => {
    e.preventDefault();
    setMensaje(null);

    if (!email) return;

    const rolMayuscula = rol.toUpperCase();

    const { error } = await supabase
      .from('empleados')
      .insert([
        {
          email: email.toLowerCase().trim(),
          nombre: nombre.trim() || 'Pendiente',
          apellido: apellido.trim() || '',
          rol: rolMayuscula,
          activo: true
        }
      ]);

    if (error) {
      setMensaje({ tipo: 'error', texto: `Error: ${error.message}` });
    } else {
      setMensaje({ tipo: 'exito', texto: `Usuario ${email} dado de alta como ${rolMayuscula}.` });
      setEmail('');
      setNombre('');
      setApellido('');
      cargarUsuarios();
    }
  };

  const handleCambiarRol = async (id, nuevoRol) => {
    const rolMayuscula = nuevoRol.toUpperCase();
    const { error } = await supabase
      .from('empleados')
      .update({ rol: rolMayuscula })
      .eq('id', id);

    if (!error) cargarUsuarios();
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Alta y Gestión de Usuarios</h2>

      {mensaje && (
        <div style={styles.badgeAlert(mensaje.tipo)}>
          {mensaje.texto}
        </div>
      )}

      <div style={styles.formCard}>
        <form onSubmit={handleAltaUsuario} style={styles.formGrid}>
          <input
            type="email"
            placeholder="Gmail del usuario"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            style={styles.input}
          />
          <select value={rol} onChange={(e) => setRol(e.target.value)} style={styles.select}>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="EMPLEADO">Empleado</option>
            <option value="ADMIN">Administrador</option>
          </select>
          <button type="submit" style={styles.btnSubmit}>Dar de Alta</button>
        </form>
      </div>

      <h3 style={styles.subtitle}>Lista de Empleados Registrados</h3>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Nombre</th>
            <th style={styles.th}>Apellido</th>
            <th style={styles.th}>Rol</th>
            <th style={styles.th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => {
            const rolNormalizado = (u.rol || '').toUpperCase();
            return (
              <tr key={u.id}>
                <td style={styles.td}>{u.email}</td>
                <td style={styles.td}>{u.nombre}</td>
                <td style={styles.td}>{u.apellido || '-'}</td>
                <td style={styles.td}>
                  <b style={{ color: rolNormalizado === 'ADMIN' ? '#facc15' : rolNormalizado === 'SUPERVISOR' ? '#38bdf8' : '#4ade80' }}>
                    {rolNormalizado}
                  </b>
                </td>
                <td style={styles.td}>
                  <select value={rolNormalizado} onChange={(e) => handleCambiarRol(u.id, e.target.value)} style={styles.select}>
                    <option value="EMPLEADO">Empleado</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}