import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useDoctorSlug } from "@/hooks/useDoctorSlug";
import {
  Stethoscope,
  Activity,
  Pill,
  MessageSquare,
  FlaskConical,
  CalendarCheck,
  ArrowRight,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";

const Services = () => {
  const { t } = useTranslation();

  const services = [
    {
      icon: Stethoscope,
      titleKey: "generalCheckup",
      descKey: "generalCheckupDesc",
      color: "primary",
    },
    {
      icon: Activity,
      titleKey: "chronicCare",
      descKey: "chronicCareDesc",
      color: "accent",
    },
    {
      icon: Pill,
      titleKey: "preventive",
      descKey: "preventiveDesc",
      color: "primary",
    },
    {
      icon: MessageSquare,
      titleKey: "consultation",
      descKey: "consultationDesc",
      color: "accent",
    },
    {
      icon: FlaskConical,
      titleKey: "labTests",
      descKey: "labTestsDesc",
      color: "primary",
    },
    {
      icon: CalendarCheck,
      titleKey: "followUp",
      descKey: "followUpDesc",
      color: "accent",
    },
  ];

  const { buildPath } = useDoctorSlug();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-primary font-medium">
              {t("services.subtitle")}
            </span>
            <h1 className="font-heading text-4xl md:text-5xl font-bold mt-2 mb-6">
              {t("services.title")}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("services.description")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <motion.div
                key={service.titleKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group bg-card rounded-2xl p-8 border border-border hover:border-primary/30 hover:shadow-xl transition-all duration-300"
              >
                <div
                  className={`w-16 h-16 rounded-2xl ${service.color === "primary" ? "bg-primary/10 group-hover:bg-primary" : "bg-accent/10 group-hover:bg-accent"} flex items-center justify-center mb-6 transition-colors`}
                >
                  <service.icon
                    className={`h-8 w-8 ${service.color === "primary" ? "text-primary group-hover:text-primary-foreground" : "text-accent group-hover:text-accent-foreground"} transition-colors`}
                  />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-3">
                  {t(`services.${service.titleKey}`)}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {t(`services.${service.descKey}`)}
                </p>
                <Link
                  to={buildPath("/book")}
                  className="inline-flex items-center text-primary font-medium hover:gap-2 transition-all"
                >
                  Book Now <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
                Why Choose Our Services?
              </h2>
              <div className="space-y-4">
                {[
                  "Personalized treatment plans tailored to your needs",
                  "State-of-the-art diagnostic equipment",
                  "Compassionate and experienced medical team",
                  "Convenient online booking and follow-up",
                  "Comprehensive health records management",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Heart className="h-3 w-3 text-primary" />
                    </div>
                    <p className="text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-primary text-primary-foreground rounded-3xl p-8 md:p-12"
            >
              <h3 className="font-heading text-2xl font-bold mb-4">
                Ready to Get Started?
              </h3>
              <p className="text-primary-foreground/80 mb-6">
                Book your appointment today and take the first step towards
                better health.
              </p>
              <Link to={buildPath("/book")}>
                <Button variant="secondary" size="lg" className="gap-2">
                  Book Appointment
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Services;
