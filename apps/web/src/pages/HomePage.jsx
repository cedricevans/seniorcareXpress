
import React, { useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Shield, Clock, Users, Activity, PhoneCall, MessageSquare, Heart, CheckCircle2, ArrowRight, Sparkles, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ParallaxSection from '@/components/ParallaxSection.jsx';
import GradientText from '@/components/GradientText.jsx';

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
        overlay="bg-gradient-to-b from-slate-950/55 via-slate-900/35 to-slate-950/65"
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
              Xpress Your Need,{' '}<br />
              <GradientText>We Will Xpress</GradientText>{' '}
              <span className="text-white">the Solution!</span>
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

      {/* SERVICES SECTION */}
      <section ref={servicesRef} className="py-24 md:py-32 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -mr-64 -mt-64 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl -ml-48 -mb-48 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">

          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-primary font-semibold tracking-widest uppercase text-sm mb-4"
            >
              What We Offer
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-6"
            >
              Support for an Active,{' '}
              <span className="text-primary italic font-normal">Fulfilling Life</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-slate-500"
            >
              Tailored companionship and assistance designed to maintain dignity, encourage mobility, and foster everyday joy.
            </motion.p>
          </div>

          {/* Row 1 — Large image card + Accent card */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-6xl mx-auto mb-6">

            {/* Large image card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-3"
            >
              <div className="h-full overflow-hidden group rounded-3xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100">
                <div className="relative h-60 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent z-10" />
                  <img
                    src="https://images.unsplash.com/photo-1603129473525-4cd6f36fe057?q=80&w=1000&auto=format&fit=crop"
                    alt="Wellness Support"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute bottom-4 left-6 z-20">
                    <span className="bg-white/90 backdrop-blur-sm text-primary text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">Lifestyle</span>
                  </div>
                </div>
                <div className="p-7">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Sun className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-2 text-slate-900">Wellness & Lifestyle Support</h3>
                  <p className="text-slate-500 leading-relaxed text-sm">Personalized assistance that respects daily routines, encouraging independence while ensuring comfort and celebrating every achievement.</p>
                </div>
              </div>
            </motion.div>

            {/* Accent card — primary color */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="lg:col-span-2"
            >
              <div className="h-full rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/80 shadow-2xl shadow-primary/25 overflow-hidden relative p-8 flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12" />
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-black/10 rounded-full blur-2xl -ml-8 -mb-8" />
                <div className="relative z-10">
                  <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center mb-5 backdrop-blur-sm">
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-3 text-white">Health Routine Management</h3>
                  <p className="text-white/75 leading-relaxed text-sm">Seamless support for daily health routines and wellness goals, giving families complete peace of mind.</p>
                </div>
                <div className="relative z-10 mt-6 space-y-2">
                  <div className="h-px bg-white/20 mb-4" />
                  {['Personalized health plans', 'Medication reminders', 'Progress tracking'].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-white/60 shrink-0" />
                      <span className="text-white/70 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Row 2 — Three equal cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-6">

            {/* Card: 24/7 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <div className="h-full rounded-3xl bg-white border border-slate-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-7">
                <div className="w-11 h-11 rounded-2xl bg-secondary/20 flex items-center justify-center mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-heading font-bold mb-2 text-slate-900">24/7 Peace of Mind</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-5">Always-available support ensuring safety and confidence for a worry-free, independent lifestyle.</p>
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <span>Always available</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>

            {/* Card: Connected Care — with image */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="h-full rounded-3xl bg-white border border-slate-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
                <div className="relative h-40 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1654702761561-d6d64d4227a1?q=80&w=800&auto=format&fit=crop"
                    alt="Family Communication"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-7">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-heading font-bold mb-2 text-slate-900">Connected Care</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">Share updates, photos, and joy with our dedicated family portal, keeping everyone in the loop.</p>
                </div>
              </div>
            </motion.div>

            {/* Card: Active Living */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <div className="h-full rounded-3xl bg-gradient-to-br from-secondary/20 via-white to-primary/5 border border-slate-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-7 flex flex-col justify-between">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-heading font-bold mb-2 text-slate-900">Active Living & Joy</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">Engaging experiences and companionship designed to inspire joy, maintain mobility, and cultivate vibrant daily life.</p>
                </div>
                <div className="mt-6">
                  <Link to="/services">
                    <Button size="sm" className="rounded-full shadow-md w-full">Learn More</Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* WHO WE ARE — compact brand story */}
      <section className="py-20 md:py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl -mr-64 -mt-64 pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            {/* Left — image */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative order-2 lg:order-1"
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="/elder-care-planning.jpg"
                  alt="SeniorCare Xpress elder care planning"
                  className="w-full h-96 object-cover"
                />
              </div>
              <div className="absolute -bottom-5 -right-5 bg-white rounded-2xl shadow-xl p-5 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Our Mission</div>
                    <div className="text-slate-500 text-xs">Compassionate home care</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right — tagline + 2 lines + CTA */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="order-1 lg:order-2"
            >
              <p className="text-primary font-semibold tracking-widest uppercase text-sm mb-4">Who We Are</p>
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-6 leading-tight">
                Compassionate Care,{' '}
                <span className="text-primary italic font-normal">Right at Home</span>
              </h2>
              <p className="text-slate-600 leading-relaxed mb-5 text-lg">
                SeniorCare Xpress is dedicated to delivering compassionate, high-quality, and personalized home health care services to individuals in the comfort of their own homes.
              </p>
              <p className="text-slate-500 leading-relaxed mb-8">
                Our goal is to foster independence, dignity, and respect — ensuring every client receives the utmost attention and support on their journey to better health and wellness.
              </p>
              <Link to="/about">
                <Button variant="outline" className="rounded-full px-8 border-primary/30 text-primary hover:bg-primary hover:text-white transition-all duration-300">
                  Our Full Story <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </motion.div>

          </div>
        </div>
      </section>

      {/* WHY CHOOSE US SECTION */}
      <ParallaxSection 
        backgroundImage="https://images.unsplash.com/photo-1669152581590-d54fda5a67de?q=80&w=2000&auto=format&fit=crop"
        overlay="bg-primary/55"
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
