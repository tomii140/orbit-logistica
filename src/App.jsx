import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './config/supabaseClient';
import { playNotificationSound } from './utils/soundNotifier';
import SoporteView from './views/SoporteView';
import NotificacionesView from './views/NotificacionesView';
import UsuariosView from './views/UsuariosView';
import PlanificacionSectorView from './views/PlanificacionSectorView';

const ADMIN_EMAIL_MAESTRO = "tomasaguero140@gmail.com";

const styles = {
  centerContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0f172a' },
  cardLogin: { backgroundColor: '#1e293b', padding: '32px', borderRadius: '8px', border: '1px solid #334155', width: '100%', maxWidth: '400px', textAlign: 'center' },
  btnPortal: { width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
  btnPrimary: { border: 'none', padding: '10px 16px', borderRadius: '6px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  btnDanger: { backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', width: '100%' },
  btnNav: { width: '100%', padding: '10px 12px', color: '#f8fafc', border: 'none', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', marginBottom: '4px' },
  btnSubNav: { width: '100%', padding: '8px 12px', color: '#94a3b8', border: 'none', textAlign: 'left', borderRadius: '4px', cursor: 'pointer', marginBottom: '2px', fontSize: '13px' },
  btnLink: { background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', marginBottom: '16px', padding: 0 },
  textError: { color: '#f87171', fontSize: '13px', marginBottom: '12px' },
  cardSection: { backgroundColor: '#1e293b', padding: '16px', borderRadius: '6px', border: '1px solid #334155' },
  cardInner: { backgroundColor: '#0f172a', padding: '12px', borderRadius: '6px', border: '1px solid #334155', marginBottom: '8px' },
  table: { width: '100%', borderCollapse: 'collapse', color: '#f8fafc' },
  td: { padding: '8px', borderBottom: '1px solid #334155' },
  thRow: { backgroundColor: '#0f172a', textAlign: 'left' },
  inputTable: { backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '4px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', marginBottom: '16px' },
  btnSuccess: { backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' }
};

export default function App() {
  // Log de diagnóstico en renderizado
  console.log("🚀 [DIAGNÓSTICO] App.jsx se está ejecutando - Versión actualizada con logs");

  const [modoAcceso, setModoAcceso] = useState(null);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorLogin, setErrorLogin] = useState('');

  const [menuActivo, setMenuActivo] = useState('empleados');
  const [submenuPlanificacion, setSubmenuPlanificacion] = useState(true);
  const [empleados, setEmpleados] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);

  const sincronizarUsuarioGoogle = useCallback(async (emailUser) => {
    if (!emailUser) return null;
    try {
      const cleanEmail = emailUser.toLowerCase().trim();
      console.log(`🔍 [DIAGNÓSTICO] Sincronizando usuario: ${cleanEmail}`);
      
      let { data, error } = await supabase
        .from('empleados')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (error) console.error("❌ Error al consultar empleados:", error);

      if (!data) {
        await supabase.auth.signOut();
        alert(`Acceso no autorizado: El correo ${cleanEmail} no ha sido dado de alta por un Administrador.`);
        return null;
      }

      if (cleanEmail === ADMIN_EMAIL_MAESTRO.toLowerCase()) {
        data.rol = 'ADMIN';
      } else if (data.rol) {
        data.rol = data.rol.toUpperCase();
      }

      console.log("✅ [DIAGNÓSTICO] Datos de usuario obtenidos:", data);
      return data;
    } catch (err) {
      console.error("❌ Error validando usuario:", err);
      await supabase.auth.signOut();
      return null;
    }
  }, []);

  const cargarEmpleados = useCallback(async () => {
    const { data, error } = await supabase.from('empleados').select('*').order('nombre');
    if (!error) {
      console.log(`👥 [DIAGNÓSTICO] Empleados cargados: ${data?.length || 0}`);
      setEmpleados(data || []);
    } else {
      console.error("❌ Error al cargar empleados:", error);
    }
  }, []);

  const cargarNotificaciones = useCallback(async () => {
    if (!usuarioActual) return;
    let query = supabase.from('notificaciones').select('*, empleados(nombre, apellido, email)').order('fecha_envio', { ascending: false });
    
    if (usuarioActual.rol === 'EMPLEADO') {
      query = query.eq('empleado_id', usuarioActual.id);
    }
    
    const { data, error } = await query;
    if (!error) {
      console.log(`🔔 [DIAGNÓSTICO] Notificaciones cargadas: ${data?.length || 0}`);
      setNotificaciones(data || []);
    } else {
      console.error("❌ Error al cargar notificaciones:", error);
    }
  }, [usuarioActual]);

  const aplicarPerfilUsuario = useCallback((userProfile) => {
    if (userProfile) {
      const rolNormalizado = (userProfile.rol || 'EMPLEADO').toUpperCase();
      setUsuarioActual({ ...userProfile, rol: rolNormalizado });
      setModoAcceso(rolNormalizado);
      setMenuActivo(rolNormalizado === 'EMPLEADO' ? 'notificaciones' : 'empleados');
    } else {
      setUsuarioActual(null);
      setModoAcceso(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email && isMounted) {
          const userProfile = await sincronizarUsuarioGoogle(session.user.email);
          if (isMounted) aplicarPerfilUsuario(userProfile);
        }
      } catch (err) {
        console.error("❌ Error al obtener sesión:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      if (event === 'SIGNED_IN' && session?.user?.email) {
        setLoading(true);
        const userProfile = await sincronizarUsuarioGoogle(session.user.email);
        if (isMounted) {
          aplicarPerfilUsuario(userProfile);
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUsuarioActual(null);
          setModoAcceso(null);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      if (authListener?.subscription) authListener.subscription.unsubscribe();
    };
  }, [sincronizarUsuarioGoogle, aplicarPerfilUsuario]);

  useEffect(() => {
    if (usuarioActual) {
      cargarEmpleados();
      cargarNotificaciones();
    }
  }, [usuarioActual, cargarEmpleados, cargarNotificaciones]);

  const handleCambioMenu = (nuevoMenu) => {
    console.log(`📌 [DIAGNÓSTICO] Navegando a la vista: ${nuevoMenu}`);
    setMenuActivo(nuevoMenu);
  };

  const handleGoogleLogin = async () => {
    setErrorLogin('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) setErrorLogin(`Error de autenticación: ${error.message}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUsuarioActual(null);
    setModoAcceso(null);
    setErrorLogin('');
  };

  if (loading) {
    return (
      <div style={styles.centerContainer}>
        <p style={{ color: '#38bdf8' }}>Cargando sesión...</p>
      </div>
    );
  }

  if (!modoAcceso && !usuarioActual) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.cardLogin}>
          <h2 style={{ color: '#34d399', margin: '0 0 8px 0' }}>📦 ORBIT Logística</h2>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '24px' }}>Seleccioná el portal de acceso:</p>
          <button type="button" onClick={() => setModoAcceso('ADMIN')} style={{ ...styles.btnPortal, backgroundColor: '#eab308', color: '#000' }}>👑 ADMINISTRADOR GENERAL</button>
          <button type="button" onClick={() => setModoAcceso('SUPERVISOR')} style={{ ...styles.btnPortal, backgroundColor: '#2563eb', color: '#fff' }}>💼 PORTAL SUPERVISORES</button>
          <button type="button" onClick={() => setModoAcceso('EMPLEADO')} style={{ ...styles.btnPortal, backgroundColor: '#059669', color: '#fff' }}>👤 PORTAL EMPLEADOS</button>
        </div>
      </div>
    );
  }

  if (!usuarioActual) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.cardLogin}>
          <button type="button" onClick={() => setModoAcceso(null)} style={styles.btnLink}>← Volver a selección de portal</button>
          <h3 style={{ color: modoAcceso === 'ADMIN' ? '#facc15' : '#34d399', margin: '0 0 16px 0' }}>Acceso {modoAcceso?.toUpperCase()}</h3>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>Iniciá sesión con tu cuenta de Google institucional/Gmail para acceder al panel.</p>
          {errorLogin && <p style={styles.textError}>{errorLogin}</p>}
          <button type="button" onClick={handleGoogleLogin} style={{ ...styles.btnPrimary, backgroundColor: '#ea4335', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px' }}>
            <span>🌐</span> Iniciar sesión con Google
          </button>
        </div>
      </div>
    );
  }

  const rolUpper = (usuarioActual.rol || 'EMPLEADO').toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <aside style={{ width: '260px', backgroundColor: '#1e293b', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ padding: '20px 16px', borderBottom: '1px solid #334155' }}>
            <h2 style={{ fontSize: '16px', margin: 0, color: '#34d399' }}>📦 ORBIT Logística</h2>
            <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
              Rol: <b style={{ color: rolUpper === 'ADMIN' ? '#facc15' : rolUpper === 'SUPERVISOR' ? '#38bdf8' : '#4ade80' }}>{rolUpper}</b>
            </span>
          </div>

          <nav style={{ padding: '12px 8px' }}>
            {rolUpper === 'EMPLEADO' ? (
              <>
                <button type="button" onClick={() => handleCambioMenu('notificaciones')} style={{ ...styles.btnNav, backgroundColor: menuActivo === 'notificaciones' ? '#2563eb' : 'transparent' }}>🔔 Mis Notificaciones</button>
                <div>
                  <button type="button" onClick={() => setSubmenuPlanificacion(!submenuPlanificacion)} style={{ ...styles.btnNav, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                    <span>📅 Ver Planificaciones</span>
                    <span>{submenuPlanificacion ? '▼' : '▶'}</span>
                  </button>
                  {submenuPlanificacion && (
                    <div style={{ paddingLeft: '16px', marginTop: '2px' }}>
                      <button type="button" onClick={() => handleCambioMenu('planificacion_salon')} style={{ ...styles.btnSubNav, backgroundColor: menuActivo === 'planificacion_salon' ? '#3b82f6' : 'transparent' }}>🏬 Salón y Cajas</button>
                      <button type="button" onClick={() => handleCambioMenu('planificacion_carne')} style={{ ...styles.btnSubNav, backgroundColor: menuActivo === 'planificacion_carne' ? '#3b82f6' : 'transparent' }}>🥩 Carne y Carniceros</button>
                      <button type="button" onClick={() => handleCambioMenu('planificacion_panaderia')} style={{ ...styles.btnSubNav, backgroundColor: menuActivo === 'planificacion_panaderia' ? '#3b82f6' : 'transparent' }}>🥖 Panadería y Lácteos</button>
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => handleCambioMenu('soporte')} style={{ ...styles.btnNav, backgroundColor: menuActivo === 'soporte' ? '#2563eb' : 'transparent' }}>📣 Avisos y Soporte</button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => handleCambioMenu('empleados')} style={{ ...styles.btnNav, backgroundColor: menuActivo === 'empleados' ? '#2563eb' : 'transparent' }}>👥 {rolUpper === 'ADMIN' ? 'Alta y Gestión de Usuarios' : 'Añadir Empleados'}</button>
                <button type="button" onClick={() => handleCambioMenu('notificaciones')} style={{ ...styles.btnNav, backgroundColor: menuActivo === 'notificaciones' ? '#2563eb' : 'transparent' }}>🔔 Notificaciones y Envíos</button>
                <div>
                  <button type="button" onClick={() => setSubmenuPlanificacion(!submenuPlanificacion)} style={{ ...styles.btnNav, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                    <span>📅 Planificaciones</span>
                    <span>{submenuPlanificacion ? '▼' : '▶'}</span>
                  </button>
                  {submenuPlanificacion && (
                    <div style={{ paddingLeft: '16px', marginTop: '2px' }}>
                      <button type="button" onClick={() => handleCambioMenu('planificacion_salon')} style={{ ...styles.btnSubNav, backgroundColor: menuActivo === 'planificacion_salon' ? '#3b82f6' : 'transparent' }}>🏬 Salón y Cajas</button>
                      <button type="button" onClick={() => handleCambioMenu('planificacion_carne')} style={{ ...styles.btnSubNav, backgroundColor: menuActivo === 'planificacion_carne' ? '#3b82f6' : 'transparent' }}>🥩 Carne y Carniceros</button>
                      <button type="button" onClick={() => handleCambioMenu('planificacion_panaderia')} style={{ ...styles.btnSubNav, backgroundColor: menuActivo === 'planificacion_panaderia' ? '#3b82f6' : 'transparent' }}>🥖 Panadería y Lácteos</button>
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => handleCambioMenu('soporte')} style={{ ...styles.btnNav, backgroundColor: menuActivo === 'soporte' ? '#2563eb' : 'transparent' }}>📣 Avisos y Soporte</button>
              </>
            )}
          </nav>
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid #334155', backgroundColor: '#0f172a' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{usuarioActual.nombre} {usuarioActual.apellido}</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>{usuarioActual.email}</div>
          <button type="button" onClick={handleLogout} style={styles.btnDanger}>Cerrar Sesión</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {menuActivo === 'empleados' && rolUpper !== 'EMPLEADO' && (
          <UsuariosView 
            usuarioActual={usuarioActual} 
            empleados={empleados} 
            onReload={cargarEmpleados}
            styles={styles}
          />
        )}
        {menuActivo === 'notificaciones' && (
          <NotificacionesView 
            usuarioActual={usuarioActual} 
            empleados={empleados} 
            notificaciones={notificaciones}
            cargarNotificaciones={cargarNotificaciones}
            styles={styles}
          />
        )}
        {menuActivo === 'planificacion_salon' && (
          <PlanificacionSectorView tituloSector="🏬 SALÓN Y CAJAS" colorBadge="#38bdf8" usuarioActual={usuarioActual} styles={styles} />
        )}
        {menuActivo === 'planificacion_carne' && (
          <PlanificacionSectorView tituloSector="🥩 CARNE Y CARNICEROS" colorBadge="#ef4444" usuarioActual={usuarioActual} styles={styles} />
        )}
        {menuActivo === 'planificacion_panaderia' && (
          <PlanificacionSectorView tituloSector="🥖 PANADERÍA Y LÁCTEOS" colorBadge="#facc15" usuarioActual={usuarioActual} styles={styles} />
        )}
        {menuActivo === 'soporte' && (
          <SoporteView usuarioActual={usuarioActual} />
        )}
      </main>
    </div>
  ); 
}