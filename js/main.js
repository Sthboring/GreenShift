document.addEventListener('DOMContentLoaded', () => {
  // --- NAVIGATION ---
  const navItems = document.querySelectorAll('.nav-item');
  const viewSections = document.querySelectorAll('.view-section');

  function switchTab(targetId) {
    navItems.forEach(nav => nav.classList.remove('active'));
    viewSections.forEach(view => view.classList.remove('active'));
    
    const activeNav = document.querySelector(`[data-target="${targetId}"]`);
    if(activeNav) activeNav.classList.add('active');
    
    const activeView = document.getElementById(targetId);
    if(activeView) activeView.classList.add('active');

    // Auto-save form inputs whenever switching tabs so user doesn't lose data
    if (document.querySelectorAll('.entry-input').length > 0) {
      Storage.saveAnnualData(getFormData());
    }

    if (targetId === 'view-dashboard') {
      renderDashboard();
    } else if (targetId === 'view-report') {
      renderReport();
    } else if (targetId === 'view-cbam') {
      populateCbamProducts();
    }
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => switchTab(item.getAttribute('data-target')));
  });

  // --- INITIALIZATION & SETUP ---
  const setupIndustryEl = document.getElementById('setup-industry');
  const setupIndustryDesc = document.getElementById('setup-industry-desc');
  
  // Populate industry dropdown
  for (const [key, ind] of Object.entries(INDUSTRIES)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = `${ind.icon} ${ind.label}`;
    setupIndustryEl.appendChild(opt);
  }
  
  setupIndustryEl.addEventListener('change', () => {
    const ind = INDUSTRIES[setupIndustryEl.value];
    if (ind) setupIndustryDesc.textContent = ind.description;
  });

  function initApp() {
    const company = Storage.getCompany();
    if (company) {
      document.getElementById('sidebar-company-name').innerText = company.name;
      document.getElementById('sidebar-industry-name').innerText = INDUSTRIES[company.industry]?.label || '';
      
      document.getElementById('setup-name').value = company.name || '';
      document.getElementById('setup-tax').value = company.taxCode || '';
      document.getElementById('setup-year').value = company.year || '2025';
      document.getElementById('setup-industry').value = company.industry || 'textile';
      document.getElementById('setup-revenue').value = company.revenue || '';
      document.getElementById('setup-employees').value = company.employees || '';
      document.getElementById('setup-production').value = company.production_output || '';
      
      const ind = INDUSTRIES[company.industry];
      if (ind) setupIndustryDesc.textContent = ind.description;
      
      if (ind && ind.cbamApplicable) {
        document.getElementById('nav-cbam').style.display = 'flex';
        populateCbamProducts(ind);
      } else {
        document.getElementById('nav-cbam').style.display = 'none';
      }

      buildEntryForm(company.industry);
      loadEntryData();
      
      switchTab('view-entry');
    } else {
      switchTab('view-setup');
    }
  }

  document.getElementById('setup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const companyData = {
      name: document.getElementById('setup-name').value,
      taxCode: document.getElementById('setup-tax').value,
      year: document.getElementById('setup-year').value,
      industry: document.getElementById('setup-industry').value,
      revenue_million_usd: parseFloat(document.getElementById('setup-revenue').value) / 25400, // convert VND to USD approx
      employees: parseInt(document.getElementById('setup-employees').value),
      production_output: parseFloat(document.getElementById('setup-production').value)
    };
    Storage.saveCompany(companyData);
    initApp();
  });

  // --- DYNAMIC ENTRY FORM BUILDER ---
  function buildEntryForm(industryKey) {
    const ind = INDUSTRIES[industryKey];
    if (!ind) return;

    // Build Scope 1
    const s1Container = document.getElementById('scope1-container');
    s1Container.innerHTML = '';
    ind.scope1Sources.forEach(src => {
      const field = EF.fuels[src] || EF.refrigerants[src] || EF.processes[src];
      if (!field) return;
      s1Container.innerHTML += `
        <div class="form-group">
          <label>${field.label}</label>
          <div style="display:flex; gap:0.5rem; align-items:center;">
            <input type="number" class="form-control entry-input" id="s1_${src}" name="s1_${src}" min="0" step="any" style="flex:1;">
            <span style="font-size:0.875rem; color:var(--color-text-secondary); width:60px;">${field.displayUnit || field.unit}</span>
          </div>
        </div>
      `;
    });

    // Build Scope 2
    const s2Container = document.getElementById('scope2-container');
    s2Container.innerHTML = `
      <div class="form-group">
        <label>Điện lưới EVN (kWh)</label>
        <input type="number" class="form-control entry-input" id="s2_grid_kwh" name="s2_grid_kwh" min="0" step="any">
      </div>
      <div class="form-group">
        <label>Hệ số lưới điện năm</label>
        <select class="form-control entry-input" id="s2_ef_year" name="s2_ef_year">
          <option value="vietnam_grid_2023">Việt Nam 2023 (0.6592)</option>
          <option value="vietnam_grid_2022">Việt Nam 2022 (0.6766)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Nước máy sử dụng (m³)</label>
        <input type="number" class="form-control entry-input" id="s2_water_m3" name="s2_water_m3" min="0" step="any">
      </div>
    `;

    // Build Scope 3
    const s3Container = document.getElementById('scope3-container');
    s3Container.innerHTML = '';
    
    ind.scope3Categories.forEach(catId => {
      const cat = SCOPE3_CATEGORIES[catId];
      if (!cat) return;
      
      let fieldsHtml = '';
      if (catId === 1 && ind.scope3Cat1Materials) {
         ind.scope3Cat1Materials.forEach(m => {
           fieldsHtml += `
             <div class="form-group">
               <label>${m.label}</label>
               <div style="display:flex; gap:0.5rem;"><input type="number" class="form-control entry-input" name="s3c1_${m.id}" id="s3c1_${m.id}" min="0" step="any"><span style="width:50px;">kg</span></div>
             </div>
           `;
         });
      } else if (catId === 4) {
         fieldsHtml += `
            <div class="form-group"><label>Sản lượng vận chuyển</label><div style="display:flex; gap:0.5rem;"><input type="number" class="form-control entry-input" name="s3c4_upstream_ton" id="s3c4_upstream_ton" min="0" step="any"><span style="width:50px;">tấn</span></div></div>
            <div class="form-group"><label>Quãng đường</label><div style="display:flex; gap:0.5rem;"><input type="number" class="form-control entry-input" name="s3c4_upstream_km" id="s3c4_upstream_km" min="0" step="any"><span style="width:50px;">km</span></div></div>
            <div class="form-group"><label>Phương tiện</label>
              <select class="form-control entry-input" name="s3c4_mode" id="s3c4_mode">
                <option value="truck_heavy">Xe tải nặng</option>
                <option value="truck_medium">Xe tải vừa</option>
                <option value="sea_container">Tàu biển</option>
              </select>
            </div>
         `;
      } else if (catId === 5) {
         fieldsHtml += `
            <div class="form-group"><label>Rác thải chôn lấp</label><div style="display:flex; gap:0.5rem;"><input type="number" class="form-control entry-input" name="s3c5_waste_landfill" id="s3c5_waste_landfill" min="0" step="any"><span style="width:50px;">tấn</span></div></div>
            <div class="form-group"><label>Nước thải cần xử lý</label><div style="display:flex; gap:0.5rem;"><input type="number" class="form-control entry-input" name="s3c5_wastewater_m3" id="s3c5_wastewater_m3" min="0" step="any"><span style="width:50px;">m³</span></div></div>
         `;
      } else if (catId === 6 && ind.scope3Cat6Transport) {
         ind.scope3Cat6Transport.forEach(m => {
           fieldsHtml += `
             <div class="form-group">
               <label>${m.label}</label>
               <div style="display:flex; gap:0.5rem;"><input type="number" class="form-control entry-input" name="s3c6_${m.id}" id="s3c6_${m.id}" min="0" step="any"><span style="width:50px;">km</span></div>
             </div>
           `;
         });
      } else if (catId === 9) {
         fieldsHtml += `
            <div class="form-group"><label>Khối lượng xuất khẩu</label><div style="display:flex; gap:0.5rem;"><input type="number" class="form-control entry-input" name="s3c9_export_ton" id="s3c9_export_ton" min="0" step="any"><span style="width:50px;">tấn</span></div></div>
            <div class="form-group">
              <label>Tuyến đường xuất khẩu</label>
              <select class="form-control" id="s3c9_route" onchange="handleRouteChange()">
                <option value="">-- Chọn tuyến xuất khẩu --</option>
                <option value="18500|sea_container">Hải Phòng/Cái Mép ➔ Rotterdam, Hà Lan (EU) - 18,500 km</option>
                <option value="18800|sea_container">Hải Phòng/Cái Mép ➔ Hamburg, Đức (EU) - 18,800 km</option>
                <option value="12200|sea_container">Cái Mép ➔ Los Angeles, Mỹ - 12,200 km</option>
                <option value="4200|sea_container">Cát Lái ➔ Yokohama, Nhật Bản - 4,200 km</option>
                <option value="custom">Khác (nhập thủ công quãng đường)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Quãng đường (km)</label>
              <div style="display:flex; gap:0.5rem;"><input type="number" class="form-control entry-input" name="s3c9_export_km" id="s3c9_export_km" min="0" step="any"><span style="width:50px;">km</span></div>
            
            </div>
            <div class="form-group"><label>Phương tiện</label>
              <select class="form-control entry-input" name="s3c9_mode" id="s3c9_mode">
                <option value="sea_container">Tàu biển Container</option>
                <option value="air_freight">Máy bay chở hàng</option>
              </select>
            </div>
         `;
      }

      if (fieldsHtml) {
        s3Container.innerHTML += `
          <div style="border-left: 3px solid var(--color-primary); padding-left: 1rem; margin-bottom: 1.5rem;">
            <h4 style="margin-bottom: 0.5rem;">${cat.icon} ${cat.label}</h4>
            <div class="grid-3">${fieldsHtml}</div>
          </div>
        `;
      }
    });

    // Attach listeners for live calculation
    document.querySelectorAll('.entry-input').forEach(el => {
      el.addEventListener('input', updateLiveTotal);
      el.addEventListener('change', updateLiveTotal);
    });
  }

  function getFormData() {
    const data = {};
    document.querySelectorAll('.entry-input').forEach(el => {
      data[el.name] = el.value;
    });
    return data;
  }

  function loadEntryData() {
    const data = Storage.getAnnualData();
    Object.keys(data).forEach(key => {
      const el = document.getElementById(key);
      if (el) el.value = data[key];
    });

    // Reconcile Cat.9 route dropdown with the loaded km/mode values
    const routeEl = document.getElementById('s3c9_route');
    const kmEl = document.getElementById('s3c9_export_km');
    const modeEl = document.getElementById('s3c9_mode');
    if (routeEl && kmEl && modeEl) {
      const matchValue = `${kmEl.value}|${modeEl.value}`;
      const matchedOption = Array.from(routeEl.options).find(o => o.value === matchValue);
      if (kmEl.value && matchedOption) {
        routeEl.value = matchValue;
        kmEl.readOnly = true;
      } else if (kmEl.value) {
        routeEl.value = 'custom';
        kmEl.readOnly = false;
      } else {
        routeEl.value = '';
        kmEl.readOnly = false;
      }
    }

    updateLiveTotal();
  }

  function updateLiveTotal() {
    const inputs = getFormData();
    const s1 = Calculator.calcScope1(inputs).total;
    const s2 = Calculator.calcScope2(inputs).total;
    const s3 = Calculator.calcScope3(inputs).total;
    document.getElementById('live-total-ghg').innerText = (s1 + s2 + s3).toFixed(2);
  }

  document.getElementById('entry-form-full').addEventListener('submit', (e) => {
    e.preventDefault();
    Storage.saveAnnualData(getFormData());
    localStorage.setItem('gs_v2_annual_saved', 'true');
    document.getElementById('nav-dashboard').style.display = 'flex';
    document.getElementById('nav-report').style.display = 'flex';
    alert('Đã lưu dữ liệu thành công!');
    switchTab('view-dashboard');
  });

  // --- DEMO DATA GENERATOR ---
  document.getElementById('btn-demo-data').addEventListener('click', () => {
    const company = Storage.getCompany();
    if(!company) return alert('Vui lòng thiết lập công ty trước!');
    
    if (confirm('Nạp dữ liệu mẫu cho ngành ' + INDUSTRIES[company.industry].label + '?')) {
      const demoInputs = {};
      const ind = company.industry;
      
      // Generic Scope 2
      demoInputs['s2_grid_kwh'] = 1250000;
      demoInputs['s2_ef_year'] = 'vietnam_grid_2023';
      demoInputs['s2_water_m3'] = 5400;

      if (ind === 'textile') {
        demoInputs['s1_diesel'] = 15000;
        demoInputs['s1_coal'] = 500;
        demoInputs['s3c1_polyester_fabric'] = 80000;
        demoInputs['s3c1_cotton_fabric'] = 40000;
        demoInputs['s3c1_dye_chemicals'] = 5000;
        demoInputs['s3c4_upstream_ton'] = 150;
        demoInputs['s3c4_upstream_km'] = 300;
        demoInputs['s3c4_mode'] = 'truck_heavy';
        demoInputs['s3c5_wastewater_m3'] = 4500;
        demoInputs['s3c9_export_ton'] = 120;
        demoInputs['s3c9_export_km'] = 12000;
        demoInputs['s3c9_mode'] = 'sea_container';
      } else if (ind === 'steel_metal') {
        demoInputs['s1_coal_coking'] = 2500;
        demoInputs['s1_natural_gas'] = 50000;
        demoInputs['s1_chemical_reaction_steel'] = 3000;
        demoInputs['s3c4_upstream_ton'] = 4000;
        demoInputs['s3c4_upstream_km'] = 150;
        demoInputs['s3c4_mode'] = 'truck_heavy';
      } else if (ind === 'food_agriculture') {
        demoInputs['s1_biomass'] = 3000;
        demoInputs['s1_fertilizer_n2o'] = 500;
        demoInputs['s1_organic_waste_ch4'] = 10000;
        demoInputs['s1_refrigerant_r134a'] = 20;
      } else {
        demoInputs['s1_petrol'] = 5000;
        demoInputs['s3c6_domestic_flight'] = 120000;
        demoInputs['s3c6_car_travel'] = 45000;
      }
      
      Storage.saveAnnualData(demoInputs);
      loadEntryData();
      alert('Đã nạp dữ liệu mẫu!');
    }
  });

  // --- CBAM ---
  function populateCbamProducts(customInd) {
    const company = Storage.getCompany();
    const sel = document.getElementById('cbam-product');
    if (!sel) return;
    sel.innerHTML = '';

    const ind = customInd || (company ? INDUSTRIES[company.industry] : null);
    let products = ind && ind.cbamProducts ? ind.cbamProducts : [];

    // Fallback if industry has no specific products configured or isn't CBAM-specific
    if (products.length === 0 && typeof CBAM !== 'undefined' && CBAM.BENCHMARKS) {
      products = Object.keys(CBAM.BENCHMARKS).map(key => ({
        id: key,
        label: CBAM.BENCHMARKS[key].label,
        cn_code: CBAM.BENCHMARKS[key].cn_range
      }));
    }

    products.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.label} (HS: ${p.cn_code})`;
      sel.appendChild(opt);
    });
  }

  document.getElementById('cbam-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const company = Storage.getCompany();
    const inputs = Storage.getAnnualData();
    const results = Calculator.calcAll(inputs, company);
    
    // Calculate embedded emissions (tCO2e/ton)
    const production = company.production_output || 1;
    const actualEmbedded = results.total / production; // Simple assumption for demo

    const cbamParams = {
      productId: document.getElementById('cbam-product').value,
      exportTonnes: parseFloat(document.getElementById('cbam-tonnes').value),
      actualEmissions: actualEmbedded,
      useDefaultValues: document.getElementById('cbam-default-values').checked,
      year: parseInt(document.getElementById('cbam-year').value)
    };

    const cbamResult = CBAM.calculate(cbamParams);
    
    if (cbamResult) {
      document.getElementById('cbam-result').style.display = 'block';
      document.getElementById('cbam-embedded-res').textContent = `${cbamResult.embeddedEmissions} tCO₂e/tấn`;
      document.getElementById('cbam-certs-res').textContent = `${cbamResult.certificatesNeeded} chứng chỉ`;
      document.getElementById('cbam-cost-eur').textContent = CBAM.formatEUR(cbamResult.cbamCostEUR);
      document.getElementById('cbam-cost-vnd').textContent = `~ ${CBAM.formatVND(cbamResult.cbamCostVND)}`;
      
      document.getElementById('cbam-saving-vnd').textContent = CBAM.formatVND(cbamResult.savingsFromMRV_VND);
      document.getElementById('cbam-savings-box').style.display = cbamResult.usingDefaultValues ? 'none' : 'block';
    }
  });


  // --- DASHBOARD ---
  function renderDashboard() {
    const company = Storage.getCompany();
    if(!company) return;
    const inputs = Storage.getAnnualData();
    const results = Calculator.calcAll(inputs, company);

    document.getElementById('kpi-total').innerText = results.total.toLocaleString();
    document.getElementById('kpi-s1').innerText = results.scope1.toLocaleString();
    document.getElementById('kpi-s2').innerText = results.scope2.toLocaleString();
    document.getElementById('kpi-s3').innerText = results.scope3.toLocaleString();

    document.getElementById('bench-industry').innerText = INDUSTRIES[company.industry].label;

    if (window.ChartsManager) {
      ChartsManager.render(results);
    }
    
    // Benchmarks
    const bContainer = document.getElementById('benchmarks-container');
    bContainer.innerHTML = '';
    const statuses = Calculator.getBenchmarkStatus(company.industry, results) || [];
    
    statuses.forEach(st => {
      const fillPct = Math.min(100, Math.max(0, (st.actual / (st.benchmark * 1.5)) * 100)); // Cap at 150%
      const markerPct = Math.min(100, (1.0 / 1.5) * 100); // Benchmark is at 100% of benchmark, scaled to 1.5
      
      const colorMap = { excellent: '#10b981', good: '#8b5cf6', warning: '#f59e0b', critical: '#ef4444' };
      const color = colorMap[st.status];

      bContainer.innerHTML += `
        <div style="margin-bottom: 1.5rem;">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
            <strong>${st.metric}</strong>
            <span style="color:${color}; font-weight:bold;">${st.actual.toFixed(2)} ${st.unit}</span>
          </div>
          <div class="benchmark-bar">
            <div class="benchmark-fill" style="width: ${fillPct}%; background-color: ${color}"></div>
            <div class="benchmark-marker" style="left: ${markerPct}%;" title="Benchmark: ${st.benchmark}"></div>
          </div>
          <small style="color:var(--color-text-secondary)">Benchmark ngành: ${st.benchmark} ${st.unit}</small>
        </div>
      `;
    });
  }

  // --- REPORT ---
  function renderReport() {
    if (window.ReportGenerator) {
      const company = Storage.getCompany();
      const inputs = Storage.getAnnualData();
      const results = Calculator.calcAll(inputs, company);
      const html = ReportGenerator.generate(company, results, inputs);
      document.getElementById('report-content').innerHTML = html;
    }
  }

  // Initialize
  initApp();
});

// --- ROUTE PRESET (Cat.9 — Vận chuyển & Phân phối hạ nguồn) ---
// Global scope so the inline onchange="handleRouteChange()" on the route <select> can reach it.
function handleRouteChange() {
  const routeEl = document.getElementById('s3c9_route');
  const kmEl = document.getElementById('s3c9_export_km');
  const modeEl = document.getElementById('s3c9_mode');
  const hintEl = document.getElementById('s3c9_km_hint');
  if (!routeEl || !kmEl || !modeEl) return;

  if (routeEl.value === 'custom') {
    kmEl.readOnly = false;
    kmEl.value = '';
    kmEl.focus();
    
    kmEl.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }

  
  const [km, mode] = routeEl.value.split('|');
  kmEl.readOnly = true;
  kmEl.value = km;
  modeEl.value = mode;
  

  // Trigger the existing input/change listeners so live total & auto-save pick up the change
  kmEl.dispatchEvent(new Event('change', { bubbles: true }));
  modeEl.dispatchEvent(new Event('change', { bubbles: true }));
}
// --- EXPORT REPORT TO EXCEL ---

// ============================================
// EXPORT GREENSHIFT REPORT TO EXCEL
// ============================================

document.getElementById('btn-export-excel').addEventListener('click', async () => {

  const btn = document.getElementById('btn-export-excel');
  const oldText = btn.innerText;

  btn.disabled = true;
  btn.innerText = '⏳ Đang tạo Excel...';

  

    // ----------------------------------------
    // GET DATA
    // ----------------------------------------

    const company = Storage.getCompany();
    const inputs = Storage.getAnnualData();

    if (!company) {
      alert('Chưa có thông tin công ty!');
      return;
    }

    const results = Calculator.calcAll(inputs, company);

    const wb = XLSX.utils.book_new();


    // ----------------------------------------
    // EXCEL STYLES
    // ----------------------------------------

    const border = {
      top: { style: 'thin', color: { rgb: 'B7B7B7' } },
      bottom: { style: 'thin', color: { rgb: 'B7B7B7' } },
      left: { style: 'thin', color: { rgb: 'B7B7B7' } },
      right: { style: 'thin', color: { rgb: 'B7B7B7' } }
    };

    const titleStyle = {
      font: {
        bold: true,
        sz: 16
      },
      alignment: {
        horizontal: 'center',
        vertical: 'center'
      }
    };

    const headerStyle = {
      font: {
        bold: true,
        sz: 11
      },
      fill: {
        patternType: 'solid',
        fgColor: { rgb: 'D9EAD3' }
      },
      border: border,
      alignment: {
        horizontal: 'center',
        vertical: 'center',
        wrapText: true
      }
    };

    const labelStyle = {
      font: {
        bold: true
      },
      border: border
    };

    const cellStyle = {
      border: border,
      alignment: {
        vertical: 'top',
        wrapText: true
      }
    };


    // ----------------------------------------
    // HELPER FUNCTIONS
    // ----------------------------------------

    function addTitle(ws, title, companyInfo = true) {

      ws['A1'] = {
        v: title,
        t: 's',
        s: titleStyle
      };

      ws['A2'] = {
        v: companyInfo
          ? `Doanh nghiệp: ${company.name}`
          : '',
        t: 's',
        s: labelStyle
      };

      ws['A3'] = {
        v: companyInfo
          ? `Năm báo cáo: ${company.year}`
          : '',
        t: 's',
        s: labelStyle
      };

      ws['A1'].s = titleStyle;

      ws['!merges'] = [
        {
          s: { r: 0, c: 0 },
          e: { r: 0, c: 3 }
        }
      ];

      ws['!rows'] = [
        { hpt: 25 },
        { hpt: 20 },
        { hpt: 20 }
      ];
    }


    function styleTable(ws, startRow, endRow, endCol) {

      for (let r = startRow; r <= endRow; r++) {

        for (let c = 0; c <= endCol; c++) {

          const cell = ws[XLSX.utils.encode_cell({
            r: r,
            c: c
          })];

          if (!cell) continue;

          cell.s = cell.s || {};
          cell.s.border = border;

          cell.s.alignment = {
            vertical: 'top',
            wrapText: true
          };

        }
      }
    }


    function setWidths(ws, widths) {

      ws['!cols'] = widths.map(width => ({
        wch: width
      }));

    }


    // ========================================
    // SHEET 1 - DASHBOARD
    // ========================================

    const dashboardRows = [

      ['GREENSHIFT - DASHBOARD'],
      [`Doanh nghiệp: ${company.name}`],
      [`Mã số thuế: ${company.taxCode || 'N/A'}`],
      [`Năm báo cáo: ${company.year}`],
      [''],

      ['CHỈ SỐ', 'GIÁ TRỊ', 'ĐƠN VỊ'],

      ['Tổng phát thải', results.total, 'tCO₂e'],
      ['Scope 1', results.scope1, 'tCO₂e'],
      ['Scope 2', results.scope2, 'tCO₂e'],
      ['Scope 3', results.scope3, 'tCO₂e'],

      [''],
      ['CƯỜNG ĐỘ PHÁT THẢI', 'GIÁ TRỊ', 'ĐƠN VỊ'],

      [
        'Theo sản lượng',
        results.intensity.per_ton ?? 'N/A',
        'tCO₂e / tấn SP'
      ],

      [
        'Theo doanh thu',
        results.intensity.per_revenue ?? 'N/A',
        'tCO₂e / 1000 USD'
      ],

      [
        'Theo nhân sự',
        results.intensity.per_employee ?? 'N/A',
        'tCO₂e / người'
      ]
    ];

    const wsDashboard =
      XLSX.utils.aoa_to_sheet(dashboardRows);

    wsDashboard['A1'].s = titleStyle;

    wsDashboard['A6'].s = headerStyle;
    wsDashboard['B6'].s = headerStyle;
    wsDashboard['C6'].s = headerStyle;

    wsDashboard['A12'].s = headerStyle;
    wsDashboard['B12'].s = headerStyle;
    wsDashboard['C12'].s = headerStyle;

    styleTable(
      wsDashboard,
      6,
      dashboardRows.length - 1,
      2
    );

    setWidths(
      wsDashboard,
      [35, 22, 25]
    );

    XLSX.utils.book_append_sheet(
      wb,
      wsDashboard,
      'Dashboard'
    );


    // ========================================
    // SHEET 2 - DỮ LIỆU NHẬP
    // ========================================

    const inputRows = [
      ['DỮ LIỆU NHẬP'],
      [`Doanh nghiệp: ${company.name}`],
      [`Năm: ${company.year}`],
      [''],
      ['TRƯỜNG', 'GIÁ TRỊ']
    ];

    Object.keys(inputs).forEach(key => {

      inputRows.push([
        key,
        inputs[key]
      ]);

    });

    const wsInput =
      XLSX.utils.aoa_to_sheet(inputRows);

    wsInput['A1'].s = titleStyle;
    wsInput['A5'].s = headerStyle;
    wsInput['B5'].s = headerStyle;

    styleTable(
      wsInput,
      4,
      inputRows.length - 1,
      1
    );

    setWidths(
      wsInput,
      [40, 30]
    );

    XLSX.utils.book_append_sheet(
      wb,
      wsInput,
      'Du lieu nhap'
    );


    // ========================================
    // 1 - EXECUTIVE SUMMARY
    // ========================================

    const ws1Rows = [

      ['1. TÓM TẮT ĐIỀU HÀNH'],

      ['Thông tin', 'Giá trị', 'Đơn vị'],

      ['Doanh nghiệp', company.name, ''],
      ['Năm báo cáo', company.year, ''],
      ['Tổng phát thải', results.total, 'tCO₂e'],
      ['Scope 1', results.scope1, 'tCO₂e'],
      ['Scope 2', results.scope2, 'tCO₂e'],
      ['Scope 3', results.scope3, 'tCO₂e'],

      ['Cường độ theo doanh thu',
        results.intensity.per_revenue ?? 'N/A',
        'tCO₂e / 1000 USD'],

      ['Cường độ theo sản lượng',
        results.intensity.per_ton ?? 'N/A',
        'tCO₂e / tấn SP']
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(ws1Rows);

    ws1['A1'].s = titleStyle;

    for (let c = 0; c < 3; c++) {
      ws1[XLSX.utils.encode_cell({
        r: 1,
        c: c
      })].s = headerStyle;
    }

    styleTable(ws1, 1, ws1Rows.length - 1, 2);

    setWidths(ws1, [35, 25, 25]);

    XLSX.utils.book_append_sheet(
      wb,
      ws1,
      '1 - Tom tat'
    );


    // ========================================
    // 2 - ORGANIZATIONAL BOUNDARY
    // ========================================

    const industry =
      INDUSTRIES[company.industry];

    const ws2Rows = [

      ['2. RANH GIỚI TỔ CHỨC'],

      ['Thông tin', 'Giá trị'],

      [
        'Phương pháp',
        'Quyền kiểm soát hoạt động (Operational Control)'
      ],

      [
        'Ngành nghề',
        industry
          ? industry.label
          : company.industry
      ],

      [
        'Tên công ty',
        company.name
      ],

      [
        'Mã số thuế',
        company.taxCode || 'N/A'
      ],

      [
        'Nhân sự',
        company.employees || 0
      ],

      [
        'Sản lượng',
        company.production_output || 0
      ]
    ];

    const ws2 = XLSX.utils.aoa_to_sheet(ws2Rows);

    ws2['A1'].s = titleStyle;
    ws2['A2'].s = headerStyle;
    ws2['B2'].s = headerStyle;

    styleTable(ws2, 1, ws2Rows.length - 1, 1);

    setWidths(ws2, [35, 60]);

    XLSX.utils.book_append_sheet(
      wb,
      ws2,
      '2 - Ranh gioi TC'
    );


    // ========================================
    // 3 - OPERATIONAL BOUNDARY
    // ========================================

    const ws3Rows = [

      ['3. RANH GIỚI HOẠT ĐỘNG'],

      [
        'Scope',
        'Nguồn phát thải',
        'Phát thải',
        'Đơn vị'
      ],

      [
        'Scope 1',
        [...new Set(
          results.breakdown
            .filter(i => i.scope === 1)
            .map(i => i.source)
        )].join(', ') || 'Không có',
        results.scope1,
        'tCO₂e'
      ],

      [
        'Scope 2',
        [...new Set(
          results.breakdown
            .filter(i => i.scope === 2)
            .map(i => i.source)
        )].join(', ') || 'Không có',
        results.scope2,
        'tCO₂e'
      ],

      [
        'Scope 3',
        Object.keys(results.scope3ByCat)
          .map(c => `Cat.${c}`)
          .join(', ') || 'Không ghi nhận',
        results.scope3,
        'tCO₂e'
      ]
    ];

    const ws3 = XLSX.utils.aoa_to_sheet(ws3Rows);

    ws3['A1'].s = titleStyle;

    for (let c = 0; c < 4; c++) {
      ws3[XLSX.utils.encode_cell({
        r: 1,
        c: c
      })].s = headerStyle;
    }

    styleTable(ws3, 1, ws3Rows.length - 1, 3);

    setWidths(ws3, [15, 65, 20, 18]);

    XLSX.utils.book_append_sheet(
      wb,
      ws3,
      '3 - Ranh gioi HD'
    );


    // ========================================
    // 4 - SCOPE 1 & 2
    // ========================================

    const ws4Rows = [

      ['4. DỮ LIỆU HOẠT ĐỘNG - SCOPE 1 & 2'],

      [
        'Scope',
        'Nguồn',
        'Sản lượng / Tiêu thụ',
        'Đơn vị',
        'Phát thải',
        'Đơn vị phát thải'
      ]
    ];

    results.breakdown
      .filter(item => item.scope !== 3)
      .forEach(item => {

        ws4Rows.push([
          `Scope ${item.scope}`,
          item.source,
          item.quantity,
          item.unit,
          item.emission,
          'tCO₂e'
        ]);

      });

    const ws4 = XLSX.utils.aoa_to_sheet(ws4Rows);

    ws4['A1'].s = titleStyle;

    for (let c = 0; c < 6; c++) {
      ws4[XLSX.utils.encode_cell({
        r: 1,
        c: c
      })].s = headerStyle;
    }

    styleTable(ws4, 1, ws4Rows.length - 1, 5);

    setWidths(
      ws4,
      [15, 40, 22, 20, 20, 20]
    );

    XLSX.utils.book_append_sheet(
      wb,
      ws4,
      '4 - Scope 1 2'
    );


    // ========================================
    // 5 - SCOPE 3
    // ========================================

    const ws5Rows = [

      ['5. PHÂN TÍCH CHUỖI GIÁ TRỊ - SCOPE 3'],

      [
        'Category',
        'Nguồn / Hoạt động',
        'Hoạt động',
        'Đơn vị',
        'Phát thải',
        'Đơn vị phát thải'
      ]
    ];

    results.breakdown
      .filter(item => item.category !== undefined)
      .forEach(item => {

        ws5Rows.push([
          `Cat.${item.category}`,
          item.source,
          item.quantity,
          item.unit,
          item.emission,
          'tCO₂e'
        ]);

      });

    if (ws5Rows.length === 2) {

      ws5Rows.push([
        'N/A',
        'Chưa nhập dữ liệu Scope 3',
        '',
        '',
        0,
        'tCO₂e'
      ]);

    }

    const ws5 = XLSX.utils.aoa_to_sheet(ws5Rows);

    ws5['A1'].s = titleStyle;

    for (let c = 0; c < 6; c++) {
      ws5[XLSX.utils.encode_cell({
        r: 1,
        c: c
      })].s = headerStyle;
    }

    styleTable(ws5, 1, ws5Rows.length - 1, 5);

    setWidths(
      ws5,
      [15, 45, 22, 20, 20, 20]
    );

    XLSX.utils.book_append_sheet(
      wb,
      ws5,
      '5 - Scope 3'
    );


    // ========================================
    // 6 - BENCHMARK
    // ========================================

    const statuses =
      Calculator.getBenchmarkStatus(
        company.industry,
        results
      ) || [];

    const ws6Rows = [

      ['6. CƯỜNG ĐỘ PHÁT THẢI & ĐỊNH CHUẨN'],

      [
        'Chỉ số',
        'Thực tế',
        'Benchmark',
        'Đơn vị',
        'Trạng thái'
      ]
    ];

    statuses.forEach(st => {

      ws6Rows.push([
        st.metric,
        st.actual,
        st.benchmark,
        st.unit,
        st.status.toUpperCase()
      ]);

    });

    if (statuses.length === 0) {

      ws6Rows.push([
        'Không có benchmark phù hợp',
        '',
        '',
        '',
        ''
      ]);

    }

    const ws6 = XLSX.utils.aoa_to_sheet(ws6Rows);

    ws6['A1'].s = titleStyle;

    for (let c = 0; c < 5; c++) {
      ws6[XLSX.utils.encode_cell({
        r: 1,
        c: c
      })].s = headerStyle;
    }

    styleTable(ws6, 1, ws6Rows.length - 1, 4);

    setWidths(
      ws6,
      [40, 20, 20, 25, 20]
    );

    XLSX.utils.book_append_sheet(
      wb,
      ws6,
      '6 - Benchmark'
    );


    // ========================================
    // 7 - CBAM
    // ========================================

    const cbamApplicable =
      industry && industry.cbamApplicable;

    const ws7Rows = [

      ['7. NGHĨA VỤ EU CBAM'],

      ['Thông tin', 'Kết quả'],

      [
        'Ngành nghề',
        industry
          ? industry.label
          : company.industry
      ],

      [
        'CBAM áp dụng',
        cbamApplicable
          ? 'CÓ'
          : 'KHÔNG'
      ],

      [
        'Trạng thái',
        cbamApplicable
          ? 'Doanh nghiệp thuộc phạm vi CBAM'
          : 'Không áp dụng'
      ]
    ];

    const ws7 = XLSX.utils.aoa_to_sheet(ws7Rows);

    ws7['A1'].s = titleStyle;
    ws7['A2'].s = headerStyle;
    ws7['B2'].s = headerStyle;

    styleTable(ws7, 1, ws7Rows.length - 1, 1);

    setWidths(ws7, [35, 65]);

    XLSX.utils.book_append_sheet(
      wb,
      ws7,
      '7 - CBAM'
    );


    // ========================================
    // 8 - DECLARATION
    // ========================================

    const ws8Rows = [

      ['8. TUYÊN BỐ (DECLARATION)'],

      ['Nội dung'],

      [
        'Dữ liệu trong báo cáo này được tổng hợp từ thông tin nội bộ của công ty thông qua nền tảng GreenShift v2.0.'
      ],

      [
        'Để sử dụng cho mục đích xuất khẩu EU hoặc chứng nhận xanh, báo cáo cần được xác minh (verify) bởi bên thứ 3 độc lập theo chuẩn ISO 14064-3.'
      ]
    ];

    const ws8 = XLSX.utils.aoa_to_sheet(ws8Rows);

    ws8['A1'].s = titleStyle;
    ws8['A2'].s = headerStyle;

    styleTable(ws8, 1, ws8Rows.length - 1, 0);

    setWidths(ws8, [110]);

    XLSX.utils.book_append_sheet(
      wb,
      ws8,
      '8 - Tuyen bo'
    );


    // ========================================
    // 9 - ACTION PLAN
    // ========================================

    const improvements =
      Calculator.getImprovements(
        company.industry,
        results
      ) || [];

    const ws9Rows = [

      ['9. KẾ HOẠCH CẢI THIỆN & GIẢM PHÁT THẢI'],

      [
        'Ưu tiên',
        'Giải pháp',
        'Hiệu quả',
        'Chi phí & ROI',
        'Hoàn vốn',
        'CO₂ giảm',
        'Đào tạo'
      ]
    ];

    improvements.forEach(imp => {

      ws9Rows.push([
        imp.priority
          ? imp.priority.toUpperCase()
          : '',

        imp.title || '',

        imp.saving || '',

        imp.cost || '',

        imp.payback || '',

        imp.co2Saving || 0,

        imp.trainingRole
          ? `${imp.trainingRole} (${imp.trainingHours} giờ)`
          : ''
      ]);

    });

    if (improvements.length === 0) {

      ws9Rows.push([
        '',
        'Cần thêm dữ liệu để đề xuất giải pháp.',
        '',
        '',
        '',
        0,
        ''
      ]);

    }

    const ws9 = XLSX.utils.aoa_to_sheet(ws9Rows);

    ws9['A1'].s = titleStyle;

    for (let c = 0; c < 7; c++) {
      ws9[XLSX.utils.encode_cell({
        r: 1,
        c: c
      })].s = headerStyle;
    }

    styleTable(ws9, 1, ws9Rows.length - 1, 6);

    setWidths(
      ws9,
      [15, 45, 35, 35, 20, 20, 40]
    );

    XLSX.utils.book_append_sheet(
      wb,
      ws9,
      '9 - Action Plan'
    );


    // ========================================
    // CREATE FILE
    // ========================================

    const fileName =
      `GreenShift_${company.name.replace(/\s+/g, '_')}_${company.year}.xlsx`;

    const excelData = XLSX.write(
      wb,
      {
        bookType: 'xlsx',
        type: 'array',
        cellStyles: true
      }
    );

    const excelBlob = new Blob(
      [excelData],
      {
        type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    );


  // ===============================
  // DOWNLOAD EXCEL
  // ===============================

  XLSX.writeFile(
    wb,
     fileName
  );

});

