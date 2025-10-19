// Edge Function para crear usuarios de forma segura
// Solo los administradores pueden crear nuevos usuarios

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejar CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Crear cliente de Supabase con privilegios de admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Obtener el token del usuario que hace la petición
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No autorizado')
    }

    // Verificar que el usuario actual es admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      throw new Error('No autorizado')
    }

    // Obtener el perfil del usuario para verificar el rol
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile.role !== 'admin') {
      throw new Error('Solo los administradores pueden crear usuarios')
    }

    // Obtener datos del body
    const { email, password, fullName, role } = await req.json()

    // Validaciones
    if (!email || !password || !fullName || !role) {
      throw new Error('Faltan campos requeridos')
    }

    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres')
    }

    if (!['admin', 'moderador'].includes(role)) {
      throw new Error('Rol inválido')
    }

    // 1. Crear usuario en Auth
    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        full_name: fullName
      }
    })

    if (authError) {
      console.error('Error creando usuario en auth:', authError)
      throw new Error(`Error al crear usuario: ${authError.message}`)
    }

    // 2. Crear perfil en la tabla profiles
    const { data: newProfile, error: profileInsertError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: newUser.user.id,
          email: email,
          full_name: fullName,
          role: role,
          is_active: true
        }
      ])
      .select()
      .single()

    if (profileInsertError) {
      console.error('Error creando perfil:', profileInsertError)

      // Si falla crear el perfil, eliminar el usuario de Auth
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)

      throw new Error(`Error al crear perfil: ${profileInsertError.message}`)
    }

    console.log('✅ Usuario creado exitosamente:', email)

    return new Response(
      JSON.stringify({
        success: true,
        data: newProfile,
        message: 'Usuario creado exitosamente'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('❌ Error en create-user:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
