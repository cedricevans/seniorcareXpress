import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Star, Phone, Mail, CheckCircle2, ArrowRight, Award, Heart, Users, ChevronDown, ChevronUp, ClipboardList, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ParallaxSection from '@/components/ParallaxSection.jsx';
import pb from '@/lib/pocketbaseClient.js';

const benefitAmounts = [
  { label: 'Surviving Spouse needs care', amount: '$1,515', icon: Heart },
  { label: 'Single Veteran needs care', amount: '$2,358', icon: Award },
  { label: 'Married Veteran needs care', amount: '$2,795', icon: Users },
  { label: 'Veteran with Spouse who needs care', amount: '$1,851', icon: Shield },
];

const serviceEras = [
  {
    era: 'World War II',
    dates: 'December 7, 1941 through December 31, 1946',
  },
  {
    era: 'Korean Conflict',
    dates: 'June 27, 1950 through January 31, 1955',
  },
  {
    era: 'Vietnam Era',
    dates: 'August 5, 1964 through May 7, 1975',
    note: 'Veterans who served in the Republic of Vietnam between 11/1/55 – 8/4/64 are also eligible.',
  },
  {
    era: 'American Merchant Marines',
    dates: 'December 7, 1941 through August 15, 1945',
  },
  {
    era: 'Gulf War',
    dates: 'August 2, 1990, through a future date to be set by law or presidential proclamation',
  },
];

const StarRating = () => (
  <div className="flex gap-1">
    {[...Array(5)].map((_, i) => (
      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
    ))}
  </div>
);

const QUIZ_STEPS = [
  {
    id: 'personal',
    title: 'Personal Information',
    fields: [
      { name: 'full_name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your full name' },
      { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'you@example.com' },
      { name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '(513) 000-0000' },
    ],
  },
  {
    id: 'service',
    title: 'Military Service',
    fields: [
      {
        name: 'veteran_status',
        label: 'Are you a Veteran or a surviving spouse of a Veteran?',
        type: 'radio',
        required: true,
        options: ['Veteran', 'Surviving Spouse', 'Other'],
      },
      {
        name: 'service_era',
        label: 'Which wartime period did you (or your spouse) serve in?',
        type: 'select',
        required: true,
        options: ['World War II', 'Korean Conflict', 'Vietnam Era', 'American Merchant Marines', 'Gulf War', 'Not Sure'],
      },
      {
        name: 'service_length',
        label: 'Did you serve at least 90 days of active duty (with at least 1 day during wartime)?',
        type: 'radio',
        required: true,
        options: ['Yes', 'No', 'Not Sure'],
      },
    ],
  },
  {
    id: 'medical',
    title: 'Care Needs',
    fields: [
      {
        name: 'care_needs',
        label: 'Do you need help with activities of daily living (bathing, dressing, eating, etc.)?',
        type: 'radio',
        required: true,
        options: ['Yes', 'No', 'Partially'],
      },
      {
        name: 'living_situation',
        label: 'Current living situation',
        type: 'radio',
        required: true,
        options: ['Living at Home', 'Assisted Living', 'Nursing Home', 'With Family'],
      },
      {
        name: 'additional_info',
        label: 'Anything else you would like us to know? (optional)',
        type: 'textarea',
        required: false,
        placeholder: 'Share any additional details about your situation...',
      },
    ],
  },
];

const VeteransQuestionnaire = () => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const currentStep = QUIZ_STEPS[step];
  const isLast = step === QUIZ_STEPS.length - 1;

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    for (const field of currentStep.fields) {
      if (field.required && !formData[field.name]) return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validate()) { setError('Please fill in all required fields.'); return; }
    setError('');
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!validate()) { setError('Please fill in all required fields.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await pb.collection('veterans_inquiries').create(formData);
      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again or call us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 px-8"
      >
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-heading font-bold text-slate-900 mb-3">Thank You!</h3>
        <p className="text-slate-600 max-w-md mx-auto">
          We've received your information and will be in touch within 1 business day to discuss your eligibility for Veterans Aid &amp; Attendance benefits.
        </p>
        <p className="text-slate-500 text-sm mt-4">
          Questions? Call us: <a href="tel:5136877866" className="text-primary font-semibold">513-687-7866</a>
        </p>
      </motion.div>
    );
  }

  return (
    <div>
      {/* Progress bar */}
      <div className="flex gap-2 mb-8">
        {QUIZ_STEPS.map((s, i) => (
          <div
            key={s.id}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-primary' : 'bg-slate-200'}`}
          />
        ))}
      </div>

      <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-2">Step {step + 1} of {QUIZ_STEPS.length}</p>
      <h3 className="text-2xl font-heading font-bold text-slate-900 mb-8">{currentStep.title}</h3>

      <div className="space-y-6">
        {currentStep.fields.map(field => (
          <div key={field.name}>
            <label className="block text-slate-700 font-medium mb-2">{field.label}{field.required && <span className="text-red-400 ml-1">*</span>}</label>

            {field.type === 'text' || field.type === 'email' || field.type === 'tel' ? (
              <input
                type={field.type}
                placeholder={field.placeholder}
                value={formData[field.name] || ''}
                onChange={e => handleChange(field.name, e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            ) : field.type === 'textarea' ? (
              <textarea
                rows={4}
                placeholder={field.placeholder}
                value={formData[field.name] || ''}
                onChange={e => handleChange(field.name, e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
              />
            ) : field.type === 'select' ? (
              <select
                value={formData[field.name] || ''}
                onChange={e => handleChange(field.name, e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              >
                <option value="">Select one...</option>
                {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : field.type === 'radio' ? (
              <div className="flex flex-wrap gap-3">
                {field.options.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange(field.name, opt)}
                    className={`px-5 py-2.5 rounded-xl border-2 font-medium text-sm transition-all duration-200 ${
                      formData[field.name] === opt
                        ? 'border-primary bg-primary text-white shadow-md'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-primary/50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <Button variant="outline" onClick={() => { setStep(s => s - 1); setError(''); }} className="rounded-full px-6">
            Back
          </Button>
        )}
        {!isLast ? (
          <Button onClick={handleNext} className="rounded-full px-8 ml-auto">
            Continue <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting} className="rounded-full px-8 ml-auto bg-yellow-400 text-slate-900 hover:bg-yellow-300 font-bold">
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4 mr-2" /> Submit</>}
          </Button>
        )}
      </div>
    </div>
  );
};

const VeteransPage = () => {
  const [openEra, setOpenEra] = useState(null);

  return (
    <>
      <Helmet>
        <title>Veterans Aid & Attendance | SeniorCare Xpress</title>
        <meta name="description" content="Veterans and their surviving spouses can access Aid and Attendance benefits to assist with the costs of home care. Get what you rightfully deserve." />
      </Helmet>

      {/* HERO */}
      <ParallaxSection
        backgroundImage="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=1440,h=1092,fit=crop/YleWb8GoELTgy7Dg/adobestock_1003153002-m7V396WoOzHLB7Bv.jpeg"
        height="min-h-[90vh]"
        overlay="bg-gradient-to-b from-slate-950/70 via-slate-900/50 to-slate-950/80"
      >
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="max-w-4xl mx-auto flex flex-col items-center"
          >
            {/* Badge */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2 mb-8">
              <Shield className="w-4 h-4 text-yellow-400" />
              <span className="text-white/90 text-sm font-medium tracking-wide uppercase">Trusted by Veterans Nationwide</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-6 leading-tight drop-shadow-xl">
              Get What You <br />
              <span className="text-yellow-400 italic font-normal">Rightfully Deserve</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-200 mb-6 font-light max-w-2xl leading-relaxed">
              Veterans and their surviving spouses can access Aid &amp; Attendance benefits to assist with the costs of home care.
            </p>

            <div className="mb-10">
              <StarRating />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#eligibility-check">
                <Button size="lg" className="rounded-full h-14 px-8 text-lg bg-yellow-400 text-slate-900 hover:bg-yellow-300 shadow-lg shadow-yellow-400/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 font-bold">
                  <ClipboardList className="w-5 h-5 mr-2" /> Free Eligibility Check
                </Button>
              </a>
              <a href="#benefits">
                <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-lg bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white backdrop-blur-sm transition-all duration-300">
                  Learn More <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </ParallaxSection>

      {/* BENEFIT AMOUNTS */}
      <section id="benefits" className="py-20 md:py-28 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-400/5 rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-primary font-semibold tracking-widest uppercase text-sm mb-4"
            >
              Monthly Benefits
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-6"
            >
              What is <span className="text-primary italic font-normal">Aid & Attendance?</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-500 leading-relaxed"
            >
              Aid &amp; Attendance is an additional monetary benefit that complements the basic veterans pension, available to those who fulfill specific medical requirements. Veterans Benefits pay <strong className="text-slate-700">$1,515–$2,795 monthly</strong> to Veterans and Spouses.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {benefitAmounts.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="h-full rounded-3xl bg-slate-50 border border-slate-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-7 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-3xl font-heading font-bold text-primary mb-3">{item.amount}<span className="text-slate-400 text-base font-normal">/mo</span></div>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT THE BENEFIT — full info */}
      <section className="py-20 bg-slate-50 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-primary font-semibold tracking-widest uppercase text-sm mb-4">The Program</p>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-6">
                The Benefits of <span className="text-primary italic font-normal">Aid & Attendance</span>
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                Aid &amp; Attendance is a program designed for wartime veterans and their surviving spouses, providing financial assistance to help cover the costs associated with long-term care. This support can be utilized for care in assisted living facilities or even within the comfort of one's home.
              </p>
              <p className="text-slate-600 leading-relaxed mb-8">
                It aims to ensure that those who have served our country receive the necessary resources to maintain their quality of life as they age.
              </p>
              <p className="text-slate-500 leading-relaxed text-sm mb-8">
                To qualify, veterans must need help with activities of daily living (ADLs), be bedridden, reside in a nursing home due to physical or medical challenges, or have severe visual impairment. All eligibility criteria related to service and finances associated with the basic veterans pension must also be met.
              </p>
              <a href="tel:5136877866">
                <Button className="rounded-full px-8 shadow-md">
                  <Phone className="w-4 h-4 mr-2" /> Call to Learn More
                </Button>
              </a>
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
                  src="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=1440,h=1092,fit=crop/YleWb8GoELTgy7Dg/adobestock_1086089902-AQExWlVGoriDZKRp.jpeg"
                  alt="Veterans Aid and Attendance"
                  className="w-full h-80 object-cover"
                />
              </div>
              {/* Floating stat card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-5 border border-slate-100">
                <div className="text-2xl font-heading font-bold text-primary">$2,795</div>
                <div className="text-slate-500 text-sm">Max monthly benefit</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* QUALIFYING SERVICE ERAS */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-primary font-semibold tracking-widest uppercase text-sm mb-4"
            >
              Eligibility
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-6"
            >
              Do You Have <span className="text-primary italic font-normal">Qualifying Service?</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-500"
            >
              Aid &amp; Attendance is available to veterans who served during wartime. See if your service period qualifies below.
            </motion.p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {serviceEras.map((era, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
              >
                <button
                  onClick={() => setOpenEra(openEra === idx ? null : idx)}
                  className="w-full text-left rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all duration-200 p-6 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-heading font-bold text-slate-900 text-lg">{era.era}</span>
                  </div>
                  {openEra === idx ? (
                    <ChevronUp className="w-5 h-5 text-primary shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>
                {openEra === idx && (
                  <div className="px-6 pb-6 pt-2 bg-white border border-t-0 border-slate-100 rounded-b-2xl -mt-2">
                    <p className="text-slate-600 leading-relaxed">{era.dates}</p>
                    {era.note && <p className="text-slate-500 text-sm mt-2 italic">{era.note}</p>}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <ParallaxSection
        backgroundImage="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=1440,h=1092,fit=crop/YleWb8GoELTgy7Dg/adobestock_1003153002-m7V396WoOzHLB7Bv.jpeg"
        overlay="bg-primary/85"
        className="py-24 md:py-32"
      >
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">Why Choose Us</h2>
            <p className="text-lg text-white/80">Dedicated assistance for veterans and their families to navigate available benefits and resources.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Heart,
                title: 'Compassion & Respect',
                desc: 'Professional advice on understanding military benefits and entitlements available to veterans and their partners.',
              },
              {
                icon: Award,
                title: 'Experience',
                desc: 'With our extensive experience, we have a deep understanding of the Aid & Attendance process, allowing us to provide effective assistance.',
              },
              {
                icon: Shield,
                title: 'Honor & Service',
                desc: 'Dedicated to assisting veterans and their families with the respect and care they have rightfully earned through their service.',
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
              >
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 hover:bg-white/20 transition-colors duration-300 h-full">
                  <div className="w-12 h-12 rounded-2xl bg-yellow-400/20 flex items-center justify-center mb-5">
                    <item.icon className="w-6 h-6 text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-white/75 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </ParallaxSection>

      {/* TESTIMONIAL */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-slate-50 rounded-3xl p-10 border border-slate-100 shadow-lg"
            >
              <StarRating />
              <blockquote className="text-xl md:text-2xl font-heading italic text-slate-700 mt-6 mb-8 leading-relaxed">
                "The support from SeniorCare Xpress is exceptional — their dedication truly makes a difference for military families. We received our benefits faster than we ever expected."
              </blockquote>
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-slate-900">Emily Carter</div>
                  <div className="text-slate-500 text-sm">Surviving Spouse, Veteran Family</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="eligibility-check" className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary to-primary/80 px-8 py-8 text-white flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-heading font-bold">Free Eligibility Check</h2>
                  <p className="text-white/80 text-sm">Takes less than 2 minutes — find out if you qualify</p>
                </div>
              </div>
              <div className="p-8">
                <VeteransQuestionnaire />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-400/10 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-5 py-2 mb-8">
              <Shield className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm font-medium">Veterans Benefits Specialists</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
              Ready to Claim Your <span className="text-yellow-400 italic font-normal">Benefits?</span>
            </h2>
            <p className="text-xl text-slate-400 mb-10 leading-relaxed">
              Don't leave money on the table. Our team is here to guide you through every step of the Aid &amp; Attendance application process.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:5136877866">
                <Button size="lg" className="rounded-full h-14 px-8 text-lg bg-yellow-400 text-slate-900 hover:bg-yellow-300 shadow-xl font-bold hover:-translate-y-1 transition-all duration-300">
                  <Phone className="w-5 h-5 mr-2" /> 513-687-7866
                </Button>
              </a>
              <a href="mailto:contact@aidetoveterans.com">
                <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-lg border-white/20 text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300">
                  <Mail className="w-5 h-5 mr-2" /> Email Us
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default VeteransPage;
