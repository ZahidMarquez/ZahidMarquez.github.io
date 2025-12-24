// Variables y storage
let totalPersonas = Number(localStorage.getItem("totalPersonas")) || 0;
let historial = JSON.parse(localStorage.getItem("historial")) || [];
let listaEspera = JSON.parse(localStorage.getItem("listaEspera")) || [];
let codigoCounter = Number(localStorage.getItem("codigoCounter")) || 1;

// Elementos
const listaUL = document.getElementById("lista");
const historialUL = document.getElementById("historial");
const totalSpan = document.getElementById("total");

// Render inicial
totalSpan.textContent = totalPersonas;
renderLista();
renderHistorial();
actualizarContadores();

// Agregar pasajero
document.getElementById("btnAgregar").addEventListener("click", () => {
    const nombre = document.getElementById("nombre").value.trim();
    const pasajeros = Number(document.getElementById("pasajeros").value);
    const telefono = document.getElementById("telefono").value.trim();
    const tipo = document.getElementById("tipo").value;

    if (!nombre || pasajeros <= 0 || !telefono) { alert("Ingrese datos válidos"); return; }

    const codigo = "AE-" + codigoCounter.toString().padStart(4,"0");
    codigoCounter++; localStorage.setItem("codigoCounter", codigoCounter);

    const horaRegistro = new Date().toLocaleString();
    const pasajero = { codigo, nombre, pasajeros, telefono, tipo, horaRegistro };
    listaEspera.push(pasajero);
    localStorage.setItem("listaEspera", JSON.stringify(listaEspera));

    totalPersonas += pasajeros;
    localStorage.setItem("totalPersonas", totalPersonas);
    totalSpan.textContent = totalPersonas;

    renderLista();
    imprimirTicket(pasajero);

    document.getElementById("nombre").value = "";
    document.getElementById("pasajeros").value = "";
    document.getElementById("telefono").value = "";
});


// Llamar pasajero
function llamarPasajero(codigo){
    const pas = listaEspera.find(p => p.codigo === codigo);
    if(!pas) return;
    localStorage.setItem("llamadaActiva", JSON.stringify(pas));
    localStorage.setItem("actualizarPantalla", Date.now());
    document.getElementById("sonidoLlamado").play();
    renderLista();
}

// Detener llamada
function detenerLlamada(codigo){
    const idx = listaEspera.findIndex(p => p.codigo===codigo);
    if(idx<0) return;
    const pas = listaEspera[idx];
    listaEspera.splice(idx,1);
    localStorage.setItem("listaEspera", JSON.stringify(listaEspera));
    historial.push({...pas, horaLlamado: new Date().toLocaleString()});
    localStorage.setItem("historial", JSON.stringify(historial));

    totalPersonas -= Number(pas.pasajeros);
    localStorage.setItem("totalPersonas", totalPersonas);
    totalSpan.textContent = totalPersonas;

    localStorage.setItem("llamadaActiva", "null");
    localStorage.setItem("actualizarPantalla", Date.now());

    renderLista();
    renderHistorial();
    actualizarContadores();
}

// Render lista
function renderLista(){
    listaUL.innerHTML = "";
    const llamadaActiva = JSON.parse(localStorage.getItem("llamadaActiva"));
    listaEspera.forEach(p => {
        const li = document.createElement("li");
        li.className = p.tipo.toLowerCase();
        if(llamadaActiva && llamadaActiva.codigo===p.codigo) li.classList.add("llamando");
        li.innerHTML = `<strong>${p.codigo}</strong> — ${p.nombre} — ${p.pasajeros} pax — <em>${p.tipo}</em>`;
        const btnCall = document.createElement("button");
        btnCall.textContent="Llamar"; btnCall.className="btn-llamar"; btnCall.onclick=()=>llamarPasajero(p.codigo);
        const btnStop = document.createElement("button");
        btnStop.textContent="Dejar de llamar"; btnStop.className="btn-stop"; btnStop.onclick=()=>detenerLlamada(p.codigo);
        li.append(btnCall,btnStop);
        listaUL.appendChild(li);
    });
}

// Render historial
function renderHistorial(){
    historialUL.innerHTML="";
    historial.forEach(h=>{
        const li = document.createElement("li");
        li.innerHTML=`<strong>${h.codigo}</strong> — ${h.nombre} — ${h.pasajeros} pax — <em>${h.tipo}</em><br><small>Registrado: ${h.horaRegistro} | Llamado: ${h.horaLlamado}</small>`;
        historialUL.appendChild(li);
    });
}

// Contadores
function actualizarContadores(){
    let aero=0, plat=0, cent=0;
    historial.forEach(h=>{
        if(h.tipo==="Aeromexico") aero+=Number(h.pasajeros);
        if(h.tipo==="Platinum") plat+=Number(h.pasajeros);
        if(h.tipo==="Centurion") cent+=Number(h.pasajeros);
    });
    document.getElementById("cont-aero").textContent=aero;
    document.getElementById("cont-plat").textContent=plat;
    document.getElementById("cont-cent").textContent=cent;
}

// Borrar historial
function borrarHistorial(){
    if(!confirm("¿Seguro que deseas borrar el historial?")) return;
    historial=[]; localStorage.setItem("historial","[]");
    actualizarContadores();
    renderHistorial();
}

// Exportar Excel
function exportarExcel(){
    if(historial.length===0){ alert("No hay datos para exportar."); return; }
    const ws_data = historial.map(h=>({
        Código:h.codigo, Nombre:h.nombre, Pasajeros:h.pasajeros, Tipo:h.tipo, "Hora Registro":h.horaRegistro, "Hora Llamado":h.horaLlamado
    }));
    const ws = XLSX.utils.json_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial");
    const fecha = new Date().toISOString().slice(0,10);
    XLSX.writeFile(wb, `historial_lista_espera_${fecha}.xlsx`);
}

// Pantalla secundaria
document.getElementById("btnPantalla")?.addEventListener("click",()=>{
    window.open("pantalla.html","_blank");
});

