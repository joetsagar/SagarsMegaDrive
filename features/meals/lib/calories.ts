// Rough per-serving calorie estimates, matched by keyword against an
// ingredient's title. Not nutrition data — just enough to ballpark a meal.
const CALORIE_KEYWORDS: [keyword: string, kcal: number][] = [
  ["olive oil", 120],
  ["butter", 100],
  ["cream", 90],
  ["cheese", 110],
  ["yogurt", 100],
  ["milk", 60],
  ["egg", 70],
  ["bacon", 160],
  ["sausage", 220],
  ["chicken", 250],
  ["turkey", 200],
  ["beef", 250],
  ["steak", 270],
  ["pork", 240],
  ["lamb", 260],
  ["salmon", 200],
  ["tuna", 130],
  ["fish", 180],
  ["shrimp", 100],
  ["prawn", 100],
  ["tofu", 90],
  ["beans", 130],
  ["lentils", 120],
  ["chickpea", 140],
  ["rice", 200],
  ["pasta", 200],
  ["noodle", 190],
  ["bread", 80],
  ["tortilla", 100],
  ["flour", 100],
  ["sugar", 50],
  ["honey", 65],
  ["chocolate", 150],
  ["nut", 170],
  ["almond", 170],
  ["peanut", 170],
  ["avocado", 240],
  ["potato", 130],
  ["onion", 40],
  ["garlic", 5],
  ["tomato", 20],
  ["pepper", 20],
  ["carrot", 25],
  ["broccoli", 30],
  ["spinach", 20],
  ["lettuce", 10],
  ["cucumber", 15],
  ["mushroom", 20],
  ["apple", 95],
  ["banana", 105],
  ["orange", 60],
  ["lemon", 15],
  ["berries", 50],
  ["berry", 50],
];

const DEFAULT_KCAL = 100;

export function estimateCalories(title: string): number {
  const lower = title.toLowerCase();
  for (const [keyword, kcal] of CALORIE_KEYWORDS) {
    if (lower.includes(keyword)) return kcal;
  }
  return DEFAULT_KCAL;
}
