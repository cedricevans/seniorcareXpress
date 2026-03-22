
import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Eye, Heart, Phone, Mail, MapPin, CheckCircle2, Users, Sparkles, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ParallaxSection from '@/components/ParallaxSection.jsx';

const values = [
  { icon: Heart, title: 'Compassionate Care', desc: 'We treat every client like family, delivering care that is both professional and deeply personal.' },
  { icon: Target, title: 'Quality First', desc: 'We strive to provide the highest quality care and services, never compromising on the standard of support we deliver.' },
  { icon: BookOpen, title: 'Education & Empowerment', desc: 'We provide ongoing information and education most relevant to your health in an efficient and expedient manner.' },
  { icon: Sparkles, title: 'Independence & Dignity', desc: 'We honor each individual\'s desire to live independently and age with grace, purpose, and joy.' },
];

const services = [
  'Educational Programs',
  'Health Assessments',
  'Personalized Care Plans',
  'Face-to-Face Visits',
  'Ongoing Monitoring',
  'Companion Services',
  'Transportation',
  'Veterans Aid & Attendance Guidance',
];

const AboutPage = () => {
  return (
    <>
      <Helmet>
        <title>About Us | SeniorCare Xpress</title>
        <meta name="description" content="SeniorCare Xpress is a membership service dedicated to assisting those 50 and older with living a happy and healthier life. Learn about our mission and team." />
      </Helmet>

      {/* HERO */}
      <div className="bg-gradient-to-br from-primary to-primary/80 py-24 px-4 text-center text-white">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl mx-auto">
          <p className="text-secondary font-semibold tracking-widest uppercase text-sm mb-4">About Us</p>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
            Dedicated to the <span className="italic font-normal text-secondary">50+ Community</span>
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
            SeniorCare Xpress is a membership service dedicated to assisting those 50 and older with living a happy and healthier life.
          </p>
        </motion.div>
      </div>

      {/* MISSION */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-primary font-semibold tracking-widest uppercase text-sm mb-4">Who We Are</p>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-6">
                Xpress Your Need, <span className="text-primary italic font-normal">We Will Xpress the Solution!</span>
              </h2>
              <p className="text-slate-600 leading-relaxed mb-5">
                Are you 50 plus? Over the years, most of us have developed an appreciation for what we have — our health, loved ones, passions, interests, and assets acquired over time. We want to nurture and conserve our resources so that we can live our lives to the fullest.
              </p>
              <p className="text-slate-600 leading-relaxed mb-5">
                <strong className="text-slate-800">SeniorCare Xpress</strong> is designed to help us do just that. The program's goal is to meet the needs of older adults who want to maintain their quality of life as they age.
              </p>
              <p className="text-slate-600 leading-relaxed">
                We have always held the philosophy that we are in business to provide the best care possible to seniors as well as others who are in need of services and discounts. We strive to meet the healthcare needs of our senior population, as we believe it's important to provide you with ongoing information and education most relevant to your health in an efficient and expedient manner.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1588966915713-6d43603478e5?q=80&w=1000&auto=format&fit=crop"
                  alt="SeniorCare Xpress team with senior"
                  className="w-full h-96 object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-5 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">50+ Community</div>
                    <div className="text-slate-500 text-xs">Serving members daily</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* MAKE THE RIGHT CHOICE */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-primary font-semibold tracking-widest uppercase text-sm mb-4">Our Commitment</p>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-6">
                Make the Right Choice <span className="text-primary italic font-normal">For Your Loved One</span>
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-10">
                SeniorCare Xpress is a membership service dedicated to assisting those 50 and older with living a happy and healthier life. Our broad scope of services includes educational programs, assessments, personalized care plans, face-to-face visits, ongoing monitoring and so much more!
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {services.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-start gap-3 text-left"
                >
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm font-medium text-slate-700">{s}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-primary font-semibold tracking-widest uppercase text-sm mb-4">What Drives Us</p>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900">
              Our <span className="text-primary italic font-normal">Core Values</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {values.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-50 rounded-3xl border border-slate-100 p-7 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <v.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{v.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT CTA */}
      <section className="py-20 bg-slate-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">Have Any Questions?</h2>
            <p className="text-slate-400 text-lg mb-10">Don't hesitate to contact us any time. We're here to help.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-3">
                <MapPin className="w-6 h-6 text-secondary" />
                <div className="text-white text-sm text-center">P.O. Box 18442<br />Fairfield, OH 45018</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-3">
                <Mail className="w-6 h-6 text-secondary" />
                <a href="mailto:contact@seniorcarexpress.com" className="text-white text-sm hover:text-secondary transition-colors text-center">contact@seniorcarexpress.com</a>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-3">
                <Phone className="w-6 h-6 text-secondary" />
                <a href="tel:5136877866" className="text-white text-sm hover:text-secondary transition-colors">513.687.7866</a>
              </div>
            </div>
            <Link to="/contact">
              <Button size="lg" className="rounded-full px-10 h-14 text-lg">Contact Us</Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default AboutPage;

