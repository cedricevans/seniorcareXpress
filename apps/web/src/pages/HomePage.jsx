
import React, { useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Shield, Clock, Users, Activity, PhoneCall, MessageSquare, Heart, CheckCircle2, ArrowRight, Sparkles, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ParallaxSection from '@/components/ParallaxSection.jsx';

const HomePage = () => {
  const servicesRef = useRef(null);
  const { scrollYProgress: servicesProgress } = useScroll({
    target: servicesRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(servicesProgress, [0, 1], [100, -100]);
  const y2 = useTransform(servicesProgress, [0, 1], [150, -150]);
  const y3 = useTransform(servicesProgress, [0, 1], [50, -50]);

  return (
    <>
      <Helmet>
        <title>SeniorCare Xpress | Empowering Independent Living</title>
        <meta name="description" content="Uplifting senior care focused on wellness, independence, and quality of life. Keeping families connected and seniors thriving." />
      </Helmet>

      {/* HERO SECTION */}
      <ParallaxSection 
        backgroundImage="https://horizons-cdn.hostinger.com/0f92c1a5-75e3-4878-84c5-4c29eda99ea0/998e20385080771dbf491b59f248bada.png"
        height="min-h-[95vh]"
        overlay="bg-gradient-to-b from-slate-950/80 via-slate-900/60 to-slate-950/90"
      >
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto flex flex-col items-center"
          >
            <img 
              src="https://horizons-cdn.hostinger.com/0f92c1a5-75e3-4878-84c5-4c29eda99ea0/6cf179a531307fd05365d487c05a8a26.png" 
              alt="SeniorCare Xpress" 
              className="h-20 md:h-28 mb-8 brightness-0 invert drop-shadow-lg"
            />
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-6 leading-tight drop-shadow-xl">
              Living Well, <br/><span className="text-secondary italic font-normal">Every Single Day</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-200 mb-10 font-light max-w-2xl leading-relaxed">
              Dedicated support that celebrates independence and enhances quality of life, keeping families connected and seniors thriving in their own rhythm.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/login">
                <Button size="lg" className="rounded-full h-14 px-8 text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  Access Family Portal
                </Button>
              </Link>
              <Link to="/services">
                <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-lg bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white backdrop-blur-sm transition-all duration-300">
                  Explore Our Approach
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </ParallaxSection>

      {/* SERVICES SECTION (Bento Grid with Parallax) */}
      <section ref={servicesRef} className="py-24 md:py-32 bg-slate-50 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-6">Support for an Active, Fulfilling Life</h2>
            <p className="text-lg text-slate-600">Tailored companionship and assistance designed to maintain dignity, encourage mobility, and foster everyday joy.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-6xl mx-auto">
            {/* Large Card 1 */}
            <motion.div style={{ y: y1 }} className="md:col-span-7 h-full">
              <Card className="h-full overflow-hidden border-0 shadow-elegant group rounded-3xl">
                <div className="relative h-64 overflow-hidden">
                  <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                  <img 
                    src="https://images.unsplash.com/photo-1603129473525-4cd6f36fe057?q=80&w=1000&auto=format&fit=crop" 
                    alt="Positive Caregiver Moments" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <CardContent className="p-8 bg-white">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <Sun className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold mb-3">Wellness & Lifestyle Support</h3>
                  <p className="text-slate-600 leading-relaxed">Personalized assistance that respects daily routines, encouraging independence while ensuring comfort. We focus on what our clients *can* do, celebrating every achievement.</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Small Card 1 */}
            <motion.div style={{ y: y2 }} className="md:col-span-5 h-full">
              <Card className="h-full border-0 shadow-elegant group rounded-3xl bg-primary text-primary-foreground overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20" />
                <CardContent className="p-8 relative z-10 flex flex-col justify-center h-full">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-6 backdrop-blur-sm">
                    <Sparkles className="w-6 h-6 text-secondary" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold mb-3">Health Routine Management</h3>
                  <p className="text-primary-foreground/80 leading-relaxed">Seamless support for daily health routines and wellness goals, providing peace of mind so you can focus on enjoying life's beautiful moments.</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Small Card 2 */}
            <motion.div style={{ y: y3 }} className="md:col-span-4 h-full">
              <Card className="h-full border-0 shadow-elegant group rounded-3xl hover:-translate-y-2 transition-transform duration-300">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center mb-6">
                    <Shield className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-3">24/7 Peace of Mind</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">Always-available support ensuring safety and confidence, empowering a worry-free, independent lifestyle for your loved ones.</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Large Card 2 */}
            <motion.div style={{ y: y1 }} className="md:col-span-8 h-full">
              <Card className="h-full overflow-hidden border-0 shadow-elegant group rounded-3xl flex flex-col sm:flex-row">
                <div className="sm:w-2/5 relative overflow-hidden min-h-[200px]">
                  <img 
                    src="https://images.unsplash.com/photo-1654702761561-d6d64d4227a1?q=80&w=800&auto=format&fit=crop" 
                    alt="Family Communication" 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <CardContent className="p-8 sm:w-3/5 bg-white flex flex-col justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold mb-3">Connected Care</h3>
                  <p className="text-slate-600 leading-relaxed">Stay close to the moments that matter. Share updates, photos, and joy seamlessly with our dedicated family portal, keeping everyone in the loop.</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Small Card 3 */}
            <motion.div style={{ y: y2 }} className="md:col-span-12 lg:col-span-8 lg:col-start-3 mt-6">
              <Card className="border-0 shadow-elegant group rounded-3xl bg-white hover:shadow-2xl transition-shadow duration-300">
                <CardContent className="p-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                  <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <Users className="w-8 h-8 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-heading font-bold mb-2">Active Living & Joy</h3>
                    <p className="text-slate-600">Engaging experiences, hobbies, and meaningful companionship designed to inspire joy, maintain mobility, and cultivate a vibrant daily life.</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US SECTION */}
      <ParallaxSection 
        backgroundImage="https://images.unsplash.com/photo-1669152581590-d54fda5a67de?q=80&w=2000&auto=format&fit=crop"
        overlay="bg-primary/90 mix-blend-multiply"
        className="py-24 md:py-32"
      >
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">The SeniorCare Xpress Difference</h2>
            <p className="text-lg text-primary-foreground/80">We bridge the gap between professional support and family involvement, focusing on what makes life beautiful.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              { icon: Heart, title: 'Empathetic Companionship', desc: 'Caregivers matched specifically to your loved one\'s personality, interests, and lifestyle preferences.' },
              { icon: Activity, title: 'Focus on Thriving', desc: 'We prioritize activities that stimulate the mind, encourage movement, and bring genuine smiles.' },
              { icon: Shield, title: 'Trusted Professionals', desc: 'Rigorous vetting and continuous training ensure our team provides the highest standard of uplifting support.' },
              { icon: MessageSquare, title: 'Transparent Connection', desc: 'Our proprietary portal provides real-time updates, photos, and direct messaging to share the joy of everyday moments.' }
            ].map((benefit, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl hover:bg-white/20 transition-colors duration-300"
              >
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
                    <benefit.icon className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                    <p className="text-primary-foreground/80 leading-relaxed">{benefit.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </ParallaxSection>

      {/* TESTIMONIALS SECTION */}
      <section className="py-24 md:py-32 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-6">Stories of Joy and Connection</h2>
            <p className="text-lg text-slate-600">Hear from the families who have found peace of mind and renewed happiness with our support.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { 
                img: "https://images.unsplash.com/photo-1588966915713-6d43603478e5?q=80&w=200&auto=format&fit=crop", 
                quote: "The level of care and transparency is unmatched. I can check the portal anytime and see photos of my mother enjoying her garden. It's given me my life back.", 
                author: "Sarah Jenkins", 
                relation: "Daughter of Client",
                delay: 0
              },
              { 
                img: "https://images.unsplash.com/photo-1618545474738-07deadbab76d?q=80&w=200&auto=format&fit=crop", 
                quote: "SeniorCare Xpress is a godsend. We know dad is active and engaged, and the caregivers are truly wonderful companions. The daily updates make my day.", 
                author: "Michael Thompson", 
                relation: "Son of Client",
                delay: 0.2
              },
              { 
                img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop", 
                quote: "Living across the country was so stressful until we found this service. The video calls and instant messaging make me feel like I'm right there sharing the moments with them.", 
                author: "Elena Rodriguez", 
                relation: "Daughter of Client",
                delay: 0.4
              }
            ].map((t, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: t.delay, duration: 0.6 }}
                className={`h-full ${idx === 1 ? 'md:mt-12' : ''}`}
              >
                <Card className="h-full border-0 shadow-elegant rounded-3xl hover:-translate-y-2 transition-transform duration-300 bg-slate-50">
                  <CardContent className="p-8 flex flex-col h-full">
                    <div className="mb-6 text-secondary">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 inline-block fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-slate-700 text-lg italic mb-8 flex-grow">"{t.quote}"</p>
                    <div className="flex items-center gap-4 mt-auto">
                      <img src={t.img} alt={t.author} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
                      <div>
                        <h4 className="font-bold text-slate-900">{t.author}</h4>
                        <p className="text-sm text-slate-500">{t.relation}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM/ABOUT SECTION */}
      <ParallaxSection 
        backgroundImage="https://images.unsplash.com/photo-1654702761561-d6d64d4227a1?q=80&w=2000&auto=format&fit=crop"
        overlay="bg-slate-900/80"
        className="py-24 md:py-32"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-8">Our Mission</h2>
            <p className="text-xl md:text-2xl font-light leading-relaxed mb-16 text-slate-200">
              "Dedicated to providing uplifting, professional support that empowers vibrant living, while giving families complete transparency and peace of mind."
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {['Joy', 'Dignity', 'Connection', 'Trust'].map((value, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4 backdrop-blur-sm">
                    <CheckCircle2 className="w-8 h-8 text-secondary" />
                  </div>
                  <h4 className="font-semibold text-lg tracking-wide">{value}</h4>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ParallaxSection>

      {/* FINAL CTA SECTION */}
      <section className="py-24 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">Ready to Embrace Better Living?</h2>
            <p className="text-xl text-primary-foreground/80 mb-10">
              Join the families who have found peace of mind and joy with SeniorCare Xpress. Access our portal to see how we can support your loved ones.
            </p>
            <Link to="/login">
              <Button size="lg" className="rounded-full h-16 px-10 text-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                Access Family Portal <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
