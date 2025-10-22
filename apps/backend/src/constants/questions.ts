import type { QuestionData, QuizQuestion } from '../types';

export const QUIZ_QUESTIONS_ES: QuestionData[] = [
  {
    id: 1,
    question: '¿Con qué frecuencia sientes dolor o malestar abdominal?',
    emoji: '🤕',
    questionDetails: 'Incluye cualquier tipo de dolor, presión o incomodidad en el abdomen',
    options: ['Nunca', 'Rara vez (1-2 veces al mes)', 'A veces (1 vez por semana)', 'Frecuentemente (varias veces por semana)', 'Siempre o casi siempre'],
  },
  {
    id: 2,
    question: '¿Cómo calificarías tu digestión después de las comidas?',
    emoji: '🍽️',
    questionDetails: 'Considera cómo te sientes 1-2 horas después de comer',
    options: ['Excelente, sin problemas', 'Buena, pero a veces me siento pesado', 'Regular, con algunos malestares', 'Mala, con hinchazón o gases', 'Muy mala, con dolor o náuseas'],
  },
  {
    id: 3,
    question: '¿Cómo describirías tus hábitos alimenticios?',
    emoji: '🥗',
    questionDetails: 'Considera la regularidad, variedad y calidad de tus comidas',
    options: ['Muy saludables y regulares', 'Saludables pero irregulares', 'Mixtos, algunas comidas saludables', 'Pobres, mucha comida procesada', 'Muy pobres, comidas irregulares'],
  },
  {
    id: 4,
    question: '¿Con qué frecuencia sientes estrés o ansiedad?',
    emoji: '😰',
    questionDetails: 'Incluye estrés laboral, personal o situaciones difíciles',
    options: ['Nunca o muy rara vez', 'Ocasionalmente', 'Frecuentemente', 'Casi siempre', 'Constantemente'],
  },
  {
    id: 5,
    question: '¿Cuánto ejercicio físico realizas semanalmente?',
    emoji: '🏃',
    questionDetails: 'Incluye cualquier actividad física: caminar, correr, gimnasio, etc.',
    options: ['Más de 5 horas por semana', '3-5 horas por semana', '1-3 horas por semana', 'Menos de 1 hora por semana', 'Casi nada'],
  },
  {
    id: 6,
    question: '¿Cómo calificarías tu calidad de sueño?',
    emoji: '😴',
    questionDetails: 'Considera si duermes lo suficiente y si el sueño es reparador',
    options: ['Excelente, duermo muy bien', 'Buena, duermo bien la mayor parte', 'Regular, algunos problemas', 'Mala, duermo poco o mal', 'Muy mala, insomnio frecuente'],
  },
  {
    id: 7,
    question: '¿Con qué frecuencia sientes hinchazón abdominal?',
    emoji: '🤰',
    questionDetails: 'Sensación de abdomen distendido o inflamado',
    options: ['Nunca', 'Rara vez', 'A veces', 'Frecuentemente', 'Siempre'],
  },
  {
    id: 8,
    question: '¿Cómo es tu regularidad intestinal?',
    emoji: '🚽',
    questionDetails: 'Frecuencia y consistencia de las deposiciones',
    options: ['Muy regular y normal', 'Regular pero con variaciones', 'Irregular, estreñimiento ocasional', 'Estreñimiento frecuente', 'Problemas graves de estreñimiento'],
  },
  {
    id: 9,
    question: '¿Sufres de diarrea o deposiciones muy blandas?',
    emoji: '💩',
    questionDetails: 'Frecuencia de deposiciones líquidas o muy blandas',
    options: ['Nunca', 'Rara vez', 'A veces', 'Frecuentemente', 'Siempre o casi siempre'],
  },
  {
    id: 10,
    question: '¿Con qué frecuencia sientes náuseas?',
    emoji: '🤢',
    questionDetails: 'Sensación de querer vomitar o malestar estomacal',
    options: ['Nunca', 'Rara vez', 'A veces', 'Frecuentemente', 'Siempre'],
  },
  {
    id: 11,
    question: '¿Cómo es tu apetito?',
    emoji: '🍽️',
    questionDetails: 'Nivel de hambre y deseo de comer',
    options: ['Excelente, siempre tengo apetito', 'Bueno, apetito normal', 'Regular, a veces pierdo el apetito', 'Malo, poco apetito', 'Muy malo, casi no tengo apetito'],
  },
  {
    id: 12,
    question: '¿Tienes intolerancias alimentarias conocidas?',
    emoji: '🥛',
    questionDetails: 'Alergias o intolerancias confirmadas por médico',
    options: ['Ninguna', 'Una leve', 'Varias leves', 'Una grave', 'Múltiples graves'],
  },
  {
    id: 13,
    question: '¿Tomas medicamentos regularmente?',
    emoji: '💊',
    questionDetails: 'Cualquier tipo de medicamento, incluyendo antiinflamatorios',
    options: ['No tomo ninguno', 'Solo vitaminas o suplementos', 'Medicamentos ocasionales', 'Medicamentos regulares', 'Múltiples medicamentos diarios'],
  },
  {
    id: 14,
    question: '¿Hay historial familiar de problemas digestivos?',
    emoji: '👨‍👩‍👧‍👦',
    questionDetails: 'Problemas en familiares directos: padres, hermanos, etc.',
    options: ['Ninguno', 'Uno lejano', 'Uno cercano', 'Varios lejanos', 'Varios cercanos'],
  },
  {
    id: 15,
    question: '¿Has notado cambios en tu peso recientemente?',
    emoji: '⚖️',
    questionDetails: 'Cambios significativos en los últimos 6 meses',
    options: ['No, peso estable', 'Leve pérdida', 'Leve ganancia', 'Pérdida significativa', 'Ganancia significativa'],
  },
  {
    id: 16,
    question: '¿Cuánta agua bebes al día?',
    emoji: '💧',
    questionDetails: 'Incluye agua, infusiones, etc. (vasos de 200ml)',
    options: ['Más de 8 vasos', '6-8 vasos', '4-6 vasos', '2-4 vasos', 'Menos de 2 vasos'],
  },
  {
    id: 17,
    question: '¿Cómo calificarías tu energía diaria?',
    emoji: '⚡',
    questionDetails: 'Nivel de energía y vitalidad durante el día',
    options: ['Excelente, mucha energía', 'Buena energía', 'Energía regular', 'Baja energía', 'Muy baja energía, fatiga constante'],
  },
];

export const QUIZ_QUESTIONS_EN: QuestionData[] = [
  {
    id: 1,
    question: 'How often do you feel abdominal pain or discomfort?',
    emoji: '🤕',
    questionDetails: 'Include any type of pain, pressure or discomfort in the abdomen',
    options: ['Never', 'Rarely (1-2 times a month)', 'Sometimes (once a week)', 'Frequently (several times a week)', 'Always or almost always'],
  },
  // Add English translations for all questions...
];

export const getQuestionsByLanguage = (language: 'es' | 'en'): QuestionData[] => {
  return language === 'es' ? QUIZ_QUESTIONS_ES : QUIZ_QUESTIONS_EN;
};