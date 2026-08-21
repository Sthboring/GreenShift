/**
 * GreenShift v2.0 — Enhanced Calculator Engine
 * Supports Scope 1, 2, 3 with Vietnam MONRE emission factors
 * Sources: MONRE CV 1726/BĐKH-PTCBT (2023), IPCC 2006, GHG Protocol
 */

// ─── EMISSION FACTORS ───────────────────────────────────────────────────────

const EF = {
  // === SCOPE 1: Direct Fuels (kgCO₂e per unit) ===
  // Source: Quyết định 2626/QĐ-BTNMT, IPCC 2006 Tier 1
  fuels: {
    coal:                  { label: 'Than bituminous',        ef: 2.46,   unit: 'tấn',  displayUnit: 'tấn than' },
    coal_coking:           { label: 'Than cốc (luyện thép)',  ef: 2.86,   unit: 'tấn',  displayUnit: 'tấn than cốc' },
    coal_thermal:          { label: 'Than antraxit',          ef: 2.65,   unit: 'tấn',  displayUnit: 'tấn than antraxit' },
    diesel:                { label: 'Dầu diesel (DO)',        ef: 2.684,  unit: 'lít',  displayUnit: 'lít dầu' },
    petrol:                { label: 'Xăng RON95',             ef: 2.313,  unit: 'lít',  displayUnit: 'lít xăng' },
    lpg:                   { label: 'LPG (Gas bình)',         ef: 1.512,  unit: 'lít',  displayUnit: 'lít LPG' },
    lpg_kg:                { label: 'LPG (tính theo kg)',     ef: 3.017,  unit: 'kg',   displayUnit: 'kg LPG' },
    fuel_oil:              { label: 'Dầu nặng FO',            ef: 2.793,  unit: 'lít',  displayUnit: 'lít dầu FO' },
    natural_gas:           { label: 'Khí tự nhiên (CNG/PNG)', ef: 2.020,  unit: 'm³',   displayUnit: 'm³ khí' },
    biomass:               { label: 'Sinh khối (biomass)',    ef: 0.0,    unit: 'tấn',  displayUnit: 'tấn sinh khối' }, // biogenic = 0 per GHG Protocol
    wood_pellets:          { label: 'Viên nén gỗ',            ef: 0.0,    unit: 'tấn',  displayUnit: 'tấn viên nén' },
  },

  // === SCOPE 1: Refrigerants (kgCO₂e per kg leaked) ===
  // Source: IPCC AR5 GWP100
  refrigerants: {
    refrigerant_r22:   { label: 'Khí lạnh R-22 (HCFC-22)',    ef: 1810,  unit: 'kg', displayUnit: 'kg R-22 rò rỉ' },
    refrigerant_r134a: { label: 'Khí lạnh R-134a (HFC)',       ef: 1430,  unit: 'kg', displayUnit: 'kg R-134a rò rỉ' },
    refrigerant_r410a: { label: 'Khí lạnh R-410A (HFC)',       ef: 2088,  unit: 'kg', displayUnit: 'kg R-410A rò rỉ' },
    refrigerant_r32:   { label: 'Khí lạnh R-32 (HFC)',         ef: 675,   unit: 'kg', displayUnit: 'kg R-32 rò rỉ' },
    refrigerant_r404a: { label: 'Khí lạnh R-404A (HFC)',       ef: 3922,  unit: 'kg', displayUnit: 'kg R-404A rò rỉ' },
  },

  // === SCOPE 1: Process Emissions ===
  // Source: IPCC 2006 Industrial Processes
  processes: {
    chemical_reaction_cement: { label: 'Nung vôi/clinker (CaCO₃→CaO)', ef: 0.525, unit: 'tấn clinker', displayUnit: 'tấn clinker sản xuất' },
    chemical_reaction_steel:  { label: 'Phản ứng luyện thép EAF (điện cực graphite)', ef: 0.05, unit: 'tấn thép', displayUnit: 'tấn thép' }, // IPCC 2006 Vol.3 Ch.4 — chỉ áp dụng lò điện hồ quang (EAF)
    chemical_reaction_aluminum: { label: 'Điện phân nhôm (anode C)', ef: 1.65, unit: 'tấn nhôm', displayUnit: 'tấn nhôm sản xuất' },
    enteric_fermentation:     { label: 'Tiêu hóa gia súc CH₄',  ef_ch4: 56.0, gwp: 28, unit: 'con trâu/bò', displayUnit: 'con trâu/bò' },
    fertilizer_n2o:           { label: 'Phân bón N₂O',           ef_n2o: 0.01, gwp: 265, unit: 'kg Nitơ bón', displayUnit: 'kg phân đạm (N)' },
    organic_waste_ch4:        { label: 'Rác hữu cơ phân hủy CH₄', ef_ch4: 0.5, gwp: 28, unit: 'kg rác hữu cơ', displayUnit: 'kg rác hữu cơ' },
  },

  // === SCOPE 2: Electricity (kgCO₂e per kWh) ===
  // Source: MONRE CV 1726/BĐKH-PTCBT (2023)
  electricity: {
    vietnam_grid_2023: { label: 'Điện lưới EVN (2023)', ef: 0.6592, unit: 'kWh' },
    vietnam_grid_2022: { label: 'Điện lưới EVN (2022)', ef: 0.6766, unit: 'kWh' },
    solar_onsite:      { label: 'Điện mặt trời tự sản', ef: 0.0,    unit: 'kWh' },
    renewable_rec:     { label: 'Điện tái tạo có I-REC', ef: 0.0,    unit: 'kWh' },
    steam_purchased:   { label: 'Hơi nước mua ngoài',   ef: 0.27,   unit: 'kg hơi' },
  },

  // === SCOPE 2: Water ===
  water: {
    tap_water: { label: 'Nước máy', ef: 0.344, unit: 'm³' },
    wastewater_treatment: { label: 'Nước thải xử lý', ef: 0.708, unit: 'm³' },
  },

  // === SCOPE 3: Transport (kgCO₂e per tonne.km) ===
  scope3_transport: {
    sea_container:   { label: 'Tàu biển container',    ef: 0.013,  unit: 'tấn.km' },
    sea_bulk:        { label: 'Tàu biển hàng rời',     ef: 0.008,  unit: 'tấn.km' },
    truck_heavy:     { label: 'Xe tải nặng (>20T)',    ef: 0.062,  unit: 'tấn.km' },
    truck_medium:    { label: 'Xe tải vừa (7-20T)',    ef: 0.082,  unit: 'tấn.km' },
    truck_light:     { label: 'Xe tải nhỏ (<7T)',      ef: 0.135,  unit: 'tấn.km' },
    air_freight:     { label: 'Hàng không',            ef: 1.020,  unit: 'tấn.km' },
    rail:            { label: 'Đường sắt',             ef: 0.028,  unit: 'tấn.km' },
  },

  // === SCOPE 3: Business Travel (kgCO₂e per passenger.km) ===
  scope3_travel: {
    domestic_flight:           { label: 'Bay nội địa',            ef: 0.255 },
    intl_flight_economy:       { label: 'Bay quốc tế (economy)',  ef: 0.195 },
    intl_flight_business:      { label: 'Bay quốc tế (business)', ef: 0.585 },
    car_petrol:                { label: 'Xe hơi xăng',            ef: 0.170 },
    car_diesel:                { label: 'Xe hơi diesel',          ef: 0.158 },
    motorbike:                 { label: 'Xe máy',                 ef: 0.103 },
  },

  // === SCOPE 3 Cat.1: Raw Materials (kgCO₂e per kg) ===
  scope3_materials: {
    polyester_fabric:  { label: 'Vải polyester',             ef: 5.55,  unit: 'kg' },
    cotton_fabric:     { label: 'Vải cotton',                ef: 3.80,  unit: 'kg' },
    nylon_fabric:      { label: 'Vải nylon',                 ef: 7.20,  unit: 'kg' },
    viscose_fabric:    { label: 'Vải viscose/rayon',         ef: 3.50,  unit: 'kg' },
    wool_fabric:       { label: 'Vải len tự nhiên',          ef: 36.0,  unit: 'kg' },
    dye_chemicals:     { label: 'Hóa chất nhuộm',           ef: 2.10,  unit: 'kg' },
    packaging_paper:   { label: 'Bao bì giấy/carton',       ef: 0.73,  unit: 'kg' },
    packaging_plastic: { label: 'Bao bì nhựa',              ef: 2.50,  unit: 'kg' },
    steel_input:       { label: 'Thép nguyên liệu',         ef: 1.85,  unit: 'kg' },
    aluminum_input:    { label: 'Nhôm nguyên liệu',         ef: 8.24,  unit: 'kg' },
    cement_input:      { label: 'Xi măng (nguyên liệu)',    ef: 0.77,  unit: 'kg' },
    food_ingredients:  { label: 'Thực phẩm nguyên liệu',   ef: 1.50,  unit: 'kg' },
  },

  // === SCOPE 3: Waste (kgCO₂e per tonne) ===
  scope3_waste: {
    landfill:          { label: 'Chôn lấp',        ef: 584,   unit: 'tấn' },
    incineration:      { label: 'Đốt rác',         ef: 1300,  unit: 'tấn' },
    recycling:         { label: 'Tái chế',         ef: 21,    unit: 'tấn' },
    composting:        { label: 'Ủ phân compost',  ef: 0,     unit: 'tấn' },
    wastewater_m3:     { label: 'Nước thải (m³)',  ef: 0.708, unit: 'm³' },
  }
};

// ─── CALCULATION ENGINE ──────────────────────────────────────────────────────

const Calculator = {

  /**
   * Calculate Scope 1 emissions (tCO₂e)
   */
  calcScope1(inputs) {
    let total = 0;
    const breakdown = [];

    // Standard fuels
    for (const [fuelId, fuelConfig] of Object.entries(EF.fuels)) {
      const quantity = parseFloat(inputs[`s1_${fuelId}`] || 0);
      if (quantity > 0) {
        const emission = (quantity * fuelConfig.ef) / 1000; // kg → tonnes
        total += emission;
        breakdown.push({
          source: fuelConfig.label,
          quantity, unit: fuelConfig.displayUnit,
          emission: emission, scope: 1
        });
      }
    }

    // Refrigerants
    for (const [refId, refConfig] of Object.entries(EF.refrigerants)) {
      const quantity = parseFloat(inputs[`s1_${refId}`] || 0);
      if (quantity > 0) {
        const emission = (quantity * refConfig.ef) / 1000;
        total += emission;
        breakdown.push({
          source: refConfig.label,
          quantity, unit: refConfig.displayUnit,
          emission, scope: 1
        });
      }
    }

    // Process emissions (special cases)
    const clinker = parseFloat(inputs['s1_chemical_reaction_cement'] || 0);
    if (clinker > 0) {
      const emission = clinker * EF.processes.chemical_reaction_cement.ef;
      total += emission;
      breakdown.push({ source: 'Nung clinker (CaCO₃→CaO)', quantity: clinker, unit: 'tấn clinker', emission, scope: 1 });
    }

    const aluminum = parseFloat(inputs['s1_chemical_reaction_aluminum'] || 0);
    if (aluminum > 0) {
      const emission = aluminum * EF.processes.chemical_reaction_aluminum.ef;
      total += emission;
      breakdown.push({ source: 'Điện phân nhôm (anode)', quantity: aluminum, unit: 'tấn nhôm', emission, scope: 1 });
    }

    const steel = parseFloat(inputs['s1_chemical_reaction_steel'] || 0);
    if (steel > 0) {
      const emission = steel * EF.processes.chemical_reaction_steel.ef;
      total += emission;
      breakdown.push({ source: 'Phản ứng luyện thép (xử lý thêm)', quantity: steel, unit: 'tấn thép', emission, scope: 1 });
    }

    // N₂O from fertilizer
    const fertN = parseFloat(inputs['s1_fertilizer_n2o'] || 0);
    if (fertN > 0) {
      const n2o_kg = fertN * EF.processes.fertilizer_n2o.ef_n2o;
      const emission = (n2o_kg * EF.processes.fertilizer_n2o.gwp) / 1000;
      total += emission;
      breakdown.push({ source: 'Phân bón N₂O', quantity: fertN, unit: 'kg N bón', emission, scope: 1 });
    }

    // CH₄ from organic waste
    const organicWaste = parseFloat(inputs['s1_organic_waste_ch4'] || 0);
    if (organicWaste > 0) {
      const ch4_kg = organicWaste * EF.processes.organic_waste_ch4.ef_ch4;
      const emission = (ch4_kg * EF.processes.organic_waste_ch4.gwp) / 1000;
      total += emission;
      breakdown.push({ source: 'Rác hữu cơ CH₄', quantity: organicWaste, unit: 'kg rác', emission, scope: 1 });
    }

    return { total: parseFloat(total.toFixed(4)), breakdown };
  },

  /**
   * Calculate Scope 2 emissions (tCO₂e)
   */
  calcScope2(inputs) {
    let total = 0;
    const breakdown = [];

    const kwhGrid = parseFloat(inputs['s2_grid_kwh'] || 0);
    const efYear = inputs['s2_ef_year'] || 'vietnam_grid_2023';
    const efGrid = EF.electricity[efYear] || EF.electricity.vietnam_grid_2023;

    if (kwhGrid > 0) {
      const emission = (kwhGrid * efGrid.ef) / 1000;
      total += emission;
      breakdown.push({
        source: `Điện lưới EVN (${efGrid.label})`,
        quantity: kwhGrid, unit: 'kWh',
        emission, scope: 2,
        ef: efGrid.ef
      });
    }

    // Steam purchased
    const steamKg = parseFloat(inputs['s2_steam_kg'] || 0);
    if (steamKg > 0) {
      const emission = (steamKg * EF.electricity.steam_purchased.ef) / 1000;
      total += emission;
      breakdown.push({ source: 'Hơi nước mua ngoài', quantity: steamKg, unit: 'kg hơi', emission, scope: 2 });
    }

    // Water
    const waterM3 = parseFloat(inputs['s2_water_m3'] || 0);
    if (waterM3 > 0) {
      const emission = (waterM3 * EF.water.tap_water.ef) / 1000;
      total += emission;
      breakdown.push({ source: 'Nước máy (EVN/SAWACO)', quantity: waterM3, unit: 'm³', emission, scope: 2 });
    }

    return { total: parseFloat(total.toFixed(4)), breakdown };
  },

  /**
   * Calculate Scope 3 emissions (tCO₂e)
   */
  calcScope3(inputs) {
    let total = 0;
    const breakdown = [];
    const byCat = {};

    // Cat.1 — Purchased goods/services
    for (const [matId, matConfig] of Object.entries(EF.scope3_materials)) {
      const qty = parseFloat(inputs[`s3c1_${matId}`] || 0);
      if (qty > 0) {
        const emission = (qty * matConfig.ef) / 1000;
        total += emission;
        byCat[1] = (byCat[1] || 0) + emission;
        breakdown.push({ source: matConfig.label, category: 1, quantity: qty, unit: matConfig.unit, emission });
      }
    }

    // Cat.4 — Upstream transport
    const uTransportTon = parseFloat(inputs['s3c4_upstream_ton'] || 0);
    const uTransportKm = parseFloat(inputs['s3c4_upstream_km'] || 0);
    const uTransportMode = inputs['s3c4_mode'] || 'truck_heavy';
    if (uTransportTon > 0 && uTransportKm > 0) {
      const efT = EF.scope3_transport[uTransportMode];
      const emission = (uTransportTon * uTransportKm * efT.ef) / 1000;
      total += emission;
      byCat[4] = (byCat[4] || 0) + emission;
      breakdown.push({ source: `Vận chuyển NVL vào (${efT.label})`, category: 4, quantity: uTransportTon * uTransportKm, unit: 'tấn.km', emission });
    }

    // Cat.5 — Waste
    const wastelandfill = parseFloat(inputs['s3c5_waste_landfill'] || 0);
    if (wastelandfill > 0) {
      const emission = (wastelandfill * EF.scope3_waste.landfill.ef) / 1000;
      total += emission; byCat[5] = (byCat[5] || 0) + emission;
      breakdown.push({ source: 'Rác thải → chôn lấp', category: 5, quantity: wastelandfill, unit: 'tấn', emission });
    }
    const wastewater = parseFloat(inputs['s3c5_wastewater_m3'] || 0);
    if (wastewater > 0) {
      const emission = (wastewater * EF.scope3_waste.wastewater_m3.ef) / 1000;
      total += emission; byCat[5] = (byCat[5] || 0) + emission;
      breakdown.push({ source: 'Nước thải xử lý', category: 5, quantity: wastewater, unit: 'm³', emission });
    }

    // Cat.6 — Business travel
    for (const [tId, tConfig] of Object.entries(EF.scope3_travel)) {
      const pkm = parseFloat(inputs[`s3c6_${tId}`] || 0);
      if (pkm > 0) {
        const emission = (pkm * tConfig.ef) / 1000;
        total += emission; byCat[6] = (byCat[6] || 0) + emission;
        breakdown.push({ source: tConfig.label, category: 6, quantity: pkm, unit: 'hành khách.km', emission });
      }
    }

    // Cat.9 — Downstream transport (export)
    const dTransportTon = parseFloat(inputs['s3c9_export_ton'] || 0);
    const dTransportKm = parseFloat(inputs['s3c9_export_km'] || 0);
    const dTransportMode = inputs['s3c9_mode'] || 'sea_container';
    if (dTransportTon > 0 && dTransportKm > 0) {
      const efT = EF.scope3_transport[dTransportMode];
      const emission = (dTransportTon * dTransportKm * efT.ef) / 1000;
      total += emission; byCat[9] = (byCat[9] || 0) + emission;
      breakdown.push({ source: `Vận chuyển xuất khẩu (${efT.label})`, category: 9, quantity: dTransportTon * dTransportKm, unit: 'tấn.km', emission });
    }

    return { total: parseFloat(total.toFixed(4)), breakdown, byCat };
  },

  /**
   * Calculate total and all metrics
   */
  calcAll(inputs, companyData) {
    const s1 = this.calcScope1(inputs);
    const s2 = this.calcScope2(inputs);
    const s3 = this.calcScope3(inputs);

    const totalGHG = s1.total + s2.total + s3.total;
    const allBreakdown = [...s1.breakdown, ...s2.breakdown, ...s3.breakdown];

    // Intensity metrics
    const production = parseFloat(companyData.production_output || 0);
    const revenue = parseFloat(companyData.revenue_million_usd || 0);
    const employees = parseFloat(companyData.employee_count || 0);

    const intensityPerTon = production > 0 ? totalGHG / production : null;
    const intensityPerRevenue = revenue > 0 ? totalGHG / (revenue * 1000) : null;
    const intensityPerEmployee = employees > 0 ? totalGHG / employees : null;

    return {
      scope1: s1.total,
      scope2: s2.total,
      scope3: s3.total,
      total: parseFloat(totalGHG.toFixed(4)),
      breakdown: allBreakdown,
      scope3ByCat: s3.byCat,
      intensity: {
        per_ton: intensityPerTon ? parseFloat(intensityPerTon.toFixed(3)) : null,
        per_revenue: intensityPerRevenue ? parseFloat(intensityPerRevenue.toFixed(4)) : null,
        per_employee: intensityPerEmployee ? parseFloat(intensityPerEmployee.toFixed(3)) : null,
      }
    };
  },

  /**
   * Compare against industry benchmark
   */
  getBenchmarkStatus(industryId, results) {
    const industry = INDUSTRIES[industryId];
    if (!industry || !industry.benchmarks) return null;

    const bench = industry.benchmarks;
    const statuses = [];

    if (bench.intensity_per_ton && results.intensity.per_ton !== null) {
      const ratio = results.intensity.per_ton / bench.intensity_per_ton.value;
      statuses.push({
        metric: bench.intensity_per_ton.label,
        actual: results.intensity.per_ton,
        benchmark: bench.intensity_per_ton.value,
        unit: bench.intensity_per_ton.unit,
        ratio,
        status: ratio <= 0.8 ? 'excellent' : ratio <= 1.0 ? 'good' : ratio <= 1.3 ? 'warning' : 'critical'
      });
    }

    if (bench.intensity_per_employee && results.intensity.per_employee !== null) {
      const ratio = results.intensity.per_employee / bench.intensity_per_employee.value;
      statuses.push({
        metric: bench.intensity_per_employee.label,
        actual: results.intensity.per_employee,
        benchmark: bench.intensity_per_employee.value,
        unit: bench.intensity_per_employee.unit,
        ratio,
        status: ratio <= 0.8 ? 'excellent' : ratio <= 1.0 ? 'good' : ratio <= 1.3 ? 'warning' : 'critical'
      });
    }

    return statuses;
  },

  /**
   * Generate improvement recommendations
   */
  getImprovements(industryId, results) {
    const improvements = [];
    const s2Pct = results.total > 0 ? (results.scope2 / results.total) * 100 : 0;
    const s1Pct = results.total > 0 ? (results.scope1 / results.total) * 100 : 0;

    if (s2Pct > 40) {
      improvements.push({
        priority: 'high',
        title: '☀️ Lắp điện mặt trời áp mái (ESCO)',
        saving: `Giảm ${Math.round(s2Pct * 0.6)}% phát thải Scope 2`,
        cost: '0 đồng vốn (mô hình ESCO)',
        payback: '4–6 năm (ESCO: 0 năm)',
        trainingRole: 'Kỹ thuật viên Solar PV',
        trainingHours: 40,
        co2Saving: parseFloat((results.scope2 * 0.6).toFixed(2)),
      });
      improvements.push({
        priority: 'high',
        title: '💡 Thay toàn bộ đèn → LED',
        saving: 'Giảm 40–60% điện chiếu sáng',
        cost: '50–200 triệu VNĐ',
        payback: '1–2 năm',
        trainingRole: null,
        co2Saving: parseFloat((results.scope2 * 0.08).toFixed(2)),
      });
    }

    if (s2Pct > 30) {
      improvements.push({
        priority: 'medium',
        title: '🔧 Lắp biến tần (VFD) cho motor bơm/quạt',
        saving: 'Giảm 20–30% điện motor',
        cost: '100–500 triệu VNĐ',
        payback: '2–4 năm',
        trainingRole: 'Kỹ thuật viên Điện công nghiệp',
        trainingHours: 24,
        co2Saving: parseFloat((results.scope2 * 0.15).toFixed(2)),
      });
    }

    if (s1Pct > 25) {
      improvements.push({
        priority: 'high',
        title: '🚛 Chuyển xe nâng diesel → xe nâng điện',
        saving: 'Giảm 100% phát thải xe nâng (Scope 1)',
        cost: '400–600 triệu VNĐ/xe',
        payback: '3–5 năm',
        trainingRole: 'Vận hành phương tiện điện',
        trainingHours: 16,
        co2Saving: parseFloat((results.scope1 * 0.2).toFixed(2)),
      });
    }

    if (industryId === 'textile' && results.scope3 > results.scope2) {
      improvements.push({
        priority: 'high',
        title: '🌿 Chuyển sang nguyên liệu bền vững (GOTS/BCI Cotton)',
        saving: 'Giảm 30–50% phát thải Scope 3 Cat.1',
        cost: 'Chi phí nguyên liệu tăng 5–15%',
        payback: 'Giá bán premium bù đắp',
        trainingRole: 'Chuyên viên Chuỗi cung ứng Xanh',
        trainingHours: 32,
        co2Saving: parseFloat((results.scope3 * 0.35).toFixed(2)),
      });
    }

    improvements.push({
      priority: 'medium',
      title: '📊 Kiểm toán năng lượng toàn diện (ISO 50001)',
      saving: 'Xác định 10–20% tiềm năng tiết kiệm chưa khai thác',
      cost: '80–200 triệu VNĐ',
      payback: '6–18 tháng',
      trainingRole: 'Kiểm toán viên Năng lượng nội bộ',
      trainingHours: 60,
      co2Saving: parseFloat((results.total * 0.1).toFixed(2)),
    });

    return improvements.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });
  }
};

window.EF = EF;
window.Calculator = Calculator;
