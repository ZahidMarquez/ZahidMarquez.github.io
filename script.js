<script>
// ===============================
// VARIABLES & STORAGE
// ===============================
let totalPersonas = Number(localStorage.getItem("totalPersonas")) || 0;
let historial = JSON.parse(localStorage.getItem("historial")) || [];
let listaEspera = JSON.parse(localStorage.getItem("listaEspera")) || [];
let codigoCounter = Number(localStorage.getItem("codigoCounter")) || 1;

document.getElementById("total").textContent = totalPersonas;
renderLista();
renderHistorial();
actualizarContadores();

// ===============================
// VALIDACIÓN INPUT PASAJEROS
// ===============================
const inputPasajeros = document.getElementById("pasajeros");

// Bloquea letras, e, +, -, etc.
inputPasajeros.addEventListener("keydown", function (e) {
    const teclasPermitidas = [
        "Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"
    ];

    if (teclasPermitidas.includes(e.key)) return;

    if (!/^\d$/.test(e.key)) {
        e.preventDefault();
    }
});

// Evita pegar texto que no sea numérico
inputPasajeros.addEventListener("paste", function (e) {
    const textoPegado = (e.clipboardData || window.clipboardData).getData("text");
    if (!/^\d+$/.test(textoPegado)) {
        e.preventDefault();
    }
});

// ===============================
// AGREGAR A LISTA DE ESPERA
// ===============================
document.getElementById("btnAgregar").addEventListener("click", () => {
    const nombre = document.getElementById("nombre").value.trim();
    const pasajeros = Number(document.getElementById("pasajeros").value);
    const tipo = document.getElementById("tipo").value;

    if (!nombre || pasajeros <= 0) {
        alert("Por favor ingrese un nombre válido y un número de pasajeros correcto.");
        return;
    }

    const codigo = "AE-" + codigoCounter.toString().padStart(4, "0");
    codigoCounter++;
    localStorage.setItem("codigoCounter", codigoCounter);

    const horaRegistro = new Date().toLocaleString();

    const pasajero = { codigo, nombre, pasajeros, tipo, horaRegistro };
    listaEspera.push(pasajero);
    localStorage.setItem("listaEspera", JSON.stringify(listaEspera));

    totalPersonas += pasajeros;
    localStorage.setItem("totalPersonas", totalPersonas);
    document.getElementById("total").textContent = totalPersonas;

    renderLista();

    document.getElementById("nombre").value = "";
    document.getElementById("pasajeros").value = "";
});

// ===============================
// LLAMAR PASAJERO
// ===============================
function llamarPasajero(codigo) {
    const pas = listaEspera.find(p => p.codigo === codigo);
    if (!pas) return;

    localStorage.setItem("llamadaActiva", JSON.stringify(pas));
    localStorage.setItem("actualizarPantalla", Date.now());

    document.getElementById("sonidoLlamado").play();
    renderLista();
}

// ===============================
// DEJAR DE LLAMAR
// ===============================
function detenerLlamada(codigo) {
    const idx = listaEspera.findIndex(p => p.codigo === codigo);
    if (idx < 0) return;

    const pas = listaEspera[idx];

    listaEspera.splice(idx, 1);
    localStorage.setItem("listaEspera", JSON.stringify(listaEspera));

    historial.push({ ...pas, horaLlamado: new Date().toLocaleString() });
    localStorage.setItem("historial", JSON.stringify(historial));

    totalPersonas -= pas.pasajeros;
    localStorage.setItem("totalPersonas", totalPersonas);
    document.getElementById("total").textContent = totalPersonas;

    localStorage.setItem("llamadaActiva", "null");
    localStorage.setItem("actualizarPantalla", Date.now());

    renderLista();
    renderHistorial();
    actualizarContadores();
}

// ===============================
// RENDER LISTA DE ESPERA
// ===============================
function renderLista() {
    const ul = document.getElementById("lista");
    ul.innerHTML = "";

    const llamadaActiva = JSON.parse(localStorage.getItem("llamadaActiva"));

    listaEspera.forEach(p => {
        const li = document.createElement("li");
        li.className = p.tipo.toLowerCase();

        if (llamadaActiva && llamadaActiva.codigo === p.codigo) {
            li.classList.add("llamando");
        }

        li.innerHTML = `
            <strong>${p.codigo}</strong> — ${p.nombre} — ${p.pasajeros} pax — <em>${p.tipo}</em>
        `;

        const btnCall = document.createElement("button");
        btnCall.textContent = "Llamar";
        btnCall.className = "btn-llamar";
        btnCall.onclick = () => llamarPasajero(p.codigo);

        const btnStop = document.createElement("button");
        btnStop.textContent = "Dejar de llamar";
        btnStop.className = "btn-stop";
        btnStop.onclick = () => detenerLlamada(p.codigo);

        li.append(btnCall, btnStop);
        ul.appendChild(li);
    });
}

// ===============================
// RENDER HISTORIAL
// ===============================
function renderHistorial() {
    const cont = document.getElementById("historial");
    cont.innerHTML = "";

    historial.forEach(h => {
        const li = document.createElement("li");
        li.innerHTML = `
            <strong>${h.codigo}</strong> — ${h.nombre} — ${h.pasajeros} pax — <em>${h.tipo}</em><br>
            <small>Registrado: ${h.horaRegistro} | Llamado: ${h.horaLlamado}</small>
        `;
        cont.appendChild(li);
    });
}

// ===============================
// CONTADORES POR CATEGORÍA
// ===============================
function actualizarContadores() {
    let aero = 0, plat = 0, cent = 0;

    historial.forEach(h => {
        if (h.tipo === "Aeromexico") aero += h.pasajeros;
        if (h.tipo === "Platinum") plat += h.pasajeros;
        if (h.tipo === "Centurion") cent += h.pasajeros;
    });

    document.getElementById("cont-aero").textContent = aero;
    document.getElementById("cont-plat").textContent = plat;
    document.getElementById("cont-cent").textContent = cent;
}

// ===============================
// BORRAR HISTORIAL
// ===============================
function borrarHistorial() {
    if (!confirm("¿Seguro que deseas borrar el historial?")) return;
    historial = [];
    localStorage.setItem("historial", "[]");
    actualizarContadores();
    renderHistorial();
}

// ===============================
// EXPORTAR A EXCEL
// ===============================
function exportarExcel() {
    if (historial.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }

    const ws_data = historial.map(h => ({
        Código: h.codigo,
        Nombre: h.nombre,
        Pasajeros: h.pasajeros,
        Tipo: h.tipo,
        "Hora Registro": h.horaRegistro,
        "Hora Llamado": h.horaLlamado
    }));

    const ws = XLSX.utils.json_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial");

    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `historial_lista_espera_${fecha}.xlsx`);
}

// ===============================
// PANTALLA SECUNDARIA
// ===============================
document.getElementById("btnPantalla").addEventListener("click", () => {
    window.open("pantalla.html", "_blank");
});
</script>
