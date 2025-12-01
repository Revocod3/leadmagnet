import 'dotenv/config';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

async function createPaymentLinks() {
  console.log('🔗 Creating Stripe Payment Links (TEST MODE)...\n');

  try {
    // 1. Plan Mensual - 30€/mes
    console.log('Creating: Plan Mensual payment link...');
    const monthlyLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: 'price_1SZKswAleRjmLgERGqm3mSsV', // Plan Mensual TEST price
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: 'https://objetivovientreplano.com/gracias-por-tu-compra?plan=monthly',
        },
      },
      metadata: {
        plan: 'monthly',
        woocommerce_product_id: '169',
      },
    });

    console.log('✅ Plan Mensual link created');
    console.log(`   URL: ${monthlyLink.url}\n`);

    // 2. Plan Anual - 220€/año
    console.log('Creating: Plan Anual payment link...');
    const yearlyLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: 'price_1SZKswAleRjmLgER9GBCPrJV', // Plan Anual TEST price
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: 'https://objetivovientreplano.com/gracias-por-tu-compra?plan=yearly',
        },
      },
      metadata: {
        plan: 'yearly',
        woocommerce_product_id: '172',
      },
    });

    console.log('✅ Plan Anual link created');
    console.log(`   URL: ${yearlyLink.url}\n`);

    // 3. Plan Vitalicio - 400€ (one-time)
    console.log('Creating: Plan Vitalicio payment link...');
    const lifetimeLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: 'price_1SZKsxAleRjmLgERQ8iHe6NC', // Plan Vitalicio TEST price
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: 'https://objetivovientreplano.com/gracias-por-tu-compra?plan=lifetime',
        },
      },
      metadata: {
        plan: 'lifetime',
        woocommerce_product_id: '173',
      },
    });

    console.log('✅ Plan Vitalicio link created');
    console.log(`   URL: ${lifetimeLink.url}\n`);

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔗 PAYMENT LINKS CREATED (TEST MODE):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📋 Copy these URLs to WordPress:\n');

    console.log('Plan Mensual (30€/mes):');
    console.log(monthlyLink.url);
    console.log('');

    console.log('Plan Anual (220€/año):');
    console.log(yearlyLink.url);
    console.log('');

    console.log('Plan Vitalicio (400€):');
    console.log(lifetimeLink.url);
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Next Steps:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('1. Go to WordPress product pages');
    console.log('2. Replace "Add to Cart" buttons with these Stripe links');
    console.log('3. User clicks → Goes to Stripe Checkout → Pays → Webhook fires → User created as PRO');
    console.log('\n✅ Much simpler than WooCommerce integration!');

    return {
      monthly: monthlyLink.url,
      yearly: yearlyLink.url,
      lifetime: lifetimeLink.url,
    };
  } catch (error: any) {
    console.error('❌ Error creating payment links:', error.message);
    throw error;
  }
}

// Run the script
createPaymentLinks()
  .then((links) => {
    console.log('\n✅ All payment links created successfully!');
    console.log('\n🧪 Test with card: 4242 4242 4242 4242');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
