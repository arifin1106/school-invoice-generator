/* =============================================
   Invoice Generator - Main Script (School Invoice)
   ============================================= */

// --- State ---
let itemCounter = 0;
let logoDataUrl = null;

// --- DOM Ready ---
document.addEventListener('DOMContentLoaded', () => {
    initSectionToggles();
    initFormListeners();
    initActionButtons();
    addItem(); // Start with one empty item
    updatePreview();
    setDefaultDates();
});

// =============================================
// INITIALIZATION
// =============================================

function setDefaultDates() {
    const today = new Date();
    const dateStr = formatDateISO(today);
    document.getElementById('invoiceDate').value = dateStr;
    updatePreview();
}

function formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function initSectionToggles() {
    document.querySelectorAll('[data-toggle="section"]').forEach(header => {
        header.addEventListener('click', () => {
            const section = header.closest('.form-section');
            section.classList.toggle('open');
        });
    });
}

function initFormListeners() {
    const form = document.getElementById('invoice-form');
    form.addEventListener('input', () => updatePreview());
    form.addEventListener('change', () => updatePreview());

    // Logo upload
    document.getElementById('logoUpload').addEventListener('change', handleLogoUpload);

    // Currency input formatting for payment received
    const paymentInput = document.getElementById('paymentReceived');
    paymentInput.addEventListener('blur', function () {
        const val = parseCurrencyInput(this.value);
        if (!isNaN(val) && val > 0) {
            this.value = formatNumber(val);
        }
    });
    paymentInput.addEventListener('focus', function () {
        const val = parseCurrencyInput(this.value);
        if (!isNaN(val) && val > 0) {
            this.value = val;
        }
    });

    // Mobile form toggle
    const toggleBtn = document.getElementById('btnToggleForm');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            document.getElementById('formPanel').classList.toggle('collapsed');
        });
    }
}

function initActionButtons() {
    document.getElementById('btnAddItem').addEventListener('click', addItem);
    document.getElementById('btnExportPDF').addEventListener('click', exportPDF);
    document.getElementById('btnPrint').addEventListener('click', printInvoice);
}

// =============================================
// ITEM MANAGEMENT
// =============================================

function addItem() {
    itemCounter++;
    const container = document.getElementById('items-container');

    const card = document.createElement('div');
    card.className = 'item-card';
    card.dataset.itemId = itemCounter;

    card.innerHTML = `
        <div class="item-card-header">
            <span>Item #${itemCounter}</span>
            <button type="button" class="btn-remove-item" onclick="removeItem(${itemCounter})">✕ Hapus</button>
        </div>
        <div class="form-group">
            <label>Keterangan</label>
            <input type="text" class="item-desc" placeholder="Contoh: Registration Fee, Admission Fee...">
        </div>
        <div class="form-row-2">
            <div class="form-group">
                <label>Nominal (Rp)</label>
                <input type="text" class="item-price input-currency" placeholder="0">
            </div>
            <div class="form-group">
                <label>Status Pembayaran</label>
                <select class="item-status">
                    <option value="unpaid">Belum Lunas</option>
                    <option value="paid">Lunas</option>
                </select>
            </div>
        </div>
    `;

    container.appendChild(card);

    // Currency formatting for price input
    const priceInput = card.querySelector('.item-price');
    priceInput.addEventListener('blur', function () {
        const val = parseCurrencyInput(this.value);
        if (!isNaN(val) && val > 0) {
            this.value = formatNumber(val);
        }
        updatePreview();
    });
    priceInput.addEventListener('focus', function () {
        const val = parseCurrencyInput(this.value);
        if (!isNaN(val) && val > 0) {
            this.value = val;
        }
    });

    // Auto-update on changes
    card.querySelector('.item-desc').addEventListener('input', () => updatePreview());
    card.querySelector('.item-price').addEventListener('input', () => updatePreview());
    card.querySelector('.item-status').addEventListener('change', () => updatePreview());

    updatePreview();
}

function removeItem(id) {
    const card = document.querySelector(`.item-card[data-item-id="${id}"]`);
    if (card) {
        card.style.opacity = '0';
        card.style.transform = 'translateX(-20px)';
        card.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            card.remove();
            updatePreview();
        }, 300);
    }
}

function getItems() {
    const items = [];
    document.querySelectorAll('.item-card').forEach((card, index) => {
        const desc = card.querySelector('.item-desc').value.trim();
        const price = parseCurrencyInput(card.querySelector('.item-price').value) || 0;
        const status = card.querySelector('.item-status').value;

        items.push({
            no: index + 1,
            description: desc || '-',
            price,
            status
        });
    });
    return items;
}

// =============================================
// LOGO UPLOAD
// =============================================

function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file logo maks 2MB');
        e.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        logoDataUrl = event.target.result;
        updatePreview();
    };
    reader.readAsDataURL(file);
}

// =============================================
// PREVIEW UPDATE
// =============================================

function updatePreview() {
    // School Name
    const schoolName = getVal('companyName') || 'Jakarta Cosmopolite Islamic School';
    setText('prevCompanyName', schoolName);

    // School Address
    const schoolAddress = getVal('schoolAddress') || '';
    const addressEl = document.getElementById('prevSchoolAddress');
    if (addressEl) {
        addressEl.textContent = schoolAddress ? 'Alamat: ' + schoolAddress : '';
    }

    // School Phone
    const schoolPhone = getVal('schoolPhone') || '';
    const phoneEl = document.getElementById('prevSchoolPhone');
    if (phoneEl) {
        phoneEl.textContent = schoolPhone ? 'Telepon: ' + schoolPhone : '';
    }

    // School Email
    const schoolEmail = getVal('schoolEmail') || '';
    const emailEl = document.getElementById('prevSchoolEmail');
    if (emailEl) {
        emailEl.textContent = schoolEmail ? 'Email: ' + schoolEmail : '';
    }

    // Logo
    const logoImg = document.getElementById('prevLogo');
    const logoPlaceholder = document.getElementById('prevLogoPlaceholder');
    const logoFooterImg = document.getElementById('prevLogoFooter');
    const logoFooterPlaceholder = document.getElementById('prevLogoFooterPlaceholder');

    if (logoDataUrl) {
        logoImg.src = logoDataUrl;
        logoImg.style.display = 'block';
        if (logoPlaceholder) logoPlaceholder.style.display = 'none';

        logoFooterImg.src = logoDataUrl;
        logoFooterImg.style.display = 'block';
        if (logoFooterPlaceholder) logoFooterPlaceholder.style.display = 'none';
    } else {
        logoImg.style.display = 'none';
        if (logoPlaceholder) logoPlaceholder.style.display = 'flex';

        logoFooterImg.style.display = 'none';
        if (logoFooterPlaceholder) logoFooterPlaceholder.style.display = 'flex';
    }

    // Invoice Info
    const invoiceNum = getVal('invoiceNumber') || '-';
    setText('prevInvoiceNumber', invoiceNum);

    const invoiceDateVal = getVal('invoiceDate');
    setText('prevInvoiceDate', formatDateDisplay(invoiceDateVal));

    // Due Date (text input now)
    const dueDateVal = getVal('dueDate') || '25/bulan/tahun';
    setText('prevDueDate', dueDateVal);

    // Student Info
    const studentName = getVal('studentName');
    const studentNameEl = document.getElementById('prevStudentName');
    if (studentNameEl) {
        studentNameEl.textContent = studentName || '(diisi nama student)';
    }

    setText('prevStudentLevel', getVal('studentLevel') || 'P1/P2/K1/K2');

    // Items Table
    const items = getItems();
    const tbody = document.getElementById('prevItemsBody');
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-row">Belum ada item</td></tr>';
    } else {
        tbody.innerHTML = items.map(item => {
            const statusText = item.status === 'paid' ? 'Lunas' : 'Belum Lunas';
            return `
                <tr>
                    <td class="text-center">${item.no}</td>
                    <td>${escapeHtml(item.description)}</td>
                    <td class="text-right">Rp ${formatNumber(item.price)}</td>
                    <td class="text-center">${statusText}</td>
                </tr>
            `;
        }).join('');
    }

    // Summary
    const total = items.reduce((sum, item) => sum + item.price, 0);
    const paymentReceived = parseCurrencyInput(getVal('paymentReceived')) || 0;
    const sisaTagihan = Math.max(total - paymentReceived, 0);

    setText('prevTotal', 'Rp ' + formatNumber(total));
    setText('prevPaymentReceived', 'Rp ' + formatNumber(paymentReceived));
    setText('prevSisaTagihan', 'Rp ' + formatNumber(sisaTagihan));

    // Payment Method (footer)
    setText('prevBankName', getVal('bankName') || 'BNI');
    setText('prevBankAccount', getVal('bankAccount') || '-');
    setText('prevBankAccountName', getVal('bankAccountName') || 'Yayasan Cahaya Pembangunan Global Indonesia');

    // Pesan
    const pesanBody = getVal('pesanBody') || '';
    const pesanLines = pesanBody.split('\n').filter(l => l.trim() !== '');
    const pesanStudentEl = document.getElementById('prevPesanStudent');
    const pesanBodyEl = document.getElementById('prevPesanBody');
    const pesanWAEl = document.getElementById('prevPesanWA');

    if (pesanStudentEl) {
        pesanStudentEl.textContent = studentName || 'Nama student';
    }

    if (pesanLines.length > 0) {
        // First line is the main message body
        if (pesanBodyEl) pesanBodyEl.textContent = pesanLines[0];
        // Remaining lines joined (usually WhatsApp contact)
        if (pesanWAEl) {
            if (pesanLines.length > 1) {
                pesanWAEl.textContent = pesanLines.slice(1).join('\n');
                pesanWAEl.style.display = 'block';
            } else {
                pesanWAEl.textContent = '';
                pesanWAEl.style.display = 'none';
            }
        }
    } else {
        if (pesanBodyEl) pesanBodyEl.textContent = '';
        if (pesanWAEl) { pesanWAEl.textContent = ''; pesanWAEl.style.display = 'none'; }
    }

    // Signer
    setText('prevSignerName', getVal('signerName') || 'RR Ratih Retno Sari, S.P');
    setText('prevSignerTitle', getVal('signerTitle') || 'Finance Manager');
}

// =============================================
// NUMBER FORMATTING (Indonesian)
// =============================================

function formatNumber(num) {
    if (num === 0) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function parseCurrencyInput(str) {
    if (!str) return 0;
    // Remove commas and dots (thousand separators)
    const cleaned = str.toString().replace(/,/g, '').replace(/\./g, '');
    const val = parseFloat(cleaned);
    return isNaN(val) ? 0 : val;
}

// =============================================
// DATE FORMATTING
// =============================================

function formatDateDisplay(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}

// =============================================
// PDF EXPORT
// =============================================

function exportPDF() {
    const element = document.getElementById('invoice-preview');
    const btn = document.getElementById('btnExportPDF');

    btn.classList.add('loading');
    btn.innerHTML = '<span>⏳</span> Generating...';

    const invoiceNum = getVal('invoiceNumber') || 'invoice';
    const studentName = getVal('studentName') || '';
    const fileName = `Invoice_${invoiceNum.replace(/[/\\/]/g, '_')}${studentName ? '_' + studentName.replace(/\s+/g, '_') : ''}.pdf`;

    const opt = {
        margin: 0,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            logging: false
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        },
        pagebreak: { mode: ['avoid-all'] }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        btn.classList.remove('loading');
        btn.innerHTML = '<span>📄</span> Download PDF';
    }).catch(err => {
        console.error('PDF Export Error:', err);
        btn.classList.remove('loading');
        btn.innerHTML = '<span>📄</span> Download PDF';
        alert('Gagal export PDF. Silakan coba lagi.');
    });
}

// =============================================
// PRINT
// =============================================

function printInvoice() {
    window.print();
}

// =============================================
// UTILITY HELPERS
// =============================================

function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}