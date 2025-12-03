import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

// URLs de los Payment Links de Stripe (LIVE)
const PAYMENT_LINKS = {
  monthly: 'https://buy.stripe.com/8x214m6TMdU64jn3f9fMA00',   // 29.99€/mes
  yearly: 'https://buy.stripe.com/28EbJ091U17k8zD9DxfMA01',    // 220€/año
  lifetime: 'https://buy.stripe.com/3cIcN42Dwg2eg259DxfMA02',  // 399.99€
};

export const PricingPage = () => {
  const { user, isAuthenticated } = useAuthStore();

  // Enable scrolling on this page
  useEffect(() => {
    document.documentElement.classList.add('allow-scroll');
    return () => {
      document.documentElement.classList.remove('allow-scroll');
    };
  }, []);

  // Pre-fill email if user is authenticated
  const getPaymentLink = (plan: 'monthly' | 'yearly' | 'lifetime') => {
    const baseUrl = PAYMENT_LINKS[plan];
    if (isAuthenticated && user?.email) {
      return `${baseUrl}?prefilled_email=${encodeURIComponent(user.email)}`;
    }
    return baseUrl;
  };

  return (
    <div className="ovp-pricing-page">
      {/* Hero Section */}
      <section className="ovp-pricing-hero">
        <div className="ovp-pricing-hero-container">
          <div className="ovp-pricing-hero-badge">
            💎 Planes de Suscripción
          </div>
          <h1 className="ovp-pricing-hero-title">Elige tu plan</h1>
          <p className="ovp-pricing-hero-subtitle">
            Transforma tu digestión y vive con libertad: tu vientre puede sentirse bien hoy
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="ovp-pricing-container">
        <div className="ovp-pricing-grid">
          {/* Plan Mensual */}
          <div className="ovp-pricing-card">
            <h3 className="ovp-plan-name">Plan Mensual</h3>
            <div className="ovp-plan-price">
              <span className="ovp-price-amount">29,99€</span>
              <span className="ovp-price-period">/mes</span>
            </div>
            <p className="ovp-plan-description">
              Ideal para comenzar tu transformación sin compromiso
            </p>
            <div className="ovp-divider"></div>
            <ul className="ovp-features-list">
              <li className="ovp-feature-item">
                <span className="ovp-feature-icon">✓</span>
                <span>Acompañamiento personalizado 24/7 con IA</span>
              </li>
              <li className="ovp-feature-item">
                <span className="ovp-feature-icon">✓</span>
                <span>Acceso a todas las herramientas y guías</span>
              </li>
              <li className="ovp-feature-item">
                <span className="ovp-feature-icon">✓</span>
                <span>Diagnóstico continuo según tus síntomas</span>
              </li>
              <li className="ovp-feature-item">
                <span className="ovp-feature-icon">✓</span>
                <span>Cancelación fácil y sin compromisos</span>
              </li>
            </ul>
            <a
              href={getPaymentLink('monthly')}
              className="ovp-cta-button primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Comenzar ahora</span>
            </a>
          </div>

          {/* Plan Anual - DESTACADO */}
          <div className="ovp-pricing-card featured">
            <div className="ovp-badge">Más Elegido</div>
            <h3 className="ovp-plan-name">Plan Anual</h3>
            <div className="ovp-plan-price">
              <span className="ovp-price-amount">18,33€</span>
              <span className="ovp-price-period">/mes</span>
            </div>
            <p className="ovp-price-detail">220€ facturados anualmente</p>
            <div style={{ textAlign: 'left' }}>
              <span className="ovp-discount-badge">Ahorra 38%</span>
            </div>
            <p className="ovp-plan-description">
              Consolida tu bienestar durante todo el año
            </p>
            <div className="ovp-divider"></div>
            <ul className="ovp-features-list">
              <li className="ovp-feature-item">
                <span className="ovp-feature-icon">✓</span>
                <span>Todo del plan mensual incluido</span>
              </li>
              <li className="ovp-feature-item">
                <span className="ovp-feature-icon">✓</span>
                <span>Ahorra casi un 40% del precio</span>
              </li>
              <li className="ovp-feature-item">
                <span className="ovp-feature-icon">✓</span>
                <span>Resultados duraderos garantizados</span>
              </li>
              <li className="ovp-feature-item">
                <span className="ovp-feature-icon">✓</span>
                <span>Estabiliza tu digestión a largo plazo</span>
              </li>
            </ul>
            <a
              href={getPaymentLink('yearly')}
              className="ovp-cta-button featured"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Únete ahora</span>
            </a>
          </div>

          {/* Plan Vitalicio */}
          <div className="ovp-pricing-card">
            <h3 className="ovp-plan-name">Plan Vitalicio</h3>
            <div className="ovp-plan-price">
              <span className="ovp-price-amount">399,99€</span>
              <span className="ovp-price-period">único</span>
            </div>
            <p className="ovp-plan-description">
              Acceso de por vida a todo el contenido
            </p>
            <div className="ovp-divider"></div>
            <ul className="ovp-features-list">
              <li className="ovp-feature-item">
                <span className="ovp-feature-icon">✓</span>
                <span>Acceso ilimitado para siempre</span>
              </li>
              <li className="ovp-feature-item">
                <span className="ovp-feature-icon">✓</span>
                <span>Todas las actualizaciones futuras</span>
              </li>
              <li className="ovp-feature-item">
                <span className="ovp-feature-icon">✓</span>
                <span>Sin renovaciones ni pagos extra</span>
              </li>
              <li className="ovp-feature-item">
                <span className="ovp-feature-icon">✓</span>
                <span>Inversión única en tu bienestar</span>
              </li>
            </ul>
            <a
              href={getPaymentLink('lifetime')}
              className="ovp-cta-button dark"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Acceso vitalicio</span>
            </a>
          </div>
        </div>

        <p className="ovp-guarantee">
          💚 Miles de personas ya recuperaron su bienestar digestivo. Tú puedes ser la próxima.
        </p>
      </section>
    </div>
  );
};

export default PricingPage;
