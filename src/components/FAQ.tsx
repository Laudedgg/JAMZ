import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FAQ = React.memo(function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "How do I earn rewards?",
      answer: "Create content using artists' tracks, submit to campaigns, and share to earn real cash rewards."
    },
    {
      question: "What platforms are supported?",
      answer: "You can create content on Instagram, TikTok, YouTube Shorts, and other major social media platforms accepted by specific campaigns."
    },
    {
      question: "How do I withdraw my earnings?",
      answer: "Set up your wallet addresses or bank details in your profile, and process withdrawals from your dashboard."
    },
    {
      question: "Are there any fees?",
      answer: "Jamz.fun is free to use for fans. We and the Artists sort your campaign rewards."
    },
    {
      question: "How do campaigns work?",
      answer: "Browse active campaigns, create content using the artist's track, submit your content, and earn rewards. Winners and participants are rewarded based on creativity, engagement, and campaign requirements."
    },
    {
      question: "Need help?",
      answer: "Contact us via email at fly@jamz.fun or reach out on our social media channels for support."
    }
  ];

  return (
    <section className="py-10 md:py-16 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-purple-900/10 via-black to-black" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-8 md:mb-12">
          <div className="flex justify-center mb-4 md:mb-6">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-900/20 border border-purple-500/30">
              <HelpCircle className="w-4 h-4 mr-2 text-purple-400" />
              <span className="text-sm text-purple-400 font-medium">FAQ</span>
            </div>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold gradient-text mb-3 md:mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto">
            Get quick answers to common questions about Jamz.fun
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="glass-card overflow-hidden group"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <h3 className={`text-lg font-semibold pr-4 transition-colors duration-300 ${openIndex === index ? 'text-purple-400' : 'text-white'}`}>
                  {faq.question}
                </h3>
                <div className="flex-shrink-0">
                  <ChevronDown className={`w-5 h-5 transition-all duration-300 ${openIndex === index ? 'text-purple-400 rotate-180' : 'text-white/60'}`} />
                </div>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 pt-2">
                      <p className="text-white/70 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
