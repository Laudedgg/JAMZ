import React, { useState, useCallback } from 'react';
import { Disc, Briefcase, ArrowRight, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react';

export const ContactMarketing = React.memo(function ContactMarketing() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      alert('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // In a real application, you would send this data to your backend
      // For now, we'll simulate a successful submission
      console.log('Form submitted:', formData);

      // Store in localStorage for demo purposes
      const contactRequests = JSON.parse(localStorage.getItem('contact-requests') || '[]');
      contactRequests.push({
        ...formData,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('contact-requests', JSON.stringify(contactRequests));

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSubmitStatus('success');

      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          message: ''
        });
        setSubmitStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');

      // Reset error state after a delay
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  return (
    <section className="py-12 md:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-black to-black" />
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/2 right-1/4 w-[300px] h-[300px] bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Disc className="text-primary w-8 h-8" />
              <Briefcase className="text-secondary w-8 h-8" />
            </div>
            <h2 className="pixel-text text-3xl md:text-4xl font-bold mb-4 md:mb-6 gradient-text">
              Music Marketing Solutions
            </h2>
            <p className="text-base md:text-xl text-white/70 mb-6 md:mb-8">
              Looking to boost your music's reach and engagement? Jamz.fun provides cost effective and trackable
              music marketing solutions for artists and record labels wanting to maximize their impact.
            </p>

            <div className="space-y-4 mb-8">
              {[
                { num: '1', color: 'primary', title: 'Featured Campaign Placement', desc: 'Get your tracks featured prominently on our platform for maximum visibility.' },
                { num: '2', color: 'secondary', title: 'Engagement Rewards', desc: 'Incentivize fans to create content around your music with customized rewards.' },
                { num: '3', color: 'accent', title: 'Analytics & Insights', desc: 'Get detailed performance metrics and audience engagement data.' }
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-start group"
                >
                  <div className={`w-10 h-10 rounded-full bg-${item.color}/20 flex items-center justify-center mt-1 mr-4`}>
                    <span className={`text-${item.color} font-bold`}>{item.num}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                    <p className="text-white/60">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <a
              href="https://wa.me/+971561118752?text=Hi%20Jamz.fun%20team!%20I'm%20interested%20in%20your%20music%20marketing%20solutions.%20Can%20we%20discuss%20a%20potential%20collaboration?"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center glass-button-primary px-6 py-3 group hover:scale-105 transition-transform"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Contact for Music Marketing Deals
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </div>

          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-2xl blur-xl opacity-20"></div>
            <div className="glass-card relative p-5 md:p-10 rounded-2xl overflow-hidden">
              <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-secondary/20 rounded-full filter blur-xl"></div>
              <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-32 h-32 bg-primary/20 rounded-full filter blur-xl"></div>

              <h3 className="text-2xl font-bold mb-6">Get in Touch</h3>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-1">Name</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name or label"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-white/70 mb-1">Message</label>
                  <textarea
                    id="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us about your music and marketing goals"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none resize-none"
                    required
                  ></textarea>
                </div>

                {submitStatus === 'success' && (
                  <div className="flex items-center p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    <span>Message sent successfully! We'll be in touch soon.</span>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="flex items-center p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                    <span>Failed to send message. Please try again later.</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full glass-button-primary px-6 py-3 mt-2 disabled:opacity-70 hover:scale-[1.02] transition-transform"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : 'Submit'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
