/**
 * GreenShift v2.0 — Industry Configuration Module
 * Defines emission sources, benchmarks, and improvement suggestions per industry
 */

const INDUSTRIES = {
  textile: {
    label: 'Dệt may / Da giày',
    icon: '👗',
    description: 'Sản xuất hàng may mặc, vải, giày dép xuất khẩu',
    scope1Sources: ['coal','diesel','lpg','fuel_oil','refrigerant_r22','refrigerant_r410a','natural_gas'],
    scope2Sources: ['grid_electricity','steam_purchased'],
    scope3Categories: [1, 4, 5, 6, 9, 11, 12],
    benchmarks: {
      intensity_per_ton: { value: 8.0, unit: 'tCO₂e/tấn vải', label: 'Trung bình ngành toàn cầu' },
      intensity_per_revenue: { value: 0.8, unit: 'tCO₂e/1000 USD', label: 'Mức tốt ngành dệt may' },
      scope2_share: 0.45, // typical: ~45% từ điện
    },
    cbamApplicable: false,
    cbamNote: 'Dệt may chưa nằm trong CBAM (dự kiến xem xét sau 2030)',
    keyMetrics: ['electricity_kwh','water_m3','wastewater_m3','fabric_input_ton'],
    improvementFocus: ['solar_rooftop','led_lighting','inverter_motor','wastewater_treatment'],
    scope3Cat1Materials: [
      { id: 'polyester_fabric', label: 'Vải polyester', ef: 5.55, unit: 'kgCO₂e/kg' },
      { id: 'cotton_fabric', label: 'Vải bông (cotton)', ef: 3.80, unit: 'kgCO₂e/kg' },
      { id: 'nylon_fabric', label: 'Vải nylon', ef: 7.20, unit: 'kgCO₂e/kg' },
      { id: 'viscose_fabric', label: 'Vải viscose/rayon', ef: 3.50, unit: 'kgCO₂e/kg' },
      { id: 'dye_chemicals', label: 'Hóa chất nhuộm', ef: 2.10, unit: 'kgCO₂e/kg' },
      { id: 'accessories', label: 'Phụ liệu (cúc, khóa, chỉ)', ef: 1.50, unit: 'kgCO₂e/kg' },
    ]
  },

  steel_metal: {
    label: 'Thép / Kim loại / Nhôm',
    icon: '🏗️',
    description: 'Sản xuất thép, nhôm, kim loại — đang bị CBAM từ 2026',
    scope1Sources: ['coal_coking','coal_thermal','diesel','natural_gas','chemical_reaction_steel','chemical_reaction_aluminum'],
    scope2Sources: ['grid_electricity'],
    scope3Categories: [1, 4, 5, 9],
    benchmarks: {
      intensity_per_ton: { value: 1.546, unit: 'tCO₂e/tấn thép', label: 'EU CBAM Default Value (Reg. 2023/1773)' },
      aluminum_intensity: { value: 6.745, unit: 'tCO₂e/tấn nhôm', label: 'EU CBAM Default — Nhôm nguyên sinh' },
    },
    cbamApplicable: true,
    cbamNote: 'CBAM áp dụng từ 01/01/2026. Cần báo cáo Embedded Emissions có xác minh.',
    keyMetrics: ['production_ton','electricity_kwh','coal_ton','natural_gas_m3'],
    improvementFocus: ['electric_arc_furnace','renewable_electricity','hydrogen_dri','scrap_recycling'],
    cbamProducts: [
      { id: 'hot_rolled_steel', label: 'Thép cuộn cán nóng', cn_code: '7208', benchmark: 1.546 },
      { id: 'cold_rolled_steel', label: 'Thép cuộn cán nguội', cn_code: '7209', benchmark: 1.546 },
      { id: 'rebar', label: 'Thép thanh vằn (rebar)', cn_code: '7214', benchmark: 1.546 },
      { id: 'steel_pipes', label: 'Ống thép hàn', cn_code: '7306', benchmark: 2.188 },
      { id: 'steel_beams', label: 'Thép hình (I, H, U)', cn_code: '7216', benchmark: 1.546 },
      { id: 'galvanized_steel', label: 'Tôn mạ kẽm / Thép mạ phủ', cn_code: '7210', benchmark: 1.856 },
      { id: 'wire_rod', label: 'Thép cuộn dây (Wire rod)', cn_code: '7213', benchmark: 1.546 },
      { id: 'steel_fasteners', label: 'Ốc vít, bu lông thép', cn_code: '7318', benchmark: 2.300 },
      { id: 'primary_aluminum', label: 'Nhôm nguyên sinh', cn_code: '7601', benchmark: 6.745 },
      { id: 'aluminum_extrusions', label: 'Nhôm đùn ép', cn_code: '7604', benchmark: 8.059 },
    ]
  },

  cement: {
    label: 'Xi măng / Vật liệu xây dựng',
    icon: '🏭',
    description: 'Sản xuất clinker, xi măng, gạch — CBAM từ 2026',
    scope1Sources: ['coal_thermal','diesel','lpg','natural_gas','chemical_reaction_cement'],
    scope2Sources: ['grid_electricity'],
    scope3Categories: [1, 4, 5],
    benchmarks: {
      intensity_per_ton: { value: 0.766, unit: 'tCO₂e/tấn xi măng', label: 'EU Benchmark (CBAM)' },
      clinker_intensity: { value: 0.826, unit: 'tCO₂e/tấn clinker', label: 'Benchmark clinker' },
    },
    cbamApplicable: true,
    cbamNote: 'CBAM áp dụng từ 01/01/2026. Xi măng và clinker đều nằm trong phạm vi.',
    keyMetrics: ['cement_output_ton','clinker_ratio','limestone_ton','electricity_kwh'],
    improvementFocus: ['alternative_fuels','clinker_substitution','waste_heat_recovery','carbon_capture'],
    cbamProducts: [
      { id: 'clinker', label: 'Clinker xi măng', cn_code: '2523', benchmark: 0.826 },
      { id: 'cement_portland', label: 'Xi măng Portland', cn_code: '2523', benchmark: 0.766 }
    ]
  },

  food_agriculture: {
    label: 'Thực phẩm / Nông nghiệp / Chế biến',
    icon: '🌾',
    description: 'Sản xuất thực phẩm, đồ uống, nông sản chế biến',
    scope1Sources: ['diesel','lpg','natural_gas','refrigerant_r134a','biomass','enteric_fermentation','fertilizer_n2o','organic_waste_ch4'],
    scope2Sources: ['grid_electricity','steam_purchased'],
    scope3Categories: [1, 4, 5, 9, 11],
    benchmarks: {
      intensity_per_ton: { value: 1.2, unit: 'tCO₂e/tấn sản phẩm', label: 'Trung bình ngành thực phẩm' },
    },
    cbamApplicable: false,
    keyMetrics: ['production_ton','electricity_kwh','wastewater_m3','fertilizer_kg','cold_storage_kwh'],
    improvementFocus: ['solar_rooftop','biogas_capture','cold_chain_optimization','fertilizer_efficiency'],
    specialSources: [
      { id: 'enteric_fermentation', label: 'Tiêu hóa bò/trâu (CH₄)', ef: 56, efUnit: 'kgCH₄/con/năm', gwp: 28 },
      { id: 'fertilizer_n2o', label: 'Phân bón N₂O', ef: 0.01, efUnit: 'kgN₂O/kgN bón', gwp: 265 },
      { id: 'organic_waste_ch4', label: 'Rác hữu cơ phân hủy (CH₄)', ef: 0.5, efUnit: 'kgCH₄/kg rác', gwp: 28 },
    ]
  },

  office_services: {
    label: 'Văn phòng / Dịch vụ / Tài chính',
    icon: '🏢',
    description: 'Văn phòng, ngân hàng, bảo hiểm, logistics, thương mại dịch vụ',
    scope1Sources: ['diesel','petrol','natural_gas','refrigerant_r410a'],
    scope2Sources: ['grid_electricity'],
    scope3Categories: [1, 5, 6, 7, 9],
    benchmarks: {
      intensity_per_employee: { value: 2.5, unit: 'tCO₂e/nhân viên/năm', label: 'Mức tốt ngành dịch vụ' },
      intensity_per_revenue: { value: 0.3, unit: 'tCO₂e/1000 USD', label: 'Benchmark ngành tài chính' },
    },
    cbamApplicable: false,
    keyMetrics: ['electricity_kwh','employee_count','business_travel_km','office_area_m2'],
    improvementFocus: ['led_lighting','remote_work_policy','video_conference','green_procurement'],
    scope3Cat6Transport: [
      { id: 'domestic_flight', label: 'Bay nội địa', ef: 0.255, unit: 'kgCO₂e/hành khách.km' },
      { id: 'international_flight_economy', label: 'Bay quốc tế (economy)', ef: 0.195, unit: 'kgCO₂e/hành khách.km' },
      { id: 'international_flight_business', label: 'Bay quốc tế (business)', ef: 0.585, unit: 'kgCO₂e/hành khách.km' },
      { id: 'car_travel', label: 'Xe ô tô (công tác)', ef: 0.170, unit: 'kgCO₂e/km' },
    ]
  },

  manufacturing_general: {
    label: 'Sản xuất / Chế tạo (chung)',
    icon: '⚙️',
    description: 'Điện tử, nhựa, hóa chất, gỗ, giấy, cơ khí chế tạo',
    scope1Sources: ['coal','diesel','lpg','natural_gas','fuel_oil','refrigerant_r22','refrigerant_r134a'],
    scope2Sources: ['grid_electricity','steam_purchased'],
    scope3Categories: [1, 4, 5, 6, 9],
    benchmarks: {
      intensity_per_revenue: { value: 0.6, unit: 'tCO₂e/1000 USD', label: 'Trung bình ngành sản xuất' },
    },
    cbamApplicable: false,
    keyMetrics: ['production_ton','electricity_kwh','water_m3'],
    improvementFocus: ['solar_rooftop','inverter_motor','process_efficiency','waste_reduction'],
  }
};

// Scope 3 category definitions
const SCOPE3_CATEGORIES = {
  1: {
    label: 'Cat.1 — Hàng hóa & Dịch vụ mua vào',
    description: 'Phát thải từ sản xuất nguyên liệu, vật tư mua vào',
    unit: 'tấn nguyên liệu',
    icon: '📦',
    relevant: ['textile', 'food_agriculture', 'manufacturing_general', 'steel_metal']
  },
  4: {
    label: 'Cat.4 — Vận chuyển thượng nguồn',
    description: 'Vận chuyển nguyên liệu từ nhà cung cấp đến nhà máy',
    icon: '🚛',
    relevant: ['textile', 'food_agriculture', 'manufacturing_general', 'steel_metal', 'cement']
  },
  5: {
    label: 'Cat.5 — Chất thải sản xuất',
    description: 'Xử lý nước thải, rác thải phát sinh trong quá trình sản xuất',
    icon: '♻️',
    relevant: ['textile', 'food_agriculture', 'manufacturing_general', 'steel_metal', 'cement']
  },
  6: {
    label: 'Cat.6 — Đi lại công tác',
    description: 'Di chuyển của nhân viên cho mục đích công việc',
    icon: '✈️',
    relevant: ['office_services', 'manufacturing_general', 'textile']
  },
  7: {
    label: 'Cat.7 — Di chuyển hàng ngày của nhân viên',
    description: 'Phát thải từ di chuyển nhân viên đến/từ nơi làm việc',
    icon: '🚌',
    relevant: ['office_services', 'manufacturing_general']
  },
  9: {
    label: 'Cat.9 — Vận chuyển & Phân phối hạ nguồn',
    description: 'Vận chuyển hàng hóa đến khách hàng/cảng xuất khẩu',
    icon: '🚢',
    relevant: ['textile', 'food_agriculture', 'manufacturing_general', 'steel_metal', 'cement']
  },
  11: {
    label: 'Cat.11 — Sử dụng sản phẩm bán ra',
    description: 'Phát thải khi khách hàng sử dụng sản phẩm của bạn',
    icon: '🛍️',
    relevant: ['textile', 'food_agriculture']
  },
  12: {
    label: 'Cat.12 — Xử lý cuối vòng đời',
    description: 'Phát thải từ tái chế hoặc thải bỏ sản phẩm sau khi sử dụng',
    icon: '🗑️',
    relevant: ['textile', 'manufacturing_general']
  }
};

// Scope 3 transport emission factors
const SCOPE3_TRANSPORT_EF = {
  sea_container: { label: 'Tàu biển (container)', ef: 0.013, unit: 'kgCO₂e/tấn.km' },
  sea_bulk: { label: 'Tàu biển (hàng rời)', ef: 0.008, unit: 'kgCO₂e/tấn.km' },
  truck_heavy: { label: 'Xe tải nặng (>20 tấn)', ef: 0.062, unit: 'kgCO₂e/tấn.km' },
  truck_medium: { label: 'Xe tải vừa (7-20 tấn)', ef: 0.082, unit: 'kgCO₂e/tấn.km' },
  truck_light: { label: 'Xe tải nhỏ (<7 tấn)', ef: 0.135, unit: 'kgCO₂e/tấn.km' },
  air_freight: { label: 'Vận chuyển hàng không', ef: 1.020, unit: 'kgCO₂e/tấn.km' },
  rail: { label: 'Đường sắt', ef: 0.028, unit: 'kgCO₂e/tấn.km' },
};

window.INDUSTRIES = INDUSTRIES;
window.SCOPE3_CATEGORIES = SCOPE3_CATEGORIES;
window.SCOPE3_TRANSPORT_EF = SCOPE3_TRANSPORT_EF;
