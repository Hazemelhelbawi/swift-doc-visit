import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Save,
  User,
  Image,
  Stethoscope,
  GraduationCap,
  Award,
  Heart,
  Plus,
  Trash2,
  Loader2,
  Palette,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ImageUpload } from "@/components/admin/ImageUpload";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useDoctor } from "@/contexts/DoctorContext";

interface Education {
  degree: string;
  degree_ar: string;
  institution: string;
  institution_ar: string;
  year: string;
}

interface LocalizedText {
  en: string;
  ar: string;
}

interface DoctorProfile {
  name: string;
  name_ar: string;
  specialty: string;
  specialty_ar: string;
  image_url?: string;
  experience_years: number;
  patients_count: number;
  rating: number;
  philosophy: string;
  philosophy_ar: string;
  description?: string;
  description_ar?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
  contact_address_ar?: string;
  working_hours?: string;
  working_hours_ar?: string;
  education: Education[];
  specializations: LocalizedText[];
  achievements: LocalizedText[];
}

interface HeroContent {
  title: string;
  title_ar: string;
  subtitle: string;
  subtitle_ar: string;
  tagline: string;
  tagline_ar: string;
  image_url?: string;
}

interface ServiceItem {
  icon: string;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
}

interface ServicesContent {
  items: ServiceItem[];
}

interface ThemeSettings {
  primary_color: string;
  accent_color: string;
}

export default function AdminSettings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { doctorId } = useDoctor();

  // Fetch data with doctor_id filter
  const { data: doctorProfileData, isLoading: loadingDoctor } = useQuery({
    queryKey: ["site-settings", "doctor_profile", doctorId],
    queryFn: async () => {
      if (!doctorId) return null;
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "doctor_profile")
        .eq("doctor_id", doctorId)
        .maybeSingle();
      if (error) throw error;
      return data?.value as unknown as DoctorProfile | null;
    },
    enabled: !!doctorId,
  });

  const { data: heroContentData, isLoading: loadingHero } = useQuery({
    queryKey: ["site-settings", "hero_content", doctorId],
    queryFn: async () => {
      if (!doctorId) return null;
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "hero_content")
        .eq("doctor_id", doctorId)
        .maybeSingle();
      if (error) throw error;
      return data?.value as unknown as HeroContent | null;
    },
    enabled: !!doctorId,
  });

  const { data: servicesContentData, isLoading: loadingServices } = useQuery({
    queryKey: ["site-settings", "services", doctorId],
    queryFn: async () => {
      if (!doctorId) return null;
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "services")
        .eq("doctor_id", doctorId)
        .maybeSingle();
      if (error) throw error;
      return data?.value as unknown as ServicesContent | null;
    },
    enabled: !!doctorId,
  });

  const { data: themeData, isLoading: loadingTheme } = useQuery({
    queryKey: ["site-settings", "theme_settings", doctorId],
    queryFn: async () => {
      if (!doctorId) return null;
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "theme_settings")
        .eq("doctor_id", doctorId)
        .maybeSingle();
      if (error) throw error;
      const value = data?.value as unknown as Record<string, string> | null;
      return {
        primary_color: value?.primary_color || "#1DAFA1",
        accent_color: value?.accent_color || "#E8655A",
      };
    },
    enabled: !!doctorId,
  });

  const defaultDoctor: DoctorProfile = {
    name: "",
    name_ar: "",
    specialty: "",
    specialty_ar: "",
    image_url: "",
    experience_years: 0,
    patients_count: 0,
    rating: 5,
    philosophy: "",
    philosophy_ar: "",
    description: "",
    description_ar: "",
    contact_phone: "",
    contact_email: "",
    contact_address: "",
    contact_address_ar: "",
    working_hours: "",
    working_hours_ar: "",
    education: [],
    specializations: [],
    achievements: [],
  };

  const defaultHero: HeroContent = {
    title: "",
    title_ar: "",
    subtitle: "",
    subtitle_ar: "",
    tagline: "",
    tagline_ar: "",
    image_url: "",
  };

  const defaultServices: ServicesContent = { items: [] };

  const [doctor, setDoctor] = useState<DoctorProfile>(defaultDoctor);
  const [hero, setHero] = useState<HeroContent>(defaultHero);
  const [services, setServices] = useState<ServicesContent>(defaultServices);
  const [theme, setTheme] = useState<ThemeSettings>({
    primary_color: "#1DAFA1",
    accent_color: "#E8655A",
  });

  // Sync state with loaded data — merge with defaults so missing fields get initial values
  useEffect(() => {
    if (doctorProfileData)
      setDoctor({ ...defaultDoctor, ...doctorProfileData });
  }, [doctorProfileData]);

  useEffect(() => {
    if (heroContentData) setHero({ ...defaultHero, ...heroContentData });
  }, [heroContentData]);

  useEffect(() => {
    if (servicesContentData)
      setServices({ ...defaultServices, ...servicesContentData });
  }, [servicesContentData]);

  useEffect(() => {
    if (themeData) setTheme(themeData);
  }, [themeData]);

  const updateMutation = useMutation({
    mutationFn: async ({
      key,
      value,
    }: {
      key: string;
      value: DoctorProfile | HeroContent | ServicesContent | ThemeSettings;
    }) => {
      if (!doctorId) throw new Error("No doctor context");

      // First try to update existing record
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", key)
        .eq("doctor_id", doctorId)
        .maybeSingle();

      if (existing) {
        // Update existing record and return updated row to verify
        const { data, error } = await supabase
          .from("site_settings")
          .update({ value: value as unknown as Json })
          .eq("key", key)
          .eq("doctor_id", doctorId)
          .select();
        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error(
            "Update failed — no rows were affected. Please check your permissions.",
          );
        }
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from("site_settings")
          .insert({
            key,
            value: value as unknown as Json,
            doctor_id: doctorId,
          })
          .select();
        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error(
            "Insert failed — no rows were created. Please check your permissions.",
          );
        }
      }
    },
    onSuccess: async (_, { key }) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["site-settings", key, doctorId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["theme-settings", doctorId],
        }),
      ]);
      await queryClient.refetchQueries({
        queryKey: ["site-settings", key, doctorId],
      });
      toast.success(t("admin.savedSuccessfully"));
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast.error(error.message || t("admin.errorSaving"));
    },
  });

  const handleSaveDoctor = () => {
    updateMutation.mutate({ key: "doctor_profile", value: doctor });
  };

  const handleSaveHero = () => {
    updateMutation.mutate({ key: "hero_content", value: hero });
  };

  const handleSaveServices = () => {
    updateMutation.mutate({ key: "services", value: services });
  };

  const handleSaveTheme = () => {
    updateMutation.mutate({ key: "theme_settings", value: theme });
  };

  const addEducation = () => {
    setDoctor({
      ...doctor,
      education: [
        ...(doctor.education || []),
        {
          degree: "",
          degree_ar: "",
          institution: "",
          institution_ar: "",
          year: "",
        },
      ],
    });
  };

  const removeEducation = (index: number) => {
    setDoctor({
      ...doctor,
      education: doctor.education.filter((_, i) => i !== index),
    });
  };

  const addSpecialization = () => {
    setDoctor({
      ...doctor,
      specializations: [...(doctor.specializations || []), { en: "", ar: "" }],
    });
  };

  const removeSpecialization = (index: number) => {
    setDoctor({
      ...doctor,
      specializations: doctor.specializations.filter((_, i) => i !== index),
    });
  };

  const addAchievement = () => {
    setDoctor({
      ...doctor,
      achievements: [...(doctor.achievements || []), { en: "", ar: "" }],
    });
  };

  const removeAchievement = (index: number) => {
    setDoctor({
      ...doctor,
      achievements: doctor.achievements.filter((_, i) => i !== index),
    });
  };

  const addService = () => {
    setServices({
      items: [
        ...(services.items || []),
        {
          icon: "Stethoscope",
          title: "",
          title_ar: "",
          description: "",
          description_ar: "",
        },
      ],
    });
  };

  const removeService = (index: number) => {
    setServices({
      items: services.items.filter((_, i) => i !== index),
    });
  };

  const isLoading =
    loadingDoctor || loadingHero || loadingServices || loadingTheme;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {t("admin.settings")}
          </h2>
          <p className="text-muted-foreground">
            {t("admin.settingsDescription")}
          </p>
        </div>

        <Tabs defaultValue="doctor" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-2">
            <TabsTrigger value="doctor" className="gap-2">
              <User className="h-4 w-4" />
              {t("admin.doctorProfile")}
            </TabsTrigger>
            <TabsTrigger value="hero" className="gap-2">
              <Image className="h-4 w-4" />
              {t("admin.heroSection")}
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-2">
              <Stethoscope className="h-4 w-4" />
              {t("admin.services")}
            </TabsTrigger>
            <TabsTrigger value="theme" className="gap-2">
              <Palette className="h-4 w-4" />
              {t("admin.theme") || "Theme"}
            </TabsTrigger>
          </TabsList>

          {/* Doctor Profile Tab */}
          <TabsContent value="doctor" className="space-y-6">
            {doctor && (
              <>
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {t("admin.basicInfo")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t("admin.doctorName")} (EN)</Label>
                      <Input
                        value={doctor.name}
                        onChange={(e) =>
                          setDoctor({ ...doctor, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("admin.doctorName")} (AR)</Label>
                      <Input
                        value={doctor.name_ar}
                        onChange={(e) =>
                          setDoctor({ ...doctor, name_ar: e.target.value })
                        }
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("admin.specialty")} (EN)</Label>
                      <Input
                        value={doctor.specialty}
                        onChange={(e) =>
                          setDoctor({ ...doctor, specialty: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("admin.specialty")} (AR)</Label>
                      <Input
                        value={doctor.specialty_ar}
                        onChange={(e) =>
                          setDoctor({ ...doctor, specialty_ar: e.target.value })
                        }
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("admin.experienceYears")}</Label>
                      <Input
                        type="number"
                        value={doctor.experience_years}
                        onChange={(e) =>
                          setDoctor({
                            ...doctor,
                            experience_years: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("admin.patientsCount")}</Label>
                      <Input
                        type="number"
                        value={doctor.patients_count}
                        onChange={(e) =>
                          setDoctor({
                            ...doctor,
                            patients_count: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("admin.rating")}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={doctor.rating}
                        onChange={(e) =>
                          setDoctor({
                            ...doctor,
                            rating: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("admin.imageUrl")}</Label>
                      <ImageUpload
                        value={doctor.image_url}
                        onChange={(url) =>
                          setDoctor({ ...doctor, image_url: url })
                        }
                        folder="profiles"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Education */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        {t("admin.education")}
                      </CardTitle>
                    </div>
                    <Button size="sm" variant="outline" onClick={addEducation}>
                      <Plus className="h-4 w-4 mr-1" />
                      {t("admin.add")}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {doctor.education.map((edu, index) => (
                      <div
                        key={index}
                        className="grid gap-4 p-4 border rounded-lg relative"
                      >
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-2 right-2 h-8 w-8 text-destructive"
                          onClick={() => removeEducation(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>{t("admin.degree")} (EN)</Label>
                            <Input
                              value={edu.degree}
                              onChange={(e) => {
                                const newEdu = [...doctor.education];
                                newEdu[index].degree = e.target.value;
                                setDoctor({ ...doctor, education: newEdu });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t("admin.degree")} (AR)</Label>
                            <Input
                              value={edu.degree_ar}
                              onChange={(e) => {
                                const newEdu = [...doctor.education];
                                newEdu[index].degree_ar = e.target.value;
                                setDoctor({ ...doctor, education: newEdu });
                              }}
                              dir="rtl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t("admin.institution")} (EN)</Label>
                            <Input
                              value={edu.institution}
                              onChange={(e) => {
                                const newEdu = [...doctor.education];
                                newEdu[index].institution = e.target.value;
                                setDoctor({ ...doctor, education: newEdu });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t("admin.institution")} (AR)</Label>
                            <Input
                              value={edu.institution_ar}
                              onChange={(e) => {
                                const newEdu = [...doctor.education];
                                newEdu[index].institution_ar = e.target.value;
                                setDoctor({ ...doctor, education: newEdu });
                              }}
                              dir="rtl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t("admin.year")}</Label>
                            <Input
                              value={edu.year}
                              onChange={(e) => {
                                const newEdu = [...doctor.education];
                                newEdu[index].year = e.target.value;
                                setDoctor({ ...doctor, education: newEdu });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Specializations */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Stethoscope className="h-5 w-5" />
                        {t("admin.specializations")}
                      </CardTitle>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={addSpecialization}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {t("admin.add")}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {doctor.specializations.map((spec, index) => (
                      <div key={index} className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                          <Label>EN</Label>
                          <Input
                            value={spec.en}
                            onChange={(e) => {
                              const newSpec = [...doctor.specializations];
                              newSpec[index].en = e.target.value;
                              setDoctor({
                                ...doctor,
                                specializations: newSpec,
                              });
                            }}
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label>AR</Label>
                          <Input
                            value={spec.ar}
                            onChange={(e) => {
                              const newSpec = [...doctor.specializations];
                              newSpec[index].ar = e.target.value;
                              setDoctor({
                                ...doctor,
                                specializations: newSpec,
                              });
                            }}
                            dir="rtl"
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => removeSpecialization(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Achievements */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        {t("admin.achievements")}
                      </CardTitle>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={addAchievement}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {t("admin.add")}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {doctor.achievements.map((ach, index) => (
                      <div key={index} className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                          <Label>EN</Label>
                          <Input
                            value={ach.en}
                            onChange={(e) => {
                              const newAch = [...doctor.achievements];
                              newAch[index].en = e.target.value;
                              setDoctor({ ...doctor, achievements: newAch });
                            }}
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label>AR</Label>
                          <Input
                            value={ach.ar}
                            onChange={(e) => {
                              const newAch = [...doctor.achievements];
                              newAch[index].ar = e.target.value;
                              setDoctor({ ...doctor, achievements: newAch });
                            }}
                            dir="rtl"
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => removeAchievement(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Philosophy */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      {t("admin.philosophy")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>EN</Label>
                      <Textarea
                        value={doctor.philosophy}
                        onChange={(e) =>
                          setDoctor({ ...doctor, philosophy: e.target.value })
                        }
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>AR</Label>
                      <Textarea
                        value={doctor.philosophy_ar}
                        onChange={(e) =>
                          setDoctor({
                            ...doctor,
                            philosophy_ar: e.target.value,
                          })
                        }
                        rows={4}
                        dir="rtl"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Description & Contact */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {t("admin.descriptionContact") || "Description & Contact"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label>{t("admin.aboutDescription")} (EN)</Label>
                      <Textarea
                        value={doctor.description || ""}
                        onChange={(e) =>
                          setDoctor({ ...doctor, description: e.target.value })
                        }
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>{t("admin.aboutDescription")} (AR)</Label>
                      <Textarea
                        value={doctor.description_ar || ""}
                        onChange={(e) =>
                          setDoctor({
                            ...doctor,
                            description_ar: e.target.value,
                          })
                        }
                        rows={3}
                        dir="rtl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t("admin.contactPhone")}</Label>
                      <Input
                        value={doctor.contact_phone || ""}
                        onChange={(e) =>
                          setDoctor({
                            ...doctor,
                            contact_phone: e.target.value,
                          })
                        }
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("admin.contactEmail")}</Label>
                      <Input
                        value={doctor.contact_email || ""}
                        onChange={(e) =>
                          setDoctor({
                            ...doctor,
                            contact_email: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t("admin.contactAddress")} (EN)</Label>
                      <Input
                        value={doctor.contact_address || ""}
                        onChange={(e) =>
                          setDoctor({
                            ...doctor,
                            contact_address: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("admin.contactAddress")} (AR)</Label>
                      <Input
                        value={doctor.contact_address_ar || ""}
                        onChange={(e) =>
                          setDoctor({
                            ...doctor,
                            contact_address_ar: e.target.value,
                          })
                        }
                        dir="rtl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t("admin.workingHours")} (EN)</Label>
                      <Input
                        value={doctor.working_hours || ""}
                        onChange={(e) =>
                          setDoctor({
                            ...doctor,
                            working_hours: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("admin.workingHours")} (AR)</Label>
                      <Input
                        value={doctor.working_hours_ar || ""}
                        onChange={(e) =>
                          setDoctor({
                            ...doctor,
                            working_hours_ar: e.target.value,
                          })
                        }
                        dir="rtl"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={handleSaveDoctor}
                  disabled={updateMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending
                    ? t("common.saving")
                    : t("admin.saveChanges")}
                </Button>
              </>
            )}
          </TabsContent>

          {/* Hero Section Tab */}
          <TabsContent value="hero" className="space-y-6">
            {hero && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    {t("admin.heroSection")}
                  </CardTitle>
                  <CardDescription>
                    {t("admin.heroDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("admin.tagline")} (EN)</Label>
                    <Input
                      value={hero.tagline}
                      onChange={(e) =>
                        setHero({ ...hero, tagline: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("admin.tagline")} (AR)</Label>
                    <Input
                      value={hero.tagline_ar}
                      onChange={(e) =>
                        setHero({ ...hero, tagline_ar: e.target.value })
                      }
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("admin.heroTitle")} (EN)</Label>
                    <Input
                      value={hero.title}
                      onChange={(e) =>
                        setHero({ ...hero, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("admin.heroTitle")} (AR)</Label>
                    <Input
                      value={hero.title_ar}
                      onChange={(e) =>
                        setHero({ ...hero, title_ar: e.target.value })
                      }
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>{t("admin.heroSubtitle")} (EN)</Label>
                    <Textarea
                      value={hero.subtitle}
                      onChange={(e) =>
                        setHero({ ...hero, subtitle: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>{t("admin.heroSubtitle")} (AR)</Label>
                    <Textarea
                      value={hero.subtitle_ar}
                      onChange={(e) =>
                        setHero({ ...hero, subtitle_ar: e.target.value })
                      }
                      rows={3}
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>{t("admin.heroImage")}</Label>
                    <ImageUpload
                      value={hero.image_url}
                      onChange={(url) => setHero({ ...hero, image_url: url })}
                      folder="hero"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
            <Button
              onClick={handleSaveHero}
              disabled={updateMutation.isPending}
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending
                ? t("common.saving")
                : t("admin.saveChanges")}
            </Button>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            {services && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Stethoscope className="h-5 w-5" />
                      {t("admin.services")}
                    </CardTitle>
                    <CardDescription>
                      {t("admin.servicesDescription")}
                    </CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={addService}>
                    <Plus className="h-4 w-4 mr-1" />
                    {t("admin.add")}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {services.items.map((service, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg relative space-y-4"
                    >
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 h-8 w-8 text-destructive"
                        onClick={() => removeService(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>{t("admin.serviceTitle")} (EN)</Label>
                          <Input
                            value={service.title}
                            onChange={(e) => {
                              const newServices = [...services.items];
                              newServices[index].title = e.target.value;
                              setServices({ items: newServices });
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("admin.serviceTitle")} (AR)</Label>
                          <Input
                            value={service.title_ar}
                            onChange={(e) => {
                              const newServices = [...services.items];
                              newServices[index].title_ar = e.target.value;
                              setServices({ items: newServices });
                            }}
                            dir="rtl"
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label>{t("admin.serviceDescription")} (EN)</Label>
                          <Textarea
                            value={service.description}
                            onChange={(e) => {
                              const newServices = [...services.items];
                              newServices[index].description = e.target.value;
                              setServices({ items: newServices });
                            }}
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label>{t("admin.serviceDescription")} (AR)</Label>
                          <Textarea
                            value={service.description_ar}
                            onChange={(e) => {
                              const newServices = [...services.items];
                              newServices[index].description_ar =
                                e.target.value;
                              setServices({ items: newServices });
                            }}
                            rows={2}
                            dir="rtl"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            <Button
              onClick={handleSaveServices}
              disabled={updateMutation.isPending}
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending
                ? t("common.saving")
                : t("admin.saveChanges")}
            </Button>
          </TabsContent>

          {/* Theme Tab */}
          <TabsContent value="theme" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  {t("admin.themeColors") || "Theme Colors"}
                </CardTitle>
                <CardDescription>
                  {t("admin.themeDescription") ||
                    "Customize your website colors. Changes will apply across all pages."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <Label>{t("admin.primaryColor") || "Primary Color"}</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={theme.primary_color}
                        onChange={(e) =>
                          setTheme({ ...theme, primary_color: e.target.value })
                        }
                        className="w-16 h-10 rounded-lg border border-border cursor-pointer"
                      />
                      <Input
                        value={theme.primary_color}
                        onChange={(e) =>
                          setTheme({ ...theme, primary_color: e.target.value })
                        }
                        placeholder="#1DAFA1"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("admin.primaryColorHint") ||
                        "Used for buttons, links, and accents"}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Label>{t("admin.accentColor") || "Accent Color"}</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={theme.accent_color}
                        onChange={(e) =>
                          setTheme({ ...theme, accent_color: e.target.value })
                        }
                        className="w-16 h-10 rounded-lg border border-border cursor-pointer"
                      />
                      <Input
                        value={theme.accent_color}
                        onChange={(e) =>
                          setTheme({ ...theme, accent_color: e.target.value })
                        }
                        placeholder="#E8655A"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("admin.accentColorHint") ||
                        "Used for highlights and secondary elements"}
                    </p>
                  </div>
                </div>

                {/* Color Preview */}
                <div className="p-6 rounded-xl border border-border bg-muted/30">
                  <p className="text-sm font-medium mb-4">
                    {t("admin.colorPreview") || "Preview"}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <div
                      className="w-20 h-20 rounded-lg shadow-md flex items-center justify-center text-white text-xs font-medium"
                      style={{ backgroundColor: theme.primary_color }}
                    >
                      Primary
                    </div>
                    <div
                      className="w-20 h-20 rounded-lg shadow-md flex items-center justify-center text-white text-xs font-medium"
                      style={{ backgroundColor: theme.accent_color }}
                    >
                      Accent
                    </div>
                    <div className="flex-1 p-4 bg-card rounded-lg border border-border">
                      <button
                        className="px-4 py-2 rounded-md text-white text-sm font-medium"
                        style={{ backgroundColor: theme.primary_color }}
                      >
                        {t("admin.sampleButton") || "Sample Button"}
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Button
              onClick={handleSaveTheme}
              disabled={updateMutation.isPending}
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending
                ? t("common.saving")
                : t("admin.saveChanges")}
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
