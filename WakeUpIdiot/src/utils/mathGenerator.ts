export type Difficulty = 'easy' | 'medium' | 'hard' | 'insane';

export interface MathQuestion {
  question: string;
  answer: number;
  difficulty: Difficulty;
}

const rnd = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const generateQuestion = (difficulty: Difficulty = 'easy'): MathQuestion => {
  switch (difficulty) {
    case 'easy': {
      const type = rnd(0, 1);
      if (type === 0) {
        const a = rnd(2, 25);
        const b = rnd(2, 25);
        return { question: `${a} + ${b}`, answer: a + b, difficulty };
      } else {
        const b = rnd(1, 15);
        const a = rnd(b, b + 20);
        return { question: `${a} − ${b}`, answer: a - b, difficulty };
      }
    }

    case 'medium': {
      const type = rnd(0, 2);
      if (type === 0) {
        const a = rnd(11, 50);
        const b = rnd(11, 50);
        return { question: `${a} + ${b}`, answer: a + b, difficulty };
      } else if (type === 1) {
        const a = rnd(3, 12);
        const b = rnd(3, 12);
        return { question: `${a} × ${b}`, answer: a * b, difficulty };
      } else {
        const a = rnd(20, 99);
        const b = rnd(5, a - 1);
        return { question: `${a} − ${b}`, answer: a - b, difficulty };
      }
    }

    case 'hard': {
      const type = rnd(0, 2);
      if (type === 0) {
        const a = rnd(5, 15);
        const b = rnd(5, 15);
        const c = rnd(2, 20);
        return { question: `(${a} × ${b}) + ${c}`, answer: a * b + c, difficulty };
      } else if (type === 1) {
        const a = rnd(10, 20);
        const b = rnd(5, 15);
        const c = rnd(3, 12);
        return { question: `${a} × ${b} − ${c}`, answer: a * b - c, difficulty };
      } else {
        const divisor = rnd(4, 12);
        const quotient = rnd(8, 20);
        const dividend = divisor * quotient;
        return { question: `${dividend} ÷ ${divisor}`, answer: quotient, difficulty };
      }
    }

    case 'insane': {
      const type = rnd(0, 3);
      if (type === 0) {
        // Big multiplication
        const a = rnd(15, 40);
        const b = rnd(15, 40);
        return { question: `${a} × ${b}`, answer: a * b, difficulty };
      } else if (type === 1) {
        // Square
        const a = rnd(11, 25);
        return { question: `${a}²`, answer: a * a, difficulty };
      } else if (type === 2) {
        // (a × b) + (c × d)
        const a = rnd(6, 15);
        const b = rnd(6, 15);
        const c = rnd(3, 10);
        const d = rnd(3, 10);
        return {
          question: `(${a} × ${b}) + (${c} × ${d})`,
          answer: a * b + c * d,
          difficulty,
        };
      } else {
        // Large clean division
        const divisor = rnd(12, 30);
        const quotient = rnd(15, 40);
        const dividend = divisor * quotient;
        return { question: `${dividend} ÷ ${divisor}`, answer: quotient, difficulty };
      }
    }
  }
};
