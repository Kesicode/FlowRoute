export const PRICING = {
  COST_PER_KM_TRANSIT: 8,    // INR per km for metro/bus transit
  FOOD_COST_PER_PERSON: 450, // INR average meal cost per person
  MISC_COST_PER_PERSON: 150, // INR miscellaneous expenses per person
  CO2_PER_KM_METRO: 0.05,    // kg CO2 per km for metro
  CO2_PER_KM_CAR: 0.22,      // kg CO2 per km for private car
  CO2_PER_KM_TAXI: 0.18,     // kg CO2 per km for taxi
  CO2_PER_KM_BUS: 0.03,      // kg CO2 per km for bus
  TAXI_COST_PER_KM: 22,      // INR per km for taxi
} as const;
