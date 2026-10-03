import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DeveloperProfile, EMPTY_DEVELOPER_PROFILE } from "@/types/developerProfile";

export const useDeveloperProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [exists, setExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      setExists(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("developer_profiles" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      if (data) {
        const d = data as any;
        setProfile({
          id: d.id,
          user_id: d.user_id,
          full_name: d.full_name || "",
          entity_name: d.entity_name || "",
          professional_title: d.professional_title || "",
          bio: d.bio || "",
          phone: d.phone || "",
          email: d.email || user.email || "",
          licenses: Array.isArray(d.licenses) ? d.licenses : [],
          certifications: Array.isArray(d.certifications) ? d.certifications : [],
          years_experience: d.years_experience ?? null,
          headshot_url: d.headshot_url || "",
          portfolio: Array.isArray(d.portfolio) ? d.portfolio : [],
        });
        setExists(true);
      } else {
        setProfile({ ...EMPTY_DEVELOPER_PROFILE, email: user.email || "" });
        setExists(false);
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [user, authLoading]);

  const save = async (data: DeveloperProfile) => {
    if (!user) throw new Error("Not authenticated");
    const payload: any = {
      user_id: user.id,
      full_name: data.full_name || null,
      entity_name: data.entity_name || null,
      professional_title: data.professional_title || null,
      bio: data.bio || null,
      phone: data.phone || null,
      email: data.email || user.email || null,
      licenses: data.licenses || [],
      certifications: data.certifications || [],
      years_experience: data.years_experience,
      headshot_url: data.headshot_url || null,
      portfolio: data.portfolio || [],
    };
    const { error } = await supabase
      .from("developer_profiles" as any)
      .upsert(payload, { onConflict: "user_id" });
    if (error) throw error;
    setProfile(data);
    setExists(true);
  };

  return { profile, setProfile, exists, loading: loading || authLoading, save };
};
