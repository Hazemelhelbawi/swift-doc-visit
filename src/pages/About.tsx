import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Award,
  Heart,
  Stethoscope,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDoctorProfile } from "@/hooks/useSiteSettings";

const About = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const { data: doctorProfile, isLoading } = useDoctorProfile();

  // Use data from settings or fallback
  const doctorName = isArabic
    ? doctorProfile?.name_ar
    : doctorProfile?.name || "Dr. Sarah Mitchell";
  const specialty = isArabic
    ? doctorProfile?.specialty_ar
    : doctorProfile?.specialty || "Internal Medicine Specialist";
  const philosophy = isArabic
    ? doctorProfile?.philosophy_ar
    : doctorProfile?.philosophy || t("about.philosophyText");

  const education = doctorProfile?.education?.map((edu) => ({
    degree: isArabic ? edu.degree_ar : edu.degree,
    institution: isArabic ? edu.institution_ar : edu.institution,
    year: edu.year,
  })) || [
    {
      degree: "M.D. in Internal Medicine",
      institution: "Johns Hopkins University",
      year: "2008",
    },
    {
      degree: "Residency in Internal Medicine",
      institution: "Mayo Clinic",
      year: "2011",
    },
    {
      degree: "Fellowship in Cardiology",
      institution: "Cleveland Clinic",
      year: "2014",
    },
  ];

  const specializations = doctorProfile?.specializations?.map((spec) =>
    isArabic ? spec.ar : spec.en,
  ) || [
    "General Internal Medicine",
    "Cardiovascular Health",
    "Diabetes Management",
    "Hypertension Treatment",
    "Preventive Medicine",
    "Geriatric Care",
  ];

  const achievements = doctorProfile?.achievements?.map((ach) =>
    isArabic ? ach.ar : ach.en,
  ) || [
    "Board Certified in Internal Medicine",
    "Fellow of the American College of Physicians",
    "Top Doctor Award 2020-2024",
    "Published researcher with 20+ papers",
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative w-full max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl rotate-3" />
                <div className="relative bg-card rounded-3xl shadow-2xl overflow-hidden">
                  {doctorProfile?.image_url ? (
                    <img
                      src={doctorProfile.image_url}
                      alt={doctorName}
                      className="w-full aspect-square object-cover"
                    />
                  ) : (
                    <div className="p-8">
                      <div className="w-48 h-48 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
                        <Stethoscope className="h-24 w-24 text-primary" />
                      </div>
                      <div className="text-center">
                        <h2 className="font-heading text-2xl font-bold">
                          {doctorName}
                        </h2>
                        <p className="text-muted-foreground">{specialty}</p>
                      </div>
                    </div>
                  )}
                  {doctorProfile?.image_url && (
                    <div className="p-4 text-center bg-card">
                      <h2 className="font-heading text-2xl font-bold">
                        {doctorName}
                      </h2>
                      <p className="text-muted-foreground">{specialty}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              <span className="text-primary font-medium">
                {t("about.subtitle")}
              </span>
              <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground">
                {isArabic ? `عن ${doctorName}` : `About ${doctorName}`}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {isArabic
                  ? doctorProfile?.description_ar || t("about.description")
                  : doctorProfile?.description || t("about.description")}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Education Section */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-heading text-3xl font-bold">
              {t("about.education")}
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {education.map((edu, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-6 bg-card rounded-2xl border border-border"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    {edu.degree}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {edu.institution}
                  </p>
                </div>
                <span className="text-primary font-medium">{edu.year}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Specializations & Achievements */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-primary" />
                </div>
                <h2 className="font-heading text-2xl font-bold">
                  {t("about.specializations")}
                </h2>
              </div>
              <div className="space-y-3">
                {specializations.map((spec, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border"
                  >
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>{spec}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Award className="h-6 w-6 text-accent" />
                </div>
                <h2 className="font-heading text-2xl font-bold">
                  {t("about.achievements") || "Achievements"}
                </h2>
              </div>
              <div className="space-y-3">
                {achievements.map((achievement, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border"
                  >
                    <Award className="h-5 w-5 text-accent" />
                    <span>{achievement}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-heading text-3xl font-bold mb-6">
              {t("about.philosophy")}
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              "{philosophy}"
            </p>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
