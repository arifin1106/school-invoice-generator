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

    const due = new Date(today);
    due.setDate(due.getDate() + 14);
    document.getElementById('dueDate').value = formatDateISO(due);

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

    // Currency input formatting for discount
    const discountInput = document.getElementById('discountAmount');
    discountInput.addEventListener('blur', function () {
        const val = parseCurrencyInput(this.value);
        if (!isNaN(val) && val > 0) {
            this.value = formatNumber(val);
        }
    });
    discountInput.addEventListener('focus', function () {
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
            <label>Deskripsi</label>
            <input type="text" class="item-desc" placeholder="Contoh: Registration Fee, Admission Fee...">
        </div>
        <div class="form-row-2">
            <div class="form-group">
                <label>Jumlah (Rp)</label>
                <input type="text" class="item-price input-currency" placeholder="0">
            </div>
            <div class="form-group">
                <label>Qty</label>
                <input type="number" class="item-qty" value="1" min="1">
            </div>
        </div>
        <div class="form-group">
            <label>Status Pembayaran</label>
            <select class="item-status">
                <option value="unpaid">Belum Dibayar</option>
                <option value="paid">Sudah Dibayar</option>
            </select>
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
    card.querySelector('.item-qty').addEventListener('input', () => updatePreview());
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
        const qty = parseInt(card.querySelector('.item-qty').value) || 0;
        const status = card.querySelector('.item-status').value;
        const total = price * qty;

        items.push({
            no: index + 1,
            description: desc || '-',
            price,
            qty,
            total,
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
    setText('prevCompanyName', schoolName.toUpperCase());

    // Logo
    const logoImg = document.getElementById('prevLogo');
    if (logoDataUrl) {
        logoImg.src = logoDataUrl;
        logoImg.style.display = 'block';
    } else {
        logoImg.style.display = 'none';
    }

    // Invoice Info
    setText('prevInvoiceNumber', getVal('invoiceNumber') || '-');
    setText('prevInvoiceDate', formatDateDisplayLong(getVal('invoiceDate')));

    const dueDateVal = getVal('dueDate');
    setText('prevDueDate', formatDateDisplayLong(dueDateVal));

    // Student / Bill To
    const studentName = getVal('studentName');
    const studentNameEl = document.getElementById('prevStudentName');
    if (studentName) {
        studentNameEl.textContent = studentName;
    } else {
        studentNameEl.innerHTML = '_________________________';
    }

    setText('prevStudentLevel', getVal('studentLevel') || '-');
    setText('prevAcademicYear', getVal('academicYear') || '-');

    // Items Table
    const items = getItems();
    const tbody = document.getElementById('prevItemsBody');
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-row">Belum ada item</td></tr>';
    } else {
        tbody.innerHTML = items.map(item => {
            const statusClass = item.status === 'paid' ? 'status-paid' : 'status-unpaid';
            const statusText = item.status === 'paid' ? 'Sudah Dibayar' : 'Belum Dibayar';
            return `
                <tr>
                    <td class="text-center">${item.no}</td>
                    <td>${escapeHtml(item.description)}</td>
                    <td class="text-center">${item.qty}</td>
                    <td class="text-right">Rp${formatNumber(item.total)}</td>
                    <td class="text-center"><span class="status-badge ${statusClass}">${statusText}</span></td>
                </tr>
            `;
        }).join('');
    }

    // Summary
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discount = parseCurrencyInput(getVal('discountAmount')) || 0;
    const totalPayment = Math.max(subtotal - discount, 0);

    setText('prevSubtotal', 'Rp' + formatNumber(subtotal));
    setText('prevDiscount', 'Rp' + formatNumber(discount));
    setText('prevTotal', 'Rp' + formatNumber(totalPayment));

    // Payment Method
    setText('prevBankName', getVal('bankName') || 'BNI');
    setText('prevBankAccountName', getVal('bankAccountName') || 'Jakarta Cosmopolite Islamic School');
    setText('prevBankAccount', getVal('bankAccount') || '-');

    // Notes
    const notesText = getVal('notesBody');
    if (notesText) {
        const lines = notesText.split('\n').filter(l => l.trim() !== '');
        // First note goes to main notes section
        const notesList = document.getElementById('prevNotesList');
        const notesBottom = document.getElementById('prevNotesBottom');

        if (lines.length > 0) {
            notesList.innerHTML = `<li>${escapeHtml(lines[0])}</li>`;
        }

        if (lines.length > 1) {
            notesBottom.innerHTML = lines.slice(1).map(line => `<li>${escapeHtml(line)}</li>`).join('');
            notesBottom.style.display = 'block';
        } else {
            notesBottom.innerHTML = '';
            notesBottom.style.display = 'none';
        }
    }

    // Closing
    setText('prevClosingGreeting', getVal('closingGreeting') || 'Warm Regards,');
    const closingDept = getVal('closingDepartment') || 'Finance Department';
    const closingSchool = getVal('closingSchoolName') || 'Jakarta Cosmopolite Islamic School';
    document.getElementById('prevClosingDepartment').innerHTML = `<strong>${escapeHtml(closingDept)}</strong>`;
    document.getElementById('prevClosingSchool').innerHTML = `<strong>${escapeHtml(closingSchool)}</strong>`;
}

// =============================================
// NUMBER FORMATTING (Indonesian)
// =============================================

function formatNumber(num) {
    if (num === 0) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatCurrency(num) {
    if (num === 0) return '0,00';

    const isNeg = num < 0;
    num = Math.abs(num);

    const intPart = Math.floor(num);
    const decPart = Math.round((num - intPart) * 100);

    const intStr = intPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const decStr = decPart.toString().padStart(2, '0');

    return (isNeg ? '-' : '') + intStr + ',' + decStr;
}

function parseCurrencyInput(str) {
    if (!str) return 0;
    // Remove dots (thousand separators), replace comma with dot for decimal
    const cleaned = str.toString().replace(/\./g, '').replace(',', '.');
    const val = parseFloat(cleaned);
    return isNaN(val) ? 0 : val;
}

// =============================================
// DATE FORMATTING
// =============================================

function formatDateDisplay(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function formatDateDisplayLong(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
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