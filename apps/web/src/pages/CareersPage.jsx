
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Heart, Smile, Coffee, GraduationCap } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import GradientText from '@/components/GradientText.jsx';
import ModernJobCard from '@/components/ModernJobCard.jsx';
import ParallaxSection from '@/components/ParallaxSection.jsx';
import ImageCard from '@/components/ImageCard.jsx';

const CareersPage = () => {
  const benefits = [
    { icon: Heart, title: 'Health & Wellness', desc: 'Comprehensive medical, dental, and vision plans to keep you and your family healthy.' },
    { icon: Smile, title: 'Supportive Culture', desc: 'A warm, inclusive environment where your contributions are truly valued.' },
    { icon: Coffee, title: 'Work-Life Balance', desc: 'Flexible scheduling options and generous paid time off.' },
    { icon: GraduationCap, title: 'Ongoing Training', desc: 'Continuous education and opportunities for career advancement.' }
  ];

  const jobs = [
    { title: 'Compassionate Caregiver', department: 'In-Home Care', location: 'Fairfield, OH', type: 'Full-time / Part-time' },
    { title: 'Care Coordinator', department: 'Operations', location: 'Hybrid', type: 'Full-time' },
    { title: 'Registered Nurse (RN)', department: 'Clinical', location: 'Fairfield, OH', type: 'Full-time' }
  ];

  return (
    <>
      <Helmet>
        <title>Careers | SeniorCare Xpress</title>
        <meta name="description" content="Join our warm, supportive team and make a meaningful difference in the lives of seniors." />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1">
          {/* Parallax Hero Section */}
          <ParallaxSection 
            backgroundImage="https://images.unsplash.com/photo-1666887359800-60e37f543dbd"
            overlay="bg-gradient-to-b from-black/80 via-black/50 to-background"
            height="min-h-[70vh]"
            className="pt-20"
          >
            <div className="max-w-4xl mx-auto px-4 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 text-white">
                  Build a career with <GradientText>heart.</GradientText>
                </h1>
                <p className="text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
                  We are always looking for kind, dedicated individuals to join our family. If you have a passion for helping others, we'd love to meet you.
                </p>
              </motion.div>
            </div>
          </ParallaxSection>

          {/* Culture Section */}
          <section className="py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  <h2 className="text-4xl font-heading font-bold mb-6">A Culture of Care</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    At SeniorCare Xpress, we believe that to provide the best care to our clients, we must first care for our team. We foster an environment of mutual respect, continuous learning, and genuine support.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    When you join us, you're not just taking a job—you're becoming part of a family dedicated to making a tangible difference in the community.
                  </p>
                </motion.div>
                
                <div className="relative">
                  <div className="absolute inset-0 bg-secondary/20 rounded-[3rem] transform rotate-3 scale-105" />
                  <ImageCard 
                    src="https://images.unsplash.com/photo-1588966915713-6d43603478e5"
                    alt="Team collaboration"
                    aspectRatio="aspect-[4/3]"
                    className="relative z-10"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="py-24 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-4xl font-heading font-bold mb-6">Why Join Us?</h2>
                <p className="text-lg text-muted-foreground">
                  We offer comprehensive benefits designed to support your well-being both inside and outside of work.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-card p-8 rounded-3xl shadow-warm border border-border text-center hover:-translate-y-1 transition-transform duration-300"
                  >
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                      <benefit.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-heading font-bold mb-3">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Open Positions */}
          <section className="py-24">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-12 text-center">
                <h2 className="text-4xl font-heading font-bold mb-4">Current Openings</h2>
                <p className="text-lg text-muted-foreground">Find your place in our growing family.</p>
              </div>

              <div className="space-y-6">
                {jobs.map((job, index) => (
                  <ModernJobCard key={index} {...job} index={index} />
                ))}
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default CareersPage;
