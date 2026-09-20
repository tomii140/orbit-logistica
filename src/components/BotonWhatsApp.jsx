import React from 'react';
import { enviarPlanificacionWhatsApp } from '../utils/whatsappHelper';

export function BotonWhatsApp({ listaTareas }) {
  const handleCompartir = () => {
    enviarPlanificacionWhatsApp('', listaTareas);
  };

  return (
    <button 
      onClick={handleCompartir}
      style={{ 
        backgroundColor: '#25D366', 
        color: '#ffffff', 
        border: 'none', 
        padding: '10px 14px', 
        borderRadius: '6px', 
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: '100%',       // Ocupa el ancho disponible en mobile
        maxWidth: '300px',  // Limite en escritorio
        boxSizing: 'border-box'
      }}
    >
      <span>📲</span> Compartir por WhatsApp
    </button>
  );
}

export default BotonWhatsApp;