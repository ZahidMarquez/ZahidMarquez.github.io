// -----------------------------
// VARIABLES INICIALES
// -----------------------------
let espera = JSON.parse(localStorage.getItem("espera")) || [];
let historial = JSON.parse(localStorage.getItem("historial")) || [];
let turnoActual = JSON.parse(localStorage.getItem("turnoActual")) || 1;
let atendidosVisible = false;

// PRIORIDAD POR TARJETA
const prioridad = { Centurion: 1, Platino: 2, Aeromexico: 3 };

// -----------------------------
// FUNCIONES DE REGISTRO
// -----------------------------
function registrar() {
  if (!nombre.value) return alert("Nombre requerido");
  const p = {
    turno: turnoActual++,
    nombre: nombre.value,
    cantidad: +cantidad.value,
    tarjeta: tarjeta.value,
    mostrador: mostrador.value,
    estado: "Pendiente",
    horaRegistro: new Date().toISOString(),
    horaLlamada: null
  };
  espera.push(p);
  guardar();
  imprimirTicket(p);
  nombre.value = "";
  cantidad.value = 1;
  render();
}

// -----------------------------
// FUNCIONES DE LLAMADA / FINALIZAR / RETIRADA
// -----------------------------
function llamar(i) {
  espera[i].estado = "Llamado";
  espera[i].horaLlamada = new Date().toISOString();
  localStorage.setItem("ultimoLlamado", JSON.stringify(espera[i]));
  speechSynthesis.speak(
    new SpeechSynthesisUtterance(
      `Turno ${espera[i].turno}, mostrador ${espera[i].mostrador}`
    )
  );
  guardar();
  render();
}

function finalizar(i) {
  const p = espera.splice(i, 1)[0];
  p.estado = "Finalizado";
  if (!p.horaLlamada) p.horaLlamada = new Date().toISOString();
  historial.push(p);
  guardar();
  render();
}

function retirada(i) {
  const p = espera.splice(i, 1)[0];
  p.estado = "Retirado";
  historial.push(p);
  guardar();
  render();
}

// -----------------------------
// FUNCION RENDERIZAR TABLAS
// -----------------------------
function render() {
  // TABLA PRINCIPAL
  tabla.innerHTML = "";
  // ORDENAR POR PRIORIDAD DE TARJETA
  espera.sort((a, b) => prioridad[a.tarjeta] - prioridad[b.tarjeta]);
  
  espera.forEach((p, i) => {
    tabla.innerHTML += `
      <tr>
        <td>${p.turno}</td><td>${p.nombre}</td><td>${p.cantidad}</td>
        <td>${p.tarjeta}</td><td>${p.mostrador}</td>
        <td>${new Date(p.horaRegistro).toLocaleTimeString()}</td>
        <td>${p.horaLlamada ? new Date(p.horaLlamada).toLocaleTimeString() : '---'}</td>
        <td>${p.estado}</td>
        <td>
          <button class="llamar" onclick="llamar(${i})">Llamar</button>
          <button class="finalizar" onclick="finalizar(${i})">Finalizar</button>
          <button class="retirada" onclick="retirada(${i})">Retirada</button>
        </td>
      </tr>`;
  });

  // TABLA ATENDIDOS
  const atendidos = historial.filter(p => p.estado === "Finalizado");
  tablaAtendidos.innerHTML = "";

  let sumG = 0, sumP = 0, sumC = 0, cG = 0, cP = 0, cC = 0;
  atendidos.forEach(p => {
    const min = (new Date(p.horaLlamada) - new Date(p.horaRegistro)) / 60000;
    tablaAtendidos.innerHTML += `
      <tr>
        <td>${p.turno}</td><td>${p.nombre}</td><td>${p.cantidad}</td>
        <td>${p.tarjeta}</td><td>${p.mostrador}</td><td>${min.toFixed(1)}</td>
      </tr>`;
    sumG += min; cG++;
    if (p.mostrador === "Platino") { sumP += min; cP++; }
    if (p.mostrador === "Centurion") { sumC += min; cC++; }
  });

  // ESTADÍSTICAS
  totalRegistros.innerText = espera.length;
  totalPax.innerText = espera.reduce((a, b) => a + b.cantidad, 0);
  countCenturion.innerText = espera.filter(p => p.tarjeta === "Centurion").length;
  countPlatino.innerText = espera.filter(p => p.tarjeta === "Platino").length;
  countAeromexico.innerText = espera.filter(p => p.tarjeta === "Aeromexico").length;

  promedioEspera.innerText = cG ? (sumG / cG).toFixed(1) : 0;
  promedioPlatino.innerText = cP ? (sumP / cP).toFixed(1) : 0;
  promedioCenturion.innerText = cC ? (sumC / cC).toFixed(1) : 0;
  totalAtendidos.innerText = atendidos.reduce((a, b) => a + b.cantidad, 0);
}

// -----------------------------
// TOGGLE ATENDIDOS
// -----------------------------
function toggleAtendidos() {
  atendidosVisible = !atendidosVisible;
  atendidosContent.style.display = atendidosVisible ? "block" : "none";
  toggleAtendidos.innerText = atendidosVisible ? "Pasajeros Atendidos ▲" : "Pasajeros Atendidos ▼";
}

// -----------------------------
// IMPRESIÓN DE TICKET
// -----------------------------
function imprimirTicket(p) {
  const w = window.open("", "", "width=300,height=400");
  w.document.write(`<pre>
✈ LISTA DE ESPERA
Turno: ${p.turno}
Nombre: ${p.nombre}
Pax: ${p.cantidad}
Tarjeta: ${p.tarjeta}
Mostrador: ${p.mostrador}
${new Date().toLocaleString()}
</pre>`);
  w.print(); w.close();
}

// -----------------------------
// ABRIR PANTALLAS
// -----------------------------
function abrirPantalla(tipo) {
  const map = {
    general: "pantalla_general.html",
    platino: "pantalla_platino.html",
    centurion: "pantalla_centurion.html"
  };
  window.open(map[tipo], tipo, "fullscreen=yes");
}

// -----------------------------
// EXPORTAR EXCEL
// -----------------------------
function exportarExcel() {
  const data = [["Turno","Nombre","Pax","Tarjeta","Mostrador","Registro","Llamada","Estado"]];
  [...espera, ...historial].forEach(p => {
    data.push([p.turno, p.nombre, p.cantidad, p.tarjeta, p.mostrador, p.horaRegistro, p.horaLlamada, p.estado]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "ListaEspera");

  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  const fecha = `${yyyy}-${mm}-${dd}`;

  XLSX.writeFile(wb, `lista_de_espera_${fecha}.xlsx`);
}

// -----------------------------
// BORRAR HISTORIAL COMPLETO
// -----------------------------
function borrarHistorial() {
  if(confirm("¿Borrar historial y limpiar pantallas?")){
    historial = [];
    espera = [];
    turnoActual = 1;
    // LIMPIAR LOCALSTORAGE COMPLETO
    localStorage.clear();
    // señal para pantallas
    localStorage.setItem("limpiarPublico", Date.now().toString());
    render();
  }
}

// -----------------------------
// DARK MODE
// -----------------------------
function toggleDark() {
  document.body.classList.toggle("dark");
}

// -----------------------------
// GUARDAR DATOS
// -----------------------------
function guardar() {
  localStorage.setItem("espera", JSON.stringify(espera));
  localStorage.setItem("historial", JSON.stringify(historial));
  localStorage.setItem("turnoActual", turnoActual);
}

// -----------------------------
// RENDER INICIAL
// -----------------------------
render();
