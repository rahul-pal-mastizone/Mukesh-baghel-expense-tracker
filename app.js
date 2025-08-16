/****************** UTILITIES ******************/
const $ = (sel) => document.querySelector(sel);
const formatMoney = (n) => (Number(n||0)).toLocaleString(undefined,{style:'currency',currency:'USD'});
const iso = (d)=> d ? new Date(d).toISOString().slice(0,10) : '';
const toNum = (v)=> Number(v||0);

// Normalize legacy records (amount/due) into bill/paid/due for computations
function pickBill(p){
  if (p.bill != null) return toNum(p.bill);
  if (p.amount != null) return toNum(p.amount);
  return 0;
}
function pickPaid(p){
  if (p.paid != null) return toNum(p.paid);
  // legacy: if amount & due exist, paid = amount - due
  if (p.amount != null && p.due != null) return Math.max(0, toNum(p.amount) - toNum(p.due));
  return 0;
}
function pickDue(p){
  // prefer stored due if new model present; otherwise compute
  const bill = pickBill(p);
  const paid = pickPaid(p);
  return Math.max(0, bill - paid);
}

/****************** STATE ******************/
const LS_KEY = 'shopkeeper_data_v2';
const LS_PHOTO = 'nidhi_boot_house_photo';
let state = JSON.parse(localStorage.getItem(LS_KEY) || 'null') || {
  warehouses: [] // start with no warehouses
};
function save(){ localStorage.setItem(LS_KEY, JSON.stringify(state)); }

/****************** CLIENT PHOTO ******************/
function renderClientPhoto(){
  const img = document.querySelector('#clientAvatar img');
  const saved = localStorage.getItem(LS_PHOTO);
  if(saved && img){ img.src = saved; }
}
$('#photoInput')?.addEventListener('change', ()=>{
  const file = $('#photoInput').files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    localStorage.setItem(LS_PHOTO, reader.result);
    renderClientPhoto();
  };
  reader.readAsDataURL(file);
});

/****************** RENDER ******************/
function refreshWarehouseSelect(){
  const sel = $('#warehouseSelect');
  const current = sel.value;
  const placeholder = '<option value="" disabled selected hidden>Select Warehouse</option>';
  const opts = state.warehouses.map((w,i)=>`<option value="${i}">${w.name}</option>`).join('');
  sel.innerHTML = placeholder + opts;
  if (current !== '' && current != null && sel.querySelector(`option[value="${current}"]`)) {
    sel.value = current;
  }
}

function refreshWarehouseTable(){
  const tbody = $('#warehouseTable tbody');
  tbody.innerHTML = '';
  state.warehouses.forEach((w, i)=>{
    const totalBill = w.purchases.reduce((s,p)=> s + pickBill(p), 0);
    const totalDue  = w.purchases.reduce((s,p)=> s + pickDue(p),  0);
    const lastDate = w.purchases.length ? iso(w.purchases[w.purchases.length-1].date) : '-';
    const tr = document.createElement('tr');
    tr.classList.add('cursor-pointer');
    tr.innerHTML = `
      <td>${w.name}</td>
      <td class="text-end">${formatMoney(totalBill)}</td>
      <td class="text-end">${formatMoney(totalDue)}</td>
      <td>${lastDate}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-danger" data-action="delete-warehouse" data-index="${i}">Delete</button>
      </td>`;

    tr.addEventListener('click', (ev)=>{
      if(ev.target && ev.target.dataset.action === 'delete-warehouse') return;
      showHistory(i);
    });

    tr.querySelector('[data-action="delete-warehouse"]').addEventListener('click', ()=>{
      if(confirm(`Delete warehouse "${w.name}" and all its purchases?`)){
        state.warehouses.splice(i,1);
        save();
        refreshAll();
        $('#historySection').classList.add('d-none');
      }
    });

    tbody.appendChild(tr);
  });
}

function showHistory(index){
  const w = state.warehouses[index];
  $('#historyTitle').textContent = w.name;
  const tbody = $('#historyTable tbody');
  tbody.innerHTML = '';
  w.purchases.forEach((p, pi)=>{
    const bill = pickBill(p);
    const paid = pickPaid(p);
    const due  = Math.max(0, bill - paid);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="text-end">${bill.toFixed(2)}</td>
      <td class="text-end">${paid.toFixed(2)}</td>
      <td class="text-end">${due.toFixed(2)}</td>
      <td>${iso(p.date)}</td>
      <td>${p.product ? p.product : ''}</td>
      <td class="text-center">
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-secondary" data-action="edit" data-pi="${pi}">Edit</button>
          <button class="btn btn-outline-danger" data-action="delete" data-pi="${pi}">Delete</button>
        </div>
      </td>`;

    tr.querySelector('[data-action="edit"]').addEventListener('click', ()=> startInlineEdit(index, pi));

    tr.querySelector('[data-action="delete"]').addEventListener('click', ()=>{
      if(confirm('Delete this purchase?')){
        w.purchases.splice(pi,1);
        save();
        refreshAll();
        showHistory(index);
      }
    });

    tbody.appendChild(tr);
  });
  $('#historySection').classList.remove('d-none');
}

function startInlineEdit(wi, pi){
  const w = state.warehouses[wi];
  const p = w.purchases[pi];
  const bill = pickBill(p);
  const paid = pickPaid(p);
  const due  = Math.max(0, bill - paid);

  const tbody = $('#historyTable tbody');
  const row = tbody.children[pi];
  row.innerHTML = `
    <td><input class="form-control form-control-sm text-end" type="number" min="0" step="0.01" value="${bill}"></td>
    <td><input class="form-control form-control-sm text-end" type="number" min="0" step="0.01" value="${paid}"></td>
    <td class="text-end"><span class="fw-semibold" id="editDue">${due.toFixed(2)}</span></td>
    <td><input class="form-control form-control-sm" type="date" value="${iso(p.date)}"></td>
    <td><input class="form-control form-control-sm" value="${p.product||''}" placeholder="(optional)"></td>
    <td class="text-center">
      <div class="btn-group btn-group-sm">
        <button class="btn btn-success">Save</button>
        <button class="btn btn-secondary">Cancel</button>
      </div>
    </td>`;

  const [billEl, paidEl, /* due display */, dateEl, productEl] = row.querySelectorAll('input');
  const dueSpan = row.querySelector('#editDue');

  function recalc(){ dueSpan.textContent = Math.max(0, toNum(billEl.value) - toNum(paidEl.value)).toFixed(2); }
  billEl.addEventListener('input', recalc);
  paidEl.addEventListener('input', recalc);

  row.querySelector('.btn-success').addEventListener('click', ()=>{
    const newBill = toNum(billEl.value);
    const newPaid = toNum(paidEl.value);
    const newDue  = Math.max(0, newBill - newPaid);

    // Normalize to new model
    delete p.amount; // legacy
    p.bill = newBill;
    p.paid = newPaid;
    p.due  = newDue;
    p.date = iso(dateEl.value);
    p.product = (productEl.value.trim() || undefined);

    save();
    refreshAll();
    showHistory(wi);
  });
  row.querySelector('.btn-secondary').addEventListener('click', ()=> showHistory(wi));
}

function refreshAll(){
  refreshWarehouseSelect();
  refreshWarehouseTable();
}

/****************** ADD EXPENSE ******************/
$('#addExpense').addEventListener('click', ()=>{
  const idx = Number($('#warehouseSelect').value);
  const product = $('#productName').value.trim();
  const bill = toNum($('#totalBill').value);
  const paid = toNum($('#paidAmount').value);
  const due  = Math.max(0, bill - paid);
  const date = iso($('#purchaseDate').value || new Date());
  if(isNaN(idx) || idx<0){
    alert('Please select a warehouse.');
    return;
  }
  if(!bill && !paid){
    alert('Enter at least Bill or Paid.');
    return;
  }
  const rec = { bill, paid, due, date };
  if(product) rec.product = product;
  // Normalize any legacy structures not needed here
  state.warehouses[idx].purchases.push(rec);
  save();
  refreshAll();
  showHistory(idx);
  $('#totalBill').value='';
  $('#paidAmount').value='';
  $('#productName').value='';
});

/****************** ADD NEW WAREHOUSE ******************/
const addWarehouseModal = new bootstrap.Modal(document.getElementById('addWarehouseModal'));
$('#addWarehouseBtn').addEventListener('click', ()=>{
  $('#newWarehouseName').value='';
  addWarehouseModal.show();
});
$('#confirmAddWarehouse').addEventListener('click', ()=>{
  const name = $('#newWarehouseName').value.trim();
  if(!name) return alert('Enter a name');
  state.warehouses.push({name, purchases:[]});
  save();
  refreshAll();
  $('#warehouseSelect').value = state.warehouses.length-1; // select the newly added one
  addWarehouseModal.hide();
});

/****************** CSV EXPORT ******************/
// Export dates as text to avoid Excel ###### issue
function asExcelText(v) { return v ? `="${v}"` : ''; }

$('#exportCsv').addEventListener('click', ()=>{
  const rows = [['Warehouse','Product Name','Bill','Paid','Due','Purchase Date']];
  state.warehouses.forEach(w=>{
    w.purchases.forEach(p=>{
      const bill = pickBill(p);
      const paid = pickPaid(p);
      const due  = Math.max(0, bill - paid);
      rows.push([
        w.name,
        p.product || '',
        bill,
        paid,
        due,
        asExcelText(iso(p.date))
      ]);
    });
  });

  const csv = rows
    .map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(','))
    .join('\n');

  const blob = new Blob(["\ufeff" + csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'shopkeeper_expenses.csv';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=> URL.revokeObjectURL(url), 5000);
});

/****************** CSV IMPORT ******************/
$('#importCsv').addEventListener('click', ()=>{
  const file = $('#importCsvInput').files[0];
  if(!file) return alert('Choose a CSV file to import');
  const reader = new FileReader();
  reader.onload = ()=>{
    const text = reader.result;
    const lines = text.split(/\r?\n/).filter(Boolean);
    const header = lines.shift().split(',').map(h=>h.replaceAll('"','').trim().toLowerCase());
    const idx = {
      warehouse: header.indexOf('warehouse'),
      product: header.indexOf('product name'),
      bill: header.indexOf('bill'),
      paid: header.indexOf('paid'),
      due: header.indexOf('due'),
      // legacy compatibility:
      amount: header.indexOf('amount spent'),
      legacyDue: header.indexOf('due amount'),
      date: header.indexOf('purchase date')
    };
    const byName = Object.fromEntries(state.warehouses.map((w,i)=>[w.name,i]));
    lines.forEach(line=>{
      const cols = line.match(/((?<=\")[^\"]*(?=\")|[^,]+)/g) || [];
      const wname = (cols[idx.warehouse]||'').replaceAll('"','');
      const product = idx.product>-1 ? (cols[idx.product]||'').replaceAll('"','') : '';
      let bill = 0, paid = 0, due = 0;

      if (idx.bill > -1 || idx.paid > -1 || idx.due > -1){
        bill = toNum((cols[idx.bill]||'0').replaceAll('"',''));
        paid = toNum((cols[idx.paid]||'0').replaceAll('"',''));
        due  = toNum((cols[idx.due ]||'0').replaceAll('"',''));
        // trust computed due if missing
        if (isNaN(due) || (cols[idx.due]==null)) due = Math.max(0, bill - paid);
      } else {
        // legacy headers: Amount Spent / Due Amount
        bill = toNum((cols[idx.amount]    ||'0').replaceAll('"',''));
        const legacyDue = toNum((cols[idx.legacyDue] ||'0').replaceAll('"',''));
        paid = Math.max(0, bill - legacyDue);
        due  = legacyDue;
      }

      const date = (cols[idx.date]||'').replaceAll('"','');
      let wi = byName[wname];
      if(wi===undefined){
        state.warehouses.push({name:wname||'Unknown', purchases:[]});
        wi = state.warehouses.length-1;
        byName[wname] = wi;
      }

      const rec = { bill, paid, due, date: iso(date) };
      if(product) rec.product = product;
      state.warehouses[wi].purchases.push(rec);
    });
    save();
    refreshAll();
  };
  reader.readAsText(file);
});

/****************** INIT ******************/
(function init(){
  $('#purchaseDate').value = iso(new Date());
  renderClientPhoto();
  refreshAll();
})();
