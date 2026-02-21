import React from 'react';
import { Quote } from 'lucide-react';

export function Testimonials() {
  const testimonials = [
    {
      quote: "Jamz.fun revolutionized how I monetize my music. The Web3 integration is seamless!",
      author: "Sarah Chen",
      role: "Electronic Music Producer",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
    },
    {
      quote: "The community engagement and reward system keeps my fans coming back for more.",
      author: "Marcus Rodriguez",
      role: "Hip Hop Artist",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
    },
    {
      quote: "Finally, a platform that truly understands what artists need in the digital age.",
      author: "Emma Thompson",
      role: "Indie Musician",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80"
    }
  ];

  return (
    <section id="testimonials" className="py-24 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Creator Success Stories</h2>
          <p className="text-xl text-gray-400">Hear from our community of artists</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-gray-800/50 backdrop-blur-lg
                         transform transition-all duration-300 hover:-translate-y-2"
            >
              <Quote className="w-8 h-8 text-neon-purple mb-4" />
              <p className="text-lg mb-6">{testimonial.quote}</p>
              <div className="flex items-center">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="ml-4">
                  <h4 className="font-bold">{testimonial.author}</h4>
                  <p className="text-gray-400">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}