/**
 * GreenShift v2.0 — CBAM Calculator Module
 * EU Carbon Border Adjustment Mechanism Calculator
 * Regulation (EU) 2023/956 — Full implementation from 01/01/2026
 */

const CBAM = {
  // Current EU ETS price (EUR/tCO₂e) — updated Q2 2026
  ETS_PRICE: 75.36,
  USD_TO_VND: 25400,
  EUR_TO_VND: 27800,

  // CBAM Factor by year (% of free allowances phased out)
  CBAM_FACTOR: {
    2026: 0.025,  // 2.5%
    2027: 0.05,
    2028: 0.10,
    2029: 0.175,
    2030: 0.25,
    2031: 0.375,
    2032: 0.50,
    2033: 0.625,
    2034: 1.00   // 100% — full implementation
  },

  // EU benchmarks per product (tCO₂e/tonne product)
  // Source: EU CBAM Implementing Regulation 2023/1773
  BENCHMARKS: {
    // Steel products
    hot_rolled_steel:           { label: 'Thép cuộn cán nóng',     benchmark: 1.546, cn_range: '7208' },
    cold_rolled_steel:          { label: 'Thép cuộn cán nguội',    benchmark: 1.546, cn_range: '7209' },
    rebar:                      { label: 'Thép thanh vằn (rebar)', benchmark: 1.546, cn_range: '7214' },
    steel_pipes:                { label: 'Ống thép hàn',           benchmark: 2.188, cn_range: '7306' },
    steel_beams:                { label: 'Thép hình (I, H, U)',    benchmark: 1.546, cn_range: '7216' },
    galvanized_steel:           { label: 'Tôn mạ kẽm / Thép mạ phủ',benchmark: 1.856, cn_range: '7210' }, // Coated flat-rolled — Vietnam Top 5 exporter to EU
    wire_rod:                   { label: 'Thép cuộn dây (Wire rod)',benchmark: 1.546, cn_range: '7213' }, // Nguyên liệu đinh, lò xo xuất EU
    steel_fasteners:            { label: 'Ốc vít, bu lông thép',   benchmark: 2.300, cn_range: '7318' }, // Vietnam major exporter to DE/FR/IT
    // Aluminum
    primary_aluminum:           { label: 'Nhôm nguyên sinh',       benchmark: 6.745, cn_range: '7601' },
    aluminum_alloys:            { label: 'Hợp kim nhôm',           benchmark: 6.745, cn_range: '7601' },
    aluminum_extrusions:        { label: 'Nhôm đùn ép',            benchmark: 8.059, cn_range: '7604' },
    aluminum_sheets:            { label: 'Tấm/lá nhôm',            benchmark: 8.059, cn_range: '7606' },
    // Cement
    clinker:                    { label: 'Clinker xi măng',         benchmark: 0.826, cn_range: '2523' },
    cement_portland:            { label: 'Xi măng Portland',        benchmark: 0.766, cn_range: '2523' },
    // Fertilizers
    ammonia:                    { label: 'Amoniac (NH₃)',           benchmark: 1.619, cn_range: '2814' },
    nitric_acid:                { label: 'Axit nitric',             benchmark: 1.619, cn_range: '2808' },
    urea:                       { label: 'Urê (phân đạm)',          benchmark: 1.619, cn_range: '3102' },
    ammonium_nitrate:           { label: 'Ammonium nitrate',        benchmark: 1.619, cn_range: '3102' },
    // Hydrogen
    hydrogen:                   { label: 'Hydro (H₂)',             benchmark: 8.900, cn_range: '2804' },
  },

  /**
   * Calculate CBAM certificate obligation and cost
   * @param {Object} params - Input parameters
   */
  calculate(params) {
    const {
      productId,
      exportTonnes,
      actualEmissions,    // tCO₂e/tonne — actual measured (if available)
      useDefaultValues,   // true = use EU default (higher penalty)
      year = 2026,
      carbonPricePaid = 0, // carbon price already paid in Vietnam (EUR/tCO₂e)
    } = params;

    const productData = this.BENCHMARKS[productId];
    if (!productData || !exportTonnes) return null;

    const cbamFactor = this.CBAM_FACTOR[year] || this.CBAM_FACTOR[2026];
    const etsPrice = this.ETS_PRICE;

    // If no verified data → EU applies default values (conservative estimate: benchmark × 1.5)
    // Note: EU Reg. 2023/1773 Annex III specifies default values per sector; 1.5x is a prudent approximation
    // for SME demo purposes. Actual EU defaults vary per product and country of origin.
    const embeddedEmissions = useDefaultValues
      ? productData.benchmark * 1.5  // conservative estimate — ghi chú khi demo
      : (actualEmissions || productData.benchmark * 1.2); // dùng số thực tế nếu có

    // Certificates needed
    // Formula: certificates = (embedded_emissions - benchmark × cbam_factor) × tonnes
    const adjustedEmissions = embeddedEmissions - (productData.benchmark * cbamFactor);
    const certificatesNeeded = Math.max(0, adjustedEmissions * exportTonnes);

    // Carbon credit to deduct (if Vietnam has carbon pricing — currently 0)
    const carbonCredit = carbonPricePaid * exportTonnes * adjustedEmissions;

    // Cost calculation
    const cbamCostEUR = certificatesNeeded * (etsPrice - carbonPricePaid);
    const cbamCostVND = cbamCostEUR * this.EUR_TO_VND;

    // Savings from actual vs default
    const defaultCertificates = Math.max(0, (productData.benchmark * 1.5 - productData.benchmark * cbamFactor) * exportTonnes);
    const actualCertificates = certificatesNeeded;
    const savingsFromMRV = (defaultCertificates - actualCertificates) * etsPrice;
    const savingsVND = savingsFromMRV * this.EUR_TO_VND;

    return {
      product: productData.label,
      exportTonnes,
      embeddedEmissions: parseFloat(embeddedEmissions.toFixed(4)),
      euBenchmark: productData.benchmark,
      cbamFactor,
      certificatesNeeded: parseFloat(certificatesNeeded.toFixed(2)),
      cbamCostEUR: parseFloat(cbamCostEUR.toFixed(2)),
      cbamCostVND: Math.round(cbamCostVND),
      savingsFromMRV_EUR: parseFloat(Math.max(0, savingsFromMRV).toFixed(2)),
      savingsFromMRV_VND: Math.round(Math.max(0, savingsVND)),
      usingDefaultValues: useDefaultValues,
      year,
      interpretation: this._interpret(embeddedEmissions, productData.benchmark),
    };
  },

  _interpret(actual, benchmark) {
    const ratio = actual / benchmark;
    if (ratio <= 0.9) return { status: 'excellent', text: 'Xuất sắc — phát thải thấp hơn benchmark EU 10%+', color: '#22c55e' };
    if (ratio <= 1.0) return { status: 'good', text: 'Đạt chuẩn — dưới ngưỡng benchmark EU', color: '#84cc16' };
    if (ratio <= 1.2) return { status: 'warning', text: 'Cần cải thiện — cao hơn benchmark EU', color: '#f59e0b' };
    return { status: 'critical', text: 'Nguy cơ cao — phát thải vượt benchmark EU đáng kể', color: '#ef4444' };
  },

  /**
   * Format currency for display
   */
  formatVND(amount) {
    if (amount >= 1e9) return `${(amount / 1e9).toFixed(2)} tỷ VNĐ`;
    if (amount >= 1e6) return `${(amount / 1e6).toFixed(1)} triệu VNĐ`;
    return `${amount.toLocaleString('vi-VN')} VNĐ`;
  },

  formatEUR(amount) {
    return `€${amount.toLocaleString('en-EU', { maximumFractionDigits: 0 })}`;
  }
};

window.CBAM = CBAM;
