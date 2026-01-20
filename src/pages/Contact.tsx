import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Phone, Mail, Clock, MapPin, Send, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';

const contactSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  message: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const Contact = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      message: '',
    },
  });

  const { mutate: submitRequest, isPending } = useMutation({
    mutationFn: async (values: ContactFormValues) => {
      const { error } = await supabase
        .from('consultation_requests')
        .insert([{
          full_name: values.full_name,
          phone: values.phone,
          message: values.message || null,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: t('contact.form.success'),
        description: t('contact.form.successMessage'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('common.retry'),
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: ContactFormValues) => {
    submitRequest(values);
  };

  const contactInfo = [
    { icon: Phone, label: 'Emergency', value: '+1 (555) 123-4567' },
    { icon: Mail, label: 'Email', value: 'contact@drcare.com' },
    { icon: Clock, label: t('contact.info.hours'), value: t('contact.info.hoursValue') },
    { icon: MapPin, label: 'Main Office', value: '123 Medical Center Dr, Suite 100' },
  ];

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
            <span className="text-primary font-medium">{t('contact.subtitle')}</span>
            <h1 className="font-heading text-4xl md:text-5xl font-bold mt-2 mb-6">
              {t('contact.title')}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('contact.description')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="py-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-card rounded-3xl p-8 md:p-10 border border-border shadow-lg"
            >
              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="font-heading text-2xl font-bold mb-3">
                    {t('contact.form.success')}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {t('contact.form.successMessage')}
                  </p>
                  <Button onClick={() => { setIsSubmitted(false); form.reset(); }}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="font-heading text-2xl font-bold mb-6">Request a Callback</h2>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="full_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('contact.form.name')}</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('contact.form.phone')}</FormLabel>
                            <FormControl>
                              <Input placeholder="+1 (555) 000-0000" dir="ltr" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('contact.form.message')}</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder={t('contact.form.messagePlaceholder')} 
                                rows={4}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full gap-2" disabled={isPending}>
                        <Send className="h-4 w-4" />
                        {isPending ? t('common.loading') : t('contact.form.submit')}
                      </Button>
                    </form>
                  </Form>
                </>
              )}
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              <h2 className="font-heading text-2xl font-bold">Contact Information</h2>
              <p className="text-muted-foreground">
                Reach out to us through any of the following channels. We're here to help!
              </p>

              <div className="space-y-4 mt-8">
                {contactInfo.map((info, i) => (
                  <div 
                    key={i} 
                    className="flex items-start gap-4 p-5 bg-card rounded-2xl border border-border"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <info.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{info.label}</h3>
                      <p className="text-muted-foreground">{info.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-primary/5 rounded-2xl border border-primary/10">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{t('contact.info.emergency')}: </span>
                  <span dir="ltr">+1 (555) 911-1234</span>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
