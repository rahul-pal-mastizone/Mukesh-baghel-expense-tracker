/****************** UTILITIES ******************/
const $ = (sel) => document.querySelector(sel);
const formatMoney = (n) => (Number(n||0)).toLocaleString(undefined,{style:'currency',currency:'USD'});
const iso = (d)=> d ? new Date(d).toISOString().slice(0,10) : '';

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
    const totalSpent = w.purchases.reduce((s,p)=>s+Number(p.amount||0),0);
    const totalDue = w.purchases.reduce((s,p)=>s+Number(p.due||0),0);
    const lastDate = w.purchases.length ? iso(w.purchases[w.purchases.length-1].date) : '-';
    const tr = document.createElement('tr');
    tr.classList.add('cursor-pointer');
    tr.innerHTML = `
      <td>${w.name}</td>
      <td class="text-end">${formatMoney(totalSpent)}</td>
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
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="text-end">${Number(p.amount||0).toFixed(2)}</td>
      <td class="text-end">${Number(p.due||0).toFixed(2)}</td>
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
  const tbody = $('#historyTable tbody');
  const row = tbody.children[pi];
  row.innerHTML = `
    <td><input class="form-control form-control-sm text-end" type="number" min="0" step="0.01" value="${p.amount}"></td>
    <td><input class="form-control form-control-sm text-end" type="number" min="0" step="0.01" value="${p.due}"></td>
    <td><input class="form-control form-control-sm" type="date" value="${iso(p.date)}"></td>
    <td><input class="form-control form-control-sm" value="${p.product||''}" placeholder="(optional)"></td>
    <td class="text-center">
      <div class="btn-group btn-group-sm">
        <button class="btn btn-success">Save</button>
        <button class="btn btn-secondary">Cancel</button>
      </div>
    </td>`;
  const [amountEl, dueEl, dateEl, productEl] = row.querySelectorAll('input');
  row.querySelector('.btn-success').addEventListener('click', ()=>{
    p.amount = Number(amountEl.value||0);
    p.due = Number(dueEl.value||0);
    p.date = iso(dateEl.value);
    p.product = productEl.value.trim() || undefined;
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
  const amount = Number($('#amountSpent').value || 0);
  const due = Number($('#dueAmount').value || 0);
  const date = iso($('#purchaseDate').value || new Date());
  if(isNaN(idx) || idx<0){
    alert('Please select a warehouse.');
    return;
  }
  if(!amount && !due){
    alert('Enter at least Amount Spent or Due Amount.');
    return;
  }
  const rec = { amount, due, date };
  if(product) rec.product = product;
  state.warehouses[idx].purchases.push(rec);
  save();
  refreshAll();
  showHistory(idx);
  $('#amountSpent').value='';
  $('#dueAmount').value='';
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
  const rows = [['Warehouse','Product Name','Amount Spent','Due Amount','Purchase Date']];
  state.warehouses.forEach(w=>{
    w.purchases.forEach(p=>{
      rows.push([
        w.name,
        p.product || '',
        Number(p.amount||0),
        Number(p.due||0),
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
      amount: header.indexOf('amount spent'),
      due: header.indexOf('due amount'),
      date: header.indexOf('purchase date')
    };
    const byName = Object.fromEntries(state.warehouses.map((w,i)=>[w.name,i]));
    lines.forEach(line=>{
      const cols = line.match(/((?<=\")[^\"]*(?=\")|[^,]+)/g) || [];
      const wname = (cols[idx.warehouse]||'').replaceAll('"','');
      const product = idx.product>-1 ? (cols[idx.product]||'').replaceAll('"','') : '';
      const amount = Number((cols[idx.amount]||'0').replaceAll('"',''));
      const due = Number((cols[idx.due]||'0').replaceAll('"',''));
      const date = (cols[idx.date]||'').replaceAll('"','');
      let wi = byName[wname];
      if(wi===undefined){
        state.warehouses.push({name:wname||'Unknown', purchases:[]});
        wi = state.warehouses.length-1;
        byName[wname] = wi;
      }
      const rec = {amount, due, date: iso(date)};
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
  // Note: we do NOT preselect a warehouse, so the placeholder stays visible
})();
