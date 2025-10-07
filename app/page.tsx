"use client";

import { Link } from "@heroui/link";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import {
  Shield,
  ChartBar,
  Users,
  FileCheck,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Lock,
  Zap,
  BarChart3,
  Award,
  Globe,
  Clock,
  Database,
  LineChart,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  // Refs para seções
  const statsRef = useRef(null);
  const featuresRef = useRef(null);
  const benefitsRef = useRef(null);
  const certificationsRef = useRef(null);
  const ctaRef = useRef(null);

  // Estados de visibilidade
  const [statsVisible, setStatsVisible] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const [benefitsVisible, setBenefitsVisible] = useState(false);
  const [certificationsVisible, setCertificationsVisible] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Intersection Observer com threshold mais baixo para ativar mais cedo
    const observerOptions = {
      threshold: 0.15,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          switch (entry.target.id) {
            case "stats-section":
              setStatsVisible(true);
              break;
            case "features-section":
              setFeaturesVisible(true);
              break;
            case "benefits-section":
              setBenefitsVisible(true);
              break;
            case "certifications-section":
              setCertificationsVisible(true);
              break;
            case "cta-section":
              setCtaVisible(true);
              break;
          }
        }
      });
    }, observerOptions);

    // Observar as seções
    const sections = [
      statsRef.current,
      featuresRef.current,
      benefitsRef.current,
      certificationsRef.current,
      ctaRef.current,
    ];

    sections.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      observer.disconnect();
    };
  }, []);

  const features = [
    {
      icon: Shield,
      title: "Gestão Avançada de Riscos",
      description:
        "Metodologias reconhecidas internacionalmente para identificação, análise e tratamento de riscos corporativos.",
    },
    {
      icon: ChartBar,
      title: "Business Intelligence",
      description:
        "Dashboards executivos com KPIs estratégicos, análise de tendências e visualização de dados em tempo real.",
    },
    {
      icon: Users,
      title: "Governança Corporativa",
      description:
        "Gestão hierárquica de usuários com controle granular de permissões e trilhas de auditoria completas.",
    },
    {
      icon: FileCheck,
      title: "Compliance & Reporting",
      description:
        "Relatórios automatizados em conformidade com ISO 31000, COSO ERM, SOX e outras normas internacionais.",
    },
    {
      icon: AlertTriangle,
      title: "Monitoramento Contínuo",
      description:
        "Sistema de alertas inteligentes com notificações customizáveis para eventos críticos e desvios de indicadores.",
    },
    {
      icon: TrendingUp,
      title: "Analytics Preditivo",
      description:
        "Inteligência artificial e machine learning para análise preditiva de cenários e simulações de risco.",
    },
  ];

  const benefits = [
    {
      icon: Award,
      text: "Redução comprovada de 65% no tempo de análise de riscos",
    },
    {
      icon: ShieldCheck,
      text: "Conformidade total com ISO 31000, COSO ERM e SOX",
    },
    {
      icon: Globe,
      text: "Suporte multilíngue e operação em 45+ países",
    },
    {
      icon: Clock,
      text: "Suporte técnico especializado 24/7/365",
    },
    {
      icon: Database,
      text: "Infraestrutura cloud com 99.99% de disponibilidade",
    },
    {
      icon: Lock,
      text: "Segurança nível bancário com criptografia AES-256",
    },
  ];

  const stats = [
    {
      value: "850+",
      label: "Organizações Globais",
      sublabel: "Fortune 500 e mid-market",
    },
    {
      value: "2.5M+",
      label: "Riscos Gerenciados",
      sublabel: "Ativamente monitorados",
    },
    {
      value: "99.99%",
      label: "Uptime SLA",
      sublabel: "Garantia contratual",
    },
    {
      value: "<2min",
      label: "Tempo de Resposta",
      sublabel: "Suporte crítico",
    },
  ];

  const certifications = [
    "ISO 27001",
    "SOC 2 Type II",
    "GDPR Compliant",
    "ISO 31000",
    "COSO ERM",
    "NIST Framework",
  ];

  const footerLinks = {
    produto: [
      { label: "Recursos", href: "#features" },
      { label: "Integrações", href: "#" },
      { label: "Preços", href: "#" },
      { label: "Atualizações", href: "#" },
      { label: "Roadmap", href: "#" },
    ],
    solucoes: [
      { label: "Enterprise", href: "#" },
      { label: "Pequenas Empresas", href: "#" },
      { label: "Consultoria", href: "#" },
      { label: "Compliance", href: "#" },
      { label: "Auditoria", href: "#" },
    ],
    recursos: [
      { label: "Documentação", href: "#" },
      { label: "API", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Webinars", href: "#" },
      { label: "Case Studies", href: "#" },
    ],
    empresa: [
      { label: "Sobre Nós", href: "#" },
      { label: "Carreiras", href: "#" },
      { label: "Imprensa", href: "#" },
      { label: "Parceiros", href: "#" },
      { label: "Contato", href: "#" },
    ],
    legal: [
      { label: "Privacidade", href: "#" },
      { label: "Termos de Uso", href: "#" },
      { label: "Segurança", href: "#" },
      { label: "LGPD", href: "#" },
      { label: "Cookies", href: "#" },
    ],
  };

  const socialLinks = [
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Youtube, href: "#", label: "YouTube" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Cursor follower effect */}
      <div
        className="pointer-events-none fixed inset-0 z-30 transition duration-300"
        style={{
          background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.05), transparent 80%)`,
        }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-50 via-blue-50/30 to-blue-50/20 dark:from-zinc-950 dark:via-blue-950/10 dark:to-blue-950/10 py-24 md:py-32 lg:py-40">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-zinc-950" />

        {/* Animated floating elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-pulse delay-700" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-400/5 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div
              className={`inline-flex items-center gap-2 bg-blue-600/10 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 backdrop-blur-sm transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-4"
              }`}
            >
              <Zap className="h-4 w-4 animate-pulse" />
              <span>Enterprise Risk Management Platform</span>
              <Sparkles className="h-4 w-4 animate-pulse delay-150" />
            </div>

            {/* Headline */}
            <h1
              className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-zinc-900 dark:text-white mb-8 leading-tight tracking-tight transition-all duration-1000 delay-100 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              Excelência em
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                Gestão de Riscos
              </span>
            </h1>

            {/* Subheadline */}
            <p
              className={`text-xl sm:text-2xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto mb-12 leading-relaxed font-light transition-all duration-1000 delay-200 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              Plataforma enterprise para identificação, avaliação e mitigação de
              riscos corporativos. Decisões estratégicas baseadas em
              inteligência de dados.
            </p>

            {/* CTA Buttons */}
            <div
              className={`flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 transition-all duration-1000 delay-300 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <Button
                as={Link}
                href="/auth/register"
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all px-10 h-14 text-base group"
                endContent={
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                }
              >
                Solicitar Demo
              </Button>
              <Button
                as={Link}
                href="/auth"
                size="lg"
                variant="bordered"
                className="border-2 border-zinc-300 dark:border-zinc-700 font-semibold px-10 h-14 text-base hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:scale-105 transition-all"
              >
                Acessar Plataforma
              </Button>
            </div>

            {/* Trust Indicators */}
            <div
              className={`flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-sm text-zinc-600 dark:text-zinc-500 transition-all duration-1000 delay-400 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              {[
                "Trial de 30 dias",
                "Setup personalizado",
                "Suporte dedicado",
              ].map((text, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 hover:scale-110 transition-transform"
                >
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-500 animate-pulse" />
                  <span className="font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section
        id="stats-section"
        ref={statsRef}
        className="py-20 border-y border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`text-center group cursor-pointer transition-all duration-700 ${
                  statsVisible
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-12 scale-90"
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="text-5xl md:text-6xl font-bold bg-gradient-to-br from-blue-600 to-blue-500 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                  {stat.value}
                </div>
                <div className="text-zinc-900 dark:text-white font-semibold text-lg mb-1">
                  {stat.label}
                </div>
                <div className="text-zinc-600 dark:text-zinc-400 text-sm">
                  {stat.sublabel}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features-section"
        ref={featuresRef}
        className="py-24 md:py-32 bg-zinc-50 dark:bg-zinc-950 relative"
      >
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/3 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/3 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div
              className={`inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-semibold mb-6 transition-all duration-700 ${
                featuresVisible
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 -translate-y-4 scale-95"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Recursos Enterprise</span>
            </div>
            <h2
              className={`text-4xl sm:text-5xl md:text-6xl font-bold text-zinc-900 dark:text-white mb-6 transition-all duration-700 delay-100 ${
                featuresVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              Tecnologia de Ponta para
              <br />
              Gestão Estratégica
            </h2>
            <p
              className={`text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto transition-all duration-700 delay-200 ${
                featuresVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              Ferramentas avançadas para profissionais que exigem precisão,
              segurança e performance em gestão de riscos corporativos.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <Card
                  key={index}
                  className={`bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-2xl hover:shadow-blue-500/10 group cursor-pointer hover:-translate-y-2 duration-500 ${
                    featuresVisible
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 translate-y-12 scale-95"
                  }`}
                  style={{ transitionDelay: `${index * 150 + 300}ms` }}
                >
                  <CardBody className="p-8 relative overflow-hidden">
                    {/* Hover effect background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-blue-500/50">
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {feature.description}
                      </p>

                      {/* Arrow indicator on hover */}
                      <div className="mt-4 flex items-center gap-2 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-2">
                        <span className="text-sm font-semibold">
                          Saiba mais
                        </span>
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section
        id="benefits-section"
        ref={benefitsRef}
        className="py-24 md:py-32 bg-white dark:bg-zinc-900 relative overflow-hidden"
      >
        {/* Animated elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-10 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 left-10 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl animate-float-delayed" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Content */}
            <div>
              <div
                className={`inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-semibold mb-6 transition-all duration-700 ${
                  benefitsVisible
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-8"
                }`}
              >
                <Award className="h-4 w-4" />
                <span>Diferenciais Competitivos</span>
              </div>
              <h2
                className={`text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-6 transition-all duration-700 delay-100 ${
                  benefitsVisible
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-8"
                }`}
              >
                Líder Global em
                <br />
                Risk Management
              </h2>
              <p
                className={`text-xl text-zinc-600 dark:text-zinc-400 mb-10 leading-relaxed transition-all duration-700 delay-200 ${
                  benefitsVisible
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-8"
                }`}
              >
                Desenvolvida em parceria com especialistas de Big Four, nossa
                plataforma oferece o que há de mais avançado em tecnologia para
                gestão de riscos empresariais.
              </p>

              <div className="space-y-5">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <div
                      key={index}
                      className={`flex items-start gap-4 p-4 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all duration-700 group cursor-pointer hover:translate-x-2 ${
                        benefitsVisible
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 -translate-x-12"
                      }`}
                      style={{ transitionDelay: `${index * 100 + 300}ms` }}
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-zinc-700 dark:text-zinc-300 font-medium text-lg pt-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {benefit.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Visual */}
            <div
              className={`relative transition-all duration-1000 ${
                benefitsVisible
                  ? "opacity-100 translate-x-0 rotate-0"
                  : "opacity-0 translate-x-12 rotate-6"
              }`}
            >
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 p-1 shadow-2xl hover:shadow-blue-500/30 transition-all duration-500 hover:scale-105 hover:rotate-2">
                <div className="w-full h-full rounded-[23px] bg-white dark:bg-zinc-900 p-12 flex flex-col items-center justify-center relative overflow-hidden group">
                  {/* Animated background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <LineChart className="h-40 w-40 text-blue-600 dark:text-blue-400 mb-8 relative z-10 animate-pulse-slow" />
                  <h3 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4 text-center relative z-10">
                    Risk Intelligence
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-center text-lg relative z-10">
                    Dashboards executivos com insights acionáveis em tempo real
                  </p>
                </div>
              </div>
              {/* Floating element */}
              <div className="absolute -bottom-6 -right-6 bg-gradient-to-br from-blue-600 to-blue-500 text-white p-6 rounded-2xl shadow-2xl animate-float hover:scale-110 transition-transform duration-300 cursor-pointer">
                <div className="text-3xl font-bold mb-1">+165%</div>
                <div className="text-sm font-medium opacity-90">
                  ROI Médio em 12 meses
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section
        id="certifications-section"
        ref={certificationsRef}
        className="py-16 bg-zinc-50 dark:bg-zinc-950 border-y border-zinc-200 dark:border-zinc-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p
              className={`text-zinc-600 dark:text-zinc-400 font-semibold text-sm uppercase tracking-wider mb-6 transition-all duration-700 ${
                certificationsVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              Certificações e Conformidade
            </p>
            <div className="flex flex-wrap justify-center gap-8">
              {certifications.map((cert, index) => (
                <div
                  key={index}
                  className={`px-6 py-3 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-lg font-semibold text-zinc-900 dark:text-white hover:border-blue-500 hover:scale-110 transition-all duration-700 cursor-pointer hover:shadow-lg ${
                    certificationsVisible
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 translate-y-8 scale-90"
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {cert}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="cta-section"
        ref={ctaRef}
        className="py-24 md:py-32 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:24px_24px] animate-grid" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        {/* Animated orbs */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-float-delayed" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div
            className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm mb-8 transition-all duration-700 ${
              ctaVisible
                ? "opacity-100 scale-100 rotate-0"
                : "opacity-0 scale-0 rotate-45"
            }`}
          >
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h2
            className={`text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 transition-all duration-700 delay-100 ${
              ctaVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            Transforme sua Gestão de
            <br />
            Riscos Corporativos
          </h2>
          <p
            className={`text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed transition-all duration-700 delay-200 ${
              ctaVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            Junte-se a organizações líderes globais que confiam em nossa
            plataforma para proteger seus ativos e garantir crescimento
            sustentável.
          </p>

          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center mb-12 transition-all duration-700 delay-300 ${
              ctaVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <Button
              as={Link}
              href="/auth/register"
              size="lg"
              className="bg-white text-blue-600 font-semibold shadow-2xl hover:bg-zinc-50 px-10 h-14 text-base hover:scale-105 transition-all group"
              endContent={
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              }
            >
              Agendar Apresentação
            </Button>
            <Button
              as={Link}
              href="/auth"
              size="lg"
              variant="bordered"
              className="border-2 border-white text-white font-semibold hover:bg-white/10 backdrop-blur-sm px-10 h-14 text-base hover:scale-105 transition-all"
            >
              Fazer Login
            </Button>
          </div>

          <p
            className={`text-white/75 text-sm transition-all duration-700 delay-400 ${
              ctaVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            Sem compromisso • Setup em 48h • Suporte em português
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 dark:bg-black text-white">
        {/* Main Footer */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8">
            {/* Brand Column */}
            <div className="lg:col-span-2 animate-fade-in">
              <div className="flex items-center gap-2 mb-6 group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">RiskAssessment</span>
              </div>
              <p className="text-zinc-400 mb-6 leading-relaxed">
                Plataforma enterprise líder em gestão de riscos corporativos.
                Tecnologia avançada para decisões estratégicas inteligentes.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-zinc-400 hover:text-white transition-all group cursor-pointer hover:translate-x-2">
                  <Mail className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <a
                    href="mailto:contato@riskassessment.com"
                    className="text-sm"
                  >
                    contato@riskassessment.com
                  </a>
                </div>
                <div className="flex items-center gap-3 text-zinc-400 hover:text-white transition-all group cursor-pointer hover:translate-x-2">
                  <Phone className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <a href="tel:+551140634000" className="text-sm">
                    +55 (11) 4063-4000
                  </a>
                </div>
                <div className="flex items-start gap-3 text-zinc-400 hover:text-white transition-all group cursor-pointer hover:translate-x-2">
                  <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <span className="text-sm">
                    Av. Paulista, 1578 - Bela Vista
                    <br />
                    São Paulo, SP - 01310-200
                  </span>
                </div>
              </div>
            </div>

            {/* Links Columns */}
            {Object.entries(footerLinks)
              .slice(0, 4)
              .map(([key, links], colIndex) => (
                <div
                  key={key}
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${colIndex * 0.1}s both`,
                  }}
                >
                  <h3 className="font-bold text-white mb-4 capitalize">
                    {key === "produto"
                      ? "Produto"
                      : key === "solucoes"
                        ? "Soluções"
                        : key === "recursos"
                          ? "Recursos"
                          : "Empresa"}
                  </h3>
                  <ul className="space-y-3">
                    {links.map((link, index) => (
                      <li key={index}>
                        <Link
                          href={link.href}
                          className="text-zinc-400 hover:text-white transition-all text-sm inline-block hover:translate-x-1"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

            {/* Legal Links Column */}
            <div
              style={{
                animation: `fadeInUp 0.6s ease-out 0.4s both`,
              }}
            >
              <h3 className="font-bold text-white mb-4">Legal</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-zinc-400 hover:text-white transition-all text-sm inline-block hover:translate-x-1"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter */}
          <div className="mt-16 pt-12 border-t border-zinc-800">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-fade-in">
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  Fique por dentro das novidades
                </h3>
                <p className="text-zinc-400">
                  Receba insights exclusivos sobre gestão de riscos e
                  atualizações da plataforma.
                </p>
              </div>
              <div className="flex gap-3">
                <input
                  type="email"
                  placeholder="Seu email corporativo"
                  className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:scale-105 transition-all"
                />
                <Button className="bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold px-8 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 transition-all">
                  Inscrever
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-zinc-800 bg-zinc-950 dark:bg-zinc-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              {/* Copyright */}
              <div className="text-zinc-500 text-sm text-center md:text-left animate-fade-in">
                © {new Date().getFullYear()} RiskAssessment. Todos os direitos
                reservados. CNPJ: 00.000.000/0001-00
              </div>

              {/* Legal Links */}
              <div className="flex flex-wrap justify-center gap-6 animate-fade-in-delay">
                {footerLinks.legal.slice(0, 3).map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    className="text-zinc-500 hover:text-white transition-all text-sm hover:-translate-y-1"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-4 animate-fade-in-delay-2">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <Link
                      key={index}
                      href={social.href}
                      className="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all hover:scale-110 hover:rotate-12"
                      aria-label={social.label}
                    >
                      <Icon className="h-5 w-5" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }

        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-30px) translateX(-10px);
          }
        }

        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes bounce-slow {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }

        @keyframes grid {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(24px);
          }
        }

        .animate-gradient {
          animation: gradient 3s ease infinite;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animate-grid {
          animation: grid 2s linear infinite;
        }

        .animate-fade-in {
          animation: fadeInUp 0.8s ease-out;
        }

        .animate-fade-in-delay {
          animation: fadeInUp 0.8s ease-out 0.2s both;
        }

        .animate-fade-in-delay-2 {
          animation: fadeInUp 0.8s ease-out 0.4s both;
        }

        .animate-fade-in-delay-3 {
          animation: fadeInUp 0.8s ease-out 0.6s both;
        }

        .animate-slide-in-left {
          animation: fadeInLeft 0.8s ease-out;
        }

        .animate-slide-in-right {
          animation: fadeInUp 0.8s ease-out;
        }

        .delay-100 {
          animation-delay: 0.1s;
        }

        .delay-200 {
          animation-delay: 0.2s;
        }

        .delay-700 {
          animation-delay: 0.7s;
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}
