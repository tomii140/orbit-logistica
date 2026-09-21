import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './config/supabaseClient';
import SoporteView from './views/SoporteView';
import NotificacionesView from './views/NotificacionesView';
import UsuariosView from './views/UsuariosView';
import PlanificacionSectorView from './views/PlanificacionSectorView';
import OrbitLogo from './components/OrbitLogo';
import TALogo from './components/TALogo';
import { themeStyles } from './styles/theme';

const ADMIN_EMAIL_MAESTRO = "tomasaguero140@gmail.com";

export default function App() {
  const [modoAcceso, setModoAcceso] = useState(null);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorLogin, setErrorLogin] = useState('');

  const [menuActivo, setMenuActivo] = useState('notificaciones');
  const [submenuPlanificacion, setSubmenuPlanificacion] = useState(true);
  const [empleados, setEmpleados] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);

  const sincronizarUsuarioGoogle = useCallback(async (emailUser) => {
    if (!emailUser) return null;
    try {
      const cleanEmail = emailUser.toLowerCase().trim();

      let { data, error } = await supabase
        .from('empleados')
        .select('*')
        .eq('email', cleanEmail)
        .eq('activo', true)
        .maybeSingle();

      if (error) console.error("Error al consultar empleados:", error);

      if (!data) {
        await supabase.auth.signOut();
        alert(`Acceso no autorizado: El correo ${cleanEmail} no está registrado o fue deshabilitado.`);
        return null;
      }

      if (cleanEmail === ADMIN_EMAIL_MAESTRO.toLowerCase()) {
        data.rol = 'ADMIN';
      } else if (data.rol) {
        data.rol = data.rol.toUpperCase();
      }

      return data;
    } catch (err) {
      console.error("Error validando usuario:", err);
      await supabase.auth.signOut();
      return null;
    }
  }, []);

  const cargarEmpleados = useCallback(async () => {
    const { data, error } = await supabase
      .from('empleados')
      .select('*')
      .eq('activo', true)
      .order('nombre');

    if (!error) {
      setEmpleados(data || []);
    } else {
      console.error("Error al cargar empleados:", error);
    }
  }, []);

  const cargarNotificaciones = useCallback(async () => {
    if (!usuarioActual) return;
    let query = supabase
      .from('notificaciones')
      .select('*, empleados(nombre, apellido, email)')
      .order('fecha_envio', { ascending: false });

    if (usuarioActual.rol === 'EMPLEADO') {
      query = query.eq('empleado_id', usuarioActual.id);
    }

    const { data, error } = await query;
    if (!error) {
      setNotificaciones(data || []);
    } else {
      console.error("Error al cargar notificaciones:", error);
    }
  }, [usuarioActual]);

  const aplicarPerfilUsuario = useCallback((userProfile) => {
    if (userProfile) {
      const rolNormalizado = (userProfile.rol || 'EMPLEADO').toUpperCase();
      setUsuarioActual({ ...userProfile, rol: rolNormalizado });
      setModoAcceso(rolNormalizado);

      if (rolNormalizado === 'ADMIN') {
        setMenuActivo('empleados');
      } else {
        setMenuActivo('notificaciones');
      }
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
        console.error("Error al obtener sesión:", err);
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

  // Pantalla de Carga con Animación de Giro Continuo
  if (loading) {
    return (
      <div style={{ ...themeStyles.container, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <OrbitLogo size={56} spinning={true} />
          <p style={{ color: '#a19ea5', marginTop: '20px', letterSpacing: '3px', fontSize: '11px', textTransform: 'uppercase' }}>
            INICIANDO ECOSISTEMA ORBIT...
          </p>
        </div>
      </div>
    );
  }

  // Selección de Portal
  if (!modoAcceso && !usuarioActual) {
    return (
      <div style={{ ...themeStyles.container, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ ...themeStyles.cardSection, textAlign: 'center', maxWidth: '420px', width: '100%', padding: '40px 32px' }}>
          <OrbitLogo size={64} />
          <h1 style={{ ...themeStyles.brandTitle, marginTop: '16px' }}>O R B I T</h1>
          <p style={themeStyles.brandSubtitle}>Operational Management Platform</p>
          
          <div style={{ margin: '32px 0 24px 0', borderTop: '1px solid #22262d', paddingTop: '24px' }}>
            <p style={{ color: '#b0aeb4', fontSize: '11px', marginBottom: '20px', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Seleccioná el portal de acceso:
            </p>
            
            <button 
              type="button" 
              onClick={() => setModoAcceso('ADMIN')} 
              style={{ ...themeStyles.btnPrimary, width: '100%', marginBottom: '12px', padding: '12px', borderColor: '#dcd9d2' }}
            >
              PORTAL ADMINISTRADOR
            </button>
            <button 
              type="button" 
              onClick={() => setModoAcceso('SUPERVISOR')} 
              style={{ ...themeStyles.btnPrimary, width: '100%', marginBottom: '12px', padding: '12px' }}
            >
              PORTAL SUPERVISORES
            </button>
            <button 
              type="button" 
              onClick={() => setModoAcceso('EMPLEADO')} 
              style={{ ...themeStyles.btnPrimary, width: '100%', padding: '12px' }}
            >
              PORTAL EMPLEADOS
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '32px' }}>
            <TALogo size={20} color="#a19ea5" />
            <span style={{ fontSize: '9px', letterSpacing: '2px', color: '#a19ea5', textTransform: 'uppercase' }}>
              TA Industrias Digitales
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Login Google
  if (!usuarioActual) {
    return (
      <div style={{ ...themeStyles.container, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ ...themeStyles.cardSection, textAlign: 'center', maxWidth: '420px', width: '100%', padding: '40px 32px' }}>
          <button 
            type="button" 
            onClick={() => setModoAcceso(null)} 
            style={{ background: 'none', border: 'none', color: '#a19ea5', cursor: 'pointer', marginBottom: '20px', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' }}
          >
            ← Volver a selección de portal
          </button>
          
          <OrbitLogo size={48} />
          <h3 style={{ ...themeStyles.brandTitle, fontSize: '18px', marginTop: '16px' }}>ACCESO {modoAcceso?.toUpperCase()}</h3>
          <p style={{ color: '#b0aeb4', fontSize: '12px', margin: '16px 0 24px 0', lineHeight: '1.5' }}>
            Iniciá sesión con tu cuenta de Google institucional para validar tus permisos en la plataforma.
          </p>

          {errorLogin && <p style={{ color: '#f87171', fontSize: '12px', marginBottom: '16px' }}>{errorLogin}</p>}

          <button 
            type="button" 
            onClick={handleGoogleLogin} 
            style={{ ...themeStyles.btnPrimary, width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', borderColor: '#dcd9d2' }}
          >
            CONTINUAR CON GOOGLE
          </button>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '32px' }}>
            <TALogo size={18} color="#a19ea5" />
            <span style={{ fontSize: '9px', letterSpacing: '2px', color: '#a19ea5', textTransform: 'uppercase' }}>
              TA Industrias Digitales
            </span>
          </div>
        </div>
      </div>
    );
  }

  const rolUpper = (usuarioActual.rol || 'EMPLEADO').toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#121417', color: '#dcd9d2', fontFamily: "'Montserrat', sans-serif" }}>
      
      {/* Sidebar Corporativo Sin Emojis */}
      <aside style={{ width: '280px', backgroundColor: '#181b20', borderRight: '1px solid #22262d', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ padding: '24px 20px', borderBottom: '1px solid #22262d', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <OrbitLogo size={36} />
            <div>
              <h2 style={{ fontSize: '16px', margin: 0, fontWeight: '500', letterSpacing: '4px', color: '#dcd9d2' }}>O R B I T</h2>
              <span style={{ fontSize: '9px', color: '#a19ea5', letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginTop: '2px' }}>
                ROL: <b style={{ color: rolUpper === 'ADMIN' ? '#dcd9d2' : '#b0aeb4' }}>{rolUpper}</b>
              </span>
            </div>
          </div>

          <nav style={{ padding: '20px 12px' }}>
            {rolUpper === 'ADMIN' && (
              <button 
                type="button" 
                onClick={() => handleCambioMenu('empleados')} 
                style={{
                  ...themeStyles.btnPrimary,
                  width: '100%',
                  textAlign: 'left',
                  marginBottom: '8px',
                  backgroundColor: menuActivo === 'empleados' ? '#22262d' : 'transparent',
                  borderColor: menuActivo === 'empleados' ? '#dcd9d2' : 'transparent'
                }}
              >
                ALTA Y GESTIÓN DE USUARIOS
              </button>
            )}

            <button 
              type="button" 
              onClick={() => handleCambioMenu('notificaciones')} 
              style={{
                ...themeStyles.btnPrimary,
                width: '100%',
                textAlign: 'left',
                marginBottom: '8px',
                backgroundColor: menuActivo === 'notificaciones' ? '#22262d' : 'transparent',
                borderColor: menuActivo === 'notificaciones' ? '#dcd9d2' : 'transparent'
              }}
            >
              {rolUpper === 'EMPLEADO' ? 'MIS NOTIFICACIONES' : 'NOTIFICACIONES Y ENVÍOS'}
            </button>

            <div style={{ marginBottom: '8px' }}>
              <button 
                type="button" 
                onClick={() => setSubmenuPlanificacion(!submenuPlanificacion)} 
                style={{
                  ...themeStyles.btnPrimary,
                  width: '100%',
                  textAlign: 'left',
                  backgroundColor: 'transparent',
                  borderColor: 'transparent',
                  color: '#a19ea5',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{rolUpper === 'EMPLEADO' ? 'VER PLANIFICACIONES' : 'PLANIFICACIONES'}</span>
                <span style={{ fontSize: '9px' }}>{submenuPlanificacion ? '▼' : '▶'}</span>
              </button>
              
              {submenuPlanificacion && (
                <div style={{ paddingLeft: '12px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button 
                    type="button" 
                    onClick={() => handleCambioMenu('planificacion_salon')} 
                    style={{
                      ...themeStyles.btnPrimary,
                      fontSize: '10px',
                      padding: '8px 12px',
                      textAlign: 'left',
                      backgroundColor: menuActivo === 'planificacion_salon' ? '#22262d' : 'transparent',
                      borderColor: menuActivo === 'planificacion_salon' ? '#dcd9d2' : 'transparent'
                    }}
                  >
                    SALÓN Y CAJAS
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleCambioMenu('planificacion_carne')} 
                    style={{
                      ...themeStyles.btnPrimary,
                      fontSize: '10px',
                      padding: '8px 12px',
                      textAlign: 'left',
                      backgroundColor: menuActivo === 'planificacion_carne' ? '#22262d' : 'transparent',
                      borderColor: menuActivo === 'planificacion_carne' ? '#dcd9d2' : 'transparent'
                    }}
                  >
                    CARNE Y CARNICEROS
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleCambioMenu('planificacion_panaderia')} 
                    style={{
                      ...themeStyles.btnPrimary,
                      fontSize: '10px',
                      padding: '8px 12px',
                      textAlign: 'left',
                      backgroundColor: menuActivo === 'planificacion_panaderia' ? '#22262d' : 'transparent',
                      borderColor: menuActivo === 'planificacion_panaderia' ? '#dcd9d2' : 'transparent'
                    }}
                  >
                    PANADERÍA Y LÁCTEOS
                  </button>
                </div>
              )}
            </div>

            <button 
              type="button" 
              onClick={() => handleCambioMenu('soporte')} 
              style={{
                ...themeStyles.btnPrimary,
                width: '100%',
                textAlign: 'left',
                backgroundColor: menuActivo === 'soporte' ? '#22262d' : 'transparent',
                borderColor: menuActivo === 'soporte' ? '#dcd9d2' : 'transparent'
              }}
            >
              AVISOS Y SOPORTE
            </button>
          </nav>
        </div>

        <div style={{ padding: '20px 16px', borderTop: '1px solid #22262d', backgroundColor: '#14171a' }}>
          <div style={{ fontSize: '12px', fontWeight: '500', color: '#dcd9d2' }}>
            {usuarioActual.nombre} {usuarioActual.apellido}
          </div>
          <div style={{ fontSize: '10px', color: '#a19ea5', marginBottom: '16px', wordBreak: 'break-all' }}>
            {usuarioActual.email}
          </div>
          <button 
            type="button" 
            onClick={handleLogout} 
            style={{ ...themeStyles.btnDanger, width: '100%', padding: '8px 12px' }}
          >
            CERRAR SESIÓN
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '20px' }}>
            <TALogo size={16} color="#a19ea5" />
            <span style={{ fontSize: '8px', letterSpacing: '2px', color: '#a19ea5', textTransform: 'uppercase' }}>
              TA Industrias Digitales
            </span>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {menuActivo === 'empleados' && rolUpper === 'ADMIN' && (
          <UsuariosView 
            usuarioActual={usuarioActual} 
            empleados={empleados} 
            onReload={cargarEmpleados}
            styles={themeStyles}
          />
        )}
        {menuActivo === 'notificaciones' && (
          <NotificacionesView 
            usuarioActual={usuarioActual} 
            empleados={empleados} 
            notificaciones={notificaciones}
            cargarNotificaciones={cargarNotificaciones}
            styles={themeStyles}
          />
        )}
        {menuActivo === 'planificacion_salon' && (
          <PlanificacionSectorView tituloSector="SALÓN Y CAJAS" colorBadge="#dcd9d2" usuarioActual={usuarioActual} styles={themeStyles} />
        )}
        {menuActivo === 'planificacion_carne' && (
          <PlanificacionSectorView tituloSector="CARNE Y CARNICEROS" colorBadge="#dcd9d2" usuarioActual={usuarioActual} styles={themeStyles} />
        )}
        {menuActivo === 'planificacion_panaderia' && (
          <PlanificacionSectorView tituloSector="PANADERÍA Y LÁCTEOS" colorBadge="#dcd9d2" usuarioActual={usuarioActual} styles={themeStyles} />
        )}
        {menuActivo === 'soporte' && (
          <SoporteView usuarioActual={usuarioActual} styles={themeStyles} />
        )}
      </main>

    </div>
  ); 
}