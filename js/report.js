/**
 * GreenShift v2.0 — Report Generator
 * Generates 9-section EU-aligned GHG Report
 */

const ReportGenerator = {
  generate(company, results, inputs) {
    if (!company || !results) return '<p>Chưa có dữ liệu để tạo báo cáo.</p>';
    
    const ind = INDUSTRIES[company.industry];

    let html = `
      <div class="report-header" style="text-align:center; margin-bottom:2rem; border-bottom: 2px solid var(--color-primary); padding-bottom:1rem;">
        <h1 style="color:var(--color-primary); margin-bottom:0.5rem;">BÁO CÁO PHÁT THẢI KHÍ NHÀ KÍNH (GHG)</h1>
        <h3 style="color:var(--color-text-primary); margin-bottom:0.5rem;">Doanh nghiệp: ${company.name}</h3>
        <p style="color:var(--color-text-secondary);">Năm báo cáo: ${company.year} | Tiêu chuẩn: GHG Protocol / ISO 14064-1</p>
      </div>
    `;

    // 1. Executive Summary
    html += this._section(1, 'Tóm tắt Điều hành (Executive Summary)', `
      <div class="grid-3" style="margin-bottom:1rem;">
        <div style="background:var(--color-card-bg); padding:1rem; border-radius:4px; text-align:center;">
          <div style="font-size:0.875rem;">Tổng phát thải (tCO₂e)</div>
          <div style="font-size:1.5rem; font-weight:bold; color:var(--color-danger);">${results.total.toLocaleString()}</div>
        </div>
        <div style="background:var(--color-card-bg); padding:1rem; border-radius:4px; text-align:center;">
          <div style="font-size:0.875rem;">Cường độ theo doanh thu</div>
          <div style="font-size:1.5rem; font-weight:bold; color:var(--color-primary);">${results.intensity.per_revenue ? results.intensity.per_revenue.toLocaleString() : 'N/A'}</div>
          <div style="font-size:0.75rem;">tCO₂e / 1000 USD</div>
        </div>
        <div style="background:var(--color-card-bg); padding:1rem; border-radius:4px; text-align:center;">
          <div style="font-size:0.875rem;">Cường độ theo sản lượng</div>
          <div style="font-size:1.5rem; font-weight:bold; color:var(--color-primary);">${results.intensity.per_ton ? results.intensity.per_ton.toLocaleString() : 'N/A'}</div>
          <div style="font-size:0.75rem;">tCO₂e / tấn SP</div>
        </div>
      </div>
      <p>Trong năm ${company.year}, tổng lượng phát thải KNK của <strong>${company.name}</strong> là <strong>${results.total.toLocaleString()} tCO₂e</strong>. 
      Tỷ trọng phân bổ: Scope 1 chiếm ${((results.scope1/results.total)*100 || 0).toFixed(1)}%, Scope 2 chiếm ${((results.scope2/results.total)*100 || 0).toFixed(1)}%, và Scope 3 chiếm ${((results.scope3/results.total)*100 || 0).toFixed(1)}%.</p>
    `);

    // 2. Organizational Boundary
    html += this._section(2, 'Ranh giới Tổ chức (Organizational Boundary)', `
      <p>Báo cáo áp dụng phương pháp tiếp cận <strong>Quyền kiểm soát hoạt động (Operational Control)</strong> theo chuẩn GHG Protocol. Ranh giới bao gồm toàn bộ hoạt động sản xuất, vận hành tại địa chỉ nhà máy đã đăng ký của công ty.</p>
      <ul>
        <li><strong>Ngành nghề:</strong> ${ind ? ind.label : company.industry}</li>
        <li><strong>MST:</strong> ${company.taxCode || 'N/A'}</li>
        <li><strong>Nhân sự:</strong> ${company.employees || 0} người</li>
      </ul>
    `);

    // 3. Operational Boundary
    html += this._section(3, 'Ranh giới Hoạt động (Operational Boundary)', `
      <table style="width:100%; border-collapse:collapse; margin-top:1rem;">
        <tr style="background:var(--color-bg);"><th style="padding:0.5rem;text-align:left;border:1px solid #ddd;">Phạm vi (Scope)</th><th style="padding:0.5rem;text-align:left;border:1px solid #ddd;">Nguồn phát thải được ghi nhận</th><th style="padding:0.5rem;text-align:right;border:1px solid #ddd;">Phát thải (tCO₂e)</th></tr>
        <tr><td style="padding:0.5rem;border:1px solid #ddd;"><strong>Scope 1</strong> (Trực tiếp)</td><td style="padding:0.5rem;border:1px solid #ddd;">${[...new Set(results.breakdown.filter(i=>i.scope===1).map(i=>i.source))].join(', ') || 'Không có'}</td><td style="padding:0.5rem;text-align:right;border:1px solid #ddd;color:var(--color-danger)"><strong>${results.scope1.toLocaleString()}</strong></td></tr>
        <tr><td style="padding:0.5rem;border:1px solid #ddd;"><strong>Scope 2</strong> (Gián tiếp)</td><td style="padding:0.5rem;border:1px solid #ddd;">${[...new Set(results.breakdown.filter(i=>i.scope===2).map(i=>i.source))].join(', ') || 'Không có'}</td><td style="padding:0.5rem;text-align:right;border:1px solid #ddd;color:var(--color-warning)"><strong>${results.scope2.toLocaleString()}</strong></td></tr>
        <tr><td style="padding:0.5rem;border:1px solid #ddd;"><strong>Scope 3</strong> (Chuỗi giá trị)</td><td style="padding:0.5rem;border:1px solid #ddd;">${Object.keys(results.scope3ByCat).map(c => `Cat.${c}`).join(', ') || 'Không ghi nhận'}</td><td style="padding:0.5rem;text-align:right;border:1px solid #ddd;color:var(--color-primary)"><strong>${results.scope3.toLocaleString()}</strong></td></tr>
      </table>
    `);

    // 4. Data & Methodology
    let dataRows = '';
    results.breakdown.filter(i => i.scope !== 3).forEach(item => {
      dataRows += `<tr>
        <td style="padding:0.5rem;border:1px solid #ddd;">Scope ${item.scope}</td>
        <td style="padding:0.5rem;border:1px solid #ddd;">${item.source}</td>
        <td style="padding:0.5rem;border:1px solid #ddd;text-align:right;">${item.quantity.toLocaleString()} ${item.unit}</td>
        <td style="padding:0.5rem;border:1px solid #ddd;text-align:right;">${item.emission.toLocaleString()}</td>
      </tr>`;
    });
    
    html += this._section(4, 'Dữ liệu Hoạt động (Scope 1 & 2)', `
      <table style="width:100%; border-collapse:collapse; margin-top:1rem; font-size:0.875rem;">
        <tr style="background:var(--color-bg);"><th style="padding:0.5rem;text-align:left;border:1px solid #ddd;">Scope</th><th style="padding:0.5rem;text-align:left;border:1px solid #ddd;">Nguồn</th><th style="padding:0.5rem;text-align:right;border:1px solid #ddd;">Sản lượng/Tiêu thụ</th><th style="padding:0.5rem;text-align:right;border:1px solid #ddd;">Phát thải (tCO₂e)</th></tr>
        ${dataRows}
      </table>
      <p style="font-size:0.75rem; margin-top:0.5rem; color:var(--color-text-secondary);">Hệ số phát thải (Emission Factors) được lấy từ QĐ 2626/QĐ-BTNMT, CV 1726/BĐKH-PTCBT (Việt Nam) và IPCC 2006.</p>
    `);

    // 5. Scope 3 Analysis
    let s3Rows = '';
    results.breakdown.filter(i => i.category !== undefined).forEach(item => {
      s3Rows += `<tr>
        <td style="padding:0.5rem;border:1px solid #ddd;">Cat.${item.category}</td>
        <td style="padding:0.5rem;border:1px solid #ddd;">${item.source}</td>
        <td style="padding:0.5rem;border:1px solid #ddd;text-align:right;">${item.quantity.toLocaleString()} ${item.unit}</td>
        <td style="padding:0.5rem;border:1px solid #ddd;text-align:right;">${item.emission.toLocaleString()}</td>
      </tr>`;
    });

    html += this._section(5, 'Phân tích Chuỗi Giá Trị (Scope 3)', `
      ${results.scope3 > 0 ? `
      <table style="width:100%; border-collapse:collapse; margin-top:1rem; font-size:0.875rem;">
        <tr style="background:var(--color-bg);"><th style="padding:0.5rem;text-align:left;border:1px solid #ddd;">Category</th><th style="padding:0.5rem;text-align:left;border:1px solid #ddd;">Nguồn/Hoạt động</th><th style="padding:0.5rem;text-align:right;border:1px solid #ddd;">Hoạt động</th><th style="padding:0.5rem;text-align:right;border:1px solid #ddd;">Phát thải (tCO₂e)</th></tr>
        ${s3Rows}
      </table>
      ` : '<p>Chưa nhập dữ liệu Scope 3.</p>'}
    `);

    // 6. Benchmarking
    const statuses = Calculator.getBenchmarkStatus(company.industry, results) || [];
    let benchHtml = '';
    statuses.forEach(st => {
      benchHtml += `<li><strong>${st.metric}:</strong> ${st.actual.toFixed(2)} ${st.unit} (Benchmark ngành: ${st.benchmark}) — Trạng thái: <span style="text-transform:uppercase; font-weight:bold;">${st.status}</span></li>`;
    });
    
    html += this._section(6, 'Cường độ Phát thải & Định chuẩn (Benchmarking)', `
      <ul>${benchHtml || '<li>Không có benchmark phù hợp.</li>'}</ul>
    `);

    // 7. CBAM Status
    if (ind && ind.cbamApplicable) {
      html += this._section(7, 'Nghĩa vụ EU CBAM (Thuế Carbon Biên Giới)', `
        <div style="background:rgba(239, 68, 68, 0.1); padding:1rem; border-left:4px solid var(--color-danger);">
          <h4 style="color:var(--color-danger); margin-bottom:0.5rem;">CẢNH BÁO CBAM</h4>
          <p>Ngành ${ind.label} nằm trong danh mục áp dụng CBAM của EU từ 01/01/2026. Doanh nghiệp bắt buộc phải duy trì hệ thống MRV này và báo cáo dữ liệu thực tế (Actual Embedded Emissions) cho nhà nhập khẩu EU để giảm thiểu chi phí mua chứng chỉ CBAM.</p>
        </div>
      `);
    }

    // 8. Declaration
    html += this._section(8, 'Tuyên bố (Declaration)', `
      <p>Dữ liệu trong báo cáo này được tổng hợp từ thông tin nội bộ của công ty thông qua nền tảng GreenShift v2.0. Để sử dụng cho mục đích xuất khẩu EU hoặc chứng nhận xanh, báo cáo này cần được xác minh (verify) bởi bên thứ 3 độc lập theo chuẩn ISO 14064-3.</p>
    `);

    // 9. Improvement Plan
    const improvements = Calculator.getImprovements(company.industry, results);
    let impHtml = '';
    improvements.forEach(imp => {
      const priorityColor = imp.priority === 'high' ? 'var(--color-danger)' : 'var(--color-warning)';
      impHtml += `
        <div style="border:1px solid #ddd; padding:1rem; margin-bottom:1rem; border-radius:4px;">
          <h4 style="color:var(--color-primary); margin-bottom:0.5rem;"><span style="background:${priorityColor}; color:#fff; padding:0.1rem 0.4rem; border-radius:3px; font-size:0.75rem; margin-right:0.5rem;">${imp.priority.toUpperCase()}</span> ${imp.title}</h4>
          <div class="grid-2" style="font-size:0.875rem;">
            <div>
              <p><strong>Hiệu quả:</strong> ${imp.saving} (≈ ${imp.co2Saving} tCO₂e/năm)</p>
              <p><strong>Chi phí & ROI:</strong> ${imp.cost} | Hoàn vốn: ${imp.payback}</p>
            </div>
            <div>
              ${imp.trainingRole ? `<p style="background:rgba(16,185,129,0.1); padding:0.5rem; border-radius:4px;"><strong>Yêu cầu Đào tạo (GreenShift):</strong><br> Cần đào tạo nhân sự hiện có thành <em>${imp.trainingRole}</em> (${imp.trainingHours} giờ)</p>` : ''}
            </div>
          </div>
        </div>
      `;
    });

    html += this._section(9, 'Kế hoạch Cải thiện & Giảm phát thải (Action Plan)', `
      <p>Dựa trên cấu trúc phát thải đặc thù của doanh nghiệp, hệ thống GreenShift đề xuất các giải pháp ưu tiên sau đây. Mỗi giải pháp được xếp hạng theo mức độ ưu tiên (HIGH/MEDIUM) dựa trên tỷ trọng phát thải thực tế:</p>
      ${impHtml || '<p>Cần thêm dữ liệu để đề xuất giải pháp.</p>'}
      <div style="margin-top:1.5rem; padding:1rem; background:rgba(16,185,129,0.08); border-left:4px solid var(--color-primary); border-radius:4px;">
        <p style="margin:0; font-size:0.875rem; color:var(--color-text-secondary);">
          <strong>⚠️ Lưu ý quan trọng:</strong> Các giải pháp trên được tạo tự động dựa trên dữ liệu kiểm kê và mang tính chất <strong>chẩn đoán sơ bộ định hướng</strong>. Để xác định giải pháp tối ưu phù hợp nhất với thực trạng công nghệ, tài chính và nhân sự của doanh nghiệp, <strong>cần có chuyên gia thực địa trực tiếp kiểm tra, đánh giá và tư vấn chuyên sâu tại nhà máy</strong>. Vui lòng liên hệ GreenShift để được kết nối với đội chuyên gia.
        </p>
      </div>
    `);

    return html;
  },

  _section(num, title, content) {
    return `
      <div class="report-section">
        <h3>${num}. ${title}</h3>
        <div class="report-section-body">
          ${content}
        </div>
      </div>
    `;
  }
};

window.ReportGenerator = ReportGenerator;
