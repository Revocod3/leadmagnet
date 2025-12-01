import 'dotenv/config';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

async function createStripeTestProducts() {
  console.log('🧪 Creating Stripe TEST products...\n');

  try {
    // 1. Plan Mensual - 30€/mes
    console.log('Creating: Plan Mensual TEST (30€/mes)...');
    const monthlyProduct = await stripe.products.create({
      name: 'Plan Mensual - Clara Pro (TEST)',
      description: 'Suscripción mensual a Clara Pro con acceso completo - MODO TEST',
      metadata: {
        woocommerce_product_id: '169',
        environment: 'test',
      },
    });

    const monthlyPrice = await stripe.prices.create({
      product: monthlyProduct.id,
      unit_amount: 3000, // 30€ in cents
      currency: 'eur',
      recurring: {
        interval: 'month',
        interval_count: 1,
      },
      metadata: {
        plan_name: 'monthly',
        woocommerce_product_id: '169',
        environment: 'test',
      },
    });

    console.log('✅ Plan Mensual TEST created');
    console.log(`   Product ID: ${monthlyProduct.id}`);
    console.log(`   Price ID: ${monthlyPrice.id}\n`);

    // 2. Plan Anual - 220€/año
    console.log('Creating: Plan Anual TEST (220€/año)...');
    const yearlyProduct = await stripe.products.create({
      name: 'Plan Anual - Clara Pro (TEST)',
      description: 'Suscripción anual a Clara Pro - MODO TEST',
      metadata: {
        woocommerce_product_id: '172',
        environment: 'test',
      },
    });

    const yearlyPrice = await stripe.prices.create({
      product: yearlyProduct.id,
      unit_amount: 22000, // 220€ in cents
      currency: 'eur',
      recurring: {
        interval: 'year',
        interval_count: 1,
      },
      metadata: {
        plan_name: 'yearly',
        woocommerce_product_id: '172',
        environment: 'test',
      },
    });

    console.log('✅ Plan Anual TEST created');
    console.log(`   Product ID: ${yearlyProduct.id}`);
    console.log(`   Price ID: ${yearlyPrice.id}\n`);

    // 3. Plan Vitalicio - 400€ (one-time payment)
    console.log('Creating: Plan Vitalicio TEST (400€ pago único)...');
    const lifetimeProduct = await stripe.products.create({
      name: 'Plan Vitalicio - Clara Pro (TEST)',
      description: 'Acceso de por vida a Clara Pro - MODO TEST',
      metadata: {
        woocommerce_product_id: '173',
        environment: 'test',
      },
    });

    const lifetimePrice = await stripe.prices.create({
      product: lifetimeProduct.id,
      unit_amount: 40000, // 400€ in cents
      currency: 'eur',
      metadata: {
        plan_name: 'lifetime',
        woocommerce_product_id: '173',
        environment: 'test',
      },
    });

    console.log('✅ Plan Vitalicio TEST created');
    console.log(`   Product ID: ${lifetimeProduct.id}`);
    console.log(`   Price ID: ${lifetimePrice.id}\n`);

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 TEST MODE SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('# Stripe TEST Product IDs');
    console.log(`STRIPE_TEST_PRODUCT_MONTHLY=${monthlyProduct.id}`);
    console.log(`STRIPE_TEST_PRODUCT_YEARLY=${yearlyProduct.id}`);
    console.log(`STRIPE_TEST_PRODUCT_LIFETIME=${lifetimeProduct.id}\n`);

    console.log('# Stripe TEST Price IDs');
    console.log(`STRIPE_TEST_PRICE_MONTHLY=${monthlyPrice.id}`);
    console.log(`STRIPE_TEST_PRICE_YEARLY=${yearlyPrice.id}`);
    console.log(`STRIPE_TEST_PRICE_LIFETIME=${lifetimePrice.id}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Update PRICE_TO_PLAN_MAP for TEST:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`  '${monthlyPrice.id}': 'monthly',`);
    console.log(`  '${yearlyPrice.id}': 'yearly',`);
    console.log(`  '${lifetimePrice.id}': 'lifetime',\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 WooCommerce MySQL Commands:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('Run these to link WooCommerce products to TEST Stripe products:\n');
    console.log(`INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES`);
    console.log(`(169, '_stripe_test_product_id', '${monthlyProduct.id}'),`);
    console.log(`(169, '_stripe_test_price_id', '${monthlyPrice.id}'),`);
    console.log(`(172, '_stripe_test_product_id', '${yearlyProduct.id}'),`);
    console.log(`(172, '_stripe_test_price_id', '${yearlyPrice.id}'),`);
    console.log(`(173, '_stripe_test_product_id', '${lifetimeProduct.id}'),`);
    console.log(`(173, '_stripe_test_price_id', '${lifetimePrice.id}')`);
    console.log(`ON DUPLICATE KEY UPDATE meta_value = VALUES(meta_value);\n`);

    return {
      monthly: { product: monthlyProduct.id, price: monthlyPrice.id },
      yearly: { product: yearlyProduct.id, price: yearlyPrice.id },
      lifetime: { product: lifetimeProduct.id, price: lifetimePrice.id },
    };
  } catch (error: any) {
    console.error('❌ Error creating Stripe TEST products:', error.message);
    throw error;
  }
}

// Run the script
createStripeTestProducts()
  .then(() => {
    console.log('✅ All TEST products created successfully!');
    console.log('\n🧪 Now configure Stripe webhook for TEST mode:');
    console.log('   https://dashboard.stripe.com/test/webhooks');
    console.log('   Endpoint URL: https://your-domain.com/api/webhooks/stripe');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
