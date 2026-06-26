/**
 * Machine Learning & Forecasting Models for Generic Medicine Platform
 */

// Simple Linear Regression algorithm
// Solves y = mx + c
function linearRegression(x, y) {
  const n = x.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumXX += x[i] * x[i];
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

/**
 * Forecasts demand volume for generic medicine based on historical trend
 * Incorporates a seasonal multiplier (e.g. higher demand in monsoon/winter months)
 */
function forecastDemand(historicalData, horizonMonths = 6) {
  const x = historicalData.map((_, index) => index);
  const yBranded = historicalData.map(d => d.demandBranded);
  const yGeneric = historicalData.map(d => d.demandGeneric);

  const lrBranded = linearRegression(x, yBranded);
  const lrGeneric = linearRegression(x, yGeneric);

  // Month names for upcoming projections
  const lastMonthStr = historicalData[historicalData.length - 1].month;
  const monthMap = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  let [lastMonthName, lastYearStr] = lastMonthStr.split(' ');
  let currentMonthIndex = monthMap.indexOf(lastMonthName);
  let currentYear = parseInt("20" + lastYearStr);

  const forecast = [];

  for (let i = 1; i <= horizonMonths; i++) {
    const nextIndex = historicalData.length + i - 1;
    
    // Advance date
    currentMonthIndex++;
    if (currentMonthIndex >= 12) {
      currentMonthIndex = 0;
      currentYear++;
    }
    const nextMonthStr = `${monthMap[currentMonthIndex]} ${String(currentYear).substring(2)}`;

    // Linear regression baseline predictions
    let predBranded = lrBranded.slope * nextIndex + lrBranded.intercept;
    let predGeneric = lrGeneric.slope * nextIndex + lrGeneric.intercept;

    // Apply seasonal fluctuation adjustments (e.g., monsoon Jul-Sep and winter Nov-Jan see 10-15% increase in infections/demand)
    let seasonalFactor = 1.0;
    const mon = monthMap[currentMonthIndex];
    if (["Jul", "Aug", "Sep"].includes(mon)) {
      seasonalFactor = 1.12; // Monsoon flu/malaria bump
    } else if (["Dec", "Jan"].includes(mon)) {
      seasonalFactor = 1.08; // Winter cough/cold bump
    }

    predBranded = Math.round(Math.max(500, predBranded * seasonalFactor));
    predGeneric = Math.round(Math.max(500, predGeneric * seasonalFactor));

    forecast.push({
      month: nextMonthStr,
      demandBranded: predBranded,
      demandGeneric: predGeneric,
      isForecast: true
    });
  }

  return forecast;
}

/**
 * Predicts the optimal generic price given a branded price and category metrics
 */
function predictGenericPrice(brandPrice, category = "General") {
  // Statistical mapping based on generic price margins in various therapeutic classes
  const markupRates = {
    "Antibiotics": 0.27,      // Generic is ~27% of brand price (73% savings)
    "Cardiovascular": 0.23,   // Generic is ~23% of brand price (77% savings)
    "Antidiabetics": 0.24,    // Generic is ~24% of brand price (76% savings)
    "Analgesics & Antipyretics": 0.30,
    "Antihistamines": 0.22,
    "Gastrointestinal": 0.23,
    "Respiratory": 0.26,
    "NSAIDs": 0.27,
    "General": 0.25
  };

  const rate = markupRates[category] || markupRates["General"];
  
  // Base prediction
  let predictedGenericPrice = brandPrice * rate;

  // Add small pricing logic (lower prices have slightly higher relative cost ratios)
  if (brandPrice < 30) {
    predictedGenericPrice = Math.max(3, brandPrice * 0.35);
  } else if (brandPrice > 300) {
    predictedGenericPrice = brandPrice * (rate - 0.03); // Bulk drug discount
  }

  const savingsPercent = Math.round(((brandPrice - predictedGenericPrice) / brandPrice) * 100);

  return {
    predictedGenericPrice: parseFloat(predictedGenericPrice.toFixed(2)),
    savingsPercent,
    rangeMin: parseFloat((predictedGenericPrice * 0.9).toFixed(2)),
    rangeMax: parseFloat((predictedGenericPrice * 1.1).toFixed(2))
  };
}

module.exports = {
  forecastDemand,
  predictGenericPrice
};
