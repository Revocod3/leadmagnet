/**
 * Seed Micro-Challenges Script - Clara Premium
 * 
 * Run with: npx tsx src/scripts/seed-challenges.ts
 */

import { prisma } from '../config/database';

const challenges = [
  // MINDFULNESS (5 challenges)
  {
    title: 'Respiración consciente 3 veces al día',
    description: 'Realiza 3 pausas de 5 respiraciones profundas: al despertar, después de comer y antes de dormir.',
    instructions: `
1. Encuentra un lugar tranquilo (puede ser sentado en tu silla)
2. Cierra los ojos o mira a un punto fijo
3. Inhala profundamente por la nariz contando hasta 4
4. Mantén el aire contando hasta 2
5. Exhala lentamente por la boca contando hasta 6
6. Repite 5 veces

💡 Tip: Pon 3 alarmas en tu móvil como recordatorio
    `.trim(),
    category: 'MINDFULNESS',
    difficulty: 'easy',
    durationDays: 3,
    followUpQuestion: '¿Cómo te ha ido con el reto?'
  },
  {
    title: 'Comida en silencio',
    description: 'Realiza una comida al día sin pantallas, en silencio, prestando atención a cada bocado.',
    instructions: `
1. Elige una comida (el almuerzo suele ser más fácil)
2. Apaga el móvil, TV, ordenador
3. Siéntate en la mesa sin distracciones
4. Observa los colores y olores de tu comida
5. Mastica cada bocado 15-20 veces
6. Nota las texturas y sabores
7. Come despacio, tomándote al menos 20 minutos

💡 Tip: Si te distraes, simplemente vuelve a enfocarte en la comida
    `.trim(),
    category: 'MINDFULNESS',
    difficulty: 'medium',
    durationDays: 5,
    followUpQuestion: '¿Cómo te ha ido con el reto?'
  },
  {
    title: 'Escaneo corporal nocturno',
    description: 'Antes de dormir, realiza un escaneo mental de tu cuerpo durante 5 minutos para liberar tensiones.',
    instructions: `
1. Túmbate en la cama boca arriba
2. Cierra los ojos y respira profundamente 3 veces
3. Enfoca tu atención en los pies, nota cualquier tensión
4. Sube lentamente: pantorrillas, muslos, caderas
5. Continúa: abdomen (muy importante), pecho, hombros
6. Termina: cuello, mandíbula, frente
7. Si encuentras tensión, imagina que se suelta al exhalar

💡 Tip: Puedes usar audios de escaneo corporal guiado
    `.trim(),
    category: 'MINDFULNESS',
    difficulty: 'easy',
    durationDays: 3,
    followUpQuestion: '¿Cómo te ha ido con el reto?'
  },
  {
    title: 'Diario de gratitud digestiva',
    description: 'Cada noche, escribe 3 cosas por las que tu cuerpo te ha permitido disfrutar hoy.',
    instructions: `
1. Antes de dormir, toma tu diario o usa la app
2. Piensa en momentos del día relacionados con tu cuerpo:
   - Una comida que disfrutaste
   - Un paseo que pudiste dar
   - Energía para hacer algo que te gusta
3. Escribe 3 de estos momentos
4. Termina con la frase: "Gracias cuerpo por..."

💡 Ejemplo: "Gracias cuerpo por permitirme disfrutar de ese café con mi amiga"
    `.trim(),
    category: 'MINDFULNESS',
    difficulty: 'easy',
    durationDays: 5,
    followUpQuestion: '¿Cómo te ha ido con el reto?'
  },
  {
    title: 'Pausa anti-estrés',
    description: 'Cuando notes estrés o tensión, realiza la técnica 5-4-3-2-1 para anclarte al presente.',
    instructions: `
La técnica 5-4-3-2-1 te ayuda a salir del estrés enfocándote en tus sentidos:

1. Cuando notes estrés, para y respira una vez
2. Nombra 5 cosas que PUEDES VER
3. Nombra 4 cosas que PUEDES TOCAR
4. Nombra 3 cosas que PUEDES OÍR
5. Nombra 2 cosas que PUEDES OLER
6. Nombra 1 cosa que PUEDES SABOREAR

Duración: apenas 1-2 minutos

💡 Tip: Hazlo al menos 2 veces al día esta semana
    `.trim(),
    category: 'MINDFULNESS',
    difficulty: 'easy',
    durationDays: 3,
    followUpQuestion: '¿Cómo te ha ido con el reto?'
  },

  // BREATHING (3 challenges)
  {
    title: 'Respiración 4-7-8 para la digestión',
    description: 'Practica la respiración 4-7-8 antes de cada comida para activar la digestión.',
    instructions: `
La respiración 4-7-8 activa el sistema parasimpático y prepara tu digestión:

1. Siéntate cómodo antes de comer
2. Inhala por la nariz contando hasta 4
3. Mantén el aire contando hasta 7
4. Exhala por la boca contando hasta 8
5. Repite 4 ciclos

Hazlo antes del desayuno, comida y cena.

💡 Tip: Es normal sentirse un poco mareado al principio, es por la oxigenación
    `.trim(),
    category: 'BREATHING',
    difficulty: 'easy',
    durationDays: 3,
    followUpQuestion: '¿Cómo te ha ido con el reto?'
  },
  {
    title: 'Respiración abdominal diaria',
    description: 'Dedica 5 minutos cada mañana a respirar profundamente usando el diafragma.',
    instructions: `
1. Túmbate boca arriba o siéntate cómodo
2. Pon una mano en el pecho y otra en el abdomen
3. Inhala por la nariz: solo debe moverse el abdomen
4. El pecho debe quedarse quieto
5. Exhala lentamente por la boca
6. Continúa durante 5 minutos

Beneficios: Masajea los órganos digestivos, reduce hinchazón, calma el sistema nervioso.

💡 Tip: Hazlo antes de levantarte de la cama
    `.trim(),
    category: 'BREATHING',
    difficulty: 'easy',
    durationDays: 5,
    followUpQuestion: '¿Cómo te ha ido con el reto?'
  },
  {
    title: 'Respiración para aliviar hinchazón',
    description: 'Cuando notes hinchazón, practica la respiración en U para aliviarla.',
    instructions: `
La respiración en U ayuda a mover gases y aliviar la hinchazón:

1. Siéntate o túmbate cómodo
2. Inhala normalmente
3. Al exhalar, imagina que el aire baja por tu lado izquierdo
4. Cruza por la parte baja del abdomen
5. Sube por el lado derecho
6. Dibujando una "U" con tu respiración

Repite 10 veces. Puedes acompañar con masaje suave siguiendo esa trayectoria.

💡 Tip: Perfecto para hacer después de comer si sientes pesadez
    `.trim(),
    category: 'BREATHING',
    difficulty: 'medium',
    durationDays: 3,
    followUpQuestion: '¿Cómo te ha ido con el reto?'
  },

  // MOVEMENT (4 challenges)
  {
    title: 'Caminata digestiva post-comida',
    description: 'Camina 10-15 minutos después de comer (a ritmo suave, sin prisa).',
    instructions: `
1. Después de tu comida principal, espera 5 minutos
2. Sal a caminar a paso tranquilo (no rápido)
3. Duración: 10-15 minutos
4. No es ejercicio intenso, es un paseo suave
5. Respira profundamente mientras caminas

Beneficios: Acelera el vaciado gástrico, reduce hinchazón, mejora el tránsito.

💡 Tip: Si no puedes salir, camina por casa o la oficina
    `.trim(),
    category: 'MOVEMENT',
    difficulty: 'easy',
    durationDays: 5,
    followUpQuestion: '¿Cómo te ha ido con el reto?'
  },
  {
    title: 'Yoga para el abdomen (5 minutos)',
    description: 'Realiza 3 posturas simples de yoga cada mañana para despertar tu digestión.',
    instructions: `
3 posturas sencillas (1-2 minutos cada una):

1. GATO-VACA
   - A cuatro patas
   - Inhala: arquea la espalda mirando arriba
   - Exhala: redondea la espalda mirando al ombligo
   - Repite 10 veces

2. TORSIÓN SENTADA
   - Sentado con piernas estiradas
   - Cruza una pierna y gira hacia ese lado
   - Mantén 30 segundos cada lado

3. RODILLAS AL PECHO
   - Tumbado boca arriba
   - Abraza ambas rodillas contra el pecho
   - Mécete suavemente lado a lado
   - 1 minuto

💡 Tip: Hazlo antes del desayuno para mejores resultados
    `.trim(),
    category: 'MOVEMENT',
    difficulty: 'easy',
    durationDays: 5,
    followUpQuestion: '¿Cómo te ha ido con el reto?'
  },
  {
    title: 'Estiramientos de escritorio',
    description: 'Si trabajas sentado, haz micro-pausas cada 2 horas con estiramientos suaves.',
    instructions: `
Cada 2 horas, haz esta rutina de 2 minutos:

1. CUELLO (30 seg)
   - Inclina cabeza a cada lado
   - Gira lentamente en círculos

2. HOMBROS (30 seg)
   - Encoge y suelta los hombros
   - Círculos con los hombros

3. TORSIÓN EN SILLA (30 seg)
   - Gira el tronco a cada lado
   - Mantén 15 segundos cada lado

4. DE PIE (30 seg)
   - Levántate y estira brazos arriba
   - Inclínate a cada lado

💡 Tip: Pon una alarma cada 2 horas como recordatorio
    `.trim(),
    category: 'MOVEMENT',
    difficulty: 'easy',
    durationDays: 3,
    followUpQuestion: '¿Cómo te ha ido con el reto?'
  },
  {
    title: 'Masaje abdominal matutino',
    description: 'Dedica 3 minutos cada mañana a masajear tu abdomen en sentido horario.',
    instructions: `
El masaje abdominal estimula el peristaltismo:

1. Tumbada boca arriba, rodillas flexionadas
2. Pon las manos sobre el abdomen
3. Masajea en círculos EN SENTIDO HORARIO
4. Empieza suave, aumenta presión gradualmente
5. Haz círculos cada vez más grandes
6. Duración: 3 minutos

Orden del masaje (sentido horario):
Izquierda abajo → arriba → cruza a derecha → baja

💡 Tip: Usa un poco de aceite si quieres
    `.trim(),
    category: 'MOVEMENT',
    difficulty: 'easy',
    durationDays: 5,
    followUpQuestion: '¿Cómo te ha ido con el reto?'
  },

  // HYDRATION (3 challenges)
  {
    title: 'Agua con limón en ayunas',
    description: 'Bebe un vaso de agua tibia con limón cada mañana antes del desayuno.',
    instructions: `
1. Calienta un vaso de agua (tibia, no caliente)
2. Exprime medio limón
3. Bébelo despacio, sin prisa
4. Espera 15-20 minutos antes de desayunar

Beneficios: Activa la digestión, hidrata después de la noche, estimula el hígado.

💡 Tip: Prepara el limón la noche anterior para hacerlo más fácil
💡 Importante: Enjuágate la boca después para proteger el esmalte
    `.trim(),
    category: 'HYDRATION',
    difficulty: 'easy',
    durationDays: 5,
    followUpQuestion: '¿Cómo te ha ido con el reto?'
  },
  {
    title: 'Objetivo 2 litros de agua',
    description: 'Lleva control de tu consumo de agua y alcanza los 2 litros diarios.',
    instructions: `
Estrategias para beber más agua:

1. Ten una botella de 500ml siempre visible
2. Marca objetivos por horario:
   - 8:00 - 500ml
   - 12:00 - 1 litro
   - 16:00 - 1.5 litros
   - 20:00 - 2 litros
3. Pon recordatorios en el móvil
4. Usa una app de seguimiento si te ayuda

💡 Tip: El agua con gas también cuenta
💡 Tip: Evita beber mucho durante las comidas (mejor entre comidas)
    `.trim(),
    category: 'HYDRATION',
    difficulty: 'medium',
    durationDays: 5,
    followUpQuestion: '¿Cómo te ha ido con el reto?'
  },
  {
    title: 'Infusión digestiva nocturna',
    description: 'Toma una infusión digestiva cada noche: manzanilla, menta, hinojo o jengibre.',
    instructions: `
Infusiones recomendadas para la digestión:

🌼 MANZANILLA - Calmante, reduce gases
🌿 MENTA - Alivia espasmos, refrescante
🌱 HINOJO - Reduce hinchazón, carminativo
🧡 JENGIBRE - Activa digestión, antiinflamatorio

Preparación:
1. Hierve agua
2. Añade la infusión (bolsita o hojas)
3. Deja reposar 5-7 minutos
4. Bebe tibia, sin prisa

Mejor momento: 30 minutos después de cenar

💡 Tip: Evita infusiones con cafeína por la noche
    `.trim(),
    category: 'HYDRATION',
    difficulty: 'easy',
    durationDays: 5,
    followUpQuestion: '¿Cómo te ha ido con el reto?'
  },

  // EATING (3 challenges)
  {
    title: 'Masticar 20 veces',
    description: 'Cuenta y mastica cada bocado al menos 20 veces antes de tragar.',
    instructions: `
La digestión empieza en la boca:

1. Toma un bocado pequeño
2. Deja el cubierto en la mesa
3. Mastica contando hasta 20
4. Solo cuando esté líquido, traga
5. Entonces toma el siguiente bocado

Beneficios:
- Mejor absorción de nutrientes
- Menos trabajo para el estómago
- Señales de saciedad llegan a tiempo
- Reduces hinchazón y gases

💡 Tip: Al principio parece raro, pero se convierte en hábito rápido
    `.trim(),
    category: 'EATING',
    difficulty: 'medium',
    durationDays: 5,
    followUpQuestion: '¿Cómo te ha ido con el reto?'
  },
  {
    title: 'Cena temprana',
    description: 'Esta semana, cena al menos 3 horas antes de acostarte.',
    instructions: `
Cenar temprano mejora la digestión nocturna:

1. Calcula tu hora de dormir
2. Resta 3 horas = hora límite para cenar
3. Ejemplo: si duermes a las 23:00, cena antes de las 20:00

Si tienes hambre más tarde:
- Una infusión
- Unas almendras
- Un yogur pequeño

Beneficios:
- Mejor calidad de sueño
- Digestión más ligera
- Menos reflujo
- Reduces hinchazón matutina

💡 Tip: Si no puedes cenar tan temprano, al menos que sea ligera
    `.trim(),
    category: 'EATING',
    difficulty: 'medium',
    durationDays: 5,
    followUpQuestion: '¿Cómo te ha ido con el reto?'
  },
  {
    title: 'Día sin ultraprocesados',
    description: 'Durante 3 días, evita alimentos ultraprocesados y come comida real.',
    instructions: `
Ultraprocesados a evitar:
❌ Bollería industrial
❌ Refrescos y zumos envasados
❌ Snacks salados (patatas, gusanitos)
❌ Platos preparados
❌ Embutidos industriales
❌ Salsas envasadas

Alternativas:
✅ Fruta fresca para picar
✅ Frutos secos
✅ Comida casera simple
✅ Verduras como snack
✅ Proteínas sin procesar

💡 Tip: No es perfeccionismo, es conciencia. Si picas algo, no te castigues
    `.trim(),
    category: 'EATING',
    difficulty: 'hard',
    durationDays: 3,
    followUpQuestion: '¿Cómo te has sentido evitando los ultraprocesados?'
  }
];

async function seedChallenges() {
  console.log('🌱 Seeding micro-challenges...');

  try {
    // First, deactivate all existing challenges
    await prisma.microChallenge.updateMany({
      data: { isActive: false }
    });

    // Create or update challenges
    for (const challenge of challenges) {
      const { points, ...challengeData } = challenge as any;

      await prisma.microChallenge.upsert({
        where: {
          title: challengeData.title
        },
        update: {
          ...challengeData,
          isActive: true
        },
        create: {
          ...challengeData,
          followUpQuestion: challengeData.followUpQuestion || '¿Cómo te ha ido con el reto?',
          isActive: true
        }
      });
      console.log(`  ✅ ${challenge.category}: ${challenge.title}`);
    }

    console.log(`\n🎉 Successfully seeded ${challenges.length} micro-challenges!`);

    // Print summary
    const categories = [...new Set(challenges.map(c => c.category))];
    console.log('\n📊 Summary by category:');
    for (const cat of categories) {
      const count = challenges.filter(c => c.category === cat).length;
      console.log(`  ${cat}: ${count} challenges`);
    }

  } catch (error) {
    console.error('❌ Error seeding challenges:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedChallenges();
