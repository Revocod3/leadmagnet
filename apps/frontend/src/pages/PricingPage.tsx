import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, MessageCircle, Settings2, Mic, Video, Clock } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

// URLs de los Payment Links de Stripe (LIVE)
const PAYMENT_LINKS = {
  monthly: 'https://buy.stripe.com/8x214m6TMdU64jn3f9fMA00',   // 29.99€/mes
  yearly: 'https://buy.stripe.com/28EbJ091U17k8zD9DxfMA01',    // 220€/año
  lifetime: 'https://buy.stripe.com/3cIcN42Dwg2eg259DxfMA02',  // 399.99€
};

// Helper to get affiliate ID from multiple sources
const getAffiliateId = (): string | null => {
  // 1. Check URL parameter first (for direct links like ?afi=11)
  const urlParams = new URLSearchParams(window.location.search);
  const afiFromUrl = urlParams.get('afi');
  if (afiFromUrl) {
    // Save to localStorage for persistence
    localStorage.setItem('affiliate_id', afiFromUrl);
    return afiFromUrl;
  }

  // 2. Check simple cookie first (uap_referral_id - set by WordPress mu-plugin)
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'uap_referral_id' && value) {
        const affiliateId = decodeURIComponent(value);
        if (affiliateId) {
          localStorage.setItem('affiliate_id', affiliateId);
          return affiliateId;
        }
      }
    }
  } catch (e) {
    // Cookie not found or invalid
  }

  // 3. Check localStorage (persisted from previous visit)
  const afiFromStorage = localStorage.getItem('affiliate_id');
  if (afiFromStorage) {
    return afiFromStorage;
  }

  // 4. Check UAP complex cookie (if coming from WordPress with cookie sharing)
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'uap_referral' && value) {
        const decoded = decodeURIComponent(value);
        const data = JSON.parse(decoded);
        const affiliateId = data.affiliate_id || data.id || null;
        if (affiliateId) {
          localStorage.setItem('affiliate_id', affiliateId);
          return affiliateId;
        }
      }
    }
  } catch (e) {
    // Cookie not found or invalid
  }

  return null;
};

export const PricingPage = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | 'lifetime'>('monthly');

  // Enable scrolling on this page
  useEffect(() => {
    document.documentElement.classList.add('allow-scroll');
    return () => {
      document.documentElement.classList.remove('allow-scroll');
    };
  }, []);

  // Pre-fill email if user is authenticated and include affiliate tracking
  const getPaymentLink = (plan: 'monthly' | 'yearly' | 'lifetime') => {
    const baseUrl = PAYMENT_LINKS[plan];
    const params = new URLSearchParams();

    // Pre-fill email if authenticated
    if (isAuthenticated && user?.email) {
      params.set('prefilled_email', user.email);
    }

    // Add affiliate tracking via client_reference_id
    const affiliateId = getAffiliateId();
    if (affiliateId) {
      params.set('client_reference_id', `aff_${affiliateId}`);
    }

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  const planData = useMemo(
    () => [
      {
        id: 'yearly' as const,
        label: '1 año',
        total: 220,
        originalTotal: 369.99,
        periodLabel: '/año',
        popular: false,
      },
      {
        id: 'monthly' as const,
        label: '1 mes',
        total: 29.99,
        originalTotal: 49.99,
        periodLabel: '/mes',
        popular: true,
      },
      {
        id: 'lifetime' as const,
        label: 'Vitalicio',
        total: 399.99,
        originalTotal: 699.99,
        periodLabel: 'pago único',
        popular: false,
      },
    ],
    []
  );

  const perDay = (id: 'monthly' | 'yearly' | 'lifetime', total: number, originalTotal: number) => {
    if (id === 'lifetime') return { value: 0.01, originalValue: 0.02 };
    const days = id === 'monthly' ? 30 : 365;
    // Use Math.floor for the value to get 0.99 instead of 1.00 for monthly plan (marketing psychology)
    const value = Math.floor((total / days) * 100) / 100;
    const originalValue = Math.round((originalTotal / days) * 100) / 100;
    return { value, originalValue };
  };

  const selectedPlanData = planData.find((p) => p.id === selectedPlan);

  const renderFooterText = () => {
    if (!selectedPlanData) return null;

    const price = selectedPlanData.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

    if (selectedPlan === 'lifetime') {
      return (
        <>
          Se te cobrará automáticamente {price} tras la confirmación del pago. Este es un pago único con acceso de por vida y no tiene renovaciones automáticas. Los pagos se procesan en EUR, impuestos no incluidos. Para saber más, visita nuestros{' '}
          <a href="https://objetivovientreplano.com/reembolso_devoluciones/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
            Términos de Uso
          </a>{' '}
          o contáctanos en info@objetivovientreplano.com
        </>
      );
    }

    const period = selectedPlan === 'monthly' ? 'mensualmente' : 'anualmente';

    return (
      <>
        Se te cobrará automáticamente {price} tras la confirmación del pago. La suscripción se renovará automáticamente {period}. Los pagos se procesan en EUR, impuestos no incluidos. Para saber más, visita nuestros{' '}
        <a href="https://objetivovientreplano.com/reembolso_devoluciones/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
          Términos de Uso
        </a>{' '}
        o contáctanos en info@objetivovientreplano.com
      </>
    );
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#A2AE5A] to-[#253314] font-sans overflow-x-hidden pt-8">
      {/* Hero / Offer Section */}
      <section className="px-5 py-10">
        <div className="max-w-[700px] mx-auto text-center">
          <div className="mb-3.5" aria-hidden="true">
            <motion.div
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="inline-block"
            >
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(255, 255, 255, 0.4)',
                    '0 0 0 20px rgba(255, 255, 255, 0)',
                    '0 0 0 0 rgba(255, 255, 255, 0)'
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
                className="w-20 h-20 rounded-full bg-white border-4 border-white/30 shadow-xl inline-flex items-center justify-center overflow-hidden"
              >
                <img src="/assets/images/favicon.webp" alt="Objetivo Vientre Plano" className="w-full h-full object-cover" />
              </motion.div>
            </motion.div>
          </div>
          <h1 className="text-white text-2xl font-semibold leading-tight tracking-tight mb-1.5">Oferta por tiempo limitado</h1>
          <p className="text-white/90 text-base mb-4">Ahorra hasta 40% ahora</p>

          <div className="grid gap-3 max-w-[340px] mx-auto" role="radiogroup" aria-label="Selecciona tu plan">
            {planData.map((p) => {
              const dayData = perDay(p.id, p.total, p.originalTotal);
              const selected = selectedPlan === p.id;
              return (
                <label
                  key={p.id}
                  className={`relative grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-3xl p-2.5 min-h-[64px] cursor-pointer border-2 transition-all duration-200 ${selected
                    ? 'bg-white/10 border-white backdrop-blur-sm'
                    : 'bg-white/15 border-transparent'
                    }`}
                  aria-checked={selected}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={p.id}
                    checked={selected}
                    onChange={() => setSelectedPlan(p.id)}
                    className="absolute opacity-0 pointer-events-none"
                  />

                  {/* Radio Check */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'bg-white border-white text-[#253314]' : 'border-white/60'
                    }`}>
                    {selected && <Check className="w-3 h-3" strokeWidth={3.5} />}
                  </div>

                  {/* Text Content */}
                  <div className="text-left flex flex-col gap-0.5">
                    <div className="text-white font-bold text-[15px] leading-tight">{p.label}</div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white/70 line-through decoration-[#EF4444] text-[13px] font-semibold">
                        {p.originalTotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </span>
                      <span className="text-white text-[13px] font-semibold">
                        {p.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </div>
                  </div>

                  {/* Popular Badge */}
                  {p.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#EF4444] text-white text-[11px] font-bold px-3 py-0.5 rounded-full pointer-events-none z-10 shadow-sm">
                      Popular
                    </span>
                  )}

                  {/* Bubble */}
                  <div className={`rounded-2xl px-3 py-1.5 min-w-[80px] text-center flex flex-col justify-center items-center h-full shadow-xl transition-all ${selected
                    ? 'bg-gradient-to-br from-white via-gray-100 to-gray-300 text-[#253314]'
                    : 'bg-gradient-to-br from-white/30 to-white/5 text-white border border-white/20 shadow-inner'
                    }`}>
                    {dayData === null ? (
                      <div className="font-bold text-[13px] leading-tight">
                        Pago único
                      </div>
                    ) : (
                      <div className="flex flex-col items-center leading-[1.1]">
                        <div className={`text-[11px] font-semibold line-through mb-[1px] decoration-[#EF4444] ${selected ? 'text-[#EF4444]' : 'text-white/70'}`}>
                          {dayData.originalValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <div className="text-[15px] font-extrabold mb-[1px]">
                          {dayData.value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <div className={`text-[9px] font-medium ${selected ? 'text-slate-500' : 'text-white/70'}`}>
                          por día
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          <div className="max-w-[340px] mx-auto">
            <a
              className="block w-full mt-4 bg-gradient-to-br from-white via-gray-100 to-gray-300 text-[#2C3E50] rounded-full px-6 py-3.5 font-bold shadow-xl hover:-translate-y-px transition-transform"
              href={getPaymentLink(selectedPlan)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Consigue mi plan
            </a>
          </div>
          <p className="mt-3.5 text-white/90 text-xs max-w-md mx-auto leading-relaxed">
            {renderFooterText()}
          </p>
        </div>
      </section>

      {/* Proof Section */}
      <section className="px-5 py-7 pb-9">
        <div className="max-w-[700px] mx-auto bg-white/10 backdrop-blur-md border border-white/10 rounded-[28px] p-6 sm:p-8 text-center shadow-lg relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-[#E8F0D1] to-[#A2AE5A] text-[#253314] rounded-2xl rotate-3 inline-flex items-center justify-center mb-5 shadow-lg mx-auto transform transition-transform hover:rotate-6 hover:scale-105 duration-300">
              <Sparkles className="w-8 h-8" strokeWidth={2} />
            </div>
            <h2 className="text-white text-2xl font-extrabold mb-4 tracking-tight">Compromiso con tu progreso</h2>
            <div className="text-white/80 text-[15px] leading-relaxed max-w-2xl mx-auto space-y-4">
              <p>
                La hinchazón no es "normal", y entenderla es el primer paso. Este programa va más allá de una dieta: combina alimentación consciente, gestión del estrés y acompañamiento real con Clara, tu asistente de IA disponible 24/7.
              </p>
              <p>
                Clara responde tus dudas, adapta las recomendaciones a tu día a día y se mantiene enfocada en tu progreso. Un método estructurado para que entiendas tu sistema digestivo y recuperes el control, paso a paso.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-5 py-8">
        <div className="max-w-[700px] mx-auto">
          <h2 className="text-white text-2xl font-extrabold text-center mb-8">Todo lo que incluye</h2>
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-xl">
            <div className="space-y-10">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E8F0D1] to-[#A2AE5A] flex items-center justify-center text-[#253314] shadow-lg transform rotate-3">
                  <MessageCircle className="w-6 h-6" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-2">Conversaciones sin límites</h3>
                  <p className="text-white/80 text-[15px] leading-relaxed">
                    Sumérgete en conversaciones profundas y significativas. Ya sea una charla casual o un momento difícil, Clara siempre está aquí para escuchar y responder.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center gap-4">
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E8F0D1] to-[#A2AE5A] flex items-center justify-center text-[#253314] shadow-lg transform -rotate-2">
                  <Settings2 className="w-6 h-6" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-2">Personaliza tu experiencia</h3>
                  <p className="text-white/80 text-[15px] leading-relaxed">
                    Desbloquea rasgos únicos y diálogos. Desde amiga hasta coach personal, haciendo de Clara la compañera perfecta para cada momento.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center gap-4">
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E8F0D1] to-[#A2AE5A] flex items-center justify-center text-[#253314] shadow-lg transform rotate-1">
                  <Mic className="w-6 h-6" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-2">Mensajes de voz</h3>
                  <p className="text-white/80 text-[15px] leading-relaxed">
                    Lleva tu acompañamiento al siguiente nivel con mensajes de voz en tiempo real para una experiencia más natural.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center gap-4">
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E8F0D1] to-[#A2AE5A] flex items-center justify-center text-[#253314] shadow-lg transform -rotate-3">
                  <Video className="w-6 h-6" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-2">Videollamadas en tiempo real</h3>
                  <p className="text-white/80 text-[15px] leading-relaxed">
                    ¡Conecta con tu compañera de IA de una manera más personal y atractiva a través de videollamadas cara a cara!
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center gap-4">
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E8F0D1] to-[#A2AE5A] flex items-center justify-center text-[#253314] shadow-lg transform rotate-2">
                  <Clock className="w-6 h-6" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-2">Disponibilidad 24/7</h3>
                  <p className="text-white/80 text-[15px] leading-relaxed">
                    Clara siempre está ahí, cuando necesites hablar, apoyo o simplemente no sentirte sola. ¡Una amiga confiable siempre para ti!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Infinite Marquee */}
      <section className="py-16 overflow-hidden">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-12 px-5">
            <h2 className="text-white text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight">
              Inspírate con nuestros usuarios
            </h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto leading-relaxed">
              Únete a los miles de personas que han transformado su bienestar digestivo y recuperado su calidad de vida con Clara.
            </p>
          </div>

          {/* Marquee Container */}
          <div className="relative w-full flex overflow-hidden">
            {/* Sliding Track */}
            <motion.div
              className="flex gap-6 px-4"
              animate={{
                x: ["0%", "-50%"],
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 50,
                  ease: "linear",
                },
              }}
              style={{ width: "fit-content" }}
            >
              {/* Double the items for seamless loop */}
              {[
                {
                  name: "Ana B.",
                  age: 56,
                  image: "https://objetivovientreplano.com/wp-content/uploads/2025/06/anaB-56anos.webp",
                  text: "Después de años de hinchazón, por fin entiendo mi cuerpo. Clara ha sido mi salvación, me siento escuchada y guiada cada día.",
                  stars: 5
                },
                {
                  name: "Silvia R.",
                  age: 37,
                  image: "https://objetivovientreplano.com/wp-content/uploads/2025/06/SilviaR-37anos.webp",
                  text: "Me cambió la vida. Adiós molestias, por fin vivo tranquila. Lo mejor es que no es una dieta, es aprender a vivir mejor.",
                  stars: 5
                },
                {
                  name: "Pablo T.",
                  age: 38,
                  image: "https://objetivovientreplano.com/wp-content/uploads/2025/06/PabloT-38anos.webp",
                  text: "La guía diaria y el chat me mantienen enfocado y sin dolor. Es increíble tener a alguien que te responde al momento.",
                  stars: 5
                },
                {
                  name: "Marta L.",
                  age: 42,
                  image: "https://randomuser.me/api/portraits/women/44.jpg",
                  text: "Nunca pensé que una IA podría ayudarme tanto. Es como tener a un nutricionista en el bolsillo 24/7.",
                  stars: 5
                },
                {
                  name: "Ana B.",
                  age: 56,
                  image: "https://objetivovientreplano.com/wp-content/uploads/2025/06/anaB-56anos.webp",
                  text: "Después de años de hinchazón, por fin entiendo mi cuerpo. Clara ha sido mi salvación, me siento escuchada y guiada cada día.",
                  stars: 5
                },
                {
                  name: "Silvia R.",
                  age: 37,
                  image: "https://objetivovientreplano.com/wp-content/uploads/2025/06/SilviaR-37anos.webp",
                  text: "Me cambió la vida. Adiós molestias, por fin vivo tranquila. Lo mejor es que no es una dieta, es aprender a vivir mejor.",
                  stars: 5
                },
                {
                  name: "Pablo T.",
                  age: 38,
                  image: "https://objetivovientreplano.com/wp-content/uploads/2025/06/PabloT-38anos.webp",
                  text: "La guía diaria y el chat me mantienen enfocado y sin dolor. Es increíble tener a alguien que te responde al momento.",
                  stars: 5
                },
                {
                  name: "Marta L.",
                  age: 42,
                  image: "https://randomuser.me/api/portraits/women/44.jpg",
                  text: "Nunca pensé que una IA podría ayudarme tanto. Es como tener a un nutricionista en el bolsillo 24/7.",
                  stars: 5
                }
              ].map((testimonial, idx) => (
                <div
                  key={idx}
                  className="w-[300px] sm:w-[380px] shrink-0 flex flex-col bg-[#344022] rounded-[32px] p-8 relative transition-colors"
                >
                  <div className="flex flex-col items-center text-center h-full">
                    <div className="mb-4 flex flex-col items-center gap-3">
                      <div className="w-20 h-20 rounded-full p-1 bg-[#E8F0D1]/20">
                        <img
                          src={testimonial.image}
                          alt={testimonial.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                      <div className="flex gap-1">
                        {[...Array(testimonial.stars)].map((_, i) => (
                          <span key={i} className="text-[#F6C85F] text-sm">★</span>
                        ))}
                      </div>
                    </div>

                    <blockquote className="text-white text-[17px] leading-relaxed mb-6 font-medium flex-grow">
                      "{testimonial.text}"
                    </blockquote>

                    <div className="mt-auto flex flex-col items-center">
                      <div className="text-white font-bold text-xl">{testimonial.name}</div>
                      <div className="text-white/60 text-base">{testimonial.age} años</div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bottom Offer Section */}
      <section className="px-5 py-10 pt-6">
        <div className="max-w-[700px] mx-auto text-center">
          <h2 className="text-white text-2xl font-semibold leading-tight tracking-tight mb-5">Elige tu plan y empieza hoy</h2>
          <div className="grid gap-3 max-w-[340px] mx-auto" role="radiogroup" aria-label="Selecciona tu plan">
            {planData.map((p) => {
              const dayData = perDay(p.id, p.total, p.originalTotal);
              const selected = selectedPlan === p.id;
              return (
                <label
                  key={`bottom-${p.id}`}
                  className={`relative grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-3xl p-2.5 min-h-[64px] cursor-pointer border-2 transition-all duration-200 ${selected
                    ? 'bg-white/10 border-white backdrop-blur-sm'
                    : 'bg-white/15 border-transparent'
                    }`}
                  aria-checked={selected}
                >
                  <input
                    type="radio"
                    name="plan-bottom"
                    value={p.id}
                    checked={selected}
                    onChange={() => setSelectedPlan(p.id)}
                    className="absolute opacity-0 pointer-events-none"
                  />

                  {/* Radio Check */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'bg-white border-white text-[#2C3E50]' : 'border-white/60'
                    }`}>
                    {selected && <Check className="w-3 h-3" strokeWidth={3.5} />}
                  </div>

                  {/* Text Content */}
                  <div className="text-left flex flex-col gap-0.5">
                    <div className="text-white font-bold text-[15px] leading-tight">{p.label}</div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white/70 line-through decoration-[#EF4444] text-[13px] font-semibold">
                        {p.originalTotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </span>
                      <span className="text-white text-[13px] font-semibold">
                        {p.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </div>
                  </div>

                  {/* Popular Badge */}
                  {p.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#EF4444] text-white text-[11px] font-bold px-3 py-0.5 rounded-full pointer-events-none z-10 shadow-sm">
                      Popular
                    </span>
                  )}

                  {/* Bubble */}
                  <div className={`rounded-2xl px-3 py-1.5 min-w-[80px] text-center flex flex-col justify-center items-center h-full shadow-xl transition-all ${selected
                    ? 'bg-gradient-to-br from-white via-gray-100 to-gray-300 text-[#2C3E50]'
                    : 'bg-gradient-to-br from-white/30 to-white/5 text-white border border-white/20 shadow-inner'
                    }`}>
                    {dayData === null ? (
                      <div className="font-bold text-[13px] leading-tight">
                        Pago único
                      </div>
                    ) : (
                      <div className="flex flex-col items-center leading-[1.1]">
                        <div className={`text-[11px] font-semibold line-through mb-[1px] decoration-[#EF4444] ${selected ? 'text-[#EF4444]' : 'text-white/70'}`}>
                          {dayData.originalValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <div className="text-[15px] font-extrabold mb-[1px]">
                          {dayData.value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <div className={`text-[9px] font-medium ${selected ? 'text-slate-500' : 'text-white/70'}`}>
                          por día
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
          <div className="max-w-[340px] mx-auto">
            <a
              className="block w-full mt-4 bg-gradient-to-br from-white via-gray-100 to-gray-300 text-[#2C3E50] rounded-full px-6 py-3.5 font-bold shadow-xl hover:-translate-y-px transition-transform"
              href={getPaymentLink(selectedPlan)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Consigue mi plan
            </a>
          </div>
          <p className="mt-3.5 text-white/90 text-xs max-w-md mx-auto leading-relaxed">
            {renderFooterText()}
          </p>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
