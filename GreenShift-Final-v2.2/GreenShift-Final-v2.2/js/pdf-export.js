const PDFExport = {
  async exportReport() {
    const btn = document.getElementById('btn-export-pdf');
    const originalText = btn.innerText;
    btn.innerText = 'Đang xử lý...';
    btn.disabled = true;

    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const reportPages = document.querySelectorAll('.report-page');
      
      for (let i = 0; i < reportPages.length; i++) {
        const page = reportPages[i];
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }
      
      const company = Storage.getCompany();
      const fileName = `GreenShift_Report_${company ? company.name.replace(/\s+/g, '_') : 'Company'}_${new Date().getFullYear()}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Lỗi xuất PDF:', error);
      alert('Có lỗi xảy ra khi xuất PDF. Vui lòng thử lại.');
    } finally {
      btn.innerText = originalText;
      btn.disabled = false;
    }
  }
};

window.PDFExport = PDFExport;
