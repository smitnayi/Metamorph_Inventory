import { useState } from 'react';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import GlassCard from '../components/GlassCard';

export default function StickerGenerator() {
  const [formData, setFormData] = useState({
    model: '',
    size: '800X1200',
    owner: '',
    shade: '',
    pcs: '',
    bundles: 1
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      // PDF Generation Logic (Ported from Python)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // A4 Size: 210 x 297 mm
      const PAGE_WIDTH = 210;
      const PAGE_HEIGHT = 297;
      
      const LEFT_MARGIN = 10;
      const TOP_MARGIN = 10;
      const RIGHT_MARGIN = 10;
      const BOTTOM_MARGIN = 10;
      
      const COLS = 4;
      const ROWS = 6;
      const STICKERS_PER_PAGE = COLS * ROWS;
      
      const USABLE_WIDTH = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN; // 190mm
      const USABLE_HEIGHT = PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN; // 277mm
      
      const STICKER_WIDTH = USABLE_WIDTH / COLS; // 47.5mm
      const STICKER_HEIGHT = USABLE_HEIGHT / ROWS; // ~46.16mm
      
      const PADDING = 3;

      let stickersCreated = 0;
      const totalStickers = parseInt(formData.bundles, 10) || 1;

      // Ensure we have a logo source
      // Here we load the logo.png from the public folder. Wait for it to load to get a base64 Data URL.
      // Since it's synchronous in pdf generation, let's load it in advance if possible, or build it using standard objects.
      
      // Helper function to load image
      const loadImage = (src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => resolve(null); // Fallback if logo fails
          img.src = src;
        });
      };

      const logoData = await loadImage('/logo-full.png');

      while (stickersCreated < totalStickers) {
        if (stickersCreated > 0 && stickersCreated % STICKERS_PER_PAGE === 0) {
          doc.addPage();
        }

        const stickerOnPage = stickersCreated % STICKERS_PER_PAGE;
        const row = Math.floor(stickerOnPage / COLS);
        const col = stickerOnPage % COLS;

        // Position calculations (jsPDF starts from top-left, unlike ReportLab Python which starts bottom-left)
        const x = LEFT_MARGIN + (col * STICKER_WIDTH);
        const y = TOP_MARGIN + (row * STICKER_HEIGHT);
        const bundleNo = stickersCreated + 1;

        // 1. Draw Border
        doc.setDrawColor(0);
        doc.setLineWidth(0.2);
        doc.rect(x, y, STICKER_WIDTH, STICKER_HEIGHT);

        const contentX = x + PADDING;

        // 2. Logo Area (Top 12mm)
        const logoAreaHeight = 12;
        const logoWidth = 32;
        const logoHeight = 8;
        const logoX = contentX + 0.5;
        const logoY = y + PADDING;

        if (logoData) {
          doc.addImage(logoData, 'PNG', logoX, logoY, logoWidth, logoHeight);
        } else {
          doc.setFillColor(230, 230, 230);
          doc.rect(logoX, logoY, logoWidth, logoHeight, 'F');
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0);
          doc.text("METAMORPH", logoX + 5, logoY + (logoHeight/2) + 2);
        }

        // 3. Separator Line
        const separatorY = y + logoAreaHeight;
        doc.setDrawColor(150);
        doc.setLineWidth(0.2);
        doc.line(contentX, separatorY, x + STICKER_WIDTH - PADDING, separatorY);

        // 4. Text Area
        const textStartY = separatorY + 4; // Start slightly below separator
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0);

        const textLines = [
          `MODEL  : ${formData.model}`,
          `SIZE   : ${formData.size}`,
          `OWNER  : ${formData.owner}`,
          `SHADE  : ${formData.shade}`,
          `PCS    : ${formData.pcs}`,
          `BUNDLE : ${bundleNo}/${totalStickers}`
        ];

        const lineHeight = 4.5;
        textLines.forEach((text, i) => {
          doc.text(text, contentX, textStartY + (i * lineHeight));
        });

        stickersCreated++;
      }

      doc.save(`Metamorph_Stickers_${formData.model || 'Export'}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Check console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col h-full overflow-y-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-2xl font-heading font-bold" style={{ color: 'var(--text-primary)' }}>Sticker Generator</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Generate printable A4 4x6 grid sticker PDF sheets for your stock.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Form Panel */}
        <GlassCard className="!p-6">
          <h3 className="text-lg font-heading font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8771A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Sticker Details
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>MODEL</label>
                <input type="text" name="model" value={formData.model} onChange={handleChange} placeholder="e.g. SINTRA-PRO" className="glass-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>SIZE</label>
                <select name="size" value={formData.size} onChange={handleChange} className="glass-input">
                  <option value="800X1200">800 X 1200</option>
                  <option value="900X1200">900 X 1200</option>
                  <option value="1200X2400">1200 X 2400</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>OWNER</label>
              <input type="text" name="owner" value={formData.owner} onChange={handleChange} placeholder="e.g. METAMORPH" className="glass-input" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>SHADE</label>
                <input type="text" name="shade" value={formData.shade} onChange={handleChange} placeholder="e.g. MATTE BLACK" className="glass-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>PCS / BUNDLE</label>
                <input type="number" name="pcs" value={formData.pcs} onChange={handleChange} placeholder="50" min="1" className="glass-input" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>TOTAL BUNDLES (STICKERS TO GENERATE)</label>
              <input type="number" name="bundles" value={formData.bundles} onChange={handleChange} min="1" max="1000" className="glass-input" />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>A 4x6 A4 page fits 24 stickers. {formData.bundles > 0 && `(Will generate ${Math.ceil(formData.bundles / 24)} page${Math.ceil(formData.bundles / 24) > 1 ? 's' : ''})`}</p>
            </div>
          </div>

          <div className="mt-8">
            <button 
              onClick={generatePDF}
              disabled={isGenerating || !formData.model}
              className="glass-btn-primary w-full py-3 justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Generating PDF...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Generate PDF ({formData.bundles} Stickers)
                </>
              )}
            </button>
          </div>
        </GlassCard>

        {/* Live Preview Panel */}
        <div className="h-full">
          <h3 className="text-sm font-semibold mb-4 ml-1 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Print Preview (1 of 24 per page)
          </h3>
          
          <div className="flex items-center justify-center p-8 rounded-xl border border-dashed" style={{ borderColor: 'var(--divider)', background: 'var(--surface)' }}>
            <motion.div 
              className="bg-white rounded-md shadow-xl overflow-hidden relative"
              style={{ width: '190px', height: '184px', border: '1px solid #E2E8F0' }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="p-3 h-full flex flex-col">
                <div className="h-10 mb-2 flex items-center">
                  <div className="flex items-center gap-1.5 font-bold text-black border-2 border-black px-2 py-0.5" style={{ fontSize: '10px' }}>
                    <span className="text-orange-500">M</span> META
                  </div>
                </div>
                
                <div className="border-b border-gray-300 w-full mb-3" />
                
                <div className="flex-1 space-y-1 font-mono text-black text-[9px] leading-tight">
                  <div className="flex"><span className="w-14">MODEL</span><span className="mr-1">:</span> <span className="font-bold truncate">{formData.model || '__________'}</span></div>
                  <div className="flex"><span className="w-14">SIZE</span><span className="mr-1">:</span> <span className="font-bold truncate">{formData.size || '__________'}</span></div>
                  <div className="flex"><span className="w-14">OWNER</span><span className="mr-1">:</span> <span className="font-bold truncate">{formData.owner || '__________'}</span></div>
                  <div className="flex"><span className="w-14">SHADE</span><span className="mr-1">:</span> <span className="font-bold truncate">{formData.shade || '__________'}</span></div>
                  <div className="flex"><span className="w-14">PCS</span><span className="mr-1">:</span> <span className="font-bold truncate">{formData.pcs || '__________'}</span></div>
                  <div className="flex"><span className="w-14">BUNDLE</span><span className="mr-1">:</span> <span className="font-bold truncate">1/{formData.bundles || 1}</span></div>
                </div>
              </div>
            </motion.div>
          </div>
          
          <div className="mt-4 p-4 rounded-xl text-sm leading-relaxed" style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.1)', color: 'var(--text-primary)' }}>
            <strong>Printing Instructions:</strong><br />
            1. Use A4 Sticker Paper.<br />
            2. Print at <strong>100% scale / Actual Size</strong>. Do NOT select "Fit to page".<br />
            3. The PDF has built-in 10mm margins explicitly designed for your 4x6 label die-cuts.
          </div>
        </div>
      </div>
    </div>
  );
}
