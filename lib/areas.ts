import { areas as demoAreas } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export interface CompanyArea {
  id: string;
  name: string;
}

export async function getCompanyAreas(): Promise<CompanyArea[]> {
  if (!isSupabaseConfigured()) {
    return demoAreas.map((area) => ({ id: area, name: area }));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("areas").select("id, name").order("name");

  if (error || !data) {
    return demoAreas.map((area) => ({ id: area, name: area }));
  }

  return data as CompanyArea[];
}
