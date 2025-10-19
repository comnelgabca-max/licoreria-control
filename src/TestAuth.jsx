import { useEffect, useState } from 'react';
import { supabase } from './services/supabase';

function TestAuth() {
  const [status, setStatus] = useState('Verificando conexión...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test 1: Verificar conexión a Supabase
        const { data, error: supabaseError } = await supabase.auth.getSession();

        if (supabaseError) {
          setError(`Error de Supabase: ${supabaseError.message}`);
          return;
        }

        setStatus('✅ Conexión a Supabase OK');

        // Test 2: Verificar tabla profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .limit(1);

        if (profilesError) {
          setError(`Error al leer profiles: ${profilesError.message}`);
          return;
        }

        setStatus('✅ Todo funciona correctamente!');
      } catch (err) {
        setError(`Error general: ${err.message}`);
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🔧 Test de Conexión</h1>
      <p><strong>Estado:</strong> {status}</p>
      {error && (
        <div style={{ color: 'red', background: '#fee', padding: '10px', borderRadius: '5px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <hr style={{ margin: '20px 0' }} />

      <h2>Probar Login Manual</h2>
      <button
        onClick={async () => {
          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: 'comnelgabca@gmail.com',
              password: '22287027'
            });

            if (error) {
              alert('❌ Error: ' + error.message);
            } else {
              alert('✅ Login exitoso!');
              console.log('Usuario:', data.user);
            }
          } catch (err) {
            alert('❌ Error: ' + err.message);
          }
        }}
        style={{
          padding: '10px 20px',
          background: '#0066cc',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Probar Login
      </button>
    </div>
  );
}

export default TestAuth;
