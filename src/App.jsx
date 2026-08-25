import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. Inicialización de cliente Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Configuración de Email Administrador Maestro
const ADMIN_EMAIL_MAESTRO = "admin@empresa.com"; 

export default function App() {
  // Autenticación y Niveles de Acceso
  const [modoAcceso, setModoAcceso] = useState(null); // 'admin' | 'supervisor' | 'empleado'
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [loading, setLoading] = useState(false);

  // Formularios de Login
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorLogin, setErrorLogin] = useState('');

  // Navegación Sidebar
  const [menuActivo, setMenuActivo] = useState('empleados');
  const [submenuPlanificacion, setSubmenuPlanificacion] = useState(true);

  // Estados Globales de Datos
  const [empleados, setEmpleados] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);

  useEffect(() => {
    if (usuarioActual) {
      cargarEmpleados();
      cargarNotificaciones();
    }
  }, [usuarioActual]);

  // --- CONSULTAS SUPABASE ---
  const cargarEmpleados = async () => {
    try {
      const { data, error } = await supabase.from('empleados').select('*').order('id');
      if (error) throw error;
      setEmpleados(data || []);
    } catch (err) {
      console.error('Error al cargar empleados:', err.message);
    }
  };

  const cargarNotificaciones = async () => {
    try {
      let query = supabase.from('notificaciones').select('*, empleados(nombre, apellido, email)').order('fecha_envio', { ascending: false });
      if (usuarioActual?.rol === 'empleado') {
        query = query.eq('empleado_id', usuarioActual.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      setNotificaciones(data || []);
    } catch (err) {
      console.error('Error al cargar notificaciones:', err.message);
    }
  };

  // --- AUTENTICACIÓN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorLogin('');
    setLoading(true);
    const inputEmailClean = emailInput.trim().toLowerCase();

    if (modoAcceso === 'admin' && inputEmailClean !== ADMIN_EMAIL_MAESTRO) {
      setErrorLogin('Acceso denegado: Este email no tiene permisos de Administrador General.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('empleados')
        .select('*')
        .eq('email', inputEmailClean)
        .eq('password', passwordInput.trim())
        .single();

      if (error || !data) {
        setErrorLogin('Credenciales incorrectas o usuario no registrado.');
        setLoading(false);
        return;
      }

      if (modoAcceso === 'supervisor' && data.rol !== 'supervisor' && data.rol !== 'admin') {
        setErrorLogin('Tu usuario no tiene rango de Supervisor.');
        setLoading(false);
        return;
      }

      if (modoAcceso === 'empleado' && data.rol !== 'empleado') {
        setErrorLogin('Tu usuario es de rango superior, seleccioná el portal adecuado.');
        setLoading(false);
        return;
      }

      if (inputEmailClean === ADMIN_EMAIL_MAESTRO) {
        data.rol = 'admin';
      }

      setUsuarioActual(data);
    } catch (err) {
      setErrorLogin('Error al conectar con la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUsuarioActual(null);
    setModoAcceso(null);
    setEmailInput('');
    setPasswordInput('');
    setErrorLogin('');
  };

  // --- SELECCIÓN DE PORTAL Y LOGIN ---
  if (!modoAcceso && !usuarioActual) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.cardLogin}>
          <h2 style={{ color: '#34d399', margin: '0 0 8px 0' }}>📦 ORBIT Logística</h2>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '24px' }}>Seleccioná el portal de acceso:</p>
          
          <button onClick={() => setModoAcceso('admin')} style={{ ...styles.btnPortal, backgroundColor: '#eab308', color: '#000' }}>
            👑 ADMINISTRADOR GENERAL
          </button>
          
          <button onClick={() => setModoAcceso('supervisor')} style={{ ...styles.btnPortal, backgroundColor: '#2563eb', color: '#fff' }}>
            💼 PORTAL SUPERVISORES
          </button>

          <button onClick={() => setModoAcceso('empleado')} style={{ ...styles.btnPortal, backgroundColor: '#059669', color: '#fff' }}>
            👤 PORTAL EMPLEADOS
          </button>
        </div>
      </div>
    );
  }

  if (!usuarioActual) {
    return (
      <div style={styles.centerContainer}>
        <form onSubmit={handleLogin} style={styles.cardLogin}>
          <button type="button" onClick={() => setModoAcceso(null)} style={styles.btnLink}>
            ← Volver a selección de portal
          </button>
          <h3 style={{ color: modoAcceso === 'admin' ? '#facc15' : '#34d399', margin: '0 0 16px 0' }}>
            Acceso {modoAcceso.toUpperCase()}
          </h3>

          <label style={styles.label}>Correo Electrónico</label>
          <input type="email" required placeholder="ejemplo@empresa.com" value={emailInput} onChange={e => setEmailInput(e.target.value)} style={styles.input} />

          <label style={styles.label}>Contraseña</label>
          <input type="password" required placeholder="******" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} style={styles.input} />

          {errorLogin && <p style={styles.textError}>{errorLogin}</p>}

          <button type="submit" disabled={loading} style={styles.btnPrimary}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    );
  }

  // --- DASHBOARD PRINCIPAL ---
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '260px', backgroundColor: '#1e293b', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ padding: '20px 16px', borderBottom: '1px solid #334155' }}>
            <h2 style={{ fontSize: '16px', margin: 0, color: '#34d399' }}>📦 ORBIT Logística</h2>
            <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
              Rol: <b style={{ color: usuarioActual.rol === 'admin' ? '#facc15' : usuarioActual.rol === 'supervisor' ? '#38bdf8' : '#4ade80' }}>{usuarioActual.rol.toUpperCase()}</b>
            </span>
          </div>

          <nav style={{ padding: '12px 8px' }}>
            {usuarioActual.rol === 'empleado' ? (
              <button style={{ ...styles.btnNav, backgroundColor: '#2563eb' }}>
                🔔 Mis Notificaciones
              </button>
            ) : (
              <>
                <button onClick={() => setMenuActivo('empleados')} style={{ ...styles.btnNav, backgroundColor: menuActivo === 'empleados' ? '#2563eb' : 'transparent' }}>
                  👥 {usuarioActual.rol === 'admin' ? 'Alta y Gestión de Usuarios' : 'Añadir Empleados'}
                </button>

                <button onClick={() => setMenuActivo('notificaciones')} style={{ ...styles.btnNav, backgroundColor: menuActivo === 'notificaciones' ? '#2563eb' : 'transparent' }}>
                  🔔 Notificaciones y Envíos
                </button>

                <div>
                  <button onClick={() => setSubmenuPlanificacion(!submenuPlanificacion)} style={{ ...styles.btnNav, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                    <span>📅 Planificaciones</span>
                    <span>{submenuPlanificacion ? '▼' : '▶'}</span>
                  </button>

                  {submenuPlanificacion && (
                    <div style={{ paddingLeft: '16px', marginTop: '2px' }}>
                      <button onClick={() => setMenuActivo('planificacion_salon')} style={{ ...styles.btnSubNav, backgroundColor: menuActivo === 'planificacion_salon' ? '#3b82f6' : 'transparent' }}>🏬 Salón y Cajas</button>
                      <button onClick={() => setMenuActivo('planificacion_carne')} style={{ ...styles.btnSubNav, backgroundColor: menuActivo === 'planificacion_carne' ? '#3b82f6' : 'transparent' }}>🥩 Carne y Carniceros</button>
                      <button onClick={() => setMenuActivo('planificacion_panaderia')} style={{ ...styles.btnSubNav, backgroundColor: menuActivo === 'planificacion_panaderia' ? '#3b82f6' : 'transparent' }}>🥖 Panadería y Lácteos</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </nav>
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid #334155', backgroundColor: '#0f172a' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{usuarioActual.nombre} {usuarioActual.apellido}</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>{usuarioActual.email}</div>
          <button onClick={handleLogout} style={styles.btnDanger}>Cerrar Sesión</button>
        </div>
      </aside>

      {/* VISTAS PRINCIPALES */}
      <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {usuarioActual.rol === 'empleado' && (
          <VistaEmpleado notificaciones={notificaciones} cargarNotificaciones={cargarNotificaciones} />
        )}

        {usuarioActual.rol !== 'empleado' && (
          <>
            {menuActivo === 'empleados' && (
              <GestionUsuarios 
                empleados={empleados} 
                usuarioActual={usuarioActual} 
                cargarEmpleados={cargarEmpleados} 
              />
            )}

            {menuActivo === 'notificaciones' && (
              <GestionNotificaciones 
                empleados={empleados} 
                notificaciones={notificaciones} 
                cargarNotificaciones={cargarNotificaciones} 
              />
            )}

            {menuActivo === 'planificacion_salon' && <ComponentePlanificacionSector tituloSector="🏬 PLANIFICACIÓN DIARIA: SALÓN Y CAJAS" colorBadge="#facc15" />}
            {menuActivo === 'planificacion_carne' && <ComponentePlanificacionSector tituloSector="🥩 PLANIFICACIÓN DIARIA: CARNE Y CARNICEROS" colorBadge="#f87171" />}
            {menuActivo === 'planificacion_panaderia' && <ComponentePlanificacionSector tituloSector="🥖 PLANIFICACIÓN DIARIA: PANADERÍA Y LÁCTEOS" colorBadge="#fb923c" />}
          </>
        )}
      </main>
    </div>
  );
}

// --- SUB-COMPONENTES ---

function VistaEmpleado({ notificaciones, cargarNotificaciones }) {
  const responderNotificacion = async (id, respuesta) => {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leido: true, fecha_lectura: new Date().toISOString(), disponibilidad: respuesta })
      .eq('id', id);

    if (!error) cargarNotificaciones();
  };

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

function GestionUsuarios({ empleados, usuarioActual, cargarEmpleados }) {
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: '', apellido: '', email: '', password: '123', rol: 'empleado', sucursal: 'Perú' });

  const guardarUsuario = async (e) => {
    e.preventDefault();
    const rolAAsignar = usuarioActual.rol === 'admin' ? nuevoUsuario.rol : 'empleado';

    const payload = {
      nombre: nuevoUsuario.nombre.trim(),
      apellido: nuevoUsuario.apellido.trim(),
      email: nuevoUsuario.email.trim().toLowerCase(),
      password: nuevoUsuario.password.trim(),
      rol: rolAAsignar,
      sucursal: nuevoUsuario.sucursal || 'Perú',
      activo: true
    };

    const { error } = await supabase.from('empleados').insert([payload]);

    if (error) {
      alert(`Error al guardar: ${error.message}`);
    } else {
      cargarEmpleados();
      alert(`Usuario creado exitosamente con el ROL: ${rolAAsignar.toUpperCase()}`);
      setNuevoUsuario({ nombre: '', apellido: '', email: '', password: '123', rol: 'empleado', sucursal: 'Perú' });
    }
  };

  const cambiarRolUsuario = async (idUsuario, nuevoRol) => {
    const { error } = await supabase.from('empleados').update({ rol: nuevoRol }).eq('id', idUsuario);
    if (!error) {
      alert(`Rol actualizado a ${nuevoRol.toUpperCase()}`);
      cargarEmpleados();
    } else {
      alert(`Error al cambiar el rol: ${error.message}`);
    }
  };

  const eliminarUsuario = async (idUsuario, nombreEmp) => {
    if (!confirm(`¿Estás seguro de eliminar a ${nombreEmp}? esta acción no se puede deshacer.`)) return;

    const { error } = await supabase.from('empleados').delete().eq('id', idUsuario);

    if (!error) {
      alert('Usuario eliminado correctamente');
      cargarEmpleados();
    } else {
      alert(`Error al eliminar: ${error.message}`);
    }
  };

  return (
    <div style={styles.cardSection}>
      <h3 style={{ marginTop: 0, color: '#60a5fa' }}>👥 Alta y Control de Usuarios</h3>
      
      {/* Formulario de Alta */}
      <form onSubmit={guardarUsuario} style={styles.formGrid}>
        <input type="text" required placeholder="Nombre" value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} style={styles.inputTable} />
        <input type="text" required placeholder="Apellido" value={nuevoUsuario.apellido} onChange={e => setNuevoUsuario({...nuevoUsuario, apellido: e.target.value})} style={styles.inputTable} />
        <input type="email" required placeholder="Email (Login)" value={nuevoUsuario.email} onChange={e => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} style={styles.inputTable} />
        <input type="text" required placeholder="Contraseña" value={nuevoUsuario.password} onChange={e => setNuevoUsuario({...nuevoUsuario, password: e.target.value})} style={styles.inputTable} />
        
        {usuarioActual.rol === 'admin' ? (
          <select value={nuevoUsuario.rol} onChange={e => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})} style={{ ...styles.inputTable, borderColor: '#38bdf8', fontWeight: 'bold' }}>
            <option value="empleado">Rol: Empleado</option>
            <option value="supervisor">Rol: Supervisor</option>
          </select>
        ) : (
          <input type="text" disabled value="Rol: Empleado" style={{ ...styles.inputTable, color: '#94a3b8' }} />
        )}

        <button type="submit" style={styles.btnSuccess}>+ Crear Usuario</button>
      </form>

      {/* Tabla con Filtros de Seguridad por Jerarquía */}
      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.td}>Nombre</th>
              <th style={styles.td}>Email</th>
              <th style={styles.td}>Contraseña</th>
              <th style={styles.td}>Rol Actual</th>
              <th style={styles.td}>Cambiar Rol</th>
              <th style={styles.td}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleados.map(emp => {
              const esMaestro = emp.email.trim().toLowerCase() === ADMIN_EMAIL_MAESTRO.toLowerCase();
              const esMismoUsuario = emp.id === usuarioActual.id || emp.email.trim().toLowerCase() === usuarioActual.email.trim().toLowerCase();
              const rolMostrar = esMaestro ? 'ADMIN' : emp.rol.toUpperCase();

              // REGLAS DE JERARQUÍA PARA ELIMINACIÓN
              let puedeEliminar = false;
              if (!esMismoUsuario && !esMaestro) {
                if (usuarioActual.rol === 'admin') {
                  puedeEliminar = true; // Admin borra a cualquiera salvo a sí mismo y al email maestro
                } else if (usuarioActual.rol === 'supervisor') {
                  puedeEliminar = emp.rol === 'empleado'; // Supervisor SOLO borra Empleados
                }
              }

              return (
                <tr key={emp.id} style={{ borderTop: '1px solid #334155' }}>
                  <td style={styles.td}>👤 {emp.nombre} {emp.apellido}</td>
                  <td style={{ ...styles.td, color: '#38bdf8' }}>{emp.email}</td>
                  
                  <td style={{ ...styles.td, color: '#fbbf24', fontFamily: 'monospace', fontWeight: 'bold' }}>
                    {emp.password}
                  </td>
                  
                  <td style={{ ...styles.td, fontWeight: 'bold', color: rolMostrar === 'ADMIN' ? '#facc15' : rolMostrar === 'SUPERVISOR' ? '#38bdf8' : '#94a3b8' }}>
                    {rolMostrar}
                  </td>
                  
                  <td style={styles.td}>
                    {usuarioActual.rol === 'admin' && !esMaestro ? (
                      <select value={emp.rol} onChange={(e) => cambiarRolUsuario(emp.id, e.target.value)} style={styles.selectSmall}>
                        <option value="empleado">EMPLEADO</option>
                        <option value="supervisor">SUPERVISOR</option>
                      </select>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '11px' }}>Fijo</span>
                    )}
                  </td>

                  {/* Acciones con Control Jerárquico */}
                  <td style={styles.td}>
                    {puedeEliminar ? (
                      <button 
                        onClick={() => eliminarUsuario(emp.id, `${emp.nombre} ${emp.apellido}`)}
                        style={{ ...styles.btnDanger, padding: '4px 8px', fontSize: '11px', width: 'auto' }}
                      >
                        🗑️ Eliminar
                      </button>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '11px' }}>
                        {esMismoUsuario ? 'Sesión Actual' : 'Protegido'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function GestionNotificaciones({ empleados, notificaciones, cargarNotificaciones }) {
  const [nuevaNotif, setNuevaNotif] = useState({ empleado_id: '', asunto_titulo: '', mensaje: '', categoria: 'Turno' });

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
              <td style={styles.td}>{new Date(n.fecha_envio).toLocaleString()}</td>
              <td style={{ ...styles.td, color: n.leido ? '#4ade80' : '#fbbf24' }}>{n.leido ? '👁️ Visto' : '⏳ Pendiente'}</td>
              <td style={styles.td}>{n.disponibilidad}</td>
              <td style={styles.td}>
                <button onClick={() => eliminarNotificacion(n.id)} style={{ ...styles.btnDanger, padding: '4px 8px', fontSize: '11px' }}>🗑️ Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ComponentePlanificacionSector({ tituloSector, colorBadge }) {
  const [camionForm, setCamionForm] = useState({ fecha: '', bultos: '', horaLlegada: '', inicioReposicion: '', repositores: 4 });
  const [registrosCamion, setRegistrosCamion] = useState([
    { id: 1, fecha: '2026-01-19', bultos: 1100, horaLlegada: '11:00 AM', inicioReposicion: '11:30 AM', repositores: 4, tiempoReposicion: '7:38 hs' },
    { id: 2, fecha: '2026-01-20', bultos: 800, horaLlegada: '10:00 AM', inicioReposicion: '11:00 AM', repositores: 4, tiempoReposicion: '5:56 hs' }
  ]);

  const [editandoFilaId, setEditandoFilaId] = useState(null);
  const [cuadrantePersonal, setCuadrantePersonal] = useState([
    { id: 1, nombre: 'MONICA', ingresoM: '08:45 AM', salidaM: '12:50 PM', descansoM: '09:45 AM - 10:00 AM', tareaM: 'CAJA NUMERO 1', tareaSecM: '-', ingresoT: '05:30 PM', salidaT: '09:50 PM', descansoT: '06:00 PM - 06:15 PM', tareaT: 'CAJERO CAJA 1' },
    { id: 2, nombre: 'LORENA', ingresoM: '09:20 AM', salidaM: '01:40 PM', descansoM: '10:00 AM - 10:15 AM', tareaM: 'CAJA NUMERO 2', tareaSecM: 'REPONER LINEA/CAJAS', ingresoT: '05:30 PM', salidaT: '09:20 PM', descansoT: '06:20 PM - 06:35 PM', tareaT: 'CAJERO CAJA 2' }
  ]);

  const agregarCamion = (e) => {
    e.preventDefault();
    if (!camionForm.fecha || !camionForm.bultos) return alert('Completá fecha y bultos');
    setRegistrosCamion([{ id: Date.now(), ...camionForm, tiempoReposicion: '6:30 hs' }, ...registrosCamion]);
    setCamionForm({ fecha: '', bultos: '', horaLlegada: '', inicioReposicion: '', repositores: 4 });
  };

  const actualizarCuadranteCelda = (id, campo, valor) => {
    setCuadrantePersonal(cuadrantePersonal.map(item => item.id === id ? { ...item, [campo]: valor } : item));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={styles.headerSector}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', color: colorBadge }}>{tituloSector}</h2>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Sucursal: Castelli 25 07 / Perú</span>
        </div>
        <span style={styles.badgeActive}>PLANIFICACIÓN ACTIVA</span>
      </div>

      {/* BLOQUE 1: RECEPCIÓN DE CAMIÓNS */}
      <div style={styles.cardSection}>
        <h3 style={{ marginTop: 0, color: '#facc15', fontSize: '15px' }}>🚛 Recepción de Camión y Tiempos de Reposición</h3>
        
        <form onSubmit={agregarCamion} style={styles.formGrid}>
          <input type="date" value={camionForm.fecha} onChange={e => setCamionForm({...camionForm, fecha: e.target.value})} style={styles.inputTable} />
          <input type="number" placeholder="Bultos" value={camionForm.bultos} onChange={e => setCamionForm({...camionForm, bultos: e.target.value})} style={styles.inputTable} />
          <input type="text" placeholder="Llegada" value={camionForm.horaLlegada} onChange={e => setCamionForm({...camionForm, horaLlegada: e.target.value})} style={styles.inputTable} />
          <input type="text" placeholder="Inicio Rep." value={camionForm.inicioReposicion} onChange={e => setCamionForm({...camionForm, inicioReposicion: e.target.value})} style={styles.inputTable} />
          <input type="number" placeholder="Repositores" value={camionForm.repositores} onChange={e => setCamionForm({...camionForm, repositores: e.target.value})} style={styles.inputTable} />
          <button type="submit" style={styles.btnSuccess}>+ Cargar Camión</button>
        </form>

        <table style={{ ...styles.table, textAlign: 'center' }}>
          <thead>
            <tr style={styles.thRowYellow}>
              <th style={styles.td}>FECHA</th>
              <th style={styles.td}>BULTOS</th>
              <th style={styles.td}>LLEGADA</th>
              <th style={styles.td}>INICIO REPOSICIÓN</th>
              <th style={styles.td}>REPOSITORES</th>
              <th style={styles.td}>TIEMPO REPOSICIÓN</th>
              <th style={styles.td}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {registrosCamion.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={styles.td}>{r.fecha}</td>
                <td style={{ ...styles.td, fontWeight: 'bold', color: '#38bdf8' }}>{r.bultos}</td>
                <td style={styles.td}>{r.horaLlegada}</td>
                <td style={styles.td}>{r.inicioReposicion}</td>
                <td style={styles.td}>{r.repositores}</td>
                <td style={{ ...styles.td, color: '#4ade80', fontWeight: 'bold' }}>{r.tiempoReposicion}</td>
                <td style={styles.td}>
                  <button onClick={() => setRegistrosCamion(registrosCamion.filter(x => x.id !== r.id))} style={{ ...styles.btnDanger, padding: '4px 8px', fontSize: '11px' }}>🗑️ Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BLOQUE 2: CUADRANTE EDITABLE */}
      <div style={styles.cardSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '15px' }}>👥 Cuadrante de Horarios y Asignación de Tareas Diarias</h3>
          <button onClick={() => setCuadrantePersonal([...cuadrantePersonal, { id: Date.now(), nombre: 'NUEVO', ingresoM: '08:00 AM', salidaM: '12:00 PM', descansoM: '-', tareaM: '-', tareaSecM: '-', ingresoT: '-', salidaT: '-', descansoT: '-', tareaT: '-' }])} style={styles.btnPrimary}>
            + Añadir Fila
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ ...styles.table, fontSize: '11px' }}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.td}>NOMBRE</th>
                <th style={styles.td}>ENTRADA/SALIDA (M)</th>
                <th style={styles.td}>DESAYUNO</th>
                <th style={styles.td}>TAREA PRINCIPAL</th>
                <th style={styles.td}>TAREA SECUNDARIA</th>
                <th style={styles.td}>ENTRADA/SALIDA (T)</th>
                <th style={styles.td}>MERIENDA</th>
                <th style={styles.td}>TAREA TARDE</th>
                <th style={styles.td}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {cuadrantePersonal.map(c => {
                const esEdit = editandoFilaId === c.id;
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={styles.td}>
                      {esEdit ? <input style={styles.inputInline} value={c.nombre} onChange={e => actualizarCuadranteCelda(c.id, 'nombre', e.target.value)} /> : <b>👤 {c.nombre}</b>}
                    </td>
                    <td style={styles.td}>
                      {esEdit ? <input style={styles.inputInline} value={c.ingresoM} onChange={e => actualizarCuadranteCelda(c.id, 'ingresoM', e.target.value)} /> : <span style={{ color: '#4ade80' }}>{c.ingresoM} - {c.salidaM}</span>}
                    </td>
                    <td style={styles.td}>
                      {esEdit ? <input style={styles.inputInline} value={c.descansoM} onChange={e => actualizarCuadranteCelda(c.id, 'descansoM', e.target.value)} /> : <span style={{ color: '#fbbf24' }}>{c.descansoM}</span>}
                    </td>
                    <td style={styles.td}>
                      {esEdit ? <input style={styles.inputInline} value={c.tareaM} onChange={e => actualizarCuadranteCelda(c.id, 'tareaM', e.target.value)} /> : <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{c.tareaM}</span>}
                    </td>
                    <td style={styles.td}>
                      {esEdit ? <input style={styles.inputInline} value={c.tareaSecM} onChange={e => actualizarCuadranteCelda(c.id, 'tareaSecM', e.target.value)} /> : c.tareaSecM}
                    </td>
                    <td style={styles.td}>
                      {esEdit ? <input style={styles.inputInline} value={c.ingresoT} onChange={e => actualizarCuadranteCelda(c.id, 'ingresoT', e.target.value)} /> : <span style={{ color: '#4ade80' }}>{c.ingresoT} - {c.salidaT}</span>}
                    </td>
                    <td style={styles.td}>
                      {esEdit ? <input style={styles.inputInline} value={c.descansoT} onChange={e => actualizarCuadranteCelda(c.id, 'descansoT', e.target.value)} /> : <span style={{ color: '#fbbf24' }}>{c.descansoT}</span>}
                    </td>
                    <td style={styles.td}>
                      {esEdit ? <input style={styles.inputInline} value={c.tareaT} onChange={e => actualizarCuadranteCelda(c.id, 'tareaT', e.target.value)} /> : <span style={{ color: '#e879f9', fontWeight: 'bold' }}>{c.tareaT}</span>}
                    </td>
                    <td style={{ ...styles.td, display: 'flex', gap: '4px' }}>
                      <button onClick={() => setEditandoFilaId(esEdit ? null : c.id)} style={{ ...styles.btnPrimary, backgroundColor: esEdit ? '#059669' : '#d97706', padding: '4px 6px', fontSize: '10px' }}>
                        {esEdit ? '💾 OK' : '✏️ Editar'}
                      </button>
                      <button onClick={() => setCuadrantePersonal(cuadrantePersonal.filter(x => x.id !== c.id))} style={{ ...styles.btnDanger, padding: '4px 6px', fontSize: '10px' }}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- DICCIONARIO DE ESTILOS CSS-IN-JS ---
const styles = {
  centerContainer: { minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'system-ui, sans-serif' },
  cardLogin: { backgroundColor: '#1e293b', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '380px', color: '#fff', border: '1px solid #334155', textAlign: 'center' },
  cardSection: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #334155' },
  cardInner: { backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #334155' },
  headerSector: { backgroundColor: '#1e293b', padding: '16px 20px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  badgeActive: { backgroundColor: '#0284c7', color: '#fff', fontSize: '11px', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' },
  input: { width: '100%', padding: '10px', margin: '6px 0 16px 0', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box' },
  inputTable: { backgroundColor: '#0f172a', border: '1px solid #334155', padding: '8px', color: '#fff', borderRadius: '4px' },
  inputInline: { width: '100%', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #38bdf8' },
  label: { fontSize: '12px', color: '#94a3b8', textAlign: 'left', display: 'block' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '20px' },
  btnPortal: { width: '100%', padding: '12px', marginBottom: '10px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  btnPrimary: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
  btnSuccess: { backgroundColor: '#059669', color: '#fff', border: 'none', padding: '8px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  btnDanger: { backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '100%' },
  btnNav: { width: '100%', textAlign: 'left', padding: '10px 12px', marginBottom: '4px', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  btnSubNav: { width: '100%', textAlign: 'left', padding: '8px 12px', marginBottom: '2px', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  btnLink: { background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: 0, fontSize: '12px', marginBottom: '12px' },
  selectSmall: { backgroundColor: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' },
  thRow: { backgroundColor: '#020617', color: '#94a3b8', textAlign: 'left' },
  thRowYellow: { backgroundColor: '#020617', color: '#fbbf24' },
  td: { padding: '8px', border: '1px solid #334155' },
  textError: { color: '#f87171', fontSize: '12px', marginTop: 0 }
};