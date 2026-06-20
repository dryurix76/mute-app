import { supabase } from "./supabaseClient";

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return data.subscription;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function updateEmail(newEmail) {
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) throw error;
}

// Perfiles (datos extra: teléfono, correo de recuperación, sheet conectado)
export async function getPerfiles() {
  const { data, error } = await supabase.from("perfiles").select("*");
  if (error) throw error;
  return data;
}

export async function actualizarPerfil(nombre, campos) {
  const { data, error } = await supabase
    .from("perfiles")
    .update(campos)
    .eq("nombre", nombre)
    .select()
    .single();
  if (error) throw error;
  return data;
}
