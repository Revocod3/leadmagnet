import { describe, it, expect } from 'vitest';
import { buildDynamicInstructionsPro, type ClaraPremiumContext } from './assistant-instructions-pro';

describe('buildDynamicInstructionsPro', () => {
  it('handles active challenge and diary reference around week 2', () => {
    const context: ClaraPremiumContext = {
      userName: 'Kevin',
      weekNumber: 2,
      daysInProgram: 14,
      currentPhase: 'week2',
      currentChallenge: {
        title: 'Reto de respiración',
        description: 'Respiraciones 4-4-6 antes de comer',
        status: 'assigned',
      },
      recentDiaryEntries: [
        {
          date: '2025-12-10',
          content: 'Me sentí con menos acidez después de comer más despacio',
          mood: 7,
          bloating: 2,
        },
      ],
    };

    const instructions = buildDynamicInstructionsPro(context);

    expect(instructions).toContain('SEMANA 2 - Regular estrés digestivo');
    expect(instructions).toContain('Hay micro-reto activo: Reto de respiración');
    expect(instructions).toContain('Referencia la última entrada (2025-12-10');
    expect(instructions).toContain('respiración, comer despacio, hidratación, sin pantallas, simplicidad');
  });

  it('offers new challenge and invites diary when none exist around maintenance', () => {
    const context: ClaraPremiumContext = {
      userName: 'Ana',
      weekNumber: 4,
      daysInProgram: 30,
      currentPhase: 'maintenance',
    };

    const instructions = buildDynamicInstructionsPro(context);

    expect(instructions).toContain('FASE DE MANTENIMIENTO');
    expect(instructions).toContain('No hay micro-reto activo');
    expect(instructions).toContain('Invita a usar el Diario con el pitch oficial');
  });
});
