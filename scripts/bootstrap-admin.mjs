import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const fullName = process.env.ADMIN_NAME ?? "Administrador Vena Digital";

if (!url || !serviceRoleKey || !email || !password) {
  console.error("Faltan variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const { data: created, error: createError } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName, role: "Administrador Vena Digital" }
});

if (createError && !createError.message.includes("already registered")) {
  console.error(createError.message);
  process.exit(1);
}

let userId = created?.user?.id;
if (!userId) {
  const { data: users, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    console.error(listError.message);
    process.exit(1);
  }
  userId = users.users.find((user) => user.email === email)?.id;
}

if (!userId) {
  console.error("No se encontro el usuario administrador");
  process.exit(1);
}

const { error: profileError } = await admin.from("profiles").upsert({
  id: userId,
  full_name: fullName,
  email,
  role: "Administrador Vena Digital",
  organization: "Vena Digital",
  position: "Administrador",
  area: "Consultoria",
  status: "Activo"
});

if (profileError) {
  console.error(profileError.message);
  process.exit(1);
}

const { data: modules, error: modulesError } = await admin.from("modules").select("key");
if (modulesError) {
  console.error(modulesError.message);
  process.exit(1);
}

const permissions = modules.map(({ key }) => ({
  profile_id: userId,
  module_key: key,
  can_view: true,
  can_create: true,
  can_edit: true,
  can_delete: true
}));

const { error: permissionsError } = await admin.from("module_permissions").upsert(permissions, { onConflict: "profile_id,module_key" });
if (permissionsError) {
  console.error(permissionsError.message);
  process.exit(1);
}

console.log(`Administrador listo: ${email}`);
