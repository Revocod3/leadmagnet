import 'dotenv/config';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

async function createStripeProducts() {
  console.log('🚀 Creating Stripe products...\n');

  try {
    // 1. Plan Mensual - 30€/mes
    console.log('Creating: Plan Mensual (30€/mes)...');
    const monthlyProduct = await stripe.products.create({
      name: 'Plan Mensual - Clara Pro',
      description: 'Suscripción mensual a Clara Pro con acceso completo',
      metadata: {
        woocommerce_product_id: '169',
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
      },
    });

    console.log('✅ Plan Mensual created');
    console.log(`   Product ID: ${monthlyProduct.id}`);
    console.log(`   Price ID: ${monthlyPrice.id}\n`);

    // 2. Plan Anual - 220€/año
    console.log('Creating: Plan Anual (220€/año)...');
    const yearlyProduct = await stripe.products.create({
      name: 'Plan Anual - Clara Pro',
      description: 'Suscripción anual a Clara Pro con acceso completo (ahorra 140€)',
      metadata: {
        woocommerce_product_id: '172',
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
      },
    });

    console.log('✅ Plan Anual created');
    console.log(`   Product ID: ${yearlyProduct.id}`);
    console.log(`   Price ID: ${yearlyPrice.id}\n`);

    // 3. Plan Vitalicio - 400€ (one-time payment)
    console.log('Creating: Plan Vitalicio (400€ pago único)...');
    const lifetimeProduct = await stripe.products.create({
      name: 'Plan Vitalicio - Clara Pro',
      description: 'Acceso de por vida a Clara Pro',
      metadata: {
        woocommerce_product_id: '173',
      },
    });

    const lifetimePrice = await stripe.prices.create({
      product: lifetimeProduct.id,
      unit_amount: 40000, // 400€ in cents
      currency: 'eur',
      metadata: {
        plan_name: 'lifetime',
        woocommerce_product_id: '173',
      },
    });

    console.log('✅ Plan Vitalicio created');
    console.log(`   Product ID: ${lifetimeProduct.id}`);
    console.log(`   Price ID: ${lifetimePrice.id}\n`);

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 SUMMARY - Copy these to your .env:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('# Stripe Product IDs');
    console.log(`STRIPE_PRODUCT_MONTHLY=${monthlyProduct.id}`);
    console.log(`STRIPE_PRODUCT_YEARLY=${yearlyProduct.id}`);
    console.log(`STRIPE_PRODUCT_LIFETIME=${lifetimeProduct.id}\n`);

    console.log('# Stripe Price IDs');
    console.log(`STRIPE_PRICE_MONTHLY=${monthlyPrice.id}`);
    console.log(`STRIPE_PRICE_YEARLY=${yearlyPrice.id}`);
    console.log(`STRIPE_PRICE_LIFETIME=${lifetimePrice.id}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Next: Update stripe-webhook.controller.ts');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('Update PRICE_TO_PLAN_MAP in stripe-webhook.controller.ts:');
    console.log(`  '${monthlyPrice.id}': 'monthly',`);
    console.log(`  '${yearlyPrice.id}': 'yearly',`);
    console.log(`  '${lifetimePrice.id}': 'lifetime',\n`);

    return {
      monthly: { product: monthlyProduct.id, price: monthlyPrice.id },
      yearly: { product: yearlyProduct.id, price: yearlyPrice.id },
      lifetime: { product: lifetimeProduct.id, price: lifetimePrice.id },
    };
  } catch (error: any) {
    console.error('❌ Error creating Stripe products:', error.message);
    throw error;
  }
}

// Run the script
createStripeProducts()
  .then(() => {
    console.log('✅ All products created successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
