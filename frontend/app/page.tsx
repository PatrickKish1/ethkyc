"use client";

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, Users, Lock, Globe, Zap, CheckCircle, Star, ArrowUpRight, Play } from 'lucide-react';
import Header from '@/components/Header';

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20">
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white/90 text-sm font-medium mb-8 animate-fade-in-up">
              <Star className="w-4 h-4 mr-2 text-yellow-400" />
              Next-Generation Decentralized Identity
            </div>

            {/* Main Heading */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-tight animate-fade-in-up animation-delay-200">
              The Future of
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Digital Identity
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400">
              UniKYC combines blockchain technology, threshold cryptography, and the dcipher network 
              to create a secure, privacy-preserving, and interoperable identity verification system.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-fade-in-up animation-delay-600">
              <Link href="/demo">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105">
                  <Play className="w-5 h-5 mr-2" />
                  Try Demo
                </Button>
              </Link>
              <Link href="/face-demo">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-white/30 bg-white/10 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
                >
                  Face Detection Demo
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto animate-fade-in-up animation-delay-800">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">100%</div>
                <div className="text-white/70">Privacy Preserved</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">5+</div>
                <div className="text-white/70">Blockchain Networks</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">∞</div>
                <div className="text-white/70">Reusable Identity</div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-1/4 left-10 w-20 h-20 bg-blue-500/20 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-1/4 right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-float-delayed"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 animate-on-scroll">
              Why Choose UniKYC?
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto animate-on-scroll">
              A revolutionary approach to identity verification that puts users in control 
              while maintaining the highest security standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "User Control",
                description: "Full self-sovereign identity with complete control over personal data and disclosure preferences.",
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: Lock,
                title: "Privacy First",
                description: "Zero-knowledge proofs and threshold cryptography ensure privacy while maintaining verifiability.",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: Globe,
                title: "Interoperable",
                description: "Works seamlessly across different platforms, services, and blockchain networks.",
                color: "from-blue-500 to-cyan-500"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="group p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-500 transform hover:scale-105 animate-on-scroll"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-white/70 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section id="technology" className="py-24 bg-white/5 backdrop-blur-sm relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 animate-on-scroll">
              Built on Proven Technology
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto animate-on-scroll">
              Leveraging cutting-edge standards and protocols for secure, scalable identity management.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: "ENS", desc: "Ethereum Name Service", icon: "🔗" },
              { name: "SIWE", desc: "Sign-In with Ethereum", icon: "🔐" },
              { name: "Filecoin", desc: "Decentralized Storage", icon: "💾" },
              { name: "WebAuthn", desc: "Biometric Security", icon: "👆" },
              { name: "dcipher", desc: "Verifiable Randomness", icon: "🎲" },
              { name: "Blocklock", desc: "Conditional Encryption", icon: "⏰" },
              { name: "Threshold", desc: "Multi-Key Crypto", icon: "🔑" },
              { name: "Multi-Chain", desc: "Cross-Network Support", icon: "🌐" }
            ].map((tech, index) => (
              <div 
                key={index}
                className="text-center p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 transform hover:scale-105 animate-on-scroll"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-3xl mb-3">{tech.icon}</div>
                <h4 className="font-bold text-white mb-2">{tech.name}</h4>
                <p className="text-sm text-white/70">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="animate-on-scroll">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
                  Revolutionizing Identity Verification
                </h2>
                <p className="text-xl text-white/70 mb-8 leading-relaxed">
                  UniKYC represents a paradigm shift in how we think about digital identity. 
                  By combining blockchain technology with advanced cryptography, we've created 
                  a system that's both more secure and more user-friendly than traditional solutions.
                </p>
                
                <div className="space-y-4">
                  {[
                    "Self-sovereign identity management",
                    "Cross-chain interoperability",
                    "Zero-knowledge proof verification",
                    "Biometric authentication support",
                    "Decentralized document storage",
                    "Conditional data release"
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-white/80">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="animate-on-scroll">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl"></div>
                  <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Shield className="w-12 h-12 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">Ready to Get Started?</h3>
                      <p className="text-white/70 mb-6">
                        Experience the future of decentralized identity verification with our interactive demo.
                      </p>
                      <Link href="/demo">
                        <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white w-full">
                          Launch Demo
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 text-center relative">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 animate-on-scroll">
              Join the Identity Revolution
            </h2>
            <p className="text-xl text-white/70 mb-8 animate-on-scroll">
              Be part of the future where users control their digital identity 
              and privacy is not just a promise, but a guarantee.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-on-scroll">
              <Link href="/demo">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg">
                  <Zap className="w-5 h-5 mr-2" />
                  Try Demo Now
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg backdrop-blur-sm"
              >
                Learn More
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
